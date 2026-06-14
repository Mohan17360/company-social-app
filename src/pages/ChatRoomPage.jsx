// src/pages/ChatRoomPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react"; 
import {
  addDoc,
  collection,
  onSnapshot,
  doc,
  serverTimestamp,
  updateDoc,
  setDoc,
  deleteDoc,
  arrayUnion 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; 
import { auth, db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import EmojiPicker from "emoji-picker-react"; 

// Function arguments structurally updated to accept wrapper properties
function ChatRoomPage({
  selectedUserId,
  embedded = false,
}) {
  // Dynamically checking explicit pass-through states vs route configurations
  const params = useParams();
  const userId = selectedUserId || params.userId;
  
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null); 
  const [currentUserId, setCurrentUserId] = useState(null); 
  const [isTyping, setIsTyping] = useState(false); 
  const [selectedImage, setSelectedImage] = useState(null); 
  const [selectedFile, setSelectedFile] = useState(null); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); 
  const [searchTerm, setSearchTerm] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const messagesEndRef = useRef(null); 
  const emojiRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let activeUserUid = null;

    const handleBeforeUnload = async () => {
      if (!activeUserUid) return;
      try {
        await updateDoc(doc(db, "users", activeUserUid), {
          online: false,
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error setting offline on unload:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        activeUserUid = user.uid;

        try {
          await updateDoc(doc(db, "users", user.uid), {
            online: true,
          });
        } catch (error) {
          console.error("Error setting user online status:", error);
        }

        window.addEventListener("beforeunload", handleBeforeUnload);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      if (activeUserUid) {
        updateDoc(doc(db, "users", activeUserUid), {
          online: false,
          lastSeen: serverTimestamp(),
        }).catch((error) => console.error("Error setting user offline on unmount:", error));
      }
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          setChatUser(docSnap.data());
        }
      },
      (error) => console.error("User snapshot error:", error)
    );

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!currentUserId || !userId) return;

    const unsubscribe = onSnapshot(
      collection(db, "messages"),
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        msgs.forEach(async (msg) => {
          if (
            msg.receiverId === currentUserId &&
            msg.senderId === userId &&
            (msg.read === false || msg.seen === false)
          ) {
            try {
              await updateDoc(doc(db, "messages", msg.id), {
                read: true,
                seen: true, 
              });
            } catch (error) {
              console.error("Error marking message as read/seen:", error);
            }
          }
        });

        const conversationMessages = msgs
          .filter(
            (msg) =>
              (msg.senderId === currentUserId && msg.receiverId === userId) ||
              (msg.senderId === userId && msg.receiverId === currentUserId)
          )
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return aTime - bTime;
          });

        setMessages(conversationMessages);
      }
    );

    return () => unsubscribe();
  }, [userId, currentUserId]); 

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, "typing", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          setIsTyping(docSnap.data().typing === true);
        } else {
          setIsTyping(false);
        }
      }
    );

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await updateDoc(doc(db, "messages", messageId), {
        reactions: arrayUnion({
          userId: currentUserId,
          emoji,
        }),
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteMessage = async (messageId, forEveryone = false) => {
    try {
      if (forEveryone) {
        await updateDoc(doc(db, "messages", messageId), {
          text: "🚫 This message was deleted",
          deleted: true,
         });
      } else {
        await deleteDoc(doc(db, "messages", messageId));
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      recorder.start();

      setMediaRecorder(recorder);
      setIsRecording(true);

      const chunks = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, {
          type: "audio/webm",
        });

        const audioRef = ref(
          storage,
          `voice-notes/${Date.now()}.webm`
        );

        await uploadBytes(audioRef, blob);
        const audioUrl = await getDownloadURL(audioRef);

        await addDoc(collection(db, "messages"), {
          senderId: currentUserId,
          receiverId: userId,
          audioUrl,
          createdAt: serverTimestamp(),
          read: false,
          delivered: true, 
          seen: false      
        });
      };
    } catch (error) {
      alert(error.message);
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedImage && !selectedFile) return;

    try {
      let imageUrl = "";
      let fileUrl = "";
      let fileName = "";

      if (selectedImage) {
        const imageRef = ref(
          storage,
          `chat-images/${Date.now()}-${selectedImage.name}`
        );
        await uploadBytes(imageRef, selectedImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      if (selectedFile) {
        const fileRef = ref(
          storage,
          `chat-files/${Date.now()}-${selectedFile.name}`
        );
        await uploadBytes(fileRef, selectedFile);
        fileUrl = await getDownloadURL(fileRef);
        fileName = selectedFile.name;
      }

      await addDoc(collection(db, "messages"), {
        senderId: currentUserId,
        receiverId: userId,
        text: message,
        imageUrl,
        fileUrl, 
        fileName, 
        createdAt: serverTimestamp(),
        read: false,
        delivered: true, 
        seen: false      
      });

      setMessage("");
      setSelectedImage(null); 
      setSelectedFile(null); 
      setShowEmojiPicker(false); 

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      await deleteDoc(doc(db, "typing", `${userId}_${currentUserId}`));

    } catch (error) {
      alert(error.message);
    }
  };

  const formatMessageDate = (timestamp) => {
    if (!timestamp?.seconds) return "";

    const messageDate = new Date(timestamp.seconds * 1000);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return messageDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp?.seconds) return "recently";

    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();

    const today = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (today) {
      return `active today at ${time}`;
    }
    if (isYesterday) {
      return `active yesterday at ${time}`;
    }
    return `active ${date.toLocaleDateString()} at ${time}`;
  };

  const isUserOnline = chatUser?.online === true;

  return (
    <div className="instagram-chat-layout">
      
      <div className="instagram-chat-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div className="chat-user-info" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          
          <div className="chat-avatar" style={{
            width: "45px",
            height: "45px",
            borderRadius: "50%",
            backgroundColor: "#2563eb",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "18px"
          }}>
            {chatUser?.name ? chatUser.name.charAt(0).toUpperCase() : "?"}
          </div>

          <div>
            <h2 style={{ margin: 0, fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "8px" }}>
              {chatUser?.name || "Loading Profile..."}
              {isTyping && (
                <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: "normal", fontStyle: "italic" }}>
                  typing...
                </span>
              )}
            </h2>

            {isUserOnline ? (
              <p style={{ color: "#22c55e", margin: 0, fontSize: "14px" }}>
                ● Active now
              </p>
            ) : (
              <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
                {formatLastSeen(chatUser?.lastSeen)}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="chat-header-actions" style={{ display: "flex", gap: "10px" }}>
            <button className="header-icon-btn" style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "white" }}>📞</button>
            <button className="header-icon-btn" style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "white" }}>🎥</button>
            <button className="header-icon-btn" style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "white" }}>ℹ️</button>
          </div>
          <div style={{ height: "20px", width: "1px", background: "#334155", margin: "0 4px" }} />
          
          {/* Embedded prop check blocks ungraceful mobile layouts from spilling on flat desktop frames */}
          {!embedded && (
            <button className="edit-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
          )}
          
          {/* Hot-reload component checks bypass processing */}
          {!embedded && (
            <button className="create-btn" onClick={() => window.location.reload()}>
              ↻ Refresh
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          position: "sticky",
          top: "0",
          zIndex: 100,
          background: "#071633",
          paddingBottom: "10px",
          marginBottom: "15px",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #475569",
            boxSizing: "border-box"
          }}
        />
      </div>

      <div className="instagram-message-area" style={{ height: "calc(100vh - 220px)", overflowY: "auto", paddingRight: "5px" }}>
        <div className="chat-messages">
          {messages
            .filter((msg) =>
              !searchTerm ? true : msg.text?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((msg, index, arr) => {
              const isMine = msg.senderId === currentUserId;
              const currentDate = formatMessageDate(msg.createdAt);
              
              const prevMsg = index > 0 ? arr[index - 1] : null;
              const prevDate = prevMsg ? formatMessageDate(prevMsg.createdAt) : "";
              const showDate = currentDate !== prevDate;

              return (
                <React.Fragment key={msg.id}>
                  {showDate && currentDate && (
                    <div style={{ textAlign: "center", margin: "15px 0" }}>
                      <span
                        style={{
                          background: "#1e293b",
                          color: "#cbd5e1",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}
                      >
                        {currentDate}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <div className={isMine ? "whatsapp-sent" : "whatsapp-received"} style={{ position: "relative", maxWidth: "70%" }}>
                      
                      {!isMine && msg.senderName && (
                        <div className="sender-name" style={{ fontWeight: "bold", fontSize: "12px", color: "#34d399", marginBottom: "4px" }}>
                          {msg.senderName}
                        </div>
                      )}

                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="chat"
                          style={{
                            maxWidth: "100%",
                            borderRadius: "8px",
                            marginBottom: "6px",
                            display: "block"
                          }}
                        />
                      )}

                      {msg.fileUrl && (
                        <div style={{ marginTop: "4px", marginBottom: "6px" }}>
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#38bdf8",
                              textDecoration: "underline",
                              fontSize: "14px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            📎 {msg.fileName || "Download Document"}
                          </a>
                        </div>
                      )}

                      {msg.audioUrl && (
                        <div style={{ marginTop: "4px", marginBottom: "6px" }}>
                          <audio controls style={{ maxWidth: "100%" }}>
                            <source src={msg.audioUrl} type="audio/webm" />
                          </audio>
                        </div>
                      )}

                      <div style={{ fontStyle: msg.deleted ? "italic" : "normal", opacity: msg.deleted ? 0.7 : 1 }}>
                        {msg.text}
                      </div>

                      <div className="message-meta" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", fontSize: "10px", opacity: 0.6, marginTop: "4px", textAlign: "right" }}>
                        {msg.createdAt?.seconds
                          ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                        {isMine && (msg.seen ? " ✓✓" : " ✓")}
                      </div>

                      {!msg.deleted && (
                        <div style={{ display: "flex", gap: "3px", marginTop: "4px", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                          <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: "12px" }} onClick={() => handleReaction(msg.id, "👍")}>👍</button>
                          <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: "12px" }} onClick={() => handleReaction(msg.id, "❤️")}>❤️</button>
                          <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: "12px" }} onClick={() => handleReaction(msg.id, "😂")}>😂</button>
                        </div>
                      )}

                      {msg.reactions?.length > 0 && (
                        <div style={{ display: "flex", gap: "2px", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "10px", width: "fit-content", marginTop: "3px" }}>
                          {msg.reactions.map((r, i) => <span key={i} style={{ fontSize: "12px" }}>{r.emoji}</span>)}
                        </div>
                      )}

                      {isMine && !msg.deleted && (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "4px" }}>
                          <button onClick={() => handleDeleteMessage(msg.id, false)} style={{ fontSize: "9px", background: "#ef4444", color: "white", border: "none", borderRadius: "3px", cursor: "pointer", padding: "2px 5px" }}>
                            Delete For Me
                          </button>
                          <button onClick={() => handleDeleteMessage(msg.id, true)} style={{ fontSize: "9px", background: "#f59e0b", color: "white", border: "none", borderRadius: "3px", cursor: "pointer", padding: "2px 5px" }}>
                            Delete For Everyone
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                </React.Fragment>
              );
            })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="instagram-chat-input-container" style={{ position: "relative" }}>
        {showEmojiPicker && (
          <div ref={emojiRef} style={{ marginBottom: "12px", position: "absolute", bottom: "80px", zIndex: 200 }}>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <div className="chat-input-bar" style={{ display: "flex", alignItems: "center", gap: "10px", background: "#1e293b", padding: "8px 12px", borderRadius: "25px" }}>
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            style={{ border: "none", background: "none", fontSize: "20px", cursor: "pointer", padding: "4px" }}
          >
            😀
          </button>

          <label style={{ cursor: "pointer", fontSize: "20px", padding: "4px", display: "inline-block" }}>
            📎
            <input 
              type="file" 
              onChange={(e) => setSelectedFile(e.target.files[0])} 
              style={{ display: "none" }} 
            />
          </label>

          <input
            type="text"
            placeholder={selectedFile ? `📎 ${selectedFile.name}` : "Type a message"}
            value={message}
            style={{ flex: 1, background: "none", border: "none", color: "white", outline: "none", fontSize: "15px", padding: "6px 0" }}
            onChange={async (e) => {
              const currentInputValue = e.target.value;
              setMessage(currentInputValue);
              
              if (!currentUserId) return;

              if (!currentInputValue.trim()) {
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                await deleteDoc(doc(db, "typing", `${userId}_${currentUserId}`));
                return;
              }

              await setDoc(doc(db, "typing", `${userId}_${currentUserId}`), {
                receiverId: userId,
                senderId: currentUserId,
                name: auth.currentUser?.displayName || chatUser?.name || "User",
                typing: true,
              });

              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

              typingTimeoutRef.current = setTimeout(async () => {
                await deleteDoc(doc(db, "typing", `${userId}_${currentUserId}`));
              }, 2000);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            onClick={handleSend}
            style={{ background: "#2563eb", color: "white", border: "none", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px" }}
          >
            ➤
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", padding: "0 8px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "#64748b", marginRight: "6px", cursor: "pointer" }}>
              📸 Attach Image
              <input type="file" accept="image/*" onChange={(e) => setSelectedImage(e.target.files[0])} style={{ display: "none" }} />
            </label>
            {selectedImage && <span style={{ fontSize: "11px", color: "#22c55e" }}>✓ {selectedImage.name}</span>}
          </div>

          <div>
            {!isRecording ? (
              <button onClick={startRecording} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "13px" }}>
                🎤 Record Voice
              </button>
            ) : (
              <button onClick={stopRecording} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                ⏹ Stop ({isRecording ? "Recording..." : ""})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatRoomPage;