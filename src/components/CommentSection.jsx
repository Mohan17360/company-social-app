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

function CommentSection({ postId, user }) {
  const [comment, setComment] =
    useState("");

  const [comments, setComments] =
    useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );

    const unsubscribe =
      onSnapshot(q, (snapshot) => {
        const data =
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        setComments(data);
      });

    return () => unsubscribe();
  }, [postId]);

  const handleComment =
    async () => {
      if (!comment.trim()) return;

      try {
        await addDoc(
          collection(db, "comments"),
          {
            postId,
            name: user.name,
            email: user.email,
            text: comment,
            createdAt:
              new Date(),
          }
        );

        setComment("");
      } catch (error) {
        alert(error.message);
      }
    };

  const handleDeleteComment =
    async (commentId) => {
      if (
        !window.confirm(
          "Delete this comment?"
        )
      )
        return;

      try {
        await deleteDoc(
          doc(
            db,
            "comments",
            commentId
          )
        );
      } catch (error) {
        alert(error.message);
      }
    };

  const formatDate = (
    timestamp
  ) => {
    if (!timestamp) return "";

    const date =
      timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleString();
  };

  return (
    <div className="comment-box">
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "15px",
        }}
      >
        <input
          className="comment-input"
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) =>
            setComment(
              e.target.value
            )
          }
        />

        <button
          className="create-btn"
          style={{
            width: "120px",
            marginTop: "0",
          }}
          onClick={
            handleComment
          }
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
          💬 {comments.length}{" "}
          Comment
          {comments.length > 1
            ? "s"
            : ""}
        </p>
      )}

      {comments.map((c) => (
        <div
          key={c.id}
          className="comment"
          style={{
            marginTop: "10px",
            padding: "10px",
            background:
              "#334155",
            borderRadius:
              "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
            }}
          >
            <strong>
              {c.name}
            </strong>

            {user?.email ===
              c.email && (
              <button
                onClick={() =>
                  handleDeleteComment(
                    c.id
                  )
                }
                style={{
                  background:
                    "#ef4444",
                  color:
                    "white",
                  border:
                    "none",
                  padding:
                    "4px 8px",
                  borderRadius:
                    "6px",
                  cursor:
                    "pointer",
                }}
              >
                Delete
              </button>
            )}
          </div>

          <p
            style={{
              marginTop: "5px",
            }}
          >
            {c.text}
          </p>

          <small
            style={{
              color:
                "#94a3b8",
            }}
          >
            {formatDate(
              c.createdAt
            )}
          </small>
        </div>
      ))}
    </div>
  );
}

export default CommentSection;