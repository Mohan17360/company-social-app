import { useState } from "react";
import CommentSection from "./CommentSection";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  collection,
} from "firebase/firestore";
import { db } from "../firebase";

function PostCard({ post, handleLike, handleEdit, handleDelete, user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

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

        // Add real-time notification before alerting the user
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

  // Function to save a post to a dedicated collection
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

  // Function to flag inappropriate content to the moderation team
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
              {post.content}
            </p>
            
            {post.image && (
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
    </>
  );
}

export default PostCard;