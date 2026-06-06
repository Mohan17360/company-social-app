import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";

function FeedPage() {
  const [post, setPost] = useState("");
  const [posts, setPosts] = useState([]);

  const loadPosts = async () => {
    const querySnapshot = await getDocs(
      collection(db, "posts")
    );

    const postList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setPosts(postList.reverse());
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePost = async () => {
    try {
      await addDoc(collection(db, "posts"), {
        content: post,
        createdAt: new Date(),
      });

      setPost("");

      loadPosts();

      alert("Post Created!");
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

      <br />
      <br />

      <button onClick={handlePost}>
        Create Post
      </button>

      <hr />

      <h2>Posts</h2>

      {posts.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid gray",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <p>{item.content}</p>
        </div>
      ))}
    </div>
  );
}

export default FeedPage;