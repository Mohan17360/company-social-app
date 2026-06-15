// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  query, 
  where 
} from "firebase/firestore";
import { auth, db } from "../firebase";
// Step A: Import useNavigate
import { useNavigate } from "react-router-dom";
// AppLayout Component Import Kiya Gaya
import AppLayout from "../components/AppLayout";

function ProfilePage() {
  // Step B: Initialize navigate hook
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState(null);
  
  console.log("Profile User Data:", userData);

  const [name, setName] = useState("");
  // FIXED: 'role' state line deleted completely to fix ESLint warning
  const [photo, setPhoto] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  // Interactive Followers/Following UI control state trackers
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [myPosts, setMyPosts] = useState([]);

  // STEP 1: Added sub-tab switcher control workspace state logic hook
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    let unsubscribeUser = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      setUserId(user.uid);
      const userRef = doc(db, "users", user.uid);

      // Real-time listener so followers/following update dynamically
      unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setName(data.name || "");
          // FIXED: setRole line deleted completely from listener
          setPhoto(data.photo || "");
        }
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [navigate]);

  // STEP 3: Firestore runtime directory listener pipeline for modal lookups
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setAllUsers(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      },
      (error) => console.error("Global directory lookup execution error:", error)
    );

    return () => unsubscribe();
  }, []);

  // STEP 4: Real-time automated listener mapping current verified user posts engine
  useEffect(() => {
    if (!userData?.email) return;

    const q = query(
      collection(db, "posts"),
      where("email", "==", userData.email)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMyPosts(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      },
      (error) => console.error("User posts sub-stream connection failure:", error)
    );

    return () => unsubscribe();
  }, [userData]);

  const uploadImage = async () => {
    if (!image) return photo;

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

  const handleSave = async () => {
    try {
      const photoUrl = await uploadImage();

      // Explicitly mutating safe system fields (preventing role injection exploits)
      await updateDoc(doc(db, "users", userId), {
        name,
        photo: photoUrl,
      });

      alert("Profile Updated!");
      navigate("/feed");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <AppLayout>
      <div className="profile-page" style={{ padding: "20px" }}>
        {/* Step 1: Add Cover Banner */}
        <div className="profile-banner"></div>

        {/* Step 2: Profile Header Upgrade */}
        <div className="profile-header" style={{ marginTop: "-70px" }}>
          {preview || photo ? (
            <img
              src={preview || photo}
              alt="Profile"
              className="profile-avatar-large"
            />
          ) : (
            <div 
              className="profile-avatar-large" 
              style={{ 
                background: "#2563eb", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                color: "white", 
                fontSize: "36px", 
                fontWeight: "bold" 
              }}
            >
              {userData?.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="profile-info">
            <h1>{userData?.name || "Loading..."}</h1>
            <p style={{ color: "#94a3b8", marginBottom: "8px" }}>{userData?.email}</p>
            {userData?.role && (
              <span className="profile-role">
                {userData.role}
              </span>
            )}
          </div>
        </div>

        {/* Action Dashboard controls tray row injected directly below Header modules */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "15px",
          }}
        >
          <button className="create-btn">
            Edit Profile
          </button>

          <button
            className="edit-btn"
            onClick={() => navigate("/saved")}
          >
            Saved Posts
          </button>
        </div>

        {/* Step 3 / STEP 6 & 7: Stats Cards Section - Swapped into high-fidelity interaction handles */}
        <div className="profile-stats" style={{ marginTop: "20px" }}>
          <div 
            className="stat-card"
            onClick={() => setShowFollowers(true)}
            style={{ cursor: "pointer" }}
          >
            <h2>{userData?.followers?.length || 0}</h2>
            <p>Followers</p>
          </div>

          <div 
            className="stat-card"
            onClick={() => setShowFollowing(true)}
            style={{ cursor: "pointer" }}
          >
            <h2>{userData?.following?.length || 0}</h2>
            <p>Following</p>
          </div>

          <div className="stat-card">
            <h2>{userData?.postsCount || myPosts.length || 0}</h2>
            <p>Posts</p>
          </div>
        </div>

        {/* Correct Structure Section / STEP 5: Settings Form Block (Role Selector Removed Safely) */}
        <div className="post-card">
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "15px" }}>Edit Profile Settings</h2>
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button className="edit-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button className="create-btn" onClick={() => window.location.reload()} style={{ width: "auto" }}>
              ↻ Refresh
            </button>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Display Name</label>
            <input
              type="text"
              value={name}
              placeholder="Name"
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#334155", border: "none", color: "white" }}
            />
            <br />
            <br />

            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Account Role</label>
            {/* Privilege separation upgrade patch. Prevents unauthorized self-escalations. */}
            <div
              style={{
                padding: "12px",
                background: "#334155",
                borderRadius: "8px",
                color: "#94a3b8",
                fontSize: "15px",
                fontWeight: "500"
              }}
            >
              {userData?.role || "No explicit role assigned"}
            </div>
            <br />
            <br />

            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Profile Picture</label>
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
            <br />
            <br />

            <button className="create-btn" onClick={handleSave}>
              Save Changes
            </button>
            <br />
            <br />

            <button
              className="edit-btn"
              onClick={() => navigate("/feed")}
              style={{ width: "100%", background: "#475569" }}
            >
              Back To Feed
            </button>
          </div>
        </div>

        {/* STEP 2: Render Sub-tab switcher toolbar wrapper container context bar layout triggers */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          <button
            className={activeTab === "posts" ? "create-btn" : "edit-btn"}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>

          <button
            className={activeTab === "saved" ? "create-btn" : "edit-btn"}
            onClick={() => setActiveTab("saved")}
          >
            Saved
          </button>

          <button
            className={activeTab === "activity" ? "create-btn" : "edit-btn"}
            onClick={() => setActiveTab("activity")}
          >
            Activity
          </button>
        </div>

        {/* STEP 3 & Step 5: Full Width Recent Activity Section Wrapped inside conditional assessment flag updates */}
        {activeTab === "activity" && (
          <div className="post-card">
            <h2>Recent Activity</h2>
            <p style={{ marginTop: "10px", color: "#94a3b8" }}>
              User posts, comments, likes and group activity will appear here.
            </p>
          </div>
        )}

        {/* Live Profile Stream Interface Component Modules / STEP 4 & STEP 8: Upgraded to High-Fidelity Photo Grid Layout */}
        {activeTab === "posts" && (
          <div className="post-card">
            <h2 style={{ marginBottom: "15px" }}>My Posts</h2>
            
            {myPosts.length > 0 ? (
              <div className="profile-posts-grid">
                {myPosts.map((post) => (
                  <div key={post.id} className="profile-post-item">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt=""
                        className="profile-grid-image"
                      />
                    ) : (
                      <div className="profile-text-post">
                        {post.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#94a3b8" }}>
                No posts yet.
              </p>
            )}
          </div>
        )}

        {/* STEP 5: Saved Tab Module Template block overlay renderer layer node layout */}
        {activeTab === "saved" && (
          <div className="post-card">
            <h2>Saved Posts</h2>
            <button
              className="create-btn"
              style={{ marginTop: "15px" }}
              onClick={() => navigate("/saved")}
            >
              Open Saved Posts
            </button>
          </div>
        )}

        {/* STEP 9: Followers UI Modal Overlay Structure Block */}
        {showFollowers && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>Followers</h2>
              <div style={{ margin: "15px 0", maxHeight: "250px", overflowY: "auto" }}>
                {allUsers
                  .filter((u) => userData?.followers?.includes(u.email))
                  .map((u) => (
                    <div
                      key={u.id}
                      className="user-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid #334155"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {u.photo ? (
                          <img
                            src={u.photo}
                            alt=""
                            style={{
                              width: "45px",
                              height: "45px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "45px",
                              height: "45px",
                              borderRadius: "50%",
                              background: "#2563eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "bold",
                            }}
                          >
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div>{u.name}</div>
                          <small style={{ color: "#94a3b8" }}>{u.role || "User"}</small>
                        </div>
                      </div>

                      <button
                        className="edit-btn"
                        onClick={() => navigate(`/user/${u.id}`)}
                      >
                        View
                      </button>
                    </div>
                  ))}
                {(!userData?.followers || userData.followers.length === 0) && (
                  <p style={{ color: "#94a3b8", padding: "10px 0" }}>No followers found.</p>
                )}
              </div>
              <button className="create-btn" style={{ width: "100%" }} onClick={() => setShowFollowers(false)}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* STEP 10: Following UI Modal Overlay Structure Block */}
        {showFollowing && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h2>Following</h2>
              <div style={{ margin: "15px 0", maxHeight: "250px", overflowY: "auto" }}>
                {allUsers
                  .filter((u) => userData?.following?.includes(u.email))
                  .map((u) => (
                    <div
                      key={u.id}
                      className="user-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid #334155"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {u.photo ? (
                          <img
                            src={u.photo}
                            alt=""
                            style={{
                              width: "45px",
                              height: "45px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "45px",
                              height: "45px",
                              borderRadius: "50%",
                              background: "#2563eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "bold",
                            }}
                          >
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div>{u.name}</div>
                          <small style={{ color: "#94a3b8" }}>{u.role || "User"}</small>
                        </div>
                      </div>

                      <button
                        className="edit-btn"
                        onClick={() => navigate(`/user/${u.id}`)}
                      >
                        View
                      </button>
                    </div>
                  ))}
                {(!userData?.following || userData.following.length === 0) && (
                  <p style={{ color: "#94a3b8", padding: "10px 0" }}>Not following anyone yet.</p>
                )}
              </div>
              <button className="create-btn" style={{ width: "100%" }} onClick={() => setShowFollowing(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default ProfilePage;