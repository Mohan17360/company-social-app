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
import { useNavigate, useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import AppLayout from "../components/AppLayout";
import GroupChatPage from "./GroupChatPage"; 

function GroupsPage() {
  const { groupId: routeGroupId } = useParams(); 
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState([]);
  const [searchGroup, setSearchGroup] = useState("");
  const [lastMessages, setLastMessages] = useState({});
  const [unreadGroups, setUnreadGroups] = useState({});
  const [currentEmail, setCurrentEmail] = useState("");
  
  const [clickedGroupId, setClickedGroupId] = useState(null);

  // PRIORITIZING local click handler state over route params during split-screen context
  const selectedGroupId = clickedGroupId || routeGroupId || null;

  const navigate = useNavigate();

  // Sync auth updates
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentEmail(user.email || "");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Sync group metadata
  useEffect(() => {
    const unsubscribeGroups = onSnapshot(
      collection(db, "groups"),
      (snapshot) => {
        setGroups(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    );

    const unsubscribeMessages = onSnapshot(
      collection(db, "groupMessages"),
      (snapshot) => {
        const latest = {};
        snapshot.docs.forEach((doc) => {
          const msg = doc.data();
          const current = latest[msg.groupId];
          if (!current || (msg.createdAt?.seconds || 0) > (current.createdAt?.seconds || 0)) {
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

  // Unread badge indicators tracking
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
            counts[notif.groupId] = (counts[notif.groupId] || 0) + 1;
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
      await addDoc(collection(db, "groups"), {
        name: groupName,
        photo: "",
        createdBy: auth.currentUser.uid,
        members: [auth.currentUser.uid],
        createdAt: serverTimestamp(),
      });
      setGroupName("");
    } catch (error) {
      alert(error.message);
    }
  };

  // Modified tracking handler bypasses route loops to isolate click events safely
  const handleGroupClick = (groupId) => {
    console.log("GROUP CLICKED:", groupId);
    setClickedGroupId(groupId);
  };

  const filteredGroups = groups.filter((group) =>
    group.name?.toLowerCase().includes(searchGroup.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="chat-page-layout" style={{ display: "flex", width: "100%", height: "100vh" }}>
        
        {/* Left Side Panel View Module (FIXED AT 380PX FOR PROPER TEXT RESPONSIVENESS) */}
        <div 
          className="chat-users-panel" 
          style={{ 
            width: "380px", 
            minWidth: "380px", 
            maxWidth: "380px", 
            borderRight: "1px solid #334155", 
            padding: "20px", 
            overflowY: "auto",
            boxSizing: "border-box",
            background: "#0f172a"
          }}
        >
          <h3>Groups</h3>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button className="edit-btn" onClick={() => navigate(-1)}>← Back</button>
            <button className="create-btn" onClick={() => window.location.reload()}>↻ Refresh</button>
          </div>

          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#334155", border: "none", color: "white", marginBottom: "10px", boxSizing: "border-box" }}
          />

          <button className="create-btn" onClick={createGroup} style={{ marginBottom: "25px", width: "100%" }}>
            Create Group
          </button>

          <input
            type="text"
            placeholder="Search groups..."
            value={searchGroup}
            onChange={(e) => setSearchGroup(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#1e293b", border: "none", color: "white", marginBottom: "20px", boxSizing: "border-box" }}
          />

          {filteredGroups
            .sort((a, b) => {
              const aTime = lastMessages[a.id]?.createdAt?.seconds || 0;
              const bTime = lastMessages[b.id]?.createdAt?.seconds || 0;
              return bTime - aTime;
            })
            .map((group) => {
              const isSelected = selectedGroupId === group.id;
              
              return (
                <div
                  key={group.id}
                  className={`chat-user-row ${isSelected ? "active-row" : ""}`}
                  onClick={() => handleGroupClick(group.id)}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#334155";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    position: "relative",
                    padding: "12px",
                    borderRadius: "10px",
                    marginBottom: "10px",
                    transition: "0.2s", 
                    background: isSelected ? "#1e293b" : "transparent"
                  }}
                >
                  {group.photo ? (
                    <img src={group.photo} alt={group.name} style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>👥</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{group.name}</h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>{group.members?.length || 0} Members</p>
                    <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lastMessages[group.id] ? `${lastMessages[group.id]?.senderName || "User"}: ${lastMessages[group.id]?.text || ""}` : "No messages yet"}
                    </p>
                  </div>
                  {unreadGroups[group.id] > 0 && (
                    <span style={{ background: "#ef4444", color: "white", borderRadius: "50%", minWidth: "24px", height: "24px", padding: "0 6px", fontSize: "12px", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", boxSizing: "border-box", flexShrink: 0 }}>
                      {unreadGroups[group.id]}
                    </span>
                  )}
                </div>
              );
            })}
        </div>

        {/* Right Side Conversation Workspace Pane - DARKER BACKGROUND FOR ELITE CONTRAST */}
        <div 
          className="chat-empty-area" 
          style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            height: "100vh", 
            overflow: "hidden",
            background: "#172033" 
          }}
        >
          {selectedGroupId ? (
            <GroupChatPage key={selectedGroupId} embeddedGroupId={selectedGroupId} embedded={true} />
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#94a3b8", padding: "20px", boxSizing: "border-box" }}>
              <h2>Select a Group Panel</h2>
              <p>Choose a discussion room from the left grid to open communication.</p>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}

export default GroupsPage;