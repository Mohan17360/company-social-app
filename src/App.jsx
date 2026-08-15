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
import GroupsPage from "./pages/GroupsPage";
import GroupChatPage from "./pages/GroupChatPage";
import MaintenanceGuard from "./components/MaintenanceGuard";
import SearchPage from "./pages/SearchPage";
import AgreementPage from "./pages/AgreementPage";
import FounderVerificationPage from "./pages/FounderVerificationPage";
import InvestorVerificationPage from "./pages/InvestorVerificationPage";
import FreelancerVerificationPage from "./pages/FreelancerVerificationPage";
import AdminAgreementPage from "./pages/AdminAgreementPage";
import FounderDashboard from "./pages/FounderDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import SignaturePage from "./pages/SignaturePage";

import FounderIdentityPage from "./pages/FounderIdentityPage";
import FounderPreferencesPage from "./pages/FounderPreferencesPage";
import FoundersPage from "./pages/FoundersPage";
import InvestorsPage from "./pages/InvestorsPage";
import InvestorIdentityPage  from "./pages/InvestorIdentityPage";
import InvestorPreferencesPage from "./pages/InvestorPreferencesPage";
import MeetingPage from "./pages/MeetingPage";
import DataRoomPage from "./pages/DataRoomPage";

import ProtectedRoute from "./components/ProtectedRoute";

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
        <Route path="/group/:groupId" element={<GroupChatPage />} />

        {/* Secured Administrative Endpoints */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-agreements"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <AdminAgreementPage />
            </ProtectedRoute>
          }
        />

        {/* STEP 6 Applied: Secured Role Verification Pipelines */}
        <Route
          path="/founder-verification"
          element={
            <ProtectedRoute roles={["Founder"]}>
              <FounderVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investor-verification"
          element={
            <ProtectedRoute roles={["Investor"]}>
              <InvestorVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/freelancer-verification"
          element={
            <ProtectedRoute roles={["Freelancer"]}>
              <FreelancerVerificationPage />
            </ProtectedRoute>
          }
        />

        {/* STEP 7 Applied: Secured Role Identity & Customization Flow Configurations */}
        <Route
          path="/founder-identity"
          element={
            <ProtectedRoute roles={["Founder"]}>
              <FounderIdentityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/founder-preferences"
          element={
            <ProtectedRoute roles={["Founder"]}>
              <FounderPreferencesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investor-identity"
          element={
            <ProtectedRoute roles={["Investor"]}>
              <InvestorIdentityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investor-preferences"
          element={
            <ProtectedRoute roles={["Investor"]}>
              <InvestorPreferencesPage />
            </ProtectedRoute>
          }
        />

        {/* STEP 4 Applied: Secured Dedicated Digital Signature Pad Page */}
        <Route
          path="/signature"
          element={
            <ProtectedRoute roles={["Founder", "Investor", "Freelancer"]}>
              <SignaturePage />
            </ProtectedRoute>
          }
        />

        {/* Secured Core Ecosystem Dashboard Enclaves */}
        <Route
          path="/founder-dashboard"
          element={
            <ProtectedRoute roles={["Founder"]}>
              <FounderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/investor-dashboard"
          element={
            <ProtectedRoute roles={["Investor"]}>
              <InvestorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/freelancer-dashboard"
          element={
            <ProtectedRoute roles={["Freelancer"]}>
              <FreelancerDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Maintenance Protected Functional Core App Routes */}
        <Route path="/feed" element={<MaintenanceGuard><FeedPage /></MaintenanceGuard>} />
        <Route path="/profile" element={<MaintenanceGuard><ProfilePage /></MaintenanceGuard>} />
        <Route path="/notifications" element={<MaintenanceGuard><NotificationsPage /></MaintenanceGuard>} />
        <Route path="/saved" element={<MaintenanceGuard><SavedPostsPage /></MaintenanceGuard>} />
        <Route path="/chat" element={<MaintenanceGuard><ChatPage /></MaintenanceGuard>} />
        <Route path="/groups" element={<MaintenanceGuard><GroupsPage /></MaintenanceGuard>} />
        <Route path="/search" element={<MaintenanceGuard><SearchPage /></MaintenanceGuard>} />
        
        {/* STEP 5 Applied: Secured User Signature Registry View Sheet */}
        <Route
          path="/agreements"
          element={
            <ProtectedRoute roles={["Founder", "Investor", "Freelancer"]}>
              <AgreementPage />
            </ProtectedRoute>
          }
        />

        <Route path="/investors" element={<MaintenanceGuard><InvestorsPage /></MaintenanceGuard>} />
        <Route path="/founders" element={<MaintenanceGuard><FoundersPage /></MaintenanceGuard>} />
        <Route
          path="/data-room"
          element={
            <ProtectedRoute roles={["Founder", "Investor", "Freelancer", "Admin"]}>
              <DataRoomPage />
            </ProtectedRoute>
          }
        />
        
        {/* STEP 8 Applied: Secured Core Meeting Workflow Gateways */}
        <Route
          path="/meetings"
          element={
            <ProtectedRoute roles={["Founder", "Investor"]}>
              <MeetingPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
