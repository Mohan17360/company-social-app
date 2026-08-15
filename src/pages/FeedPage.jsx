// src/pages/FeedPage.jsx
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
  getDoc,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import PostCard from "../components/PostCard";
import { useNavigate } from "react-router-dom";

function FeedPage() {
  const [post, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);

  // Initialize Instagram-Style Creation Hooks States
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  // Added user search core state dependencies hooks
  const [userSearch, setUserSearch] = useState("");
  const [allUsers, setAllUsers] = useState([]);

  // Added ndaRequired state to control access policies on creation payloads
  const [ndaRequired, setNdaRequired] = useState(false);

  // STEP 2 Applied: Added ndaType state hook to automate multi-role NDA pipelines
  const [ndaType, setNdaType] = useState("");

  // Initialize the navigate hook instance
  const navigate = useNavigate();

  // Added goToDashboard function with direct asynchronous session tracking matrix
  const goToDashboard = async () => {
    const user = auth.currentUser;

    if (!user) return;

    try {
      const snap = await getDoc(
        doc(db, "users", user.uid)
      );

      if (!snap.exists()) return;

      const role = snap.data().role;

      if (role === "Founder") {
        navigate("/founder-dashboard");
      } else if (role === "Investor") {
        navigate("/investor-dashboard");
      } else if (role === "Freelancer") {
        navigate("/freelancer-dashboard");
      }
    } catch (error) {
      console.error("Dashboard routing failed from Feed:", error);
    }
  };

  // Clear online flag when user leaves, closes the tab, or refreshes
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

    // Registered clean live query data-stream pipeline for users context maps
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllUsers(usersData);
    });

    let unsubscribeUser = null;
    let unsubscribeNotifications = null;

    // 2. Auth State Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      // Update the user's online status to true upon logging in
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

          // STEP 3 Applied: Automatically maps ecosystem role properties to initialize ndaType safely
          if (data.role === "Founder") {
            setNdaType("Founder");
          } else if (data.role === "Investor") {
            setNdaType("Investor");
          } else if (data.role === "Freelancer") {
            setNdaType("Freelancer");
          } else {
            setNdaType("Founder"); // Safe baseline routing fallback template configuration
          }
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

    // Cleanup active snapshot connections on unmount sequence processing
    return () => {
      unsubscribePosts();
      unsubscribeUsers();
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
      // Step 2.2 Applied: Dynamic background pre-fetch resolves target active version matrices perfectly
      let currentNdaVersion = 1;

      if (ndaRequired) {
        const agreementRef = doc(
          db,
          "agreementTemplates",
          ndaType
        );

        const agreementSnap = await getDoc(agreementRef);

        if (agreementSnap.exists()) {
          currentNdaVersion =
            agreementSnap.data().version || 1;
        }
      }

      let imageUrl = "";
      if (image) {
        imageUrl = await uploadImage();
      }

      // Step 2.3 Applied: Swapped fixed fallback value to securely trace currentNdaVersion parameters
      await addDoc(collection(db, "posts"), {
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        photo: userData.photo || "",
        content: post,
        image: imageUrl,
        
        ndaRequired: ndaRequired,
        ndaType: ndaRequired ? ndaType : "",
        ndaVersion: ndaRequired ? currentNdaVersion : 0,

        likes: [],
        createdAt: new Date(),
        updatedAt: null,
      });

      // Reset all operational state triggers cleanly upon fulfillment
      setMessage("");
      setImage(null);
      setPreview("");
      setSelectedFileName(""); 
      setNdaRequired(false);
      
      // Auto-collapse creation popup cleanly upon successful task processing
      setShowCreatePost(false);
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
    if (!window.confirm("Are you sure you want to log out?")) return;
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

  // Integrated filtration conditional matching reduction maps
  const filteredUsers = allUsers.filter(
    (user) =>
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="app-layout">
      
      {/* Modernized Side Action Tray Panel Overlay Framework */}
      <div className="instagram-sidebar">
        <h2 className="sidebar-logo">
          Company Social
        </h2>

        <button
          className="sidebar-item"
          onClick={() => navigate("/feed")}
        >
          <span className="sidebar-icon">🏠</span>
          <span className="sidebar-text">Home</span>
        </button>

        <button
          className="sidebar-item"
          onClick={() => document.getElementById("user-search")?.focus()}
        >
          <span className="sidebar-icon">🔍</span>
          <span className="sidebar-text">Search</span>
        </button>

        <button
          className="sidebar-item"
          onClick={() => setShowCreatePost(true)}
        >
          <span className="sidebar-icon">➕</span>
          <span className="sidebar-text">Create</span>
        </button>

        <button
          className="sidebar-item"
          onClick={() => navigate("/chat")}
        >
          <span className="sidebar-icon">💬</span>
          <span className="sidebar-text">Messages</span>
        </button>

        <button
          className="sidebar-item"
          onClick={() => navigate("/groups")}
        >
          <span className="sidebar-icon">👥</span>
          <span className="sidebar-text">Groups</span>
        </button>

        <button
          className="sidebar-item"
          onClick={() => navigate("/notifications")}
        >
          <span className="sidebar-icon">🔔</span>
          <span className="sidebar-text">
            Notifications {notificationCount > 0 && `(${notificationCount})`}
          </span>
        </button>

        <button
          className="sidebar-item"
          onClick={() => navigate("/profile")}
        >
          <span className="sidebar-icon">👤</span>
          <span className="sidebar-text">Profile</span>
        </button>

        {userData?.role === "Admin" && (
          <button
            className="sidebar-item"
            onClick={() => navigate("/admin")}
          >
            <span className="sidebar-icon">⚙️</span>
            <span className="sidebar-text">Admin</span>
          </button>
        )}

        <button
          className="sidebar-item logout"
          onClick={handleLogout}
        >
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-text">Logout</span>
        </button>
      </div>

      {/* Dynamic side-by-side core template layout panel isolation context box */}
      <div className="feed-main-content">
        {/* Profile identity verification sub-bar component context */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(30, 41, 59, 0.4)",
          padding: "10px 20px",
          borderRadius: "12px",
          marginBottom: "20px",
          fontSize: "14px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {userData?.photo ? (
              <img src={userData.photo} alt="User" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "12px" }}>
                {userData?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <span>Hi, <strong>{userData?.name || "User"}</strong> ({userData?.role})</span>
          </div>

          {/* Dynamic role-resolving Dashboard button on the right row side */}
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <button
              onClick={goToDashboard}
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              🏠 Dashboard
            </button>

            <button onClick={() => navigate("/saved")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", textDecoration: "underline" }}>
              Saved Posts
            </button>
          </div>
        </div>

        {/* Target user profiles tracker workspace input field hook */}
        <input
          id="user-search"
          type="text"
          placeholder="🔍 Search users..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="search-box"
          style={{ marginBottom: "10px" }}
        />

        {/* Render modular absolute dynamic target User query maps block overlay wrapper */}
        {userSearch && (
          <div className="post-card" style={{ marginBottom: "20px", backgroundColor: "#1e293b", padding: "10px", borderRadius: "12px" }}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => navigate(`/user/${user.id}`)}
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #334155",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  <strong style={{ fontSize: "15px" }}>{user.name || "Anonymous User"}</strong>
                  <br />
                  <span style={{ color: "#94a3b8", fontSize: "13px" }}>{user.email}</span>
                  <br />
                  <span style={{ color: "#38bdf8", fontSize: "12px", fontWeight: "600" }}>Role: {user.role || "Freelancer"}</span>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", color: "#94a3b8", margin: "10px 0" }}>No matching user profiles found.</p>
            )}
          </div>
        )}

        {/* Search Input Filter for Posts Content items thread stream array */}
        <input
          className="search-box"
          type="text"
          placeholder="🔍 Search posts, contents, or authors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: "20px" }}
        />

        {/* Feed Stream Content Thread Area */}
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

      {/* Instagram-style Modal Popup Overlay Portal Insertion */}
      {showCreatePost && (
        <div className="create-post-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="create-post-modal" style={{
            background: "#1e293b",
            width: "100%",
            maxWidth: "550px",
            borderRadius: "20px",
            padding: "25px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            border: "1px solid #334155"
          }}>
            
            <div className="modal-header" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #334155",
              paddingBottom: "12px",
              marginBottom: "20px"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "bold" }}>Create Post</h2>
              <button 
                onClick={() => {
                  setShowCreatePost(false);
                  setSelectedFileName("");
                }}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "22px", cursor: "pointer", padding: "4px" }}
              >
                ✕
              </button>
            </div>

            {/* Core Form Elements Asset Tree Block */}
            <div className="post-box" style={{ background: "none", padding: 0, boxShadow: "none", marginBottom: 0 }}>
              <textarea
                placeholder="What's on your mind?"
                value={post}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "140px",
                  background: "#334155",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  padding: "15px",
                  resize: "none",
                  marginBottom: "15px",
                  fontSize: "15px",
                  outline: "none"
                }}
              />

              {/* NDA Requirement Policy Control Toggle Input Row */}
              <div
                style={{
                  marginTop: "-5px",
                  marginBottom: "15px",
                  color: "white",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "14px" }}>
                  <input
                    type="checkbox"
                    checked={ndaRequired}
                    onChange={(e) => setNdaRequired(e.target.checked)}
                    style={{ marginRight: "8px", cursor: "pointer", width: "16px", height: "16px" }}
                  />
                  🔒 NDA Required Before Viewing
                </label>
              </div>

              {/* Sub-context Inline Label showing the dynamic auto-detected NDA status */}
              {ndaRequired && ndaType && (
                <div style={{ marginTop: "-10px", marginBottom: "15px", fontSize: "13px", color: "#38bdf8", fontWeight: "600" }}>
                  📋 Auto-locked to: {ndaType} NDA Template
                </div>
              )}
              
              {/* Integrated Horizontal Instagram Style Toolbar Row Controls */}
              <div className="create-post-tools" style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                
                {/* 🖼️ Tool Button Housing Hidden Label Photo File Upload Trigger */}
                <label className="upload-btn" style={{ position: "relative", cursor: "pointer" }}>
                  <span style={{ fontSize: "18px", padding: "8px", background: "#475569", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px" }} title="Add Photo">
                    🖼️
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setImage(file);
                      setPreview(URL.createObjectURL(file));
                      setSelectedFileName(file.name); 
                    }}
                  />
                </label>

                <button type="button" className="tool-btn" title="Video (Coming Soon)" style={{ width: "42px", height: "42px", borderRadius: "50%", border: "none", background: "#334155", fontSize: "18px", color: "white", cursor: "not-allowed", opacity: 0.6 }}>
                  🎥
                </button>

                <button type="button" className="tool-btn" title="Emoji" style={{ width: "42px", height: "42px", borderRadius: "50%", border: "none", background: "#334155", fontSize: "18px", color: "white", cursor: "pointer" }}>
                  😊
                </button>

                <button type="button" className="tool-btn" title="Location" style={{ width: "42px", height: "42px", borderRadius: "50%", border: "none", background: "#334155", fontSize: "18px", color: "white", cursor: "pointer" }}>
                  📍
                </button>
              </div>

              {/* Sub-context Inline Filename Metadata Banner */}
              {selectedFileName && (
                <div style={{ marginBottom: "15px", padding: "4px 8px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", width: "fit-content" }}>
                  <span style={{ color: "#94a3b8", fontSize: "13px" }} title={selectedFileName}>
                    📎 {selectedFileName}
                  </span>
                </div>
              )}

              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    maxHeight: "220px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    marginBottom: "15px",
                    border: "1px solid #334155"
                  }}
                />
              )}

              <button className="create-btn" onClick={handlePost}>
                Share Post
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default FeedPage;