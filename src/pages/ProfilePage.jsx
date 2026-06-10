import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
// Step A: Import useNavigate
import { useNavigate } from "react-router-dom";

function ProfilePage() {
  // Step B: Initialize navigate hook
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState(null);
  
  console.log("Profile User Data:", userData);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [photo, setPhoto] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

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
          setRole(data.role || "");
          setPhoto(data.photo || "");
        }
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [navigate]);

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

      await updateDoc(doc(db, "users", userId), {
        name,
        role,
        photo: photoUrl,
      });

      alert("Profile Updated!");
      navigate("/feed");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
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

      {/* Step 3: Stats Cards Section */}
      <div className="profile-stats">
        <div className="stat-card">
          <h2>{userData?.followers?.length || 0}</h2>
          <p>Followers</p>
        </div>

        <div className="stat-card">
          <h2>{userData?.following?.length || 0}</h2>
          <p>Following</p>
        </div>

        <div className="stat-card">
          <h2>{userData?.postsCount || 0}</h2>
          <p>Posts</p>
        </div>
      </div>

      {/* Correct Structure Section: Settings Form Block */}
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
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#334155", border: "none", color: "white" }}
          >
            <option>Owner</option>
            <option>Investor</option>
            <option>Freelancer</option>
            <option>Admin</option>
          </select>
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

      {/* Step 5: Full Width Recent Activity Section */}
      <div className="post-card">
        <h2>Recent Activity</h2>
        <p style={{ marginTop: "10px", color: "#94a3b8" }}>
          User posts, comments, likes and group activity will appear here.
        </p>
      </div>

      {/* New Explicit Posts Section */}
      <div className="post-card">
        <h2>Posts</h2>
        <p style={{ marginTop: "10px", color: "#94a3b8" }}>
          User posts will appear here.
        </p>
      </div>
    </div>
  );
}

export default ProfilePage;