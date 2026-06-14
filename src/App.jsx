// src/App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminPage from "./pages/AdminPage";
import SavedPostsPage from "./pages/SavedPostsPage";
import UserProfilePage from "./pages/UserProfilePage";
import ChatPage from "./pages/ChatPage";
import ChatRoomPage from "./pages/ChatRoomPage";
import GroupsPage from "./pages/GroupsPage";
import GroupChatPage from "./pages/GroupChatPage";
import MaintenanceGuard from "./components/MaintenanceGuard";

function App() {
  // Global presence observer effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          await updateDoc(
            doc(db, "users", user.uid),
            {
              online: true,
            }
          );
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Unprotected Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/user/:uid" element={<UserProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/group/:groupId" element={<GroupChatPage />} />
        
        {/* Maintenance Protected Routes */}
        <Route path="/feed" element={<MaintenanceGuard><FeedPage /></MaintenanceGuard>} />
        <Route path="/profile" element={<MaintenanceGuard><ProfilePage /></MaintenanceGuard>} />
        <Route path="/notifications" element={<MaintenanceGuard><NotificationsPage /></MaintenanceGuard>} />
        <Route path="/saved" element={<MaintenanceGuard><SavedPostsPage /></MaintenanceGuard>} />
        <Route path="/chat" element={<MaintenanceGuard><ChatPage /></MaintenanceGuard>} />
        <Route path="/chat/:userId" element={<MaintenanceGuard><ChatRoomPage /></MaintenanceGuard>} />
        <Route path="/groups" element={<MaintenanceGuard><GroupsPage /></MaintenanceGuard>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;