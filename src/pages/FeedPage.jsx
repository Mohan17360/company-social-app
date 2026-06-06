import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

function FeedPage() {
  const [post, setPost] = useState("");

  const handlePost = async () => {
    try {
      await addDoc(collection(db, "posts"), {
        content: post,
        createdAt: new Date()
      });

      alert("Post Created!");

      setPost("");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Social Feed</h1>

      <textarea
        rows="5"
        cols="50"
        placeholder="What's on your mind?"
        value={post}
        onChange={(e) => setPost(e.target.value)}
      />

      <br /><br />

      <button onClick={handlePost}>
        Create Post
      </button>
    </div>
  );
}

export default FeedPage;