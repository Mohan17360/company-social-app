import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

function CommentSection({ postId, user }) {
  const [comment, setComment] =
    useState("");

  const [comments, setComments] =
    useState([]);

  const loadComments = async () => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );

    setComments(data);
  };

  useEffect(() => {
    loadComments();
  }, []);

  const handleComment = async () => {
    if (!comment.trim()) return;

    try {
      await addDoc(
        collection(db, "comments"),
        {
          postId,
          name: user.name,
          text: comment,
          createdAt: new Date(),
        }
      );

      setComment("");

      loadComments();
    } catch (error) {
      alert(error.message);
    }
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
          onClick={handleComment}
        >
          Post
        </button>
      </div>

      {comments.map((c) => (
        <div
          key={c.id}
          className="comment"
        >
          <strong>
            {c.name}
          </strong>

          <p
            style={{
              marginTop: "5px",
            }}
          >
            {c.text}
          </p>
        </div>
      ))}
    </div>
  );
}

export default CommentSection;