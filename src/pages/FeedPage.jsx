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
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribePosts = onSnapshot(
      collection(db, "posts"),
      (snapshot) => {
        const postList = snapshot.docs.map((doc) => ({
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

  const uploadImage =
    async () => {
      if (!image) return "";

      const formData =
        new FormData();

      formData.append(
        "file",
        image
      );

      formData.append(
        "upload_preset",
        "companysocial"
      );

      const response =
        await fetch(
          "https://api.cloudinary.com/v1_1/doocnue5h/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      return data.secure_url;
    };

  const handlePost =
    async () => {
      if (
        !post.trim() &&
        !image
      )
        return;

      try {
        let imageUrl = "";

        if (image) {
          imageUrl =
            await uploadImage();
        }

        await addDoc(
          collection(db, "posts"),
          {
            name:
              userData.name,
            email:
              userData.email,
            role:
              userData.role,
            photo:
              userData.photo || "",
            content: post,
            image:
              imageUrl,
            likes: 0,
            createdAt:
              new Date(),
            updatedAt:
              null,
          }
        );

        setPost("");
        setImage(null);
        setPreview("");
      } catch (error) {
        alert(error.message);
      }
    };

  const handleLike =
    async (postId) => {
      try {
        const postRef = doc(
          db,
          "posts",
          postId
        );

        const postSnap =
          await getDoc(postRef);

        if (!postSnap.exists())
          return;

        const currentLikes =
          postSnap.data()
            .likes || 0;

        await updateDoc(
          postRef,
          {
            likes:
              currentLikes +
              1,
          }
        );
      } catch (error) {
        alert(error.message);
      }
    };

  const handleEdit =
    async (
      postId,
      newContent
    ) => {
      if (
        !newContent.trim()
      )
        return;

      try {
        await updateDoc(
          doc(
            db,
            "posts",
            postId
          ),
          {
            content:
              newContent,
            updatedAt:
              new Date(),
          }
        );
      } catch (error) {
        alert(error.message);
      }
    };

  const handleDelete =
    async (postId) => {
      if (
        !window.confirm(
          "Delete this post?"
        )
      )
        return;

      try {
        await deleteDoc(
          doc(
            db,
            "posts",
            postId
          )
        );
      } catch (error) {
        alert(error.message);
      }
    };

  const handleLogout =
    async () => {
      try {
        await signOut(auth);
        window.location.href =
          "/login";
      } catch (error) {
        alert(error.message);
      }
    };

  return (
    <div className="feed-container">

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          marginBottom: "20px",
        }}
      >
        <button
          className="edit-btn"
          onClick={() =>
            (window.location.href =
              "/profile")
          }
        >
          Profile
        </button>

        <button
          className="delete-btn"
          onClick={
            handleLogout
          }
        >
          Logout
        </button>
      </div>

      {userData && (
        <div className="profile-card">
          {userData.photo && (
            <img
              src={
                userData.photo
              }
              alt="Profile"
              style={{
                width:
                  "100px",
                height:
                  "100px",
                borderRadius:
                  "50%",
                objectFit:
                  "cover",
                marginBottom:
                  "15px",
                border:
                  "3px solid #2563eb",
              }}
            />
          )}

          <h2 className="profile-name">
            {userData.name}
          </h2>

          <p>
            {userData.email}
          </p>

          <p className="profile-role">
            {userData.role}
          </p>
        </div>
      )}

      <h1 className="feed-title">
        Company Social
      </h1>

      <div className="post-box">
        <textarea
          placeholder="What's on your mind?"
          value={post}
          onChange={(e) =>
            setPost(
              e.target.value
            )
          }
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setImage(
              e.target.files[0]
            );

            setPreview(
              URL.createObjectURL(
                e.target.files[0]
              )
            );
          }}
        />

        {preview && (
          <img
            src={preview}
            alt="Preview"
            style={{
              width: "100%",
              marginTop: "15px",
              borderRadius:
                "10px",
            }}
          />
        )}

        <button
          className="create-btn"
          onClick={
            handlePost
          }
        >
          Share Post
        </button>
      </div>

      {posts.map((item) => (
        <PostCard
          key={item.id}
          post={item}
          handleLike={
            handleLike
          }
          handleEdit={
            handleEdit
          }
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




