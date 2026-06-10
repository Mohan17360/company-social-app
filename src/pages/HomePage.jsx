import { Link, useNavigate } from "react-router-dom"; // Step B: Verified/Added the useNavigate import

function HomePage() {
  // Step C: Initialized the navigate hook inside the component
  const navigate = useNavigate();

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
          padding: "50px",
          borderRadius: "20px",
          textAlign: "center",
          width: "100%",
          maxWidth: "600px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            marginBottom: "15px",
          }}
        >
          Company Social Platform
        </h1>

        {/* Step D: Injected Back and Refresh control buttons row directly below the main heading */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            justifyContent: "center", // Centered to match the design language of the landing card
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

        <p
          style={{
            color: "#94a3b8",
            marginBottom: "35px",
            fontSize: "18px",
          }}
        >
          Connect, share ideas and collaborate with professionals.
        </p>

        <div
          style={{
            display: "flex",
            gap: "15px",
            justifyContent: "center",
          }}
        >
          <Link to="/login">
            <button
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "12px 25px",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Login
            </button>
          </Link>

          <Link to="/register">
            <button
              style={{
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "12px 25px",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Register
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;