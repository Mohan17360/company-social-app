// src/pages/RegisterPage.jsx
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
// Step 1: Updated imports to include getDoc
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
// Step B: Imported the useNavigate hook from react-router-dom
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Replaced default state assignment from "Owner" to "Freelancer"
  const [role, setRole] = useState("Freelancer");
  const [image, setImage] = useState(null);

  // Step 2: Added administration infrastructure check states
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Step C: Initialized the navigate variable instance
  const navigate = useNavigate();

  // Step 4: Run mount sequence loadSettings check call
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "platform"));

        if (settingsDoc.exists()) {
          setRegistrationEnabled(settingsDoc.data().registrationEnabled);
        }
      } catch (error) {
        console.error("Failed to load application system settings:", error);
      }
      setLoadingSettings(false);
    };

    loadSettings();
  }, []);

  const handleRegister = async () => {
    // Step 5: Prevent registration logic processing if route disabled
    if (!registrationEnabled) {
      alert("New registrations are currently disabled by administrator.");
      return;
    }

    try {
      let photoURL = "";

      if (image) {
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
        photoURL = data.secure_url;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Replaced role logic code to route registrations into an administrative queue
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role: "Pending",
        requestedRole: role,
        approvalStatus: "Pending",
        photo: photoURL,
        createdAt: new Date(),
        online: false,
        isBanned: false,
      });

      alert("Registration Successful!");
      
      // Replaced old window location assignment to ensure smooth Client-Side Routing
      navigate("/feed");
    } catch (error) {
      alert(error.message);
    }
  };

  // Step 6: Maintenance and load fallbacks layout evaluation block
  if (loadingSettings) {
    return null;
  }

  if (!registrationEnabled) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#0f172a",
          color: "white",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "15px" }}>
            🚫 Registration Closed
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "25px" }}>
            New user registration has been disabled by administrator.
          </p>
          <button
            className="edit-btn"
            onClick={() => navigate("/login")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Go To Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          padding: "40px",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "25px",
            color: "white"
          }}
        >
          Create Account
        </h1>

        {/* Step D: Injected Back and Refresh control buttons row directly below the header */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            justifyContent: "center"
          }}
        >
          <button
            className="edit-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <button
            className="create-btn"
            onClick={() => window.location.reload()}
          >
            ↻ Refresh
          </button>
        </div>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "15px",
            borderRadius: "10px",
            border: "none",
            background: "#334155",
            color: "white",
            boxSizing: "border-box"
          }}
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "15px",
            borderRadius: "10px",
            border: "none",
            background: "#334155",
            color: "white",
            boxSizing: "border-box"
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "15px",
            borderRadius: "10px",
            border: "none",
            background: "#334155",
            color: "white",
            boxSizing: "border-box"
          }}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "15px",
            borderRadius: "10px",
            border: "none",
            background: "#334155",
            color: "white",
            boxSizing: "border-box",
            cursor: "pointer"
          }}
        >
          <option value="Owner">Owner</option>
          <option value="Investor">Investor</option>
          <option value="Freelancer">Freelancer</option>
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          style={{
            width: "100%",
            marginBottom: "20px",
            color: "#94a3b8"
          }}
        />

        <button 
          className="create-btn" 
          onClick={handleRegister}
          style={{ width: "100%", padding: "14px", fontWeight: "600" }}
        >
          Register
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;