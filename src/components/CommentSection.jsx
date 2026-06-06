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
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const loadComments = async () => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setComments(data);
  };

  useEffect(() => {
    loadComments();
  }, []);

  const handleComment = async () => {
    if (!comment.trim()) return;

    await addDoc(collection(db, "comments"), {
      postId,
      name: user.name,
      text: comment,
      createdAt: new Date(),
    });

    setComment("");
    loadComments();
  };

  return (
    <div style={{ marginTop: "15px" }}>
      <input
        type="text"
        placeholder="Write a comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{
          padding: "8px",
          width: "70%",
        }}
      />

      <button
        onClick={handleComment}
        style={{
          marginLeft: "10px",
        }}
      >
        Add Comment
      </button>

      {comments.map((c) => (
        <div
          key={c.id}
          style={{
            marginTop: "10px",
            textAlign: "left",
          }}
        >
          <strong>{c.name}</strong>
          <br />
          {c.text}
        </div>
      ))}
    </div>
  );
}

export default CommentSection;