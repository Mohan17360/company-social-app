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
  deleteDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  query,
  where,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db, auth } from "../firebase"; // Storage instance pull completely removed
import AppLayout from "../components/AppLayout";

function GroupChatPage({ embedded = false, embeddedGroupId = null }) {
  const params = useParams();
  const navigate = useNavigate();

  // Unified dynamic parameter selection routing boundary
  const groupId = embedded ? embeddedGroupId : params.groupId;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  
  const [groupData, setGroupData] = useState(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState("");

  // Cleanly collapsed by default for Discord/WhatsApp flow
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false); 
  const [groupImage, setGroupImage] = useState(null);
  
  // Media asset attachment states
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Automatically mark relevant unread notifications as read using batch writes
  useEffect(() => {
    const markNotificationsAsRead = async () => {
      if (!auth.currentUser?.email || !groupId) return;

      const q1 = query(
        collection(db, "notifications"),
        where("receiverEmail", "==", auth.currentUser.email),
        where("groupId", "==", groupId),
        where("read", "==", false)
      );

      const q2 = query(
        collection(db, "notifications"),
        where("userEmail", "==", auth.currentUser.email),
        where("groupId", "==", groupId),
        where("read", "==", false)
      );

      try {
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const combinedDocs = [...snap1.docs, ...snap2.docs];

        if (combinedDocs.length > 0) {
          const batch = writeBatch(db);
          combinedDocs.forEach((notification) => {
            const docRef = doc(db, "notifications", notification.id);
            batch.update(docRef, { read: true });
          });
          await batch.commit();
        }
      } catch (err) {
        console.error("Error clearing group unread status badges:", err);
      }
    };

    if (hasAccess) {
      markNotificationsAsRead();
    }
  }, [groupId, hasAccess]);

  // Real-time Access Control Guard Layer
  useEffect(() => {
    console.log("ACTIVE GROUP ID IN SOURCE:", groupId);

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
    if (!hasAccess || !groupId) return;

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

      const groupSnap = await getDoc(
        doc(db, "groups", groupId)
      );

      const userSnap = await getDoc(
        doc(db, "users", memberId)
      );

      if (
        groupSnap.exists() &&
        userSnap.exists()
      ) {
        const groupData = groupSnap.data();
        const userData = userSnap.data();

        await addDoc(
          collection(db, "notifications"),
          {
            receiverEmail: userData.email,
            userEmail: userData.email,
            groupId,
            groupName: groupData.name,
            message: `You were added to group "${groupData.name}"`,
            read: false,
            createdAt: serverTimestamp(),
          }
        );
      }

      alert("Member Added");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await updateDoc(doc(db, "groups", groupId), {
        members: arrayRemove(memberId),
      });
      alert("Member Removed");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await updateDoc(doc(db, "groups", groupId), {
        members: arrayRemove(auth.currentUser.uid),
      });
      alert("You left the group");
      navigate("/groups");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteGroup = async () => {
    const confirmDelete = window.confirm(
      "Delete this group permanently?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(
        doc(db, "groups", groupId)
      );

      alert("Group Deleted");

      navigate("/groups");
    } catch (error) {
      alert(error.message);
    }
  };

  const uploadGroupPhoto = async () => {
    if (!groupImage) return;

    try {
      const formData = new FormData();

      formData.append("file", groupImage);
      formData.append(
        "upload_preset",
        "companysocial"
      );

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/doocnue5h/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      await updateDoc(
        doc(db, "groups", groupId),
        {
          photo: data.secure_url,
        }
      );

      alert("Group photo updated");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedImage) return;

    try {
      setIsUploading(true);
      let uploadedImageUrl = "";

      // Step A: Replaced Firebase Storage logic with robust Cloudinary multi-part uploads pipeline
      if (selectedImage) {
        console.log("IMAGE SELECTED");

        const formData = new FormData();
        formData.append("file", selectedImage);
        formData.append("upload_preset", "companysocial");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/doocnue5h/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        uploadedImageUrl = data.secure_url;

        console.log("CLOUDINARY URL:", uploadedImageUrl);
      }

      const currentUserProfile = users.find((u) => u.id === auth.currentUser?.uid);

      // Step B: Dispatch clean aggregate package array objects directly
      await addDoc(collection(db, "groupMessages"), {
        groupId,
        senderId: auth.currentUser.uid,
        senderName: currentUserProfile?.name || auth.currentUser.displayName || "User",
        text: message.trim() ? message : "",
        imageUrl: uploadedImageUrl || null,
        createdAt: serverTimestamp(),
      });

      const groupSnap = await getDoc(doc(db, "groups", groupId));
      const groupInfo = groupSnap.data();

      for (const memberId of groupInfo.members) {
        if (memberId !== auth.currentUser.uid) {
          const userSnap = await getDoc(doc(db, "users", memberId));

          if (userSnap.exists()) {
            const userData = userSnap.data();

            await addDoc(collection(db, "notifications"), {
              userEmail: userData.email,
              receiverEmail: userData.email,
              groupId: groupId,
              groupName: groupInfo.name,
              message: `${currentUserProfile?.name || "Someone"} sent a message in ${groupInfo.name}`,
              read: false,
              createdAt: serverTimestamp(),
            });
          }
        }
      }

      setMessage("");
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploading(false);
    } catch (error) {
      // Step C: Verbose error categorization targeting missing permissions or invalid buckets
      console.error("GROUP IMAGE ERROR:", error);
      alert(error.message);
      setIsUploading(false);
    }
  };

  // Shared inner content module - CONVERTED TO FLEXBOX FOR STREAMLINED VIEWPORTS
  const mainContent = (
    <div 
      className="feed-container" 
      style={{ 
        padding: embedded ? "0px" : "20px", 
        maxWidth: "100%", 
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    >
      
      {/* STICKY WRAPPED RICH HIGH-FIDELITY WHATSAPP STYLE TOP HEADER WITH SHADOWS */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#07142b",
          paddingBottom: "10px",
          marginBottom: "10px",
        }}
      >
        <div
          className="group-chat-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "15px 20px",
            background: "#1e293b",
            borderRadius: "12px",
            marginBottom: "0px", 
            flexShrink: 0,
            boxShadow: "0 2px 15px rgba(0,0,0,0.25)",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Flex column layer to wrap avatar and micro-indicator neatly */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img
                src={groupData?.photo || "https://via.placeholder.com/50"}
                alt="group"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: groupData?.photo ? "2px solid #2563eb" : "none"
                }}
              />
              {/* GREEN ONLINE INDICATOR DOT */}
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#22c55e",
                  borderRadius: "50%",
                  marginTop: "4px",
                }}
              ></div>
            </div>

            <div>
              <h2 style={{ margin: 0 }}>
                {groupData?.name}
              </h2>

              <small
                style={{
                  color: "#22c55e",
                  fontWeight: "600"
                }}
              >
                {groupData?.members?.length || 0} members
              </small>
            </div>
          </div>

          {/* FIX #2: Replaced react-icons elements with custom native high-contrast span triggers */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: "20px",
              fontSize: "20px",
              cursor: "pointer",
              alignItems: "center",
              color: "#94a3b8"
            }}
          >
            <span style={{ transition: "color 0.2s" }} onMouseOver={(e) => e.target.style.color = "#fff"} onMouseOut={(e) => e.target.style.color = "#94a3b8"}>📞</span>
            <span style={{ transition: "color 0.2s" }} onMouseOver={(e) => e.target.style.color = "#fff"} onMouseOut={(e) => e.target.style.color = "#94a3b8"} />
            <span style={{ transition: "color 0.2s" }} onMouseOver={(e) => e.target.style.color = "#fff"} onMouseOut={(e) => e.target.style.color = "#94a3b8"}>⋮</span>
          </div>
        </div>
      </div>

      {/* Standalone flow commands panel controls layout */}
      {!embedded && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexShrink: 0 }}>
          <button className="edit-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button className="create-btn" onClick={() => window.location.reload()}>
            ↻ Refresh
          </button>
        </div>
      )}

      {/* CHAT APP STYLED SCROLLABLE ZONE - UPDATED FOR BOTTOM ALIGNMENT LIKE WHATSAPP */}
      <div 
        className="post-card" 
        style={{ 
          flex: 1, 
          overflowY: "auto", 
          marginBottom: "10px",
          padding: "15px",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <h3>Messages</h3>
          {messages.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", margin: "auto 0" }}>No messages here yet. Say hi!</p>
          ) : (
            messages.map((msg) => {
              const originalSender = users.find((u) => u.id === msg.senderId);
              const verifiedSenderName = msg.senderName || originalSender?.name || "User";
              const isMine = msg.senderId === auth.currentUser?.uid;

              // Avatar and Identity mapping logic layers
              const senderUser = users.find((u) => u.id === msg.senderId);
              const senderAvatar = senderUser?.photo || "https://ui-avatars.com/api/?background=2563eb&color=fff&name=" + encodeURIComponent(verifiedSenderName);

              return (
                <div 
                  key={msg.id} 
                  style={{ 
                    display: "flex", 
                    justifyContent: isMine ? "flex-end" : "flex-start", 
                    alignItems: "flex-end",
                    gap: "8px",
                    marginBottom: "14px"
                  }}
                >
                  {/* Dynamically append side avatar block if the message belongs to other group members */}
                  {!isMine && (
                    <img
                      src={senderAvatar}
                      alt={verifiedSenderName}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0
                      }}
                    />
                  )}

                  <div
                    style={{
                      background: isMine ? "#2563eb" : "#374151",
                      color: "white",
                      padding: "12px 16px", 
                      borderRadius: "12px",
                      maxWidth: "320px", 
                      minWidth: "120px",
                      wordBreak: "break-word",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
                    }}
                  >
                    {!isMine && (
                      <div style={{ fontWeight: "bold", marginBottom: "5px", color: "#93c5fd" }}>
                        {verifiedSenderName}
                      </div>
                    )}

                    {/* RENDER LOGIC MULTI-BRANCH FOR MEDIA CAPABILITY PATHWAYS */}
                    <>
                      {msg.text && <div style={{ marginBottom: msg.imageUrl ? "8px" : "0" }}>{msg.text}</div>}
                      {msg.imageUrl && (
                        <a href={msg.imageUrl} target="_blank" rel="noreferrer">
                          <img
                            src={msg.imageUrl}
                            alt="Shared upload panel"
                            style={{
                              maxWidth: "100%",
                              width: "240px",
                              maxHeight: "200px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              marginTop: "4px",
                              border: "1px solid rgba(255,255,255,0.1)"
                            }}
                          />
                        </a>
                      )}
                    </>

                    <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "5px", textAlign: "right" }}>
                      {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString() : ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div ref={bottomRef}></div>
      </div>

      {/* WHATSAPP STYLE ROW CONTEXT INPUT COMPOSER AREA */}
      <div 
        className="post-card" 
        style={{ 
          position: "sticky",
          bottom: "0",
          zIndex: 50,
          marginTop: "10px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "#0f172a",
          borderTop: "1px solid #1e293b",
          padding: "10px 15px",
          gap: "8px"
        }}
      >
        {/* IMAGE PREVIEW COMPONENT TRACK BEFORE UPLOAD ACTION */}
        {selectedImage && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#1e293b", padding: "8px 12px", borderRadius: "8px", width: "fit-content" }}>
            <img
              src={URL.createObjectURL(selectedImage)}
              alt=""
              style={{
                width: "80px",
                height: "80px",
                objectFit: "cover",
                borderRadius: "10px"
              }}
            />
            <button 
              onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "100%" }}>
          <span style={{ fontSize: "22px", cursor: "pointer", opacity: 0.8 }}>😊</span>
          
          <span 
            style={{ fontSize: "22px", cursor: "pointer", opacity: 0.8, transition: "transform(0.1s)" }}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          >
            🖼️
          </span>

          <input 
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => setSelectedImage(e.target.files[0] || null)}
            style={{ display: "none" }}
          />

          <textarea
            rows={1}
            placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              flex: 1,
              resize: "none",
              height: "50px",
              padding: "14px",
              borderRadius: "25px",
              boxSizing: "border-box",
              border: "1px solid #cbd5e1",
              background: "#1e293b",
              color: "white"
            }}
          />
          <button 
            className="create-btn" 
            onClick={handleSend}
            disabled={isUploading}
            style={{
              width: "50px",
              height: "50px",
              fontSize: "20px",
              fontWeight: "bold",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0",
              paddingLeft: "4px",
              opacity: isUploading ? 0.6 : 1,
              cursor: isUploading ? "not-allowed" : "pointer"
            }}
          >
            {isUploading ? "..." : "➤"}
          </button>
        </div>
      </div>

      {/* Collapsible Members List Section */}
      <div className="post-card" style={{ flexShrink: 0, marginBottom: "10px", marginTop: "20px" }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => setShowMembers(!showMembers)}
        >
          <h3 style={{ margin: 0 }}>Members ({groupData?.members?.length || 0})</h3>
          <span>{showMembers ? "▲" : "▼"}</span>
        </div>

        {showMembers && (
          <div style={{ marginTop: "15px", maxHeight: "150px", overflowY: "auto" }}>
            {users
              .filter((user) => groupData?.members?.includes(user.id))
              .map((user) => (
                <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span>👤 {user.name}</span>
                  <div>
                    {groupData?.createdBy === user.id && (
                      <span style={{ color: "#f59e0b", fontWeight: "bold", marginRight: "10px" }}>
                        Admin
                      </span>
                    )}

                    {groupData?.createdBy === auth.currentUser?.uid && user.id !== auth.currentUser?.uid && (
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
      <div className="post-card" style={{ flexShrink: 0, marginBottom: "10px" }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => setShowAddMembers(!showAddMembers)}
        >
          <h3>Add Members</h3>
          <span>{showAddMembers ? "▲" : "▼"}</span>
        </div>

        {showAddMembers && (
          <div style={{ marginTop: "15px", maxHeight: "150px", overflowY: "auto" }}>
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
              .filter((user) => user.id !== auth.currentUser?.uid && user.name?.toLowerCase().includes(searchUser.toLowerCase()))
              .map((user) => (
                <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span>{user.name}</span>
                  {groupData?.members?.includes(user.id) ? (
                    <span style={{ color: "#22c55e", fontWeight: "bold" }}>✓ Added</span>
                  ) : (
                    <button className="create-btn" onClick={() => handleAddMember(user.id)}>
                      Add
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* COLLAPSIBLE GROUP SETTINGS CARD */}
      <div
        className="post-card"
        style={{
          marginBottom: "20px",
          flexShrink: 0
        }}
      >
        <div
          onClick={() => setShowSettings(!showSettings)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <h3 style={{ margin: 0 }}>
            ⚙️ Group Settings
          </h3>
          <span>
            {showSettings ? "▲" : "▼"}
          </span>
        </div>

        {showSettings && (
          <div style={{ marginTop: "15px" }}>
            {groupData?.createdBy === auth.currentUser?.uid ? (
              <>
                <label
                  style={{
                    display: "block",
                    padding: "12px",
                    background: "#334155",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "center",
                    marginBottom: "10px",
                    fontWeight: "600"
                  }}
                >
                  📷 Change Group Photo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setGroupImage(e.target.files[0])}
                  />
                </label>

                <button
                  className="create-btn"
                  onClick={uploadGroupPhoto}
                  style={{
                    width: "100%",
                    marginBottom: "10px",
                  }}
                >
                  Update Group Photo
                </button>

                <button
                  className="delete-btn"
                  onClick={handleDeleteGroup}
                  style={{
                    width: "100%",
                    background: "#dc2626"
                  }}
                >
                  Delete Group
                </button>
              </>
            ) : (
              <button
                className="delete-btn"
                onClick={handleLeaveGroup}
                style={{
                  width: "100%",
                }}
              >
                Leave Group
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isCheckingAccess) {
    const loadingView = (
      <div className="feed-container" style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "#64748b" }}>Verifying access status...</p>
      </div>
    );
    return embedded ? loadingView : <AppLayout>{loadingView}</AppLayout>;
  }

  if (!hasAccess) {
    const accessDeniedView = (
      <div className="feed-container" style={{ padding: "20px" }}>
        <div className="post-card" style={{ textAlign: "center", padding: "30px" }}>
          <h2 style={{ color: "#ef4444" }}>🔒 Access Denied</h2>
          <p style={{ color: "#64748b", margin: "15px 0" }}>
            You are not a member of this private group chat segment.
          </p>
        </div>
      </div>
    );
    return embedded ? accessDeniedView : <AppLayout>{accessDeniedView}</AppLayout>;
  }

  // Dynamic branch selection avoiding extra sidebars double nesting glitches
  return embedded ? mainContent : <AppLayout>{mainContent}</AppLayout>;
}

export default GroupChatPage;