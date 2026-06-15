// src/pages/SavedPostsPage.jsx
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
// Added explicit onAuthStateChanged import block
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
// Verified/Added the useNavigate import
import { useNavigate } from "react-router-dom";
// AppLayout Component Import Add Kiya Gaya
import AppLayout from "../components/AppLayout";

function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState([]);
  
  // Initialized the navigate hook inside the component
  const navigate = useNavigate();

  // Integrated the multi-layer synchronized lifecycle listener block
  useEffect(() => {
    let unsubscribePosts = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setSavedPosts([]);
        if (unsubscribePosts) unsubscribePosts();
        return;
      }

      const q = query(
        collection(db, "savedPosts"),
        where("userEmail", "==", user.email)
      );

      unsubscribePosts = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSavedPosts(data);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribePosts) unsubscribePosts();
    };
  }, []);

  return (
    <AppLayout>
      <div className="feed-container">
        {/* Target heading matched style class name */}
        <h1 className="feed-title">Saved Posts</h1>

        {/* Injected Back and Refresh layout markup directly beneath the header */}
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

        {/* Structured WhatsApp Style Conditional Empty State Resolution Engine */}
        {savedPosts.length === 0 ? (
          <div className="post-card" style={{ textAlign: "center", padding: "30px 20px" }}>
            <h3 style={{ marginBottom: "8px" }}>No Saved Posts Yet</h3>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
              Save posts from the feed and they will appear here.
            </p>
          </div>
        ) : (
          savedPosts.map((post) => (
            <div key={post.id} className="post-card">
              <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6" }}>{post.content}</p>

              {post.image && (
                <img
                  src={post.image}
                  alt=""
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    marginTop: "10px"
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}

export default SavedPostsPage;