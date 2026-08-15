// src/pages/LoginPage.jsx
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
// Integrated required Firestore document reading modules safely
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase"; // Adjusted default import line references
// Step B: Imported the useNavigate hook from react-router-dom
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step C: Initialized the navigate variable instance
  const navigate = useNavigate();

  // Replaced sequential plain redirection pipeline with clear, robust async role checks matrix
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Extract current logged-in account record profile parameters
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      alert("Login Successful!");

      // Added temporarily: Trace parameter validation metrics
      console.log("ROLE =", userData?.role);

      // Dynamic Role-Based Route Validation Engine (Updated with Step 2 Debug Hook)
      if (userData?.role === "Founder") {
        console.log("GOING TO FOUNDER DASHBOARD");
        navigate("/founder-dashboard");
      } else if (userData?.role === "Investor") {
        navigate("/investor-dashboard");
      } else if (userData?.role === "Freelancer") {
        navigate("/freelancer-dashboard");
      } else {
        navigate("/feed");
      }
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
          maxWidth: "450px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          Welcome Back
        </h1>

        {/* Step D: Injected Back and Refresh dashboard control node directly beneath target heading */}
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
            &larr; Back
          </button>

          <button
            className="create-btn"
            onClick={() => window.location.reload()}
          >
            &#8635; Refresh
          </button>
        </div>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
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
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "20px",
            borderRadius: "10px",
            border: "none",
            background: "#334155",
            color: "white",
            boxSizing: "border-box"
          }}
        />

        <button
          className="create-btn"
          onClick={handleLogin}
          style={{ width: "100%", padding: "14px", fontWeight: "600" }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default LoginPage;