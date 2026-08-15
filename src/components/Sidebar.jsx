// src/components/Sidebar.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";

function Sidebar() {
  const navigate = useNavigate();
  
  // Real-time states for unread counts tracking
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadGroupCount, setUnreadGroupCount] = useState(0);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    let unsubscribeNotif = null;
    let unsubscribeGroupNotif = null;
    let unsubscribeChats = null;

    // Monitoring Auth State changes gracefully (Kept alive to prevent notifications breakdown)
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || "");
          }
        } catch (error) {
          console.error("Error updating admin authorization role:", error);
        }

        // 1. Real-time Notifications Listener (Primary)
        const notifQuery = query(
          collection(db, "notifications"),
          where("receiverEmail", "==", user.email),
          where("read", "==", false)
        );

        unsubscribeNotif = onSnapshot(notifQuery, (snapshot) => {
          console.log(
            "Sidebar Notifications (Primary receiverEmail):",
            snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
          );

          setUnreadNotifCount(snapshot.size);

          const groupCount = snapshot.docs.filter(
            (doc) => doc.data().groupId
          ).length;
          setUnreadGroupCount(groupCount);
        }, (err) => console.error("Sidebar notification tracking error:", err));

        // Secondary fallback listener for group notifications using userEmail
        const groupNotifQuery = query(
          collection(db, "notifications"),
          where("userEmail", "==", user.email),
          where("read", "==", false)
        );

        unsubscribeGroupNotif = onSnapshot(groupNotifQuery, (snapshot) => {
          console.log(
            "Sidebar Notifications (Fallback userEmail):",
            snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
          );

          const legacyGroupCount = snapshot.docs.filter(
            (doc) => doc.data().groupId && !doc.data().receiverEmail
          ).length;
          
          if (legacyGroupCount > 0) {
            setUnreadGroupCount((prev) => prev + legacyGroupCount);
            setUnreadNotifCount((prev) => prev + legacyGroupCount);
          }
        }, (err) => console.error("Sidebar group fallback tracking error:", err));

        // 2. Real-time Personal Chats Unread Badge Listener
        const chatsQuery = query(
          collection(db, "messages"),
          where("receiverId", "==", user.uid),
          where("read", "==", false)
        );

        unsubscribeChats = onSnapshot(
          chatsQuery,
          (snapshot) => {
            const uniqueSenders = new Set();

            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              if (data.senderId) {
                uniqueSenders.add(data.senderId);
              }
            });

            setUnreadChatCount(uniqueSenders.size);
          },
          (err) => console.error("Sidebar chat badge tracking error:", err)
        );

      } else {
        setUnreadNotifCount(0);
        setUnreadChatCount(0);
        setUnreadGroupCount(0);
        setUserRole("");
        if (unsubscribeNotif) unsubscribeNotif();
        if (unsubscribeGroupNotif) unsubscribeGroupNotif();
        if (unsubscribeChats) unsubscribeChats();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotif) unsubscribeNotif();
      if (unsubscribeGroupNotif) unsubscribeGroupNotif();
      if (unsubscribeChats) unsubscribeChats();
    };
  }, []);

  // Flex layout helpers for badges integration
  const badgeStyle = {
    background: "#ef4444",
    color: "white",
    borderRadius: "50%",
    padding: "2px 7px",
    fontSize: "12px",
    fontWeight: "bold",
    marginLeft: "auto",
    display: "inline-block"
  };

  return (
    <div className="app-sidebar">
      <h2>Company Social</h2>

      <button onClick={() => navigate("/feed")} style={{ display: "flex", alignItems: "center", width: "100%" }}>
        🏠 Home
      </button>

      <button onClick={() => navigate("/search")} style={{ display: "flex", alignItems: "center", width: "100%" }}>
        🔍 Search
      </button>

      <button onClick={() => navigate("/chat")} style={{ display: "flex", alignItems: "center", width: "100%" }}>
        💬 Messages
        {unreadChatCount > 0 && (
          <span style={badgeStyle}>{unreadChatCount}</span>
        )}
      </button>

      <button onClick={() => navigate("/groups")} style={{ display: "flex", alignItems: "center", width: "100%" }}>
        👥 Groups
        {unreadGroupCount > 0 && (
          <span style={badgeStyle}>{unreadGroupCount}</span>
        )}
      </button>

      <button onClick={() => navigate("/notifications")} style={{ display: "flex", alignItems: "center", width: "100%" }}>
        🔔 Notifications
        {unreadNotifCount > 0 && (
          <span style={badgeStyle}>{unreadNotifCount}</span>
        )}
      </button>

      <button onClick={() => navigate("/profile")} style={{ display: "flex", alignItems: "center", width: "100%" }}>
        👤 Profile
      </button>

      {userRole !== "Admin" && (
        <button onClick={() => navigate("/data-room")} style={{ display: "flex", alignItems: "center", width: "100%" }}>
          Data Room
        </button>
      )}

      {/* Renders conditional admin links dependent on structural setup rules */}
      {userRole === "Admin" && (
        <button
          onClick={() => navigate("/admin")}
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}
        >
          ⚙️ Admin
        </button>
      )}
    </div>
  );
}

export default Sidebar;
