// src/pages/InvestorDashboard.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
// Step 1: Consolidated Firestore imports to safely support real-time badges without duplicates
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where 
} from "firebase/firestore";
// Added: Secure authentication state listener import
import { onAuthStateChanged } from "firebase/auth";
// Added: React Router navigation helper
import { useNavigate } from "react-router-dom";

function InvestorDashboard() {
  const [userData, setUserData] = useState(null);
  // Step 2: Added state hook to track dynamic unread notification badge count
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();

  // Replaced: Synchronized stack with auth boundaries to prevent initial state race conditions
  useEffect(() => {
    let unsubscribeNotifications = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) return;

        const unsubscribeDoc = onSnapshot(
          doc(db, "users", user.uid),
          (snap) => {
            // Temporary Fix Guard Block Applied Cleanly Inside onSnapshot
            if (snap.exists()) {
              const data = snap.data();

              if (data.role !== "Investor") {
                navigate("/founder-dashboard");
                return;
              }

              setUserData(data);

              // Step 3: Trigger real-time snapshot subscription query tracking matching metrics
              if (data.email) {
                const q = query(
                  collection(db, "notifications"),
                  where("receiverEmail", "==", data.email),
                  where("read", "==", false)
                );

                unsubscribeNotifications = onSnapshot(q, (snapshot) => {
                  setNotificationCount(snapshot.size);
                });
              }
            }
          }
        );

        return () => {
          unsubscribeDoc();
          if (unsubscribeNotifications) unsubscribeNotifications();
        };
      }
    );

    return () => unsubscribeAuth();
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "30px",
      }}
    >
      <h1>💰 Investor Dashboard</h1>

      <div
        style={{
          marginTop: "25px",
          background: "#1e293b",
          padding: "20px",
          borderRadius: "15px",
        }}
      >
        <h2>Investor Status</h2>

        <p>
          <strong>Name:</strong>{" "}
          {userData?.name || "Loading..."}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {userData?.email || "Loading..."}
        </p>

        <p>
          <strong>Role:</strong>{" "}
          {userData?.role || "Investor"}
        </p>

        <p>
          <strong>Verification:</strong>{" "}
          {userData?.verified
            ? "✅ Approved"
            : "⏳ Pending"}
        </p>

        <p>
          <strong>Signature:</strong>{" "}
          {userData?.signatureSubmitted
            ? "✅ Submitted"
            : "❌ Not Submitted"}
        </p>

        {userData?.signatureUrl && (
          <div style={{ marginTop: "15px" }}>
            <p>
              <strong>Saved Signature</strong>
            </p>

            <img
              src={userData.signatureUrl}
              alt="Signature"
              style={{
                maxWidth: "300px",
                background: "#334155",
                padding: "10px",
                borderRadius: "10px",
              }}
            />
          </div>
        )}
      </div>

      {/* Step 4: Wrapped Company Platform and upgraded Notification badge button inside flex container */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={() => navigate("/feed")}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "10px",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🌐 Open Company Social Platform
        </button>

        <button
          onClick={() => navigate("/notifications")}
          style={{
            position: "relative",
            padding: "12px 20px",
            border: "none",
            borderRadius: "10px",
            background: "#f59e0b",
            color: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🔔 Notifications

          {notificationCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                background: "red",
                color: "white",
                borderRadius: "50%",
                minWidth: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {notificationCount}
            </span>
          )}
        </button>
      </div>

      <div
        style={{
          marginTop: "25px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
        }}
      >
        {/* Replaced Block: Startups card is now fully interactive with routing action */}
        <div
          onClick={() => navigate("/founders")}
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
            cursor: "pointer",
          }}
        >
          <h3>🚀 Startups</h3>
          <p>
            Browse verified founders and startups.
          </p>
        </div>

        {/* Replaced Block: Meetings card is now fully interactive and links directly to /meetings */}
        <div
          onClick={() => navigate("/meetings")}
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
            cursor: "pointer",
          }}
        >
          <h3>📅 Meetings</h3>
          <p>Manage founder meeting requests.</p>
        </div>

        {/* Replaced Block: Made the Agreement card clickable linking directly to /agreements */}
        <div
          onClick={() => navigate("/agreements")}
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
            cursor: "pointer",
          }}
        >
          <h3>📄 Agreements</h3>
          <p>
            View signed investment agreements.
          </p>
        </div>

        <div
          onClick={() => navigate("/data-room")}
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
            cursor: "pointer",
          }}
        >
          <h3>Secure Data Rooms</h3>
          <p>Access startup documents after NDA verification.</p>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
          }}
        >
          <h3>💼 Portfolio</h3>
          <p>
            Track startup investments.
          </p>
        </div>
      </div>
    </div>
  );
}

export default InvestorDashboard;
