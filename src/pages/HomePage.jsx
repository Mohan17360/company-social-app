import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Company Social Platform</h1>

      <p>Welcome to the platform.</p>

      <Link to="/login">
        <button>Login</button>
      </Link>

      <Link to="/register">
        <button style={{ marginLeft: "10px" }}>
          Register
        </button>
      </Link>
    </div>
  );
}

export default HomePage;