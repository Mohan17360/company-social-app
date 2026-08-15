// src/pages/AdminPage.jsx
import { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  query,      
  where,      
  getDocs,
  addDoc,
  setDoc,
  getDoc    
} from "firebase/firestore";
// Step 1: Updated base imports to reference the explicit database and auth modules
import { db, auth } from "../firebase";
// Step A: Import useNavigate
import { useNavigate } from "react-router-dom";

function AdminPage() {
  // Step 1: Define Locked Master Super Admin Identity Profile Email System Constant
  const SUPER_ADMIN_EMAIL = "laminyamal1239@gmail.com";

  // Step 10.2: Define settings document location string key identifier
  const SETTINGS_DOC = "platform";

  // Step 2: Added evaluation flag checking current active admin hierarchy tier
  const isSuperAdmin = auth.currentUser?.email === SUPER_ADMIN_EMAIL;

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]); 
  const [reports, setReports] = useState([]); // Real-time reports queue state
  const [searchTerm, setSearchTerm] = useState("");
  const [commentsCount, setCommentsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);

  // Step 1 (Continued): Expanded Analytical Infrastructure Pipeline States
  const [groupsCount, setGroupsCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [adminsCount, setAdminsCount] = useState(0);
  const [bannedUsersCount, setBannedUsersCount] = useState(0);

  // Step 8.7: Activity logs state infrastructure
  const [activityLogs, setActivityLogs] = useState([]);

  // Step 1: Add State (New Tab Navigation Control Hook)
  const [activeTab, setActiveTab] = useState("dashboard");

  // New State variables for the Platform Settings interface module
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  // Step B: Initialize navigate hook
  const navigate = useNavigate();

  // Step 10.3: Initial setting values state initialization extraction call
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", SETTINGS_DOC));
        if (snap.exists()) {
          setMaintenanceMode(snap.data().maintenanceMode);
          setRegistrationEnabled(snap.data().registrationEnabled);
        }
      } catch (error) {
        console.error("Failed to recover remote configuration records:", error);
      }
    };
    loadSettings();
  }, []);

  // Real-time snapshot listeners for administrative workspace collections
  useEffect(() => {
    // 1. Users System Listener + Dynamic State Filtration Reducers
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
        
        // Step 2: Extract real-time user state attributes
        setOnlineUsersCount(usersList.filter((u) => u.online === true).length);
        setAdminsCount(usersList.filter((u) => u.role === "Admin").length);
        setBannedUsersCount(usersList.filter((u) => u.isBanned === true).length);
      },
      (error) => console.error("Error listening to users collection:", error)
    );

    // 2. Posts Content Feed Moderation Listener
    const unsubscribePostsList = onSnapshot(
      collection(db, "posts"),
      (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
      },
      (error) => console.error("Error listening to posts collection:", error)
    );

    // 3. Flagged Reports Operations Queue Listener
    const unsubscribeReports = onSnapshot(
      collection(db, "reports"),
      (snapshot) => {
        const reportsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(reportsData);
      },
      (error) => console.error("Error listening to reports collection:", error)
    );

    // 4. Global Comments Analytics Counter Listener
    const unsubscribeComments = onSnapshot(
      collection(db, "comments"),
      (snapshot) => {
        setCommentsCount(snapshot.size);
      },
      (error) => console.error("Error listening to comments collection:", error)
    );

    // 5. Global Notifications Analytics Counter Listener
    const unsubscribeNotifications = onSnapshot(
      collection(db, "notifications"),
      (snapshot) => {
        setNotificationsCount(snapshot.size);
      },
      (error) => console.error("Error listening to notifications collection:", error)
    );

    // Step 3: Global Groups Analytics Counter Listener
    const unsubscribeGroups = onSnapshot(
      collection(db, "groups"),
      (snapshot) => {
        setGroupsCount(snapshot.size);
      },
      (error) => console.error("Error listening to groups collection:", error)
    );

    // Step 4: Global Messages Analytics Counter Listener
    const unsubscribeMessages = onSnapshot(
      collection(db, "messages"),
      (snapshot) => {
        setMessagesCount(snapshot.size);
      },
      (error) => console.error("Error listening to messages collection:", error)
    );

    // Step 8.8: Activity Logs Live Tracker System Listener
    const unsubscribeLogs = onSnapshot(
      collection(db, "activityLogs"),
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort or reverse to show the latest logs first
        setActivityLogs(logs.reverse());
      },
      (error) => console.error("Error listening to activityLogs collection:", error)
    );

    // Step 5 & Step 8.9: Detach all listeners clean on unmount sequence
    return () => {
      unsubscribeUsers();
      unsubscribePostsList();
      unsubscribeReports();
      unsubscribeComments();
      unsubscribeNotifications();
      unsubscribeGroups();
      unsubscribeMessages();
      unsubscribeLogs();
    };
  }, []);

  // GLOBAL LOGGING MASTER HELPER PIPELINE FUNCTION
  const createActivityLog = async (action, target) => {
    try {
      await addDoc(collection(db, "activityLogs"), {
        action,
        target,
        admin: auth.currentUser?.email || "Unknown Admin",
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Activity log failed:", error);
    }
  };

  // Function to drop a user profile along with all written posts, comments, and notifications
  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm("Delete this user permanently? This cannot be undone.")) return;

    try {
      // 1. Locate and purge all posts matching the target user's email identifier
      const postsQuery = query(
        collection(db, "posts"),
        where("email", "==", userEmail)
      );
      const postsSnapshot = await getDocs(postsQuery);
      for (const postDoc of postsSnapshot.docs) {
        await deleteDoc(doc(db, "posts", postDoc.id));
      }

      // 2. Locate and purge all written comments matching the target user's email identifier
      const commentsQuery = query(
        collection(db, "comments"),
        where("email", "==", userEmail)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      for (const commentDoc of commentsSnapshot.docs) {
        await deleteDoc(doc(db, "comments", commentDoc.id));
      }

      // 3. Locate and purge all notifications matching the target user's email identifier
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userEmail", "==", userEmail)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      for (const notificationDoc of notificationsSnapshot.docs) {
        await deleteDoc(doc(db, "notifications", notificationDoc.id));
      }

      // Step 8.6: Create activity audit trail record right before final index dropped
      await createActivityLog("User Deleted", userEmail);

      // 4. Destroy core user index profile document reference element 
      await deleteDoc(doc(db, "users", userId));

      alert("User and all related data deleted");
    } catch (error) {
      console.error("Cascading deletion failed: ", error);
      alert(error.message);
    }
  };

  // STEP 3: Adjusted handler signature parameters to use dynamic userEmail strings
  const handleRoleChange = async (userId, userEmail, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        approvalStatus: "Approved" // Normal mutations bypass onboarding lock gates
      });

      // Updated tracking targets parameter to feed the readable user email string
      await createActivityLog(`Role changed to ${newRole}`, userEmail);

      alert("User access role updated successfully.");
    } catch (error) {
      console.error("Error patching user assignment field:", error);
      alert(`Failed to update security tier: ${error.message}`);
    }
  };

  // Function to resolve role admission processing pipelines safely
  const handleResolveRoleRequest = async (user, isApproved) => {
    try {
      const targetRole = isApproved ? user.requestedRole : "Freelancer";
      await updateDoc(doc(db, "users", user.id), {
        role: targetRole,
        approvalStatus: isApproved ? "Approved" : "Rejected"
      });

      await createActivityLog(
        isApproved ? `Role Request Approved (${targetRole})` : "Role Request Rejected",
        user.email
      );

      alert(`Registration request handled as ${isApproved ? "Approved" : "Rejected"}.`);
    } catch (error) {
      console.error("Failed to commit role moderation action updates:", error);
      alert(error.message);
    }
  };

  // Renamed to handleVerificationApproval to support all roles onboarding checks universally
  const handleVerificationApproval = async (userId, approved) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        verified: approved,
        verificationStatus: approved ? "Approved" : "Rejected",
      });
      alert(approved ? "Verification Approved" : "Verification Rejected");
    } catch (error) {
      alert(error.message);
    }
  };

  // Function to toggle a user's connection session authorization flag status
  const handleBanUser = async (userId, userEmail, currentBanStatus) => {
    const contextAction = currentBanStatus ? "unban" : "ban";
    if (!window.confirm(`Are you certain you want to ${contextAction} this system user?`)) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        isBanned: !currentBanStatus,
      });

      // Step 8.5: Write toggle update action parameters directly into audit queue with email target
      await createActivityLog(
        currentBanStatus ? "User Unbanned" : "User Banned",
        userEmail
      );

      alert(`User context registry state updated to ${currentBanStatus ? "Unbanned" : "Banned"}.`);
    } catch (error) {
      console.error("Error executing collection field patch routing:", error);
      alert(`Failed to execute profile flag assignment change: ${error.message}`);
    }
  };

  // Moderation function to delete a post directly from the dashboard
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await deleteDoc(doc(db, "posts", postId));
      alert("Post deleted successfully");
    } catch (error) {
      console.error("Error moderating post:", error);
      alert(error.message);
    }
  };

  // Moderation function to clear out a false/reviewed content flag report log
  const handleDismissReport = async (reportId) => {
    try {
      await deleteDoc(doc(db, "reports", reportId));
      alert("Report record dismissed successfully.");
    } catch (error) {
      console.error("Error removing report entry index:", error);
      alert(error.message);
    }
  };

  // Step 10.4: Master update handler actions linking interface mutations to base data models
  const saveMaintenanceMode = async (value) => {
    setMaintenanceMode(value);
    try {
      await setDoc(
        doc(db, "settings", SETTINGS_DOC),
        {
          maintenanceMode: value,
          registrationEnabled,
        },
        { merge: true }
      );
      await createActivityLog(
        value ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
        "System Settings"
      );
    } catch (error) {
      console.error("Failed to sync structural maintenance mode flag changes:", error);
    }
  };

  const saveRegistrationStatus = async (value) => {
    setRegistrationEnabled(value);
    try {
      await setDoc(
        doc(db, "settings", SETTINGS_DOC),
        {
          maintenanceMode,
          registrationEnabled: value,
        },
        { merge: true }
      );
      await createActivityLog(
        value ? "Public Registration Opened" : "Public Registration Closed",
        "System Settings"
      );
    } catch (error) {
      console.error("Failed to sync network account creation toggle changes:", error);
    }
  };

  // Process user parameters client-side across names, emails, and roles
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter incoming registration records stuck on the validation gateway threshold step
  const pendingRoleRequests = users.filter((user) => user.approvalStatus === "Pending");

  // Filter out user profiles restricted purely to administrative privileges
  const adminUsers = users.filter((user) => user.role === "Admin");

  // Step 1 Integration: Instantiated the conditional active pending Founders lookup trace
  const pendingFounders = users.filter(
    (user) =>
      user.role === "Founder" &&
      user.verificationSubmitted === true &&
      user.verified !== true
  );

  // Added conditional filters to parse remaining onboarding user types categories
  const pendingInvestors = users.filter(
    (user) =>
      user.role === "Investor" &&
      user.verificationSubmitted === true &&
      user.verified !== true
  );

  const pendingFreelancers = users.filter(
    (user) =>
      user.role === "Freelancer" &&
      user.verificationSubmitted === true &&
      user.verified !== true
  );

  return (
    <div className="feed-container">
      <h1 className="feed-title">Admin Dashboard</h1>

      {/* Sidebar Layout Start (Flex layout container) */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-start",
        }}
      >
        {/* Sidebar Components Dashboard Controller Row */}
        <div
          style={{
            width: "230px",
            minWidth: "230px",
          }}
        >
          <div className="post-card">
            <button
              className="create-btn"
              style={{
                width: "100%",
                marginBottom: "10px",
                backgroundColor: activeTab === "dashboard" ? "#2563eb" : ""
              }}
              onClick={() => setActiveTab("dashboard")}
            >
              📊 Dashboard
            </button>

            <button
              className="create-btn"
              style={{
                width: "100%",
                marginBottom: "10px",
                backgroundColor: activeTab === "users" ? "#2563eb" : ""
              }}
              onClick={() => setActiveTab("users")}
            >
              👥 Users
            </button>

            {/* Injected Role Requests workspace state navigator link into the control index array */}
            <button
              className="create-btn"
              style={{
                width: "100%",
                marginBottom: "10px",
                backgroundColor: activeTab === "roleRequests" ? "#2563eb" : ""
              }}
              onClick={() => setActiveTab("roleRequests")}
            >
              📋 Role Requests {pendingRoleRequests.length > 0 && `(${pendingRoleRequests.length})`}
            </button>

            {/* Step 2 Integration: Added responsive navigation panel link targeting specialized founder approvals tab */}
            <button
              className="create-btn"
              style={{
                width: "100%",
                marginBottom: "10px",
                backgroundColor: activeTab === "founderVerification" ? "#2563eb" : ""
              }}
              onClick={() => setActiveTab("founderVerification")}
            >
              🏢 Founder Verifications
              {pendingFounders.length > 0 && ` (${pendingFounders.length})`}
            </button>

            {/* Added Sidebar Navigation control options tracking Investor verification tabs */}
            <button
              className="create-btn"
              style={{
                width: "100%",
                marginBottom: "10px",
                backgroundColor: activeTab === "investorVerification" ? "#2563eb" : ""
              }}
              onClick={() => setActiveTab("investorVerification")}
            >
              💰 Investor Verifications
              {pendingInvestors.length > 0 && ` (${pendingInvestors.length})`}
            </button>

            {/* Added Sidebar Navigation control options tracking Freelancer verification tabs */}
            <button
              className="create-btn"
              style={{
                width: "100%",
                marginBottom: "10px",
                backgroundColor: activeTab === "freelancerVerification" ? "#2563eb" : ""
              }}
              onClick={() => setActiveTab("freelancerVerification")}
            >
              👨‍💻 Freelancer Verifications
              {pendingFreelancers.length > 0 && ` (${pendingFreelancers.length})`}
            </button>

            <button
              className="create-btn"
              style={{
                width: "100%",
                marginBottom: "10px",
                backgroundColor: activeTab === "posts" ? "#2563eb" : ""
              }}
              onClick={() => setActiveTab("posts")}
            >
              📝 Posts
            </button>

            <button
              className="create-btn"
              style={{
                width: "100%",
                marginBottom: "10px",
                backgroundColor: activeTab === "reports" ? "#2563eb" : ""
              }}
              onClick={() => setActiveTab("reports")}
            >
              🚨 Reports
            </button>

            <button
              className="create-btn"
              style={{
                width: "100%",
                marginBottom: "10px",
                backgroundColor: activeTab === "activity" ? "#2563eb" : ""
              }}
              onClick={() => setActiveTab("activity")}
            >
              📜 Activity
            </button>

            {/* Added: Interactive Agreements Management Link directly using useNavigate hook triggers */}
            <button
              className="create-btn"
              onClick={() => navigate("/admin-agreements")}
              style={{
                width: "100%",
                marginBottom: "10px",
                fontWeight: "600"
              }}
            >
              📄 Manage Agreements
            </button>

            {/* Step 5: Wrapped Settings layout option to protect module access routes */}
            {isSuperAdmin && (
              <button
                className="create-btn"
                style={{
                  width: "100%",
                  marginTop: "10px",
                  backgroundColor: activeTab === "settings" ? "#2563eb" : ""
                }}
                onClick={() => setActiveTab("settings")}
              >
                ⚙ Settings
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Context Right Content Container Box Segment */}
        <div style={{ flex: 1 }}>

          {/* Injected Back and Refresh dashboard controls row */}
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

          {/* Dynamic Search Workspace Bar */}
          <input
            className="search-box"
            type="text"
            placeholder="Filter users by name, email string, or target structural access level..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "16px",
              boxSizing: "border-box"
            }}
          />

          {/* Dashboard Tab Wrapper Node */}
          {activeTab === "dashboard" && (
            <>
              {/* Upgraded Platform Summary Analytics Extended Matrix Card */}
              <div 
                className="post-card" 
                style={{ 
                  borderLeft: "5px solid #2563eb", 
                  marginBottom: "25px",
                  background: "#f8fafc" 
                }}
              >
                <h2 style={{ marginTop: 0, color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "12px" }}>
                  Platform Statistics
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "4px 0", color: "#334155" }}>
                  <p style={{ margin: 0 }}><strong>Total Active Accounts:</strong> {users.length}</p>
                  <p style={{ margin: 0 }}><strong>Total Published Posts:</strong> {posts.length}</p>
                  <p style={{ margin: 0 }}><strong>Total Active Comments:</strong> {commentsCount}</p>
                  <p style={{ margin: 0 }}><strong>Total System Notifications:</strong> {notificationsCount}</p>
                  <p style={{ margin: 0 }}><strong>Total Groups:</strong> {groupsCount}</p>
                  <p style={{ margin: 0 }}><strong>Total Messages:</strong> {messagesCount}</p>
                  <p style={{ margin: 0 }}><span style={{ color: "#22c55e" }}>●</span> <strong>Online Users:</strong> {onlineUsersCount}</p>
                  <p style={{ margin: 0 }}><strong>Admins:</strong> {adminsCount}</p>
                  <p style={{ margin: 0 }}><span style={{ color: "#ea580c" }}>🚫</span> <strong>Banned Users:</strong> {bannedUsersCount}</p>
                  <p style={{ margin: 0 }}><span style={{ color: "#ef4444" }}>⚠️</span> <strong>Pending Reports:</strong> {reports.length}</p>
                </div>
              </div>

              {/* Statically Separated Administrators Viewport Board */}
              <h2 style={{
                color: "#334155",
                borderBottom: "2px solid #e2e8f0",
                paddingBottom: "8px",
                marginBottom: "15px",
              }}>
                Admins
              </h2>
              <div style={{ marginBottom: "30px" }}>
                {adminUsers.length > 0 ? (
                  adminUsers.map((admin) => (
                    <div
                      key={admin.id}
                      className="post-card"
                      style={{
                        borderLeft: "5px solid #dc2626",
                        marginBottom: "15px",
                      }}
                    >
                      <h3>
                        👑 {admin.name}
                        {admin.email === SUPER_ADMIN_EMAIL && (
                          <span style={{
                            background: "#dc2626",
                            color: "white",
                            padding: "33px 8px",
                            borderRadius: "12px",
                            marginLeft: "10px",
                            fontSize: "11px",
                          }}>
                            SUPER ADMIN
                          </span>
                        )}
                      </h3>
                      <p style={{ margin: "0 0 4px 0", color: "#64748b" }}>{admin.email}</p>
                      <p style={{ margin: "0 0 4px 0" }}>Role: <strong>{admin.role}</strong></p>
                      <p style={{ margin: 0 }}>
                        Status: {admin.online ? (
                          <span style={{ color: "#22c55e", fontWeight: "bold" }}> Online</span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}> Offline</span>
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#64748b" }}>No administrators found.</p>
                )}
              </div>
            </>
          )}

          {/* Reports Tab Wrapper Node */}
          {activeTab === "reports" && (
            <>
              <h2 style={{ color: "#334155", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "15px" }}>
                Reported Content Feed
              </h2>
              <div style={{ maxHeight: "350px", overflowY: "auto", marginBottom: "30px", paddingRight: "5px" }}>
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <div 
                      key={report.id} 
                      className="post-card" 
                      style={{ borderLeft: "4px solid #ef4444", margin: "10px 0", background: "#fef2f2" }}
                    >
                      <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b" }}>
                        <strong>Flagged By:</strong> {report.reportedBy}
                      </p>
                      <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#64748b" }}>
                        <strong>Post Author:</strong> {report.postOwner}
                      </p>
                      <p style={{ margin: "0 0 15px 0", color: "#1e293b", background: "#ffffff", padding: "10px", borderRadius: "4px", border: "1px solid #fca5a5" }}>
                        {report.content}
                      </p>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleDeletePost(report.postId)}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        >
                          💥 Remove Content
                        </button>
                        <button
                          onClick={() => handleDismissReport(report.id)}
                          style={{
                            backgroundColor: "#64748b",
                            color: "white",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        >
                          ✅ Dismiss Report
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#22c55e", fontSize: "14px", fontWeight: "500" }}>🟢 All reports cleared! The moderation queue is empty.</p>
                )}
              </div>
            </>
          )}

          {/* Posts Tab Wrapper Node */}
          {activeTab === "posts" && (
            <>
              <h2 style={{ color: "#334155", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "15px" }}>
                All Platform Posts
              </h2>
              <div style={{ maxHeight: "350px", overflowY: "auto", marginBottom: "30px", paddingRight: "5px" }}>
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post.id} className="post-card" style={{ borderLeft: "3px solid #64748b", margin: "10px 0" }}>
                      <h4 style={{ margin: "0 0 5px 0", color: "#475569" }}>By: {post.name}</h4>
                      <p style={{ margin: "0 0 12px 0", color: "#1e293b", fontSize: "14px" }}>{post.content}</p>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeletePost(post.id)}
                        style={{
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        🗑️ Delete Post
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#64748b", fontSize: "14px" }}>No platform posts available to manage.</p>
                )}
              </div>
            </>
          )}

          {/* Activity Tab Wrapper Node */}
          {activeTab === "activity" && (
            <>
              <h2 style={{ color: "#334155", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "15px" }}>
                Recent Activity
              </h2>
              <div
                className="post-card"
                style={{
                  maxHeight: "450px",
                  overflowY: "auto",
                  marginBottom: "30px",
                  background: "#1e293b",
                  borderLeft: "5px solid #22c55e",
                  padding: "5px"
                }}
              >
                {activityLogs.length > 0 ? (
                  activityLogs.slice(0, 20).map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #334155",
                      }}
                    >
                      <div style={{ fontWeight: "700", color: "white" }}>
                        {log.action}
                      </div>
                      <div style={{ color: "#94a3b8", marginTop: "4px", fontSize: "13px" }}>
                        Target: {log.target}
                      </div>
                      <div style={{ color: "#60a5fa", marginTop: "4px", fontSize: "13px" }}>
                        By: {log.admin}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#64748b", fontSize: "14px", padding: "10px" }}>No activity logs recorded yet.</p>
                )}
              </div>
            </>
          )}

          {/* Founder Verification Tab Content Segment */}
          {activeTab === "founderVerification" && (
            <>
              <h2 style={{ color: "#334155", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "15px" }}>
                Founder Identity Verification Queue
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {pendingFounders.length > 0 ? (
                  pendingFounders.map((founder) => (
                    <div key={founder.id} className="post-card" style={{ borderLeft: "5px solid #2563eb" }}>
                      <h3 style={{ margin: "0 0 5px 0" }}>🏢 {founder.name}</h3>
                      <p style={{ margin: "0 0 10px 0", color: "#64748b", fontSize: "14px" }}>{founder.email}</p>
                      
                      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                        <button
                          onClick={() => handleVerificationApproval(founder.id, true)}
                          style={{
                            backgroundColor: "#22c55e",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "13px"
                          }}
                        >
                          ✓ Approve Identity
                        </button>
                        <button
                          onClick={() => handleVerificationApproval(founder.id, false)}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "13px"
                          }}
                        >
                          ✕ Reject Request
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#22c55e", fontSize: "14px", fontWeight: "500" }}>
                    🟢 Clean sheet! No founder profiles currently awaiting identity validation checks.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Investor Verification Content Display Loop Area */}
          {activeTab === "investorVerification" && (
            <>
              <h2 style={{ color: "#334155", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "15px" }}>
                Investor Credentials Verification Queue
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {pendingInvestors.length > 0 ? (
                  pendingInvestors.map((investor) => (
                    <div key={investor.id} className="post-card" style={{ borderLeft: "5px solid #10b981" }}>
                      <h3 style={{ margin: "0 0 5px 0" }}>💰 {investor.name}</h3>
                      <p style={{ margin: "0 0 10px 0", color: "#64748b", fontSize: "14px" }}>{investor.email}</p>
                      
                      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                        <button
                          onClick={() => handleVerificationApproval(investor.id, true)}
                          style={{
                            backgroundColor: "#22c55e",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "13px"
                          }}
                        >
                          ✓ Approve Investor
                        </button>
                        <button
                          onClick={() => handleVerificationApproval(investor.id, false)}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "13px"
                          }}
                        >
                          ✕ Reject Investor
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#10b981", fontSize: "14px", fontWeight: "500" }}>
                    🟢 Clean sheet! No investor profiles currently awaiting verification checks.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Freelancer Verification Content Display Loop Area */}
          {activeTab === "freelancerVerification" && (
            <>
              <h2 style={{ color: "#334155", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "15px" }}>
                Freelancer Profile Verification Queue
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {pendingFreelancers.length > 0 ? (
                  pendingFreelancers.map((freelancer) => (
                    <div key={freelancer.id} className="post-card" style={{ borderLeft: "5px solid #a855f7" }}>
                      <h3 style={{ margin: "0 0 5px 0" }}>👨‍💻 {freelancer.name}</h3>
                      <p style={{ margin: "0 0 10px 0", color: "#64748b", fontSize: "14px" }}>{freelancer.email}</p>
                      
                      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                        <button
                          onClick={() => handleVerificationApproval(freelancer.id, true)}
                          style={{
                            backgroundColor: "#22c55e",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "13px"
                          }}
                        >
                          ✓ Approve Freelancer
                        </button>
                        <button
                          onClick={() => handleVerificationApproval(freelancer.id, false)}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "13px"
                          }}
                        >
                          ✕ Reject Freelancer
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#a855f7", fontSize: "14px", fontWeight: "500" }}>
                    🟢 Clean sheet! No freelancer profiles currently awaiting verification checks.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Role Requests Tab Node */}
          {activeTab === "roleRequests" && (
            <>
              <h2 style={{ color: "#334155", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", marginBottom: "15px" }}>
                Pending Role Access Requests
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {pendingRoleRequests.length > 0 ? (
                  pendingRoleRequests.map((user) => (
                    <div key={user.id} className="post-card" style={{ borderLeft: "5px solid #f59e0b" }}>
                      <h3 style={{ margin: "0 0 5px 0" }}>{user.name || "Anonymous Registration"}</h3>
                      <p style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "14px" }}>{user.email}</p>
                      <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#1e293b" }}>
                        Requested Access Allocation Tier: <strong style={{ color: "#d97706" }}>{user.requestedRole || "Freelancer"}</strong>
                      </p>
                      
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleResolveRoleRequest(user, true)}
                          style={{
                            backgroundColor: "#22c55e",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer"
                          }}
                        >
                          ✅ Approve Request
                        </button>
                        <button
                          onClick={() => handleResolveRoleRequest(user, false)}
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "4px",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer"
                          }}
                        >
                          ❌ Reject Request
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#64748b", padding: "15px 0", fontSize: "14px" }}>
                    🎉 No pending signup authorization requests require attention.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Users Tab Wrapper Node */}
          {activeTab === "users" && (
            <>
              <h2 style={{ color: "#334155", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}>User Management</h2>
              
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="post-card"
                    style={{
                      opacity: user.isBanned ? 0.65 : 1,
                      borderRight: user.isBanned ? "6px solid #f59e0b" : "none",
                      transition: "all 0.2s ease-in-out"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div style={{ flexGrow: 1 }}>
                        <h3 style={{ margin: "0 0 5px 0", display: "flex", alignItems: "center" }}>
                          {user.name || "Anonymous User"} 
                          
                          {user.email === SUPER_ADMIN_EMAIL && (
                            <span style={{
                              background: "#dc2626",
                              color: "white",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              marginLeft: "10px",
                              fontWeight: "700"
                            }}>
                              SUPER ADMIN
                            </span>
                          )}

                          {user.isBanned && (
                            <span style={{ 
                              color: "#d97706", 
                              background: "#fef3c7", 
                              fontSize: "12px", 
                              padding: "2px 8px", 
                              borderRadius: "12px", 
                              marginLeft: "10px",
                              fontWeight: "600"
                            }}>
                              Account Suspended
                            </span>
                          )}
                        </h3>
                        <p style={{ margin: "0 0 12px 0", color: "#64748b", fontSize: "14px" }}>{user.email}</p>
                      </div>
                    </div>
                    
                    <div style={{ margin: "12px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                      <label htmlFor={`role-${user.id}`} style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>
                        Assigned Platform Role:
                      </label>
                      <select
                        id={`role-${user.id}`}
                        value={user.role || "Freelancer"}
                        disabled={!isSuperAdmin || user.email === SUPER_ADMIN_EMAIL}
                        onChange={(e) => {
                          if (user.role === "Admin" && !isSuperAdmin) {
                            alert("Admins cannot modify other Admin accounts.");
                            return;
                          }
                          handleRoleChange(user.id, user.email, e.target.value);
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                          backgroundColor: (!isSuperAdmin || user.email === SUPER_ADMIN_EMAIL) ? "#e2e8f0" : "#ffffff",
                          fontSize: "14px",
                          cursor: (!isSuperAdmin || user.email === SUPER_ADMIN_EMAIL) ? "not-allowed" : "pointer",
                          fontWeight: "500"
                        }}
                      >
                        {isSuperAdmin && <option value="Admin">Admin</option>}
                        <option value="Founder">Founder</option>
                        <option value="Investor">Investor</option>
                        <option value="Freelancer">Freelancer</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: "20px", margin: "10px 0", fontSize: "13px", color: "#64748b" }}>
                      <span><strong>Followers Count:</strong> {user.followers?.length || 0}</span>
                      <span><strong>Following Count:</strong> {user.following?.length || 0}</span>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "15px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                      <button
                        disabled={user.email === SUPER_ADMIN_EMAIL}
                        onClick={() => {
                          if (user.email === SUPER_ADMIN_EMAIL) {
                            alert("Super Admin account cannot be suspended.");
                            return;
                          }
                          if (user.role === "Admin" && !isSuperAdmin) {
                            alert("Admin accounts cannot be suspended.");
                            return;
                          }
                          handleBanUser(user.id, user.email, !!user.isBanned);
                        }}
                        style={{
                          backgroundColor: user.isBanned ? "#22c55e" : "#ea580c",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          fontWeight: "600",
                          fontSize: "13px",
                          opacity: user.email === SUPER_ADMIN_EMAIL ? 0.5 : 1,
                          cursor: user.email === SUPER_ADMIN_EMAIL ? "not-allowed" : "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {user.isBanned ? "🔓 Reactivate Account" : "🚫 Suspend User Access"}
                      </button>

                      <button
                        onClick={() => {
                          if (user.email === SUPER_ADMIN_EMAIL || user.role === "Admin") {
                            alert("Super Admin and standard Admin accounts cannot be deleted.");
                            return;
                          }
                          handleDeleteUser(user.id, user.email);
                        }}
                        style={{
                          backgroundColor: "#ef4444",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "13px",
                          marginLeft: "auto"
                        }}
                      >
                        🗑️ Wipe Record Permanently
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "#64748b", padding: "40px 0", background: "#f8fafc", borderRadius: "8px" }}>
                  No account profiles match your search criteria "{searchTerm}"
                </p>
              )}
            </>
          )}

          {/* Settings Tab Wrapper Node */}
          {activeTab === "settings" && isSuperAdmin && (
            <>
              <h2
                style={{
                  color: "#334155",
                  borderBottom: "2px solid #e2e8f0",
                  paddingBottom: "8px",
                  marginBottom: "15px"
                }}
              >
                Platform Settings
              </h2>

              <div className="post-card">
                <h3>Maintenance Mode</h3>
                <button
                  className={maintenanceMode ? "delete-btn" : "create-btn"}
                  onClick={() => saveMaintenanceMode(!maintenanceMode)}
                  style={{
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  {maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
                </button>

                <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #e2e8f0" }} />

                <h3>Registration Access</h3>
                <button
                  className={registrationEnabled ? "delete-btn" : "create-btn"}
                  onClick={() => saveRegistrationStatus(!registrationEnabled)}
                  style={{
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  {registrationEnabled ? "Close Registration" : "Open Registration"}
                </button>
              </div>
            </>
          )}

        {/* Close Layout Wrap Elements */}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;