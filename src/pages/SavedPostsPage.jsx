import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase";
// Step A: Verified/Added the useNavigate import
import { useNavigate } from "react-router-dom";

function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState([]);
  
  // Step B: Initialized the navigate hook inside the component
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) return;

    const q = query(
      collection(db, "savedPosts"),
      where("userEmail", "==", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSavedPosts(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="feed-container">
      {/* Target heading matched style class name */}
      <h1 className="feed-title">Saved Posts</h1>

      {/* Step C: Injected Back and Refresh layout markup directly beneath the header */}
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

      {savedPosts.map((post) => (
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
    </div>
  );
}

export default SavedPostsPage;