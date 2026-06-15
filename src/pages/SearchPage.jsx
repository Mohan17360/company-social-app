import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
// AppLayout Component Import Kiya Gaya
import AppLayout from "../components/AppLayout";

function SearchPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setUsers(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="feed-container">
        <h1>🔍 Search</h1>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
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
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "20px",
            background: "#1e293b",
            border: "none",
            color: "white"
          }}
        />

        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="post-card"
            style={{
              cursor: "pointer",
              marginBottom: "15px",
            }}
            onClick={() => navigate(`/user/${user.id}`)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              {user.photo ? (
                <img
                  src={user.photo}
                  alt=""
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "22px",
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h3>{user.name}</h3>
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>{user.email}</p>
                {user.role && (
                  <span className="role-badge" style={{ marginTop: "4px" }}>
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "20px" }}>
            No users found.
          </p>
        )}
      </div>
    </AppLayout>
  );
}

export default SearchPage;