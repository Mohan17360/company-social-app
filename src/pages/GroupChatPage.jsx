// src/pages/GroupChatPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db, auth } from "../firebase";

function GroupChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  
  const [groupData, setGroupData] = useState(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState("");

  const [showMembers, setShowMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);

  const bottomRef = useRef(null);

  // Automatically mark relevant unread notifications as read upon access
  useEffect(() => {
    const markNotificationsAsRead = async () => {
      if (!auth.currentUser?.email) return;

      const q = query(
        collection(db, "notifications"),
        where("userEmail", "==", auth.currentUser.email),
        where("groupId", "==", groupId),
        where("read", "==", false)
      );

      const snapshot = await getDocs(q);

      snapshot.forEach(async (notification) => {
        await updateDoc(
          doc(db, "notifications", notification.id),
          {
            read: true,
          }
        );
      });
    };

    markNotificationsAsRead();
  }, [groupId]);

  // Real-time Access Control Guard Layer
  useEffect(() => {
    if (!groupId) return;

    const unsubscribeGroup = onSnapshot(
      doc(db, "groups", groupId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentUserId = auth.currentUser?.uid;
          
          setGroupData(data);
          if (data.members && data.members.includes(currentUserId)) {
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
        } else {
          setHasAccess(false);
        }
        setIsCheckingAccess(false);
      },
      (error) => {
        console.error("Error checking group access: ", error);
        setIsCheckingAccess(false);
      }
    );

    return () => unsubscribeGroup();
  }, [groupId]);

  // Real-time group message stream listener
  useEffect(() => {
    if (!hasAccess) return;

    const unsubscribeMessages = onSnapshot(
      collection(db, "groupMessages"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((msg) => msg.groupId === groupId)
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return aTime - bTime;
          });

        setMessages(data);
      }
    );

    return () => unsubscribeMessages();
  }, [groupId, hasAccess]);

  // Real-time listener loading full global user collection
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
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

    return () => unsubscribeUsers();
  }, []);

  // Automated layout positioning mechanism tracking incoming messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleAddMember = async (memberId) => {
    try {
      await updateDoc(
        doc(db, "groups", groupId),
        {
          members: arrayUnion(memberId),
        }
      );
      alert("Member Added");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await updateDoc(
        doc(db, "groups", groupId),
        {
          members: arrayRemove(memberId),
        }
      );
      alert("Member Removed");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await updateDoc(
        doc(db, "groups", groupId),
        {
          members: arrayRemove(
            auth.currentUser.uid
          ),
        }
      );

      alert("You left the group");

      navigate("/groups");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const currentUserProfile = users.find((u) => u.id === auth.currentUser?.uid);

      await addDoc(collection(db, "groupMessages"), {
        groupId,
        senderId: auth.currentUser.uid,
        senderName: currentUserProfile?.name || auth.currentUser.displayName || "User",
        text: message,
        createdAt: serverTimestamp(),
      });

      const groupSnap = await getDoc(
        doc(db, "groups", groupId)
      );

      const groupInfo = groupSnap.data();

      for (const memberId of groupInfo.members) {
        if (
          memberId !== auth.currentUser.uid
        ) {
          const userSnap = await getDoc(
            doc(db, "users", memberId)
          );

          if (userSnap.exists()) {
            const userData = userSnap.data();

            await addDoc(
              collection(db, "notifications"),
              {
                userEmail: userData.email,
                groupId: groupId,
                groupName: groupInfo.name,
                message: `${
                  currentUserProfile?.name || "Someone"
                } sent a message`,
                read: false,
                createdAt: serverTimestamp(),
              }
            );
          }
        }
      }

      setMessage("");
    } catch (error) {
      alert(error.message);
    }
  };

  if (isCheckingAccess) {
    return (
      <div className="feed-container">
        <p style={{ textAlign: "center", color: "#64748b" }}>Verifying access status...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="feed-container">
        <div className="post-card" style={{ textAlign: "center", padding: "30px" }}>
          <h2 style={{ color: "#ef4444" }}>🔒 Access Denied</h2>
          <p style={{ color: "#64748b", margin: "15px 0" }}>
            You are not a member of this private group chat segment.
          </p>
          <button className="create-btn" onClick={() => navigate("/groups")}>
            Return to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <img
        src={groupData?.photo || "https://via.placeholder.com/100"}
        alt="Group"
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          objectFit: "cover",
          marginBottom: "15px",
        }}
      />

      <h1>Group Chat: {groupData?.name}</h1>

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

      {groupData?.createdBy !==
        auth.currentUser?.uid && (
        <button
          className="delete-btn"
          onClick={handleLeaveGroup}
          style={{
            marginBottom: "15px",
          }}
        >
          Leave Group
        </button>
      )}

      <p
        style={{
          color: "#94a3b8",
          marginBottom: "20px",
        }}
      >
        {groupData?.members?.length || 0} Members
      </p>

      {/* Collapsible Members List Section */}
      <div className="post-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => setShowMembers(!showMembers)}
        >
          <h3 style={{ margin: 0 }}>
            👥 {groupData?.members?.length || 0} Members
          </h3>
          <span>{showMembers ? "▲" : "▼"}</span>
        </div>

        {showMembers && (
          <div style={{ marginTop: "15px" }}>
            {users
              .filter((user) => groupData?.members?.includes(user.id))
              .map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span>👤 {user.name}</span>
                  <div>
                    {groupData?.createdBy === user.id && (
                      <span
                        style={{
                          color: "#f59e0b",
                          fontWeight: "bold",
                          marginRight: "10px",
                        }}
                      >
                        Admin
                      </span>
                    )}

                    {groupData?.createdBy === auth.currentUser?.uid &&
                      user.id !== auth.currentUser?.uid && (
                        <button
                          className="delete-btn"
                          onClick={() => handleRemoveMember(user.id)}
                          style={{
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            padding: "4px 8px",
                            fontSize: "12px"
                          }}
                        >
                          Remove
                        </button>
                      )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Collapsible Add Members Section */}
      <div className="post-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => setShowAddMembers(!showAddMembers)}
        >
          <h3 style={{ margin: 0 }}>Add Members</h3>
          <span>{showAddMembers ? "▲" : "▼"}</span>
        </div>

        {showAddMembers && (
          <div style={{ marginTop: "15px" }}>
            <input
              type="text"
              placeholder="Search user..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                marginBottom: "15px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                boxSizing: "border-box"
              }}
            />

            {users
              .filter(
                (user) =>
                  user.id !== auth.currentUser?.uid &&
                  user.name?.toLowerCase().includes(searchUser.toLowerCase())
              )
              .map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span>{user.name}</span>
                  
                  {groupData?.members?.includes(user.id) ? (
                    <span
                      style={{
                        color: "#22c55e",
                        fontWeight: "bold",
                      }}
                    >
                      ✓ Added
                    </span>
                  ) : (
                    <button
                      className="create-btn"
                      onClick={() => handleAddMember(user.id)}
                    >
                      Add
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Scrollable Message Box Panel layout wrapper */}
      <div
        className="post-card"
        style={{
          maxHeight: "450px",
          overflowY: "auto",
        }}
      >
        <h3>Messages</h3>
        {messages.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center" }}>No messages here yet. Say hi!</p>
        ) : (
          messages.map((msg) => {
            const originalSender = users.find((u) => u.id === msg.senderId);
            const verifiedSenderName = msg.senderName || originalSender?.name || "User";
            const isMine = msg.senderId === auth.currentUser?.uid;

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isMine ? "flex-end" : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    background: isMine ? "#2563eb" : "#475569",
                    color: "white",
                    padding: "10px 15px",
                    borderRadius: "12px",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                  }}
                >
                  {!isMine && (
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: "5px",
                        color: "#93c5fd",
                      }}
                    >
                      {verifiedSenderName}
                    </div>
                  )}

                  <div>{msg.text}</div>

                  <div
                    style={{
                      fontSize: "11px",
                      opacity: 0.7,
                      marginTop: "5px",
                      textAlign: "right",
                    }}
                  >
                    {msg.createdAt?.seconds
                      ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString()
                      : ""}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef}></div>
      </div>

      {/* Upgraded Composer Text Input box Area layout */}
      <div className="post-card">
        <textarea
          rows={3}
          placeholder="Message group..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: "100%",
            resize: "none",
            padding: "12px",
            borderRadius: "8px",
            boxSizing: "border-box",
            border: "1px solid #cbd5e1"
          }}
        />
        <br />
        <br />
        <button className="create-btn" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}

export default GroupChatPage;