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
  arrayUnion,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; 
import { auth, db } from "../firebase"; // Storage core library references purged
import EmojiPicker from "emoji-picker-react"; 

// Imported clear optimized storage utility bridge module
import {
  uploadToCloudinary,
  uploadDocumentToCloudinary,
} from "../services/cloudinaryUpload";

// Function arguments structurally updated to accept wrapper properties
function ChatRoomPage({
  selectedUserId,
  embedded = false,
}) {
  // Dynamically checking explicit pass-through states vs route configurations
  const params = useParams();
  const userId = embedded
    ? selectedUserId
    : params.userId;
  
  const navigate = useNavigate();
  // FIXED: Injected isEmbeddedMode validation tracker rule underneath initialization
  const isEmbeddedMode = embedded === true;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null); 
  const [currentUserId, setCurrentUserId] = useState(null); 
  const [isTyping, setIsTyping] = useState(false); 
  // STEP 1 APPENDED: Injected otherUserTyping state tracker rule under state tracking node
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); 
  const [selectedFile, setSelectedFile] = useState(null); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); 
  const [searchTerm, setSearchTerm] = useState("");
  
  // STEP 1 REPLACED/ASSURED: WhatsApp Style Thread Replying Engine State Tracker
  const [replyingTo, setReplyingTo] = useState(null);

  // WhatsApp/Telegram Style Fullscreen Media Engine State
  const [fullscreenImage, setFullscreenImage] = useState(null);

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

  // STEP 2 FIXED: Injected optimized routine marking incoming non-seen streams as verified read logs
  useEffect(() => {
    const markMessagesAsSeen = async () => {
      if (!currentUserId || !userId) return;

      const q = query(
        collection(db, "messages"),
        where("senderId", "==", userId),
        where("receiverId", "==", currentUserId),
        where("seen", "==", false)
      );

      const snapshot = await getDocs(q);

      snapshot.forEach(async (messageDoc) => {
        await updateDoc(
          doc(db, "messages", messageDoc.id),
          {
            seen: true,
            read: true,
          }
        );
      });
    };

    markMessagesAsSeen();
  }, [userId, currentUserId]);

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
          .filter((msg) => msg.text !== undefined || msg.imageUrl || msg.fileUrl || msg.audioUrl)
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

  // STEP 6 APPENDED: Realtime stream listener parsing typingStatus snapshots for absolute state values
  useEffect(() => {
    if (!userId || !currentUserId) return;

    const unsubscribe = onSnapshot(
      doc(db, "typingStatus", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOtherUserTyping(
            data.receiverId === currentUserId &&
            data.typing === true
          );
        } else {
          setOtherUserTyping(false);
        }
      }
    );

    return () => unsubscribe();
  }, [userId, currentUserId]);

  // STEP 5 ADDED: Injected onSnapshot presence tracking to catch changes directly from the metadata user collection references
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (snap) => {
        const data = snap.data();

        if (
          data?.isTyping &&
          data?.typingTo === auth.currentUser?.uid
        ) {
          setOtherUserTyping(true);
        } else {
          setOtherUserTyping(false);
        }
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // REPLACED FIX 4: Real-time automatic layout positioning focusing behavior configs
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

  // FIX APPLIED: Variable closure copy assigned to safely handle ESLint hooks diagnostics
  useEffect(() => {
    const currentTimeout = typingTimeoutRef.current;
    return () => {
      if (currentTimeout) clearTimeout(currentTimeout);
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

        // Cloudinary audio buffer binary pipeline deployment
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("upload_preset", "companysocial");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/doocnue5h/video/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        const audioUrl = data.secure_url;

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

      // Step 3 Fix: Modernized using secure asynchronous Cloudinary lookup utility methods
      if (selectedImage) {
        const uploadResult = await uploadToCloudinary(selectedImage);
        imageUrl = uploadResult.url;
      }

      // ✅ Option 2 Fixed: Resolved ESLint unused import warning by leveraging uploadDocumentToCloudinary utility handler
      if (selectedFile) {
        fileUrl = await uploadDocumentToCloudinary(selectedFile);
        fileName = selectedFile.name;
      }

      // STEP 3 ASSURED: Configured absolute reference saving parameters for replyingTo blocks
      await addDoc(collection(db, "messages"), {
        senderId: currentUserId,
        receiverId: userId,
        text: message,
        imageUrl,
        fileUrl, 
        fileName, 
        replyTo: replyingTo
          ? {
              text: replyingTo.text || "",
              senderId: replyingTo.senderId,
            }
          : null,
        createdAt: serverTimestamp(),
        read: false,
        delivered: true, 
        seen: false 
      });

      setMessage("");
      setSelectedImage(null); 
      setSelectedFile(null); 
      setShowEmojiPicker(false); 
      // STEP 4 REPLACED/ASSURED: Clear thread references on submission
      setReplyingTo(null);

      // STEP 5 APPENDED: Set typing parameter value to false under the typingStatus workspace configuration model
      if (currentUserId && userId) {
        await setDoc(
          doc(db, "typingStatus", currentUserId),
          {
            senderId: currentUserId,
            receiverId: userId,
            typing: false,
          }
        );
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      await deleteDoc(doc(db, "typing", `${userId}_${currentUserId}`));

    } catch (error) {
      console.error(error.message);
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

  if (!userId) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "white",
        }}
      >
        Select a conversation
      </div>
    );
  }

  return (
    <div
      className="instagram-chat-layout"
      style={{
        height: "100%", // FIXED: Purged viewport blockers to ensure accurate fluid scroll tracking
        width: "100%",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        padding: isEmbeddedMode ? "0px" : "20px",
        overflow: "hidden"
      }}
    >
      <div className="instagram-chat-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexShrink: 0 }}>
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

            {/* STEP 6 APPENDED: Real-time user document typing indicator rendering area */}
            {otherUserTyping && (
              <div
                style={{
                  color: "#22c55e",
                  fontSize: "12px",
                  marginTop: "2px",
                }}
              >
                Typing...
              </div>
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
          
          {!embedded && (
            <button className="edit-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
          )}
          
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
          flexShrink: 0
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

      {/* REPLACED FIX: Optimized parent tree structure according to step updates directives safely */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="instagram-message-area">
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
                      <div className="message-date-divider" style={{ textAlign: "center", margin: "15px 0" }}>
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
                      className={`message-row ${isMine ? "message-row-sent" : "message-row-received"}`}
                      style={{
                        display: "flex",
                        justifyContent: isMine ? "flex-end" : "flex-start",
                        marginBottom: "8px",
                      }}
                    >
                      <div className={`message-bubble ${isMine ? "whatsapp-sent" : "whatsapp-received"}`} style={{ position: "relative", maxWidth: "70%" }}>
                        
                        {!isMine && msg.senderName && (
                          <div className="sender-name" style={{ fontWeight: "bold", fontSize: "12px", color: "#34d399", marginBottom: "4px" }}>
                            {msg.senderName}
                          </div>
                        )}

                        {/* STEP 6 REPLACED: Contextual reference rendering evaluating past conversation blocks inside bubble layout */}
                        {msg.replyTo && (
                          <div
                            style={{
                              background: "rgba(255,255,255,0.08)",
                              borderLeft: "3px solid #60a5fa",
                              padding: "6px",
                              borderRadius: "6px",
                              marginBottom: "6px",
                              fontSize: "12px",
                            }}
                          >
                            {msg.replyTo.text}
                          </div>
                        )}

                        {/* REPLACED: Updated with optimized maximum layout sizing boundaries */}
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt=""
                            onClick={() => setFullscreenImage(msg.imageUrl)}
                            style={{
                              maxWidth: "250px",
                              borderRadius: "12px",
                              marginTop: "8px",
                              cursor: "pointer",
                              display: "block",
                              transition: "0.2s"
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

                        {/* STEP 4 UPDATED: Appended precision double checks for dynamic layout validation rendering */}
                        <div className="message-meta" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", fontSize: "10px", opacity: 0.6, marginTop: "4px", textAlign: "right" }}>
                          {msg.createdAt?.seconds
                            ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                          {isMine && (
                            <span
                              style={{
                                marginLeft: "6px",
                                color: msg.seen ? "#38bdf8" : "#94a3b8",
                                fontSize: "12px"
                              }}
                            >
                              {msg.seen ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>

                        {/* STEP 2 REPLACED: Integrated active control node linking elements safely inside loop parameters */}
                        {!msg.deleted && (
                          <button
                            onClick={() => setReplyingTo(msg)}
                            style={{
                              border: "none",
                              background: "transparent",
                              color: "#60a5fa",
                              cursor: "pointer",
                              fontSize: "11px",
                              marginTop: "4px",
                              padding: 0,
                              display: "block"
                            }}
                          >
                            Reply
                          </button>
                        )}

                        {!msg.deleted && (
                          <div className="message-reactions" style={{ display: "flex", gap: "3px", marginTop: "4px", justifyContent: isMine ? "flex-end" : "flex-start" }}>
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
                        <div className="message-delete-actions" style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "4px" }}>
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

            {/* STEP 4 FIXED: Anchor reference node properly preserved right inside the scrolling flex grid loops parameters */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* STEP 7 APPENDED: Render template mapping for realtime typing state triggers */}
        {otherUserTyping && (
          <div
            style={{
              color: "#38bdf8",
              fontSize: "13px",
              padding: "8px 12px",
              fontStyle: "italic",
            }}
          >
            Typing...
          </div>
        )}

        <div className="instagram-chat-input-container chat-composer" style={{ position: "relative", flexShrink: 0, marginTop: "auto", paddingTop: "10px" }}>
          {showEmojiPicker && (
            <div ref={emojiRef} style={{ marginBottom: "12px", position: "absolute", bottom: "80px", zIndex: 200 }}>
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}

          {/* STEP 5 REPLACED: Active conditional rendering module building user preview blocks securely */}
          {replyingTo && (
            <div
              style={{
                background: "#1e293b",
                borderLeft: "4px solid #60a5fa",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <strong>Replying to</strong>
                <div style={{ fontSize: "12px", color: "#cbd5e1" }}>
                  {replyingTo.text}
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "16px"
                }}
              >
                ✕
              </button>
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

            {/* STEP 4 REPLACED: Updated dynamic inline handler triggering typing indicators through user documents seamlessly */}
            <input
              type="text"
              placeholder={selectedFile ? `📎 ${selectedFile.name}` : "Type a message..."}
              value={message}
              style={{ flex: 1, background: "none", border: "none", color: "white", outline: "none", fontSize: "15px", padding: "6px 0" }}
              onChange={async (e) => {
                setMessage(e.target.value);

                if (auth.currentUser?.uid) {
                  await updateDoc(
                    doc(db, "users", auth.currentUser.uid),
                    {
                      isTyping: e.target.value.length > 0,
                      typingTo: userId || "",
                    }
                  );
                }

                clearTimeout(window.typingTimer);

                window.typingTimer = setTimeout(async () => {
                  if (auth.currentUser?.uid) {
                    await updateDoc(
                      doc(db, "users", auth.currentUser.uid),
                      {
                        isTyping: false,
                        typingTo: "",
                      }
                    );
                  }
                }, 1500);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              className="chat-send-button"
              onClick={handleSend}
              style={{ background: "#2563eb", color: "white", border: "none", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px" }}
            >
              ➤
            </button>
          </div>

          <div className="chat-attachment-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", padding: "0 8px" }}>
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

      {/* Fullscreen Media Overlay Workspace */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            cursor: "pointer"
          }}
        >
          <img
            src={fullscreenImage}
            alt="fullscreen"
            style={{
              maxWidth: "95vw",
              maxHeight: "95vh",
              borderRadius: "12px",
              objectFit: "contain"
            }}
          />

          <a
            href={fullscreenImage}
            download
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "20px",
              right: "80px",
              background: "#2563eb",
              color: "white",
              padding: "10px 14px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
          >
            Download
          </a>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenImage(null);
            }}
            style={{
              position: "absolute",
              top: "20px",
              right: "25px",
              border: "none",
              background: "#ef4444",
              color: "white",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}

export default ChatRoomPage;