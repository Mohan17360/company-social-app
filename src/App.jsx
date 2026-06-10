import { useEffect } from "react"; // Added useEffect import
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth"; // Added onAuthStateChanged import
import { doc, updateDoc } from "firebase/firestore"; // Added doc and updateDoc imports
import { auth, db } from "./firebase"; // Added auth and db imports

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

function App() {
  // Added global presence observer effect inside the main App component shell
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
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/saved" element={<SavedPostsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:userId" element={<ChatRoomPage />} />
        <Route path="/user/:uid" element={<UserProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/groups" element={<GroupsPage/>} />
        <Route path="/group/:groupId" element={<GroupChatPage/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
