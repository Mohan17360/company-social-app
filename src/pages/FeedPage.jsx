import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";

function FeedPage() {
  const [post, setPost] = useState("");
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);

  const loadPosts = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "posts")
      );

      const postList = [];

      querySnapshot.forEach((doc) => {
        postList.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setPosts(postList.reverse());
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    loadPosts();

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          window.location.href = "/login";
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePost = async () => {
    if (!post.trim()) return;

    try {
      await addDoc(collection(db, "posts"), {
        name: userData.name,
        role: userData.role,
        content: post,
        likes: 0,
        createdAt: new Date(),
      });

      setPost("");

      loadPosts();

      alert("Post Created!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLike = async (
    postId,
    currentLikes
  ) => {
    try {
      await updateDoc(
        doc(db, "posts", postId),
        {
          likes: currentLikes + 1,
        }
      );

      loadPosts();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);

      alert("Logged Out!");

      window.location.href = "/login";
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <button onClick={handleLogout}>
        Logout
      </button>

      {userData && (
        <div
          style={{
            border: "1px solid gray",
            padding: "15px",
            marginTop: "15px",
            marginBottom: "20px",
          }}
        >
          <h2>{userData.name}</h2>

          <p>{userData.email}</p>

          <strong>{userData.role}</strong>
        </div>
      )}

      <h1>Social Feed</h1>

      <textarea
        rows="6"
        cols="50"
        placeholder="What's on your mind?"
        value={post}
        onChange={(e) =>
          setPost(e.target.value)
        }
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
            padding: "15px",
            marginTop: "10px",
          }}
        >
          <h3>{item.name}</h3>

          <small>{item.role}</small>

          <p>{item.content}</p>

          <button
            onClick={() =>
              handleLike(
                item.id,
                item.likes || 0
              )
            }
          >
            ❤️ Like ({item.likes || 0})
          </button>
        </div>
      ))}
    </div>
  );
}

export default FeedPage;