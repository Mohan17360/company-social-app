import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
// Step B: Imported the useNavigate hook from react-router-dom
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Owner");
  const [image, setImage] = useState(null);

  // Step C: Initialized the navigate variable instance
  const navigate = useNavigate();

  const handleRegister = async () => {
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

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role,
        photo: photoURL,
        createdAt: new Date(),
      });

      alert("Registration Successful!");
      
      // Replaced old window location assignment to ensure smooth Client-Side Routing
      navigate("/feed");
    } catch (error) {
      alert(error.message);
    }
  };

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
          }}
        >
          <option>Owner</option>
          <option>Investor</option>
          <option>Freelancer</option>
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          style={{
            width: "100%",
            marginBottom: "20px",
          }}
        />

        <button className="create-btn" onClick={handleRegister}>
          Register
        </button>
      </div>
    </div>
  );
}

export default RegisterPage;