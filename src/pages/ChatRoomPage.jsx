// src/pages/ChatRoomPage.jsx
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

function ChatRoomPage() {
  const { userId } = useParams();
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

  // State managers for audio capturing sessions (Unused audioChunks removed)
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const bottomRef = useRef(null); 

  // Effect block dedicated exclusively to managing active session context
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  // 1. Isolated Real-time User Profile & Presence Data Sync
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

  // 2. Real-time Message Stream Sync + Automated Read Status Mutation
  useEffect(() => {
    if (!currentUserId || !userId) return;

    const unsubscribe = onSnapshot(
      collection(db, "messages"),
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        // Loop through messages and auto-mark unread incoming messages as read
        msgs.forEach(async (msg) => {
          if (
            msg.receiverId === currentUserId &&
            msg.senderId === userId &&
            msg.read === false
          ) {
            try {
              await updateDoc(doc(db, "messages", msg.id), {
                read: true,
              });
            } catch (error) {
              console.error("Error marking message as read:", error);
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

  // Listens to the typing indicator status of the counterpart user
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

  // 3. Smooth Auto-Scroll Anchor
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

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

  // Step 3: Add Start Recording function
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
        });
      };
    } catch (error) {
      alert(error.message);
    }
  };

  // Step 4: Add Stop Recording function
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
      });

      setMessage("");
      setSelectedImage(null); 
      setSelectedFile(null); 
      setShowEmojiPicker(false); 

      await setDoc(doc(db, "typing", currentUserId), {
        typing: false,
        receiverId: userId,
        senderId: currentUserId,
      });

    } catch (error) {
      alert(error.message);
    }
  };

  const isUserOnline = chatUser?.online === true;

  return (
    <div className="feed-container">
      <h1>Chat Room</h1>

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

      {/* Header Profile Info Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <h3>{chatUser?.name || "Loading Profile..."}</h3>

        {/* Render explicit real-time feedback when partner modifies message content */}
        {isTyping && (
          <span
            style={{
              color: "#22c55e",
              fontSize: "14px",
            }}
          >
            typing...
          </span>
        )}

        <span
          style={{
            color: isUserOnline ? "#22c55e" : "#ef4444",
            fontWeight: "bold",
          }}
        >
          {isUserOnline ? "🟢 Online" : "🔴 Offline"}
        </span>
      </div>

      {/* Sticky Container housing Search Actions */}
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

      {/* Scrollable Message Box Display */}
      <div 
        className="post-card"
        style={{
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        <h3>Messages</h3>

        {messages
          .filter((msg) =>
            !searchTerm ? true : msg.text?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((msg) => {
            const isMine = msg.senderId === currentUserId;

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isMine ? "flex-end" : "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      background: isMine ? "#2563eb" : "#475569",
                      color: "white",
                      padding: "10px 15px",
                      borderRadius: "12px",
                      maxWidth: "100%", 
                      wordBreak: "break-word",
                    }}
                  >
                    <>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="chat"
                          style={{
                            maxWidth: "250px",
                            borderRadius: "10px",
                            marginBottom: "8px",
                            display: "block"
                          }}
                        />
                      )}

                      {msg.fileUrl && (
                        <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#fff",
                              textDecoration: "underline",
                              fontSize: "14px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            📎 {msg.fileName || "Download Attached File"}
                          </a>
                        </div>
                      )}

                      {/* Render HTML5 Audio playback anchor inline when present */}
                      {msg.audioUrl && (
                        <div style={{ marginTop: "5px", marginBottom: "5px" }}>
                          <audio controls style={{ maxWidth: "100%" }}>
                            <source src={msg.audioUrl} type="audio/webm" />
                          </audio>
                        </div>
                      )}

                      {msg.text && (
                        <div
                          style={{
                            fontStyle: msg.deleted ? "italic" : "normal",
                            opacity: msg.deleted ? 0.7 : 1,
                          }}
                        >
                          {msg.text}
                        </div>
                      )}
                    </>

                    {isMine && (
                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "4px",
                          textAlign: "right",
                        }}
                      >
                        {msg.read ? "✓✓" : "✓"}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: "11px",
                        opacity: 0.7,
                        marginTop: "5px",
                        textAlign: "right",
                      }}
                    >
                      {msg.createdAt?.seconds
                        ? new Date(msg.createdAt.seconds * 1000).toLocaleString()
                        : ""}
                    </div>
                  </div>

                  {!msg.deleted && (
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        marginTop: "5px",
                        justifyContent: isMine ? "flex-end" : "flex-start",
                      }}
                    >
                      <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: "14px" }} onClick={() => handleReaction(msg.id, "👍")}>👍</button>
                      <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: "14px" }} onClick={() => handleReaction(msg.id, "❤️")}>❤️</button>
                      <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: "14px" }} onClick={() => handleReaction(msg.id, "😂")}>😂</button>
                      <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: "14px" }} onClick={() => handleReaction(msg.id, "😮")}>😮</button>
                      <button style={{ border: "none", background: "none", cursor: "pointer", fontSize: "14px" }} onClick={() => handleReaction(msg.id, "🎉")}>🎉</button>
                    </div>
                  )}

                  {msg.reactions?.length > 0 && (
                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "16px",
                        textAlign: isMine ? "right" : "left",
                        display: "flex",
                        gap: "3px",
                        justifyContent: isMine ? "flex-end" : "flex-start",
                        background: "rgba(0,0,0,0.05)",
                        padding: "4px 8px",
                        borderRadius: "20px",
                        width: "fit-content"
                      }}
                    >
                      {msg.reactions.map((reaction, index) => (
                        <span key={index} title={`Reacted by user`}>
                          {reaction.emoji}
                        </span>
                      ))}
                    </div>
                  )}

                  {isMine && !msg.deleted && (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "flex-end",
                        marginTop: "4px",
                    }}
                  >
                    <button
                      onClick={() => handleDeleteMessage(msg.id, false)}
                      style={{
                        fontSize: "11px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        padding: "4px 8px"
                      }}
                    >
                      Delete For Me
                    </button>

                    <button
                      onClick={() => handleDeleteMessage(msg.id, true)}
                      style={{
                        fontSize: "11px",
                        background: "#f59e0b",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        padding: "4px 8px"
                      }}
                    >
                      Delete For Everyone
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      {/* Message Text Input Area */}
      <div className="post-card">
        <button
          className="edit-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{ marginBottom: "8px", fontSize: "16px", cursor: "pointer" }}
        >
          😊 Toggle Emojis
        </button>

        {showEmojiPicker && (
          <div style={{ marginBottom: "12px" }}>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        <textarea
          placeholder="Type message..."
          value={message}
          onChange={async (e) => {
            setMessage(e.target.value);

            if (!currentUserId) return;

            await setDoc(doc(db, "typing", currentUserId), {
              typing: e.target.value.length > 0,
              receiverId: userId,
              senderId: currentUserId,
            });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <br />
        <br />

        <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
          Upload Image:
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedImage(e.target.files[0])}
          style={{ marginBottom: "12px", display: "block" }}
        />

        <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
          Upload Document/File:
        </label>
        <input
          type="file"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          style={{ marginBottom: "15px", display: "block" }}
        />

        {/* MediaRecorder button layout row triggers */}
        <div style={{ marginBottom: "15px" }}>
          {!isRecording ? (
            <button
              className="edit-btn"
              onClick={startRecording}
              style={{ cursor: "pointer" }}
            >
              🎤 Start Recording
            </button>
          ) : (
            <button
              className="delete-btn"
              onClick={stopRecording}
              style={{ background: "#ef4444", color: "#fff", cursor: "pointer" }}
            >
              ⏹ Stop Recording
            </button>
          )}
        </div>

        <button className="create-btn" onClick={handleSend}>
          Send Message
        </button>
      </div>
    </div>
  );
}

export default ChatRoomPage;