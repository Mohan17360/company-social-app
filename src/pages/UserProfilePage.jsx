// src/pages/UserProfilePage.jsx
import { useEffect, useState } from "react";
// Step A: Integrated the useNavigate hook import alongside useParams
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  // STEP 9: Added mutation array transformation methods
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
// STEP 9 (Continued): Imported explicitly monitored auth state references
import { db, auth } from "../firebase";

function UserProfilePage() {
  const { uid } = useParams();

  // Step B: Initialized the navigate hook inside the component
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);

  // STEP 10: Initialized interactive following status toggle tracker state hook
  const [isFollowing, setIsFollowing] = useState(false);

  // STEP 1: Added modal visibility layout control flags and global directory hooks
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // RECOMMENDED SOLUTION: Fully real-time profile state tracking hook pipeline
  useEffect(() => {
    // Real-time user profile snapshot listener
    const unsubscribeUser = onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const fetchedData = snapshot.data();
          setUserData(fetchedData);

          // STEP 11: Real-time relationship evaluation gateway evaluation
          const currentEmail = auth.currentUser?.email;
          setIsFollowing(!!fetchedData.followers?.includes(currentEmail));
        }
      },
      (error) => console.error("Error watching user profile layout node:", error)
    );

    // Real-time listener for Posts collection written by this specific user
    const q = query(
      collection(db, "posts"),
      where("uid", "==", uid)
    );

    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPosts(data);
    });

    // Unified cleanup phase to detach all operational pipeline snapshots
    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, [uid]);

  // STEP 3: Initialized global runtime dictionary mapping engine tracker loop listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllUsers(users);
      },
      (error) => console.error("Global directory snapshot stream failure:", error)
    );

    return () => unsubscribe();
  }, []);

  // STEP 12: Real-time bilateral array union and removal coordination handler logic
  const handleFollow = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !userData) return;

    try {
      const targetRef = doc(db, "users", uid);
      const currentRef = doc(db, "users", currentUser.uid);

      if (isFollowing) {
        // Atomic transaction removing current credentials from target profile arrays
        await updateDoc(targetRef, {
          followers: arrayRemove(currentUser.email),
        });

        // Atomic transaction removing target credentials from active account arrays
        await updateDoc(currentRef, {
          following: arrayRemove(userData.email),
        });
      } else {
        // Atomic transaction appending current credentials onto target profile arrays
        await updateDoc(targetRef, {
          followers: arrayUnion(currentUser.email),
        });

        // Atomic transaction appending target credentials onto active account arrays
        await updateDoc(currentRef, {
          following: arrayUnion(userData.email),
        });
      }
    } catch (error) {
      console.error("Failed to commit relationship status updates:", error);
    }
  };

  if (!userData) return <p>Loading...</p>;

  return (
    <div className="feed-container">
      {/* Step C: Added navigation block layout directly at the top of the viewport container */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          className="edit-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <button
          className="create-btn"
          onClick={() => window.location.reload()}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="profile-card">
        {/* STEP 1: Upgraded unified Flex Header container for User Profile Card presentation layout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "30px",
            marginBottom: "25px",
            flexWrap: "wrap",
          }}
        >
          {userData.photo && (
            <img
              src={userData.photo}
              alt=""
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "4px solid #2563eb",
              }}
            />
          )}

          <div>
            <h1
              style={{
                marginBottom: "10px",
              }}
            >
              {userData.name}
            </h1>

            <p
              style={{
                color: "#94a3b8",
              }}
            >
              {userData.email}
            </p>

            <p>{userData.role}</p>

            <div
              style={{
                display: "flex",
                gap: "25px",
                marginTop: "15px",
                fontWeight: "600",
              }}
            >
              {/* STEP 4: Upgraded interactive modal trigger pointers swapping static text fields */}
              <span
                onClick={() => setShowFollowers(true)}
                style={{
                  cursor: "pointer",
                }}
              >
                Followers {userData.followers?.length || 0}
              </span>

              <span
                onClick={() => setShowFollowing(true)}
                style={{
                  cursor: "pointer",
                }}
              >
                Following {userData.following?.length || 0}
              </span>
              <span>Posts {userData.postsCount || posts.length || 0}</span>
            </div>
          </div>
        </div>

        {/* STEP 13 & STEP 3: Self-targeting prevention view guard with side-by-side action controls */}
        {auth.currentUser?.uid !== uid && (
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleFollow}
              style={{
                marginBottom: "15px",
                padding: "10px 22px",
                border: "none",
                borderRadius: "999px",
                cursor: "pointer",
                fontWeight: "700",
                color: "white",
                backgroundColor: isFollowing ? "#22c55e" : "#2563eb",
                transition: "0.3s",
              }}
            >
              {isFollowing ? "✓ Following" : "+ Follow"}
            </button>

            {/* Injected message navigator button cleanly alongside the base interaction pill */}
            <button
              onClick={() => navigate(`/chat/${uid}`)}
              style={{
                marginLeft: "10px",
                marginBottom: "15px",
                padding: "10px 22px",
                border: "none",
                borderRadius: "999px",
                cursor: "pointer",
                fontWeight: "700",
                color: "white",
                backgroundColor: "#64748b",
                transition: "0.3s"
              }}
            >
              💬 Message
            </button>
          </div>
        )}
      </div>

      <h2>User Posts</h2>

      {posts.map((post) => (
        <div key={post.id} className="post-card">
          <p>{post.content}</p>

          {post.image && (
            <img
              src={post.image}
              alt=""
              style={{
                width: "100%",
                borderRadius: "10px",
              }}
            />
          )}
        </div>
      ))}

      {/* STEP 5: Followers list modal presentation wrapper portal element */}
      {showFollowers && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Followers</h2>
            <div style={{ margin: "15px 0", maxHeight: "200px", overflowY: "auto" }}>
              {allUsers
                .filter((u) => userData.followers?.includes(u.email))
                .map((u) => (
                  <div key={u.id} className="user-row" style={{ padding: "8px 0" }}>
                    👤 {u.name}
                  </div>
                ))}
              {(!userData.followers || userData.followers.length === 0) && (
                <p style={{ color: "#64748b", fontSize: "14px" }}>No followers yet.</p>
              )}
            </div>
            <button className="edit-btn" onClick={() => setShowFollowers(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Following list modal presentation wrapper portal element */}
      {showFollowing && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Following</h2>
            <div style={{ margin: "15px 0", maxHeight: "200px", overflowY: "auto" }}>
              {allUsers
                .filter((u) => userData.following?.includes(u.email))
                .map((u) => (
                  <div key={u.id} className="user-row" style={{ padding: "8px 0" }}>
                    👤 {u.name}
                  </div>
                ))}
              {(!userData.following || userData.following.length === 0) && (
                <p style={{ color: "#64748b", fontSize: "14px" }}>Not following anyone yet.</p>
              )}
            </div>
            <button className="edit-btn" onClick={() => setShowFollowing(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfilePage;