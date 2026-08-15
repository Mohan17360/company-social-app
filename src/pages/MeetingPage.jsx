// src/pages/MeetingPage.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
// Import onAuthStateChanged for secure async session restoration tracking
import { onAuthStateChanged } from "firebase/auth";
// Verified: All required modules included cleanly without duplicates
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  addDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

function MeetingPage() {
  const [meetings, setMeetings] = useState([]);
  const [userRole, setUserRole] = useState("");

  // Added States exactly as requested (Step 3 & Step 6)
  const [searchTerm, setSearchTerm] = useState("");
  const [investors, setInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  
  // Added Founder State Hooks for Investor Context mapping
  const [founders, setFounders] = useState([]);
  const [selectedFounder, setSelectedFounder] = useState(null);

  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [topic, setTopic] = useState("");

  // Step 2: Added state wrapper tracking agreement completion status
  const [agreementCompleted, setAgreementCompleted] = useState(false);

  const loadMeetings = async () => {
    if (!auth.currentUser) return;

    try {
      // Step 1 & Debug Code Added #2: Fetch user document snapshot and log its state metrics cleanly
      const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      
      console.log("USER DOC EXISTS:", userSnap.exists());

      if (userSnap.exists()) {
        console.log("USER DATA:", userSnap.data());
      }
      
      if (!userSnap.exists()) return;
      
      const userData = userSnap.data();
      setUserRole(userData.role);

      // Change #2: Added explicit console log for verification diagnostics
      console.log("ROLE =", userData.role);

      let q;

      // Dynamic switch boundaries mapping role states safely (Bypassing syntax mismatches)
      if (userData.role === "Founder") {
        q = query(
          collection(db, "meetings"),
          where("founderId", "==", auth.currentUser.uid)
        );
      } else if (userData.role === "Investor") {
        q = query(
          collection(db, "meetings"),
          where("investorId", "==", auth.currentUser.uid)
        );
      } else {
        return; // Fallback for other unmapped roles
      }

      // Attached real-time subscription stream listener
      onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMeetings(data);
      });
      
    } catch (error) {
      console.error("Error loading meetings:", error);
    }
  };

  // Load Investors Function (STEP 4)
  const loadInvestors = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));

      const data = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (user) =>
            user.role === "Investor" &&
            user.verified === true
        );

      setInvestors(data);
    } catch (error) {
      console.error("Error loading investors:", error);
    }
  };

  // Load Founders Function exactly as requested (Step 6)
  const loadFounders = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));

      const data = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (user) =>
            user.role === "Founder" &&
            user.verified === true
        );

      setFounders(data);
    } catch (error) {
      console.error("Error loading founders:", error);
    }
  };

  // Real-time Signature Engine Mapping: Auto-unlocks when a valid profile selection is activated
  useEffect(() => {
    const verifyNdaHistoryState = async () => {
      const currentUser = auth.currentUser;
      const partnerId = userRole === "Founder" ? selectedInvestor?.id : selectedFounder?.id;
      
      if (!currentUser || !partnerId) {
        setAgreementCompleted(false);
        return;
      }

      // Bypass constraints for Admin or direct Owner self-scheduling states
      if (currentUser.uid === partnerId || userRole === "Admin") {
        setAgreementCompleted(true);
        return;
      }

      try {
        const founderUid = userRole === "Founder" ? currentUser.uid : partnerId;
        const viewerUid = userRole === "Founder" ? partnerId : currentUser.uid;

        const q = query(
          collection(db, "ndaHistory"),
          where("ownerId", "==", founderUid),
          where("viewerId", "==", viewerUid)
        );
        
        const snap = await getDocs(q);
        setAgreementCompleted(!snap.empty);
      } catch (err) {
        console.error("Failed to parse nda history verification flags:", err);
        setAgreementCompleted(false);
      }
    };

    verifyNdaHistoryState();
  }, [selectedInvestor, selectedFounder, userRole]);

  // Correct Fix Applied: Listens to explicit session transitions before triggering queries (Updated Step 6)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) return;

        console.log("AUTH RESTORED:", user.email);

        await loadMeetings();
        await loadInvestors();
        await loadFounders(); 
      }
    );

    return () => unsubscribe();
  }, []);

  // Step 2 Applied: Handle Firestore update mutations and send out dynamic contextual notifications with receiverEmail
  const updateMeetingStatus = async (meetingId, status, meetingDate = "", meetingTime = "") => {
    try {
      await updateDoc(doc(db, "meetings", meetingId), {
        status,
        meetingDate,
        meetingTime,
      });

      // Locate meeting item reference inside state array to extract role configurations
      const meeting = meetings.find(
        (m) => m.id === meetingId
      );

      // Added temporary diagnostic console log immediately before document creation block
      console.log("CREATING NOTIFICATION");

      // Handle the dynamic receiver-side user selection context safely using state names
      const actionUserName =
        userRole === "Founder"
          ? meeting.founderName
          : meeting.investorName;

      // Replaced: Integrated the exact requested dynamic layout string assignment
      await addDoc(
        collection(db, "notifications"),
        {
          receiverEmail:
            userRole === "Investor"
              ? meeting.founderEmail
              : meeting.investorEmail,

          message:
            status === "Accepted"
              ? `${actionUserName} accepted your meeting request.`
              : `${actionUserName} rejected your meeting request.`,

          type: "meeting",
          read: false,
          createdAt: new Date(),
        }
      );

      // Reloading layout context state securely after mutation
      await loadMeetings();
    } catch (error) {
      console.error("Error updating meeting status:", error);
      alert("Failed to update status: " + error.message);
    }
  };

  // Replaced: Delete function now updates the local UI array state instantly to prevent race conditions
  const deleteMeeting = async (meetingId) => {
    try {
      await deleteDoc(
        doc(db, "meetings", meetingId)
      );

      setMeetings((prev) =>
        prev.filter((m) => m.id !== meetingId)
      );
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // Meeting Request Function initiated by Founder (STEP 5)
  const requestMeeting = async () => {
    if (!selectedInvestor) {
      alert("Select investor");
      return;
    }

    if (!topic || !meetingDate || !meetingTime) {
      alert("Please enter topic, date and time parameters.");
      return;
    }

    try {
      const founderSnap = await getDoc(
        doc(db, "users", auth.currentUser.uid)
      );

      const founderData = founderSnap.data();

      await addDoc(collection(db, "meetings"), {
        founderId: auth.currentUser.uid,
        founderName: founderData.name,
        founderEmail: founderData.email || auth.currentUser.email,

        investorId: selectedInvestor.id,
        investorName: selectedInvestor.name,
        investorEmail: selectedInvestor.email,

        requestedBy: "Founder",
        topic,

        meetingDate,
        meetingTime,

        status: "Pending",
        createdAt: new Date(),
      });

      alert("Meeting Request Sent");

      // Reset local interface controls
      setMeetingDate("");
      setMeetingTime("");
      setTopic("");
      setSelectedInvestor(null);
      setSearchTerm("");

      await loadMeetings();
    } catch (error) {
      alert(error.message);
    }
  };

  // Step 9: Added requestFounderMeeting function with strict error mapping and localized reset workflows exactly as requested
  const requestFounderMeeting = async () => {
    if (!selectedFounder) {
      alert("Please select a founder");
      return;
    }

    if (!topic || !meetingDate || !meetingTime) {
      alert("Fill all fields");
      return;
    }

    try {
      const investorSnap = await getDoc(
        doc(db, "users", auth.currentUser.uid)
      );

      const investorData = investorSnap.data();

      await addDoc(collection(db, "meetings"), {
        founderId: selectedFounder.id,
        founderName: selectedFounder.name,
        founderEmail: selectedFounder.email,

        investorId: auth.currentUser.uid,
        investorName: investorData.name,
        investorEmail: investorData.email,

        requestedBy: "Investor",

        topic,
        meetingDate,
        meetingTime,

        status: "Pending",
        createdAt: new Date(),
      });

      alert("Meeting Request Sent");

      setSelectedFounder(null);
      setTopic("");
      setMeetingDate("");
      setMeetingTime("");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div
      className="meeting-page"
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "30px",
      }}
    >
      <h1>📅 Meetings</h1>

      {/* Change #3: Added temporary diagnostics indicator right below structural title anchor */}
      <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>
        User Role: <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{userRole || "Fetching..."}</span>
      </p>

      {/* Founder Scheduling Management Matrix Section using lower-case boundaries */}
      {userRole?.toLowerCase() === "founder" && (
        <div className="meeting-panel" style={{ background: "#1e293b", padding: "20px", borderRadius: "15px", marginBottom: "25px" }}>
          <h2>Request a New Meeting</h2>
          
          <input
            type="text"
            placeholder="Search Investor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #475569",
              background: "#0f172a",
              color: "white",
              marginTop: "10px",
              marginBottom: "15px"
            }}
          />

          {/* Investor Discovery Cards Grid Layer */}
          <div style={{ display: "grid", gap: "10px", maxHeight: "200px", overflowY: "auto", marginBottom: "15px" }}>
            {investors
              .filter((investor) =>
                investor.name
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )
              .map((investor) => (
                <div
                  key={investor.id}
                  onClick={() => setSelectedInvestor(investor)}
                  style={{
                    background: selectedInvestor?.id === investor.id ? "#2563eb" : "#0f172a",
                    padding: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: "1px solid #334155"
                  }}
                >
                  <h4 style={{ margin: 0 }}>{investor.name}</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#94a3b8" }}>{investor.email}</p>
                </div>
            ))}
          </div>

          {/* Selected Investor Verification Framework (STEP 7) */}
          {selectedInvestor && (
            <div style={{ borderTop: "1px solid #334155", paddingTop: "15px" }}>
              <p style={{ color: "#38bdf8", fontWeight: "bold" }}>
                Selected Schedule Target: {selectedInvestor.name}
              </p>

              {/* Updated: Clear Selection Button for Founder Section */}
              <button
                onClick={() => {
                  setSelectedInvestor(null);
                  setTopic("");
                  setMeetingDate("");
                  setMeetingTime("");
                }}
                style={{
                  marginBottom: "15px",
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#ef4444",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "block"
                }}
              >
                Clear Selection
              </button>

              {/* Added Topic Text Input Field directly above Date Input context */}
              <input
                type="text"
                placeholder="Meeting Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "white",
                }}
              />

              {/* Fixed Visibility: Native HTML5 Date Picker for Founder Panel */}
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "white",
                  marginBottom: "10px",
                  colorScheme: "dark",
                }}
              />

              {/* Fixed Visibility: Native HTML5 Time Picker for Founder Panel */}
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "white",
                  marginBottom: "15px",
                  colorScheme: "dark",
                }}
              />

              {/* Step 4: Conditionally toggle disabled states and dynamic locks text */}
              <button
                onClick={requestMeeting}
                disabled={!agreementCompleted}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background: agreementCompleted ? "#10b981" : "#475569",
                  color: agreementCompleted ? "white" : "#94a3b8",
                  cursor: agreementCompleted ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                }}
              >
                {agreementCompleted ? "Create Meeting" : "Agreement Required"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Investor Scheduling Management Matrix Section exactly as requested */}
      {userRole?.toLowerCase() === "investor" && (
        <div
          className="meeting-panel"
          style={{
            marginTop: "20px",
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
            marginBottom: "25px",
          }}
        >
          <h2>Request a New Meeting</h2>

          <input
            type="text"
            placeholder="Search Founder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              borderRadius: "8px",
              border: "1px solid #475569",
              background: "#0f172a",
              color: "white",
            }}
          />

          <div style={{ marginTop: "15px", display: "grid", gap: "10px", maxHeight: "200px", overflowY: "auto" }}>
            {founders
              .filter((founder) =>
                founder.name
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )
              .map((founder) => (
                <div
                  key={founder.id}
                  onClick={() => setSelectedFounder(founder)}
                  style={{
                    background:
                      selectedFounder?.id === founder.id
                        ? "#2563eb"
                        : "#0f172a",
                    padding: "15px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    border: "1px solid #334155"
                  }}
                >
                  <strong>{founder.name}</strong>
                  <br />
                  <span style={{ fontSize: "14px", color: "#94a3b8" }}>{founder.email}</span>
                </div>
              ))}
          </div>

          {/* Added Selection block workflow dynamically targeted to Investor context */}
          {selectedFounder && (
            <>
              <h3 style={{ marginTop: "20px" }}>
                Selected Founder: {selectedFounder.name}
              </h3>

              {/* Updated: Clear Selection Button for Investor Section */}
              <button
                onClick={() => {
                  setSelectedFounder(null);
                  setTopic("");
                  setMeetingDate("");
                  setMeetingTime("");
                }}
                style={{
                  marginBottom: "15px",
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#ef4444",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "block"
                }}
              >
                Clear Selection
              </button>

              <input
                type="text"
                placeholder="Meeting Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "10px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "white",
                }}
              />

              {/* Fixed Visibility: Native HTML5 Date Picker for Investor Panel */}
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "white",
                  marginTop: "10px",
                  colorScheme: "dark",
                }}
              />

              {/* Fixed Visibility: Native HTML5 Time Picker for Investor Panel */}
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "white",
                  marginTop: "10px",
                  colorScheme: "dark",
                }}
              />

              {/* Step 4 (Investor): Conditionally toggle disabled states and dynamic locks text */}
              <button
                onClick={() => requestFounderMeeting()}
                disabled={!agreementCompleted}
                style={{
                  width: "100%",
                  marginTop: "15px",
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background: agreementCompleted ? "#10b981" : "#475569",
                  color: agreementCompleted ? "white" : "#94a3b8",
                  cursor: agreementCompleted ? "pointer" : "not-allowed",
                  fontWeight: "bold"
                }}
              >
                {agreementCompleted ? "Create Meeting" : "Agreement Required"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Historical Meeting Request Context List Output */}
      <h2>Your Meetings</h2>
      <div className="meeting-list" style={{ marginTop: "15px" }}>
        {meetings.length === 0 ? (
          <p>No meetings found.</p>
        ) : (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="meeting-card"
              style={{
                background: "#1e293b",
                padding: "20px",
                borderRadius: "15px",
                marginBottom: "15px",
              }}
            >
              {/* Contextually layout header dependent on user role perspective (Updated Name Format) */}
              <h3>
                {userRole === "Founder"
                  ? `Investor: ${meeting.investorName || meeting.investorEmail}`
                  : `Founder: ${meeting.founderName || meeting.founderEmail}`}
              </h3>

              <p>Requested By: {meeting.requestedBy || "N/A"}</p>

              {/* Added Topic key layer inside metadata view stack */}
              <p>Topic: {meeting.topic || "No Topic"}</p>

              <p>Status: {meeting.status}</p>

              <p>Meeting Date: {meeting.meetingDate || "Not Scheduled"}</p>

              <p>Meeting Time: {meeting.meetingTime || "Not Scheduled"}</p>

              {/* Conditional action wrapper now verifies explicit role/origin boundaries strictly */}
              {meeting.status === "Pending" &&
               (
                 (meeting.requestedBy === "Founder" &&
                  userRole === "Investor") ||

                 (meeting.requestedBy === "Investor" &&
                  userRole === "Founder")
               ) && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "15px",
                  }}
                >
                  <button
                    onClick={() => updateMeetingStatus(meeting.id, "Accepted", meeting.meetingDate, meeting.meetingTime)}
                    style={{
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: "6px",
                      background: "#10b981",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => updateMeetingStatus(meeting.id, "Rejected")}
                    style={{
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: "6px",
                      background: "#ef4444",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}

              {/* Explicit Delete Request Button below Accept/Reject actions */}
              <button
                onClick={() => deleteMeeting(meeting.id)}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  background: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "block"
                }}
              >
                Delete Request
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MeetingPage;
