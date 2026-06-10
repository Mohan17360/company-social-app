// src/pages/GroupsPage.jsx
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

function GroupsPage() {
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState([]);
  const [searchGroup, setSearchGroup] = useState("");
  const [lastMessages, setLastMessages] = useState({});
  const [unreadGroups, setUnreadGroups] = useState({});
  const [currentEmail, setCurrentEmail] = useState("");

  const navigate = useNavigate();

  // Safely track and sync authentication credentials reactively
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentEmail(user.email || "");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Structural sync for Group listings and Message previews
  useEffect(() => {
    const unsubscribeGroups = onSnapshot(
      collection(db, "groups"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        setGroups(data);
      }
    );

    const unsubscribeMessages = onSnapshot(
      collection(db, "groupMessages"),
      (snapshot) => {
        const latest = {};

        snapshot.docs.forEach((doc) => {
          const msg = doc.data();
          const current = latest[msg.groupId];

          if (
            !current ||
            (msg.createdAt?.seconds || 0) >
              (current.createdAt?.seconds || 0)
          ) {
            latest[msg.groupId] = msg;
          }
        });

        setLastMessages(latest);
      }
    );

    return () => {
      unsubscribeGroups();
      unsubscribeMessages();
    };
  }, []);

  // Isolated notification listener triggered reactively when user credentials load
  useEffect(() => {
    if (!currentEmail) return;

    const unsubscribeNotifications = onSnapshot(
      query(
        collection(db, "notifications"),
        where("userEmail", "==", currentEmail),
        where("read", "==", false)
      ),
      (snapshot) => {
        const counts = {};

        snapshot.docs.forEach((doc) => {
          const notif = doc.data();

          if (notif.groupId) {
            counts[notif.groupId] =
              (counts[notif.groupId] || 0) + 1;
          }
        });

        setUnreadGroups(counts);
      }
    );

    return () => unsubscribeNotifications();
  }, [currentEmail]);

  const createGroup = async () => {
    if (!groupName.trim()) return;

    try {
      await addDoc(
        collection(db, "groups"),
        {
          name: groupName,
          photo: "",
          createdBy: auth.currentUser.uid,
          members: [
            auth.currentUser.uid,
          ],
          createdAt: serverTimestamp(),
        }
      );

      setGroupName("");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  return (
    <div className="feed-container">
      <h1>Groups</h1>

      {/* Step B: Injected navigation and control controls row directly under header */}
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

      <input
        type="text"
        placeholder="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />

      <br />
      <br />

      <button
        className="create-btn"
        onClick={createGroup}
      >
        Create Group
      </button>

      <br />
      <br />

      <input
        type="text"
        placeholder="Search groups..."
        value={searchGroup}
        onChange={(e) => setSearchGroup(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          marginBottom: "20px",
          borderRadius: "6px",
          border: "1px solid #cbd5e1",
          boxSizing: "border-box"
        }}
      />

      {groups
        .filter((group) =>
          group.name?.toLowerCase().includes(searchGroup.toLowerCase())
        )
        .map((group) => (
          <div
            key={group.id}
            className="post-card"
            onClick={() => handleGroupClick(group.id)}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "15px",
              position: "relative"
            }}
          >
            {group.photo ? (
              <img 
                src={group.photo} 
                alt={group.name} 
                style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>👥</div>
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0 }}>{group.name}</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                {group.members?.length || 0} Members
              </p>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "14px",
                  marginTop: "5px",
                  marginRight: "40px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}
              >
                {lastMessages[group.id]?.text ||
                  "No messages yet"}
              </p>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  margin: "4px 0 0 0"
                }}
              >
                {lastMessages[group.id]?.createdAt?.seconds
                  ? new Date(
                      lastMessages[group.id]
                        .createdAt.seconds * 1000
                    ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : ""}
              </p>
            </div>

            {unreadGroups[group.id] > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "white",
                  borderRadius: "50%",
                  minWidth: "24px",
                  height: "24px",
                  padding: "0 6px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxSizing: "border-box",
                  marginLeft: "auto"
                }}
              >
                {unreadGroups[group.id]}
              </span>
            )}
          </div>
        ))}
    </div>
  );
}

export default GroupsPage;