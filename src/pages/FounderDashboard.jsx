// src/pages/FounderDashboard.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
// Consolidated structural firestore module references cleanly
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  orderBy
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function FounderDashboard() {
  const [userData, setUserData] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Initialized tracking state array for direct streaming hydration
  const [ndaHistory, setNdaHistory] = useState([]);
  
  // 1. Add new state variables (Placed precisely below ndaHistory exactly as requested)
  const [documents, setDocuments] = useState([]);
  const [documentViews, setDocumentViews] = useState([]);
  
  const navigate = useNavigate();

  // Core listener stack for real-time user session status and notifications count mapping
  useEffect(() => {
    let unsubscribeNotifications = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) return;

        const unsubscribeDoc = onSnapshot(
          doc(db, "users", user.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setUserData(data);

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

  // Real-time query streaming inbound agreement signatures from target collection
  useEffect(() => {
    const user = auth.currentUser;

    if (!user) return;

    const q = query(
      collection(db, "agreementSignatures"),
      where("ownerId", "==", user.uid),
      orderBy("signedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setNdaHistory(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }
    );

    return unsubscribe;
  }, []);

  // 2. Add Documents Listener (Completely isolated separate useEffect block)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribeDocuments = onSnapshot(
      query(
        collection(db, "documents"),
        where("ownerId", "==", user.uid)
      ),
      (snapshot) => {
        setDocuments(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }
    );

    return unsubscribeDocuments;
  }, []);

  // 3. Add Document Views Listener (Completely isolated separate useEffect block below documents listener)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribeViews = onSnapshot(
      query(
        collection(db, "documentViews"),
        where("ownerId", "==", user.uid)
      ),
      (snapshot) => {
        setDocumentViews(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }
    );

    return unsubscribeViews;
  }, []);

  // 4. Add Analytics Calculations (Processed exactly right above the return statement)
  const totalDocuments = documents.length;

  const totalViews = documentViews.filter(
    (x) => x.event === "VIEWED" || x.event === "OPENED"
  ).length;

  const totalDownloads = documentViews.filter(
    (x) => x.event === "DOWNLOADED"
  ).length;

  const averageReadingTime = documentViews.filter(
    (x) => x.event === "TIME_SPENT"
  ).reduce(
    (sum, x) => sum + (x.durationSeconds || 0),
    0
  );

  const confidentialFiles = documents.filter(
    (d) => d.confidential
  ).length;

  const mostViewedDocument = [...documents].sort(
    (a, b) => (b.viewCount || 0) - (a.viewCount || 0)
  )[0];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "30px",
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <h1>🚀 Founder Dashboard</h1>

      <div
        style={{
          marginTop: "25px",
          background: "#1e293b",
          padding: "20px",
          borderRadius: "15px",
        }}
      >
        <h2>Profile Status</h2>

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
          {userData?.role || "Founder"}
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
                background: "white",
                padding: "10px",
                borderRadius: "10px",
              }}
            />
          </div>
        )}
      </div>

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
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        <div
          onClick={() => navigate("/investors")}
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
            cursor: "pointer",
            transition: "transform 0.2s, background-color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#334155";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1e293b";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <h3>💰 Investors</h3>
          <p>Find investors for your startup.</p>
        </div>

        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "15px" }}>
          <h3>👨‍💻 Freelancers</h3>
          <p>Hire talent for your startup.</p>
        </div>

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
          <p>Schedule investor meetings.</p>
        </div>

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
          <p>Manage signed agreements.</p>
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
          <h3>Secure Data Room</h3>
          <p>Upload and monitor confidential startup documents.</p>
        </div>
      </div>

      {/* 5. Add Analytics Cards UI (Inserted perfectly before the "NDA Acceptances" heading bound) */}
      <h2 style={{ marginTop: 40, marginBottom: -20 }}>📊 VDR Telemetry Analytics</h2>
      <div
        style={{
          marginTop: 40,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
        }}
      >
        <div style={{ background: "#1e293b", padding: 20, borderRadius: 15, border: "1px solid #334155" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>📂 Documents</h3>
          <h1 style={{ margin: "10px 0 0 0", fontSize: "2rem", color: "#38bdf8" }}>{totalDocuments}</h1>
        </div>

        <div style={{ background: "#1e293b", padding: 20, borderRadius: 15, border: "1px solid #334155" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>👁 Views</h3>
          <h1 style={{ margin: "10px 0 0 0", fontSize: "2rem", color: "#10b981" }}>{totalViews}</h1>
        </div>

        <div style={{ background: "#1e293b", padding: 20, borderRadius: 15, border: "1px solid #334155" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>⬇ Downloads</h3>
          <h1 style={{ margin: "10px 0 0 0", fontSize: "2rem", color: "#fbbf24" }}>{totalDownloads}</h1>
        </div>

        <div style={{ background: "#1e293b", padding: 20, borderRadius: 15, border: "1px solid #334155" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>⏱ Reading Time</h3>
          <h1 style={{ margin: "10px 0 0 0", fontSize: "2rem", color: "#a855f7" }}>
            {averageReadingTime > 60 ? `${Math.round(averageReadingTime / 60)} m` : `${averageReadingTime} s`}
          </h1>
        </div>

        <div style={{ background: "#1e293b", padding: 20, borderRadius: 15, border: "1px solid #334155" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>🔒 Confidential</h3>
          <h1 style={{ margin: "10px 0 0 0", fontSize: "2rem", color: "#ef4444" }}>{confidentialFiles}</h1>
        </div>

        <div style={{ background: "#1e293b", padding: 20, borderRadius: 15, border: "1px solid #334155" }}>
          <h3 style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>🏆 Most Viewed</h3>
          <p style={{ margin: "10px 0 4px 0", fontWeight: "bold", fontSize: "14px", color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {mostViewedDocument?.name || "No document yet"}
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Views: <span style={{ color: "#10b981", fontWeight: "bold" }}>{mostViewedDocument?.viewCount || 0}</span>
          </p>
        </div>
      </div>

      {/* Historical Meeting Request Context List Output */}
      <div
        style={{
          marginTop: 40,
          background: "#1e293b",
          padding: 20,
          borderRadius: 15,
          border: "1px solid #334155"
        }}
      >
        <h2>📜 NDA Acceptances</h2>

        {ndaHistory.length === 0 ? (
          <p style={{ color: "#94a3b8", marginTop: 15 }}>No NDA Accepted Yet.</p>
        ) : (
          ndaHistory.map((item) => (
            <div
              key={item.id}
              style={{
                background: "#0f172a",
                padding: 15,
                marginTop: 15,
                borderRadius: 12,
                border: "1px solid #334155"
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#38bdf8" }}>{item.viewerName}</h3>
              
              <p style={{ margin: "4px 0", fontSize: "14px" }}>
                <strong>Role :</strong> {item.viewerRole || "Viewer"}
              </p>
              
              <p style={{ margin: "4px 0", fontSize: "14px" }}>
                <strong>Post :</strong> {item.postTitle || item.postId}
              </p>
              
              <p style={{ margin: "4px 0", fontSize: "14px" }}>
                <strong>Agreement :</strong> {item.ndaType}
              </p>
              
              <p style={{ margin: "4px 0", fontSize: "14px" }}>
                <strong>Version :</strong> {item.agreementVersion}
              </p>
              
              <p style={{ margin: "4px 0", fontSize: "14px" }}>
                <strong>Status :</strong>{" "}
                <span style={{ color: "#16a34a", fontWeight: "bold" }}>{item.status}</span>
              </p>

              {item.pdfUrl && (
                <div style={{ marginTop: 15 }}>
                  <a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "10px 16px",
                      background: "#2563eb",
                      color: "#fff",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontWeight: "600",
                    }}
                  >
                    📄 Download Signed Agreement
                  </a>
                </div>
              )}

              <p style={{ marginTop: 10 }}>
                <strong>File Size:</strong>{" "}
                {item.fileSize
                  ? `${(item.fileSize / 1024).toFixed(2)} KB`
                  : "N/A"}
              </p>

              <p>
                <strong>Format:</strong>{" "}
                {item.fileFormat || "PDF"}
              </p>

              <p
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#94a3b8",
                  wordBreak: "break-all",
                }}
              >
                <strong>SHA-256:</strong>
                <br />
                {item.agreementHash}
              </p>
              
              <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                <strong>Accepted :</strong> {item.signedAt?.toDate ? item.signedAt.toDate().toLocaleString() : (item.acceptedAt?.toDate ? item.acceptedAt.toDate().toLocaleString() : "N/A")}
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default FounderDashboard;