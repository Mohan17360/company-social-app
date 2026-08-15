// src/components/PostCard.jsx
import { useState, useEffect } from "react";
// STEP 1 Applied: Imported useAuth safely from context directory layer
import { useAuth } from "../context/useAuth";
import CommentSection from "./CommentSection";
import NdaPopup from "./NdaPopup"; 
import {
  acceptNdaAgreement,
  evaluateNdaAccess,
  logNdaAudit,
  NDA_AUDIT_EVENTS,
} from "../services/ndaService";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,         
  collection,     
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";

function PostCard({ post, handleLike, handleEdit, handleDelete, user }) {
  // STEP 2 Applied: Destructured global context layer to extract authorized session state variables
  const { userData: currentLoggedInUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

  const [showNdaPopup, setShowNdaPopup] = useState(false);

  // Core persistence and hydration checking hooks
  const [hasAcceptedNda, setHasAcceptedNda] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Standalone tracking hook state variables for active templates parsing
  const [agreement, setAgreement] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [ndaLoading, setNdaLoading] = useState(false);
  const [requiredNdaVersion, setRequiredNdaVersion] = useState(1);
  const [ndaUpgradeRequired, setNdaUpgradeRequired] = useState(false);

  // Persistence access check to map identical versioned docId keys smoothly
  useEffect(() => {
    const checkNdaAccess = async () => {
      if (!post.ndaRequired) {
        setHasAcceptedNda(true);
        setCheckingAccess(false);
        return;
      }

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setCheckingAccess(false);
        return;
      }

      // STEP 3 Applied: Formulated unified multi-role bypass checks for Owners and Admin groups cleanly
      const isOwner = currentUser.uid === post.uid;
      const isAdmin = currentLoggedInUser?.role === "Admin";

      if (isOwner || isAdmin) {
        setHasAcceptedNda(true);
        setCheckingAccess(false);
        return;
      }

      try {
        const access = await evaluateNdaAccess(post, currentUser.uid);
        setHasAcceptedNda(access.granted);
        setAgreement(access.agreement);
        setRequiredNdaVersion(access.requiredVersion);
        setNdaUpgradeRequired(access.upgradeRequired);
      } catch (error) {
        console.error("Error evaluating historical NDA access map:", error);
        setHasAcceptedNda(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkNdaAccess();
  }, [post, currentLoggedInUser]);

  // Helper States / Derived States
  const hasLiked = user && post.likes?.includes(user.uid);
  const isOwner = user?.email === post.email;
  const isFollowing = user?.following?.includes(post.email);

  console.log("Current User:", user);
  console.log("Following List:", user?.following);
  console.log("isFollowing:", isFollowing);

  const badgeColor =
    post.role === "Owner"
      ? "#16a34a"
      : post.role === "Investor"
      ? "#2563eb"
      : "#9333ea";

  // openNdaPopup async orchestrator to pre-fetch matching active template schemas
  const openNdaPopup = async () => {
    // STEP 4 Applied: Defended workflow execution loops against un-hydrated context profiles
    if (!currentLoggedInUser) {
      alert("Loading user information, please wait...");
      return;
    }

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      // STEP 3 Continued: Injected safe dual layer checks to also prevent popups on Admin views
      const isOwner = currentUser.uid === post.uid;
      const isAdmin = currentLoggedInUser?.role === "Admin";

      if (isOwner || isAdmin) {
        setHasAcceptedNda(true);
        return;
      }

      const access = await evaluateNdaAccess(post, currentUser.uid);
      if (access.granted) {
        setHasAcceptedNda(true);
        return;
      }

      if (!access.agreement) {
        alert("The active NDA agreement is unavailable. Please try again later.");
        return;
      }
      setAgreement(access.agreement);
      setRequiredNdaVersion(access.requiredVersion);
      setNdaUpgradeRequired(access.upgradeRequired);
      setSignatureUrl("");

      const userSnap = await getDoc(
        doc(db, "users", currentUser.uid)
      );

      if (userSnap.exists()) {
        setSignatureUrl(
          userSnap.data().signatureUrl || ""
        );
      }

      setShowNdaPopup(true);
      await logNdaAudit(NDA_AUDIT_EVENTS.VIEWED, {
        postId: post.id,
        ownerId: post.uid,
        ndaType: post.ndaType || "Founder",
        agreementVersion: access.requiredVersion,
      });

    } catch (error) {
      console.error("Error assembling digital signature workspace maps:", error);
      alert(error.message);
    }
  };

  // Configured centralized acceptance tracking block matching standard version control metrics
  const acceptNda = async () => {
    try {
      setNdaLoading(true);

      if (!agreement) {
        throw new Error("The active NDA agreement is unavailable.");
      }

      await acceptNdaAgreement({
        post,
        viewer: currentLoggedInUser || user,
        agreement,
        signatureUrl,
      });

      setHasAcceptedNda(true);
      setShowNdaPopup(false);

    } catch (error) {
      console.error("Database persistence fault writing to history catalog:", error);
      await logNdaAudit(NDA_AUDIT_EVENTS.ACCEPT_FAILED, {
        postId: post.id,
        ownerId: post.uid,
        ndaType: post.ndaType || "Founder",
        agreementVersion: requiredNdaVersion,
        reason: error.message || "Unknown acceptance failure",
      });
      alert(error.message);
    } finally {
      setNdaLoading(false);
    }
  };

  const declineNda = () => {
    logNdaAudit(NDA_AUDIT_EVENTS.DECLINED, {
      postId: post.id,
      ownerId: post.uid,
      ndaType: post.ndaType || "Founder",
      agreementVersion: requiredNdaVersion,
    });
  };

  // Actions
  const handleSave = () => {
    handleEdit(post.id, editedContent);
    setIsEditing(false);
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await updateDoc(doc(db, "users", user.uid), {
          following: arrayRemove(post.email),
        });
        await updateDoc(doc(db, "users", post.uid), {
          followers: arrayRemove(user.email),
        });
        alert(`You unfollowed ${post.name}`);
      } else {
        await updateDoc(doc(db, "users", user.uid), {
          following: arrayUnion(post.email),
        });
        await updateDoc(doc(db, "users", post.uid), {
          followers: arrayUnion(user.email),
        });

        await addDoc(collection(db, "notifications"), {
          userEmail: post.email,
          message: `${user.name} started following you`,
          read: false,
          createdAt: new Date(),
        });

        alert(`You are now following ${post.name}`);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSavePost = async () => {
    if (!user?.email) {
      alert("You must be logged in to save posts.");
      return;
    }

    try {
      await addDoc(collection(db, "savedPosts"), {
        userEmail: user.email,
        postId: post.id,
        postOwner: post.email,
        content: post.content,
        image: post.image || "",
        savedAt: new Date(),
      });

      alert("Post saved successfully!");
    } catch (error) {
      console.error("Error saving post to collection:", error);
      alert(error.message);
    }
  };

  const handleReport = async () => {
    if (!user) {
      alert("You must be logged in to report content.");
      return;
    }

    try {
      await addDoc(collection(db, "reports"), {
        postId: post.id,
        postOwner: post.email,
        reportedBy: user.email,
        content: post.content,
        createdAt: new Date(),
      });

      alert("Post reported successfully. Thank you for keeping our platform safe.");
    } catch (error) {
      console.error("Error submitting content moderation log:", error);
      alert(error.message);
    }
  };

  if (checkingAccess) {
    return (
      <div className="post-card" style={{ opacity: 0.6, padding: "20px", color: "#94a3b8" }}>
        ⚡ Checking operational access policies...
      </div>
    );
  }

  return (
    <>
      <div className="post-card">
        {/* Modern Post Header Section */}
        <div className="post-header">
          {post.photo ? (
            <img
              src={post.photo}
              alt="Profile"
              className="post-avatar"
              style={{ width: "45px", height: "45px" }}
            />
          ) : (
            <div className="post-avatar">
              {post.name?.charAt(0)?.toUpperCase()}
            </div>
          )}

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3
                className="post-name"
                style={{
                  cursor: "pointer",
                  color: "#2563eb",
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
                onClick={() => (window.location.href = `/user/${post.uid}`)}
              >
                {post.name}
              </h3>
              <span
                style={{
                  background: badgeColor,
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {post.role}
              </span>

              {/* Added dynamic NDA Protected Badge */}
              {post.ndaRequired && (
                <span
                  style={{
                    background: "#dc2626",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginLeft: "8px",
                  }}
                >
                  🔒 NDA Protected
                </span>
              )}
            </div>
            <p className="post-time">
              {post.createdAt?.seconds
                ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                : "Just now"}
            </p>
          </div>
        </div>

        {/* History / Edited Timestamp */}
        {post.updatedAt && (
          <div style={{ color: "#f59e0b", marginBottom: "10px", fontSize: "12px" }}>
            Edited: {post.updatedAt?.seconds 
              ? new Date(post.updatedAt.seconds * 1000).toLocaleString() 
              : new Date(post.updatedAt).toLocaleString()}
          </div>
        )}

        {/* Content Body: Edit Mode vs View Mode */}
        {isEditing ? (
          <>
            <textarea
              rows="4"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              style={{
                width: "100%",
                background: "#334155",
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "white",
                padding: "10px",
                fontSize: "14px",
                outline: "none",
                resize: "none"
              }}
            />
            <br />
            <br />
            <button className="edit-btn" onClick={handleSave}>
              Save
            </button>
            <button
              className="delete-btn"
              onClick={() => setIsEditing(false)}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.7",
                marginBottom: "15px",
              }}
            >
              {post.ndaRequired && !hasAcceptedNda
                ? "🔒 This content is protected by a Non-Disclosure Agreement."
                : post.content}
            </p>
            
            {post.image && (!post.ndaRequired || hasAcceptedNda) && (
              <img
                src={post.image}
                alt="Post"
                onClick={() => setShowImage(true)}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  marginTop: "10px",
                  marginBottom: "15px",
                  maxHeight: "500px",
                  objectFit: "cover",
                  cursor: "pointer",
                }}
              />
            )}
          </>
        )}

        {post.ndaRequired && !hasAcceptedNda && (
          <button
            className="edit-btn"
            style={{
              marginTop: "12px",
              width: "100%",
              background: "#dc2626",
              color: "white",
            }}
            onClick={openNdaPopup}
          >
            🔒 View Protected Content
          </button>
        )}

        {/* Better Action Buttons Container */}
        <div className="post-actions">
          <button
            className="like-btn"
            onClick={() => handleLike(post.id)}
            style={{
              background: hasLiked ? "#ef4444" : "#475569",
              color: "white",
            }}
          >
            {hasLiked ? "❤️" : "🤍"} {post.likes?.length || 0} {post.likes?.length === 1 ? "Like" : "Likes"}
          </button>

          {/* Follow/Unfollow Button for other users */}
          {user?.email !== post.email && (
            <button className="edit-btn" onClick={handleFollow}>
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}

          {/* Collection-Based Save Bookmark Button */}
          <button className="edit-btn" onClick={handleSavePost}>
            ⚡ Save
          </button>

          {/* Report Content Flag Button Component */}
          {user?.email !== post.email && (
            <button className="delete-btn" onClick={handleReport}>
              🚩 Report
            </button>
          )}

          {/* Edit/Delete Controls for Post Owner */}
          {isOwner && (
            <>
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                ✏️ Edit
              </button>
              <button className="delete-btn" onClick={() => handleDelete(post.id)}>
                🗑 Delete
              </button>
            </>
          )}
        </div>

        {/* Like Summary Text */}
        {post.likes?.length > 0 && (
          <p style={{ marginTop: "10px", color: "#94a3b8", fontSize: "14px" }}>
            {hasLiked
              ? post.likes.length === 1
                ? "You liked this"
                : `You and ${post.likes.length - 1} others liked this`
              : `${post.likes.length} people liked this`}
          </p>
        )}

        {/* Comments Section */}
        <CommentSection postId={post.id} user={user} postOwnerEmail={post.email} />
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {showImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <button
            onClick={() => setShowImage(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "#ef4444",
              color: "white",
              border: "none",
              padding: "10px 15px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ✕ Close
          </button>
          <img
            src={post.image}
            alt="Full"
            style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "10px" }}
          />
        </div>
      )}

      {/* Embedded externalized dynamic <NdaPopup /> layout gatekeeper safely at the footer view layer */}
      <NdaPopup
        key={`${showNdaPopup}-${post.id}-${requiredNdaVersion}`}
        open={showNdaPopup}
        onClose={() => setShowNdaPopup(false)}
        agreement={agreement}
        signatureUrl={signatureUrl}
        onAccept={acceptNda}
        loading={ndaLoading}
        requiredVersion={requiredNdaVersion}
        upgradeRequired={ndaUpgradeRequired}
        ndaType={post.ndaType || "Founder"}
        onDecline={declineNda}
      />
    </>
  );
}

export default PostCard;
