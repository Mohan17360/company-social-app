// src/pages/InvestorsPage.jsx
import { useEffect, useState } from "react";
// Consolidated Firestore features with auth context integration
import {  db } from "../firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";

function InvestorsPage() {
  // Mapped the collection array state holder
  const [investors, setInvestors] = useState([]);

  // Integrated conditional asynchronous fetch lookup targeting verified investors
  useEffect(() => {
    const loadInvestors = async () => {
      const snap = await getDocs(collection(db, "users"));

      const data = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (user) =>
            user.role === "Investor" &&
            user.verified === true
        );

      setInvestors(data);
    };

    loadInvestors();
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
      <h1>💰 Investors</h1>

      <div
        style={{
          marginTop: "20px",
          background: "#1e293b",
          padding: "20px",
          borderRadius: "15px",
        }}
      >
        <h3>Investor Discovery Hub</h3>

        <p>
          Browse verified investors and request meetings.
        </p>
      </div>

      {/* Dynamic iteration layer generating high-fidelity verified investor cards */}
      {investors.map((investor) => (
        <div
          key={investor.id}
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
            marginTop: "15px",
          }}
        >
          <h3>{investor.name}</h3>

          <p style={{ color: "#94a3b8", margin: "5px 0" }}>{investor.email}</p>
        </div>
      ))}

      {investors.length === 0 && (
        <p style={{ textAlign: "center", color: "#64748b", marginTop: "30px" }}>
          No verified investors found on the platform yet.
        </p>
      )}
    </div>
  );
}

export default InvestorsPage;