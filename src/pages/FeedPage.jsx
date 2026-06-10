import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import PostCard from "../components/PostCard";
// Imported useNavigate for smooth client-side SPA routing
import { useNavigate } from "react-router-dom";

function FeedPage() {
  const [post, setPost] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);

  // Initialized the navigate hook instance
  const navigate = useNavigate();

  // Step 2: Clear online flag when user leaves, closes the tab, or refreshes
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          online: false,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    // 1. Real-time listener for Posts collection
    const unsubscribePosts = onSnapshot(collection(db, "posts"), (snapshot) => {
      const postList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postList.reverse());
    });

    let unsubscribeUser = null;
    let unsubscribeNotifications = null;

    // 2. Auth State Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      // Step 1: Update the user's online status to true upon logging in
      await updateDoc(doc(db, "users", user.uid), {
        online: true,
      });

      const userRef = doc(db, "users", user.uid);

      // Real-time user updates with built-in ban enforcement
      unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Gatekeep active sessions against administrative bans
          if (data.isBanned) {
            alert("Your account has been banned by an administrator.");
            await signOut(auth);
            navigate("/login");
            return;
          }

          setUserData({
            uid: user.uid,
            ...data,
          });
        }
      });

      // 3. Real-time listener for Notifications
      unsubscribeNotifications = onSnapshot(
        collection(db, "notifications"),
        (snapshot) => {
          const unread = snapshot.docs.filter((doc) => {
            const data = doc.data();
            return data.userEmail === user.email && data.read === false;
          });
          setNotificationCount(unread.length);
        }
      );
    });

    // Cleanup active snapshot connections on unmount
    return () => {
      unsubscribePosts();
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [navigate]);

  const uploadImage = async () => {
    if (!image) return "";

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "companysocial");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/doocnue5h/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    return data.secure_url;
  };

  const handlePost = async () => {
    if (!post.trim() && !image) return;

    try {
      let imageUrl = "";
      if (image) {
        imageUrl = await uploadImage();
      }

      await addDoc(collection(db, "posts"), {
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        photo: userData.photo || "",
        content: post,
        image: imageUrl,
        likes: [],
        createdAt: new Date(),
        updatedAt: null,
      });

      setPost("");
      setImage(null);
      setPreview("");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLike = async (postId) => {
    try {
      const postRef = doc(db, "posts", postId);
      const targetPost = posts.find((p) => p.id === postId);

      if (!targetPost) return;

      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      if (targetPost.likes?.includes(currentUserId)) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUserId),
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUserId),
        });

        // Add notification logic if liking someone else's post
        if (targetPost.email !== userData?.email) {
          await addDoc(collection(db, "notifications"), {
            userEmail: targetPost.email,
            message: `${userData.name} liked your post`,
            createdAt: new Date(),
            read: false,
          });
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = async (postId, newContent) => {
    if (!newContent.trim()) return;
    try {
      await updateDoc(doc(db, "posts", postId), {
        content: newContent,
        updatedAt: new Date(),
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      // Clean up presence status to false when gracefully logging out
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          online: false,
        });
      }
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredPosts = posts.filter(
    (item) =>
      item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="feed-container">
      
      {/* Combined Dashboard Header Layout */}
      <div className="dashboard-header">
        
        {/* Profile Identity Left Side Area */}
        <div className="profile-section">
          {userData?.photo ? (
            <img 
              src={userData.photo} 
              alt="Profile" 
              className="profile-avatar"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="profile-avatar">
              {userData?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}

          <div>
            <h2>{userData?.name || "Loading..."}</h2>
            <p>{userData?.email}</p>
            <span className="role-badge">
              {userData?.role}
            </span>
          </div>
        </div>

        {/* Global Control Right Side Toolbar */}
        <div className="nav-section">
          <div className="top-navbar">
            <button className="profile-btn" onClick={() => navigate("/feed")}>
              🏠 Feed
            </button>

            {userData?.role === "Admin" && (
              <button className="profile-btn" onClick={() => navigate("/admin")}>
                🛠️ Admin
              </button>
            )}

            <button className="profile-btn" onClick={() => navigate("/chat")}>
              💬 Chat
            </button>

            <button className="profile-btn" onClick={() => navigate("/groups")}>
              👥 Groups
            </button>

            <button className="profile-btn" onClick={() => navigate("/notifications")}>
              🔔 Notifications ({notificationCount})
            </button>

            <button className="profile-btn" onClick={() => navigate("/saved")}>
              🔖 Saved
            </button>

            <button className="profile-btn" onClick={() => navigate("/profile")}>
              👤 Profile
            </button>

            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

      </div>

      {/* Search Input Filter */}
      <input
        className="search-box"
        type="text"
        placeholder="🔍 Search posts, users or roles..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Post Box Composer */}
      <div className="post-box">
        <textarea
          placeholder="What's on your mind?"
          value={post}
          onChange={(e) => setPost(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            setImage(file);
            setPreview(URL.createObjectURL(file));
          }}
        />
        {preview && (
          <img
            src={preview}
            alt="Preview"
            style={{
              width: "100%",
              marginTop: "15px",
              borderRadius: "12px",
              marginBottom: "15px",
            }}
          />
        )}
        <button className="create-btn" onClick={handlePost}>
          Share Post
        </button>
      </div>

      {/* Feed Stream */}
      {filteredPosts.length === 0 && (
        <p style={{ textAlign: "center", color: "#94a3b8" }}>
          No posts found.
        </p>
      )}

      {filteredPosts.map((item) => (
        <PostCard
          key={item.id}
          post={item}
          handleLike={handleLike}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          user={userData}
        />
      ))}
    </div>
  );
}

export default FeedPage;