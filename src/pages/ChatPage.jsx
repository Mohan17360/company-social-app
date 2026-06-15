// src/pages/ChatPage.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom"; 
// Step 1: Explicit Embedded Route Component Imported Safely
import ChatRoomPage from "./ChatRoomPage"; 
// AppLayout Component Import Add Kiya Gaya
import AppLayout from "../components/AppLayout";

function ChatPage() {
  const [users, setUsers] = useState([]);
  const [lastMessages, setLastMessages] = useState({}); 
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  // Step 2: Instantiated dynamic shared panel selection hooks state
  const [selectedUser, setSelectedUser] = useState(null); 

  const navigate = useNavigate(); 

  useEffect(() => {
    // 1. Users Stream Listener
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

    // 2. Global Messages & Unread Mapper
    const unsubscribeMessages = onSnapshot(
      collection(db, "messages"),
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const latest = {};
        const unread = {};

        msgs.forEach((msg) => {
          const currentUserId = auth.currentUser?.uid;

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

          if (
            msg.receiverId === currentUserId &&
            msg.read === false
          ) {
            unread[msg.senderId] = (unread[msg.senderId] || 0) + 1;
          }
        });

        setLastMessages(latest);
        setUnreadCounts(unread);
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeMessages();
    };
  }, []);

  // Chronological Advanced Sorting Node (Latest Chat on Top)
  const sortedUsers = [...users].sort((a, b) => {
    const aTime = lastMessages[a.id]?.time || 0;
    const bTime = lastMessages[b.id]?.time || 0;
    return bTime - aTime;
  });

  // Apply Filter Criteria beforehand to match active directory selections
  const filteredUsers = sortedUsers.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // FIX: Derived State Pattern - Automatically fallback to first user if none explicitly selected.
  // This completely eliminates the asynchronous cascading renders warning from ESLint.
  const activeChatUserId = selectedUser || filteredUsers[0]?.id;

  return (
    <AppLayout>
      <div className="chat-page-layout">
        {/* Left Panel */}
        <div className="chat-users-panel">
          <div className="chat-panel-header">
            <h2>Messages</h2>
            <button 
              className="edit-btn" 
              onClick={() => navigate(-1)}
              style={{ padding: "6px 12px", fontSize: "13px" }}
            >
              ← Back
            </button>
          </div>

          <input
            type="text"
            placeholder="Search..."
            className="chat-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`chat-user-row ${activeChatUserId === user.id ? "active-row" : ""}`}
              onClick={() => setSelectedUser(user.id)} // Step 3: Shifted routing pipeline to modern state setters
              style={{ position: "relative", cursor: "pointer" }}
            >
              <div className="chat-user-avatar">
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%"
                    }}
                  />
                ) : (
                  user.name?.charAt(0).toUpperCase()
                )}
                <span 
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "42px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: user.online ? "#22c55e" : "#ef4444",
                    border: "2px solid #1e293b",
                    zIndex: 2
                  }}
                  title={user.online ? "Online" : "Offline"}
                />
              </div>

              <div className="chat-user-details" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h4>{user.name}</h4>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {lastMessages[user.id]?.timestamp?.seconds
                      ? new Date(lastMessages[user.id].timestamp.seconds * 1000).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>

                <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "13px" }}>
                  {lastMessages[user.id]?.text || "Start conversation"}
                </p>
              </div>

              {unreadCounts[user.id] > 0 && (
                <span className="unread-badge">
                  {unreadCounts[user.id]}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Right Area Workspace Render Section */}
        {/* Step 4: Swapped raw empty placeholders for context embedded configuration blocks */}
        <div className="chat-empty-area" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {activeChatUserId ? (
            <ChatRoomPage
              key={activeChatUserId}
              selectedUserId={activeChatUserId}
              embedded={true}
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <h2>Select a conversation</h2>
              <p>Choose a user from the left panel to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default ChatPage;