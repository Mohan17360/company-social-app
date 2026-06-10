import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase";

function CommentSection({
  postId,
  user,
  postOwnerEmail,
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setComments(data);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleComment = async () => {
    if (!comment.trim()) return;

    try {
      await addDoc(collection(db, "comments"), {
        postId,
        name: user.name,
        email: user.email,
        text: comment,
        createdAt: new Date(),
      });

      if (user.email !== postOwnerEmail) {
        await addDoc(collection(db, "notifications"), {
          userEmail: postOwnerEmail,
          message: `${user.name} commented on your post`,
          read: false,
          createdAt: new Date(),
        });
      }

      setComment("");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await deleteDoc(doc(db, "comments", commentId));
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="comment-box">
      {/* Better Comment Input */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "15px",
        }}
      >
        <textarea
          className="comment-input"
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="1"
          style={{
            resize: "vertical",
            minHeight: "42px",
            fontFamily: "inherit",
          }}
        />

        <button
          className="create-btn"
          style={{
            width: "120px",
            marginTop: "0",
            height: "42px",
          }}
          onClick={handleComment}
        >
          Post
        </button>
      </div>

      {comments.length > 0 && (
        <p
          style={{
            marginTop: "15px",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          💬 {comments.length} Comment{comments.length > 1 ? "s" : ""}
        </p>
      )}

      {comments.map((c) => (
        <div
          key={c.id}
          className="comment"
          style={{
            marginTop: "10px",
            padding: "12px",
            background: "#334155",
            borderRadius: "10px",
          }}
        >
          {/* Comment Header Section */}
          <div
            className="comment-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                className="comment-avatar"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                {c.name?.charAt(0)?.toUpperCase()}
              </div>

              <div>
                <strong style={{ display: "block", fontSize: "14px" }}>
                  {c.name}
                </strong>
                <div className="comment-time" style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>
                  {c.createdAt?.seconds
                    ? new Date(c.createdAt.seconds * 1000).toLocaleString()
                    : "Just now"}
                </div>
              </div>
            </div>

            {user?.email === c.email && (
              <button
                onClick={() => handleDeleteComment(c.id)}
                style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                Delete
              </button>
            )}
          </div>

          {/* Comment Text Layout Layer */}
          <p className="comment-text" style={{ fontSize: "14px", lineHeight: "1.5", margin: "0 0 0 42px" }}>
            {c.text}
          </p>
        </div>
      ))}
    </div>
  );
}

export default CommentSection;