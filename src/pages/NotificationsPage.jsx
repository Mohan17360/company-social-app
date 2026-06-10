import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
} from "firebase/auth";

import { auth, db } from "../firebase";
// Step A: Verified/Added the useNavigate import
import { useNavigate } from "react-router-dom";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  
  // Step B: Initialized the navigate hook inside the component
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) return;

        const q = query(
          collection(db, "notifications"),
          where("userEmail", "==", user.email)
        );

        const unsubscribeNotifications = onSnapshot(
          q,
          async (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            for (const item of data) {
              if (!item.read) {
                await updateDoc(
                  doc(db, "notifications", item.id),
                  {
                    read: true,
                  }
                );
              }
            }

            setNotifications(data.reverse());
          }
        );

        return () => unsubscribeNotifications();
      }
    );

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="feed-container">
      {/* Target heading matched style class name */}
      <h1 className="feed-title">Notifications</h1>

      {/* Step C: Injected Back and Refresh layout markup directly beneath the header */}
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

      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        notifications.map((item) => (
          <div key={item.id} className="post-card">
            <p>{item.message}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default NotificationsPage;