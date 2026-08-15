// src/pages/FoundersPage.jsx
import { useEffect, useState } from "react";
// Added: React Router navigation framework helper for query params routing
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";

function FoundersPage() {
  const [founders, setFounders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFounders = async () => {
      const snap = await getDocs(collection(db, "users"));

      const data = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (user) =>
            user.role === "Founder" &&
            user.verified === true
        );

      setFounders(data);
    };

    loadFounders();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "30px",
      }}
    >
      <h1>🚀 Founders</h1>

      <div
        style={{
          marginTop: "20px",
          background: "#1e293b",
          padding: "20px",
          borderRadius: "15px",
        }}
      >
        <h3>Startup Discovery Hub</h3>

        <p>
          Browse verified founders and request meetings.
        </p>
      </div>

      {founders.map((founder) => (
        <div
          key={founder.id}
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
            marginTop: "15px",
          }}
        >
          <h3>{founder.name}</h3>

          <p
            style={{
              color: "#94a3b8",
              margin: "5px 0",
            }}
          >
            {founder.email}
          </p>

          {founder.companyName && (
            <p>{founder.companyName}</p>
          )}

          {/* Replaced: Button component now tracks URL parameterized query path shifts directly */}
          <button
            onClick={() =>
              navigate(
                `/meetings?founder=${founder.id}`
              )
            }
            style={{
              marginTop: "10px",
              padding: "10px 15px",
              border: "none",
              borderRadius: "8px",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Request Meeting
          </button>
        </div>
      ))}

      {founders.length === 0 && (
        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginTop: "30px",
          }}
        >
          No verified founders found on the platform yet.
        </p>
      )}
    </div>
  );
}

export default FoundersPage;