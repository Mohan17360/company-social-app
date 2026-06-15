// src/pages/NotificationsPage.jsx
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeNotifications = null;
    let unsubscribeFallback = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      let primaryDocs = [];
      let fallbackDocs = [];

      const mergeAndProcess = async () => {
        const allDocsMap = new Map();

        primaryDocs.forEach((d) => allDocsMap.set(d.id, d));
        fallbackDocs.forEach((d) => {
          if (!allDocsMap.has(d.id)) {
            allDocsMap.set(d.id, d);
          }
        });

        const combinedData = Array.from(allDocsMap.values());

        const sortedData = combinedData.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setNotifications(sortedData);

        const unreadDocs = sortedData.filter((item) => !item.read);
        if (unreadDocs.length > 0) {
          const batch = writeBatch(db);
          unreadDocs.forEach((item) => {
            const docRef = doc(db, "notifications", item.id);
            batch.update(docRef, { read: true });
          });
          try {
            await batch.commit();
          } catch (err) {
            console.error("Error executing auto-read batch process:", err);
          }
        }
      };

      const q = query(
        collection(db, "notifications"),
        where("receiverEmail", "==", user.email)
      );

      unsubscribeNotifications = onSnapshot(q, (snapshot) => {
        primaryDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        mergeAndProcess();
      }, (err) => console.error("Primary notification stream failed:", err));

      const fallbackQ = query(
        collection(db, "notifications"),
        where("userEmail", "==", user.email)
      );

      unsubscribeFallback = onSnapshot(fallbackQ, (snapshot) => {
        fallbackDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        mergeAndProcess();
      }, (err) => console.error("Fallback notification stream failed:", err));
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeFallback) unsubscribeFallback();
    };
  }, []);

  return (
    <AppLayout>
      <div className="feed-container">
        <h1 className="feed-title">Notifications</h1>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button className="edit-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button className="create-btn" onClick={() => window.location.reload()}>
            ↻ Refresh
          </button>
        </div>

        {notifications.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", marginTop: "20px" }}>
            No notifications
          </p>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className="post-card">
              <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6" }}>
                {item.message || item.text || "New updates received."}
              </p>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}

export default NotificationsPage;