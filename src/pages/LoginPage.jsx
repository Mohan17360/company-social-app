import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
// Step B: Imported the useNavigate hook from react-router-dom
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step C: Initialized the navigate variable instance
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Login Successful!");
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
          }}
        />

        <button
          className="create-btn"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default LoginPage;