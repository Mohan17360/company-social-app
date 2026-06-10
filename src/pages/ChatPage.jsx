import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom"; 

function ChatPage() {
  const [users, setUsers] = useState([]);
  const [lastMessages, setLastMessages] = useState({}); 
  const [unreadCounts, setUnreadCounts] = useState({}); // Step 1: Added unread counter tracking state

  const navigate = useNavigate(); 

  useEffect(() => {
    // 1. Real-time Users Snapshot Channel Listener
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (user) => user.email !== auth.currentUser?.email
          );

        setUsers(data);
      }
    );

    // 2. Real-time Global Messages Context Listener with Unread Message Calculations
    const unsubscribeMessages = onSnapshot(
      collection(db, "messages"),
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const latest = {};
        const unread = {}; // Step 2: Instantiated temporary unread mapping collection

        msgs.forEach((msg) => {
          const currentUserId = auth.currentUser?.uid;

          // Disregard messages that don't belong to the current authenticated user session
          if (
            msg.senderId !== currentUserId &&
            msg.receiverId !== currentUserId
          ) {
            return;
          }

          const otherUser =
            msg.senderId === currentUserId
              ? msg.receiverId
              : msg.senderId;

          const currentTime = msg.createdAt?.seconds || 0;

          if (
            !latest[otherUser] ||
            currentTime > latest[otherUser].time
          ) {
            latest[otherUser] = {
              text: msg.text,
              time: currentTime,
              timestamp: msg.createdAt,
            };
          }

          // Step 3: Check if the message is unread and addressed to the current logged-in user
          if (
            msg.receiverId === currentUserId &&
            msg.read === false
          ) {
            unread[msg.senderId] = (unread[msg.senderId] || 0) + 1;
          }
        });

        setLastMessages(latest);
        setUnreadCounts(unread); // Step 4: Dispatched built map directly to state
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeMessages();
    };
  }, []);

  return (
    <div className="feed-container">
      <h1>Messages</h1>

      {/* Step B: Injected Back and Refresh control buttons directly below the header */}
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

      {users.map((user) => (
        <div
          key={user.id}
          className="post-card"
          onClick={() => navigate(`/chat/${user.id}`)}
          style={{
            cursor: "pointer",
          }}
        >
          {/* Step 5: Render user name and a flexible conditional badge element row container layout */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3>{user.name}</h3>

            {unreadCounts[user.id] > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  minWidth: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  padding: "0 4px"
                }}
              >
                {unreadCounts[user.id]}
              </span>
            )}
          </div>

          <p>{user.email}</p>

          {/* Upgraded preview area displaying text and timestamps */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p
              style={{
                color: "#94a3b8",
                fontSize: "14px",
                margin: 0,
              }}
            >
              {lastMessages[user.id]?.text || "No messages yet"}
            </p>

            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              {lastMessages[user.id]?.timestamp?.seconds
                ? new Date(
                    lastMessages[user.id].timestamp.seconds * 1000
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
          </div>

          <p
            style={{
              color: user.online ? "#22c55e" : "#ef4444",
              fontWeight: "bold",
              marginTop: "10px"
            }}
          >
            {user.online ? "🟢 Online" : "🔴 Offline"}
          </p>

          <p>{user.role}</p>
        </div>
      ))}
    </div>
  );
}

export default ChatPage;