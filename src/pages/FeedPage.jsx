import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { db, auth } from "../firebase";
import PostCard from "../components/PostCard";

function FeedPage() {
  const [post, setPost] = useState("");
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] =
    useState(null);

  useEffect(() => {
    const unsubscribePosts =
      onSnapshot(
        collection(db, "posts"),
        (snapshot) => {
          const postList =
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

          setPosts(postList.reverse());
        }
      );

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            window.location.href =
              "/login";
            return;
          }

          const userRef = doc(
            db,
            "users",
            user.uid
          );

          const userSnap =
            await getDoc(userRef);

          if (userSnap.exists()) {
            setUserData(
              userSnap.data()
            );
          }
        }
      );

    return () => {
      unsubscribePosts();
      unsubscribeAuth();
    };
  }, []);

  const handlePost = async () => {
    if (!post.trim()) return;

    try {
      await addDoc(
        collection(db, "posts"),
        {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          content: post,
          likes: 0,
          createdAt: new Date(),
        }
      );

      setPost("");

      alert("Post Created!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLike = async (
    postId
  ) => {
    try {
      const postRef = doc(
        db,
        "posts",
        postId
      );

      const postSnap =
        await getDoc(postRef);

      if (!postSnap.exists()) return;

      const currentLikes =
        postSnap.data().likes || 0;

      await updateDoc(postRef, {
        likes: currentLikes + 1,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = async (
    postId,
    newContent
  ) => {
    if (!newContent.trim()) return;

    try {
      await updateDoc(
        doc(db, "posts", postId),
        {
          content: newContent,
        }
      );

      alert("Post Updated!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (
    postId
  ) => {
    const confirmDelete =
      window.confirm(
        "Delete this post?"
      );

    if (!confirmDelete) return;

    try {
      await deleteDoc(
        doc(db, "posts", postId)
      );

      alert("Post Deleted!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);

      alert("Logged Out!");

      window.location.href =
        "/login";
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
            border:
              "1px solid gray",
            padding: "15px",
            marginTop: "15px",
            marginBottom: "20px",
          }}
        >
          <h2>{userData.name}</h2>

          <p>{userData.email}</p>

          <strong>
            {userData.role}
          </strong>
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
        <PostCard
          key={item.id}
          post={item}
          handleLike={handleLike}
          handleEdit={handleEdit}
          handleDelete={
            handleDelete
          }
          user={userData}
        />
      ))}
    </div>
  );
}

export default FeedPage;