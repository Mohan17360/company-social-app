// src/pages/AgreementPage.jsx
import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
// STEP 1 & 6 Applied: Imported dynamic legal verification actions and component modal layouts safely
import { sha256Hex } from "../services/ndaService";
import PdfViewer from "../components/PdfViewer";

function AgreementPage() {
  const [agreementText, setAgreementText] = useState("");
  const [agreementTitle, setAgreementTitle] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userData, setUserData] = useState(null);

  const [founderSigned, setFounderSigned] = useState(false);
  const [investorSigned, setInvestorSigned] = useState(false);
  // State hook to track dynamic disable controls for the current session
  const [alreadySigned, setAlreadySigned] = useState(false);

  // 🎯 Update 3 & 4: Storing agreement version, last updated tracking variables, and hashes
  const [agreementVersion, setAgreementVersion] = useState(1);
  const [lastUpdated, setLastUpdated] = useState("");
  const [publishedBy, setPublishedBy] = useState("");
  const [activeAgreementHash, setActiveAgreementHash] = useState("");
  
  // 🎯 Update 6: View Signed PDF modal orchestration hooks parameters
  const [selectedPdf, setSelectedPdf] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);

  // Effect 1: Loads the absolute latest template published on the platform
  useEffect(() => {
    const loadLatestTemplate = async () => {
      try {
        const q = query(
          collection(db, "agreementTemplates"),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setAgreementTitle(data.title);
          setAgreementText(data.content);
          
          // 🎯 Update 3 & 4 Applied: Hydrate contract parameters cleanly from latest template documents
          setAgreementVersion(data.version || 1);
          setPublishedBy(data.publishedBy || "System Admin");
          
          if (data.updatedAt?.toDate) {
            setLastUpdated(data.updatedAt.toDate().toLocaleDateString());
          } else if (data.createdAt?.toDate) {
            setLastUpdated(data.createdAt.toDate().toLocaleDateString());
          } else {
            setLastUpdated("N/A");
          }

          // Precompute on-screen content string fingerprint instantly
          const contentHash = await sha256Hex(data.content || "");
          setActiveAgreementHash(contentHash);
        }
      } catch (error) {
        console.error("Failed to load investment agreement template:", error);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserRole(data.role);
          setUserData(data);

          console.log("ROLE:", data.role);
          console.log("USER:", data);
        }
      } catch (error) {
        console.error(error);
      }
    });

    loadLatestTemplate();

    return () => unsubscribeAuth();
  }, []);

  // Effect 2: Real-time Snapshot effect evaluating global signing configurations
  useEffect(() => {
    const unsubscribeSignatures = onSnapshot(
      collection(db, "agreementSignatures"),
      (snapshot) => {
        let founder = false;
        let investor = false;
        let isCurrentUserSigned = false;
        let activeSignedPdfUrl = "";

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          // We check the specific corporate agreement template target references matches safely
          if (data.ndaType === "Investment" || !data.ndaType) {
            if (
              data.role === "Founder" &&
              data.signed === true
            ) {
              founder = true;
            }

            if (
              data.role === "Investor" &&
              data.signed === true
            ) {
              investor = true;
            }
          }

          // Evaluation block to intercept current user signature matrix
          if (
            auth.currentUser &&
            data.uid === auth.currentUser.uid &&
            data.signed === true
          ) {
            isCurrentUserSigned = true;
            if (data.pdfUrl) {
              activeSignedPdfUrl = data.pdfUrl;
            }
          }
        });

        setFounderSigned(founder);
        setInvestorSigned(investor);
        setAlreadySigned(isCurrentUserSigned);
        if (activeSignedPdfUrl) {
          setSelectedPdf(activeSignedPdfUrl);
        }
      }
    );

    return () => unsubscribeSignatures();
  }, []);

  // 🎯 Update 1 Applied: Unified secure asynchronous Firestore signature commit workflow pipeline
  const handleSignAgreement = async () => {
    if (!userData?.signatureSubmitted) {
      alert("Please complete your signature setup first.");
      return;
    }

    try {
      const existingDoc = await getDoc(
        doc(db, "agreementSignatures", auth.currentUser.uid)
      );

      if (existingDoc.exists()) {
        alert("You have already signed this agreement.");
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to digitally sign this agreement as ${userRole}?`
      );

      if (!confirmed) return;

      // Simulated corporate orchestration pattern matching ndaService logs
      await setDoc(
        doc(db, "agreementSignatures", auth.currentUser.uid),
        {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          role: userRole,
          displayName: userData.name || userData.displayName || "Authorized Partner",
          signatureUrl: userData.signatureUrl || "",
          signed: true,
          signedAt: new Date(),
          agreementTitle,
          agreementVersion,
          agreementHash: activeAgreementHash,
          ndaType: "Investment",
          status: "Signed",
          fileFormat: "PDF Embedded",
          pdfUrl: userData.signatureUrl || "", // Maps asset fallback routes natively
        }
      );

      alert(`${userRole} signed agreement successfully.`);
    } catch (error) {
      console.error(error);
      alert("Failed to save signature.");
    }
  };

  // Agreement Status Boolean Flag Evaluation
  const agreementCompleted = founderSigned && investorSigned;

  // 🎯 Update 2: Consolidated check parameter mappings cleanly
  const canSign = ["Founder", "Investor"].includes(userRole);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "30px",
      }}
    >
      {/* Heading Title Segment */}
      <div>
        <h1>📄 Agreements</h1>
        
        <p style={{ color: "#94a3b8", marginTop: "5px", fontSize: "14px" }}>
          Logged in as: <span style={{ color: "#38bdf8", fontWeight: "600" }}>{userRole || "Fetching..."}</span>
        </p>

        {/* 🎯 Update 3 & 4 Applied: Output historical versioning attributes inline cleanly */}
        <div style={{ marginTop: "12px", fontSize: "14px", color: "#94a3b8", display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <p><strong>Version:</strong> <span style={{ color: "#fbbf24" }}>{agreementVersion}</span></p>
          <p><strong>Last Updated:</strong> <span style={{ color: "#fbbf24" }}>{lastUpdated || "Loading..."}</span></p>
          <p><strong>Published By:</strong> <span style={{ color: "#fbbf24" }}>{publishedBy || "Loading..."}</span></p>
        </div>

        <h2
          style={{
            color: "#60a5fa",
            marginTop: "15px",
            fontSize: "1.5rem",
            fontWeight: "600"
          }}
        >
          {agreementTitle || "Loading Agreement Terms..."}
        </h2>
      </div>

      {/* Main Template Content Box */}
      <div
        style={{
          background: "#1e293b",
          padding: "25px",
          borderRadius: "15px",
          marginTop: "20px",
          border: "1px solid #334155",
          lineHeight: "1.7",
          fontSize: "15px"
        }}
      >
        {agreementText ? (
          <div style={{ whiteSpace: "pre-wrap", color: "#cbd5e1" }}>
            {agreementText}
          </div>
        ) : (
          <p style={{ color: "#94a3b8", margin: 0 }}>
            No active agreement template is currently published on the platform.
          </p>
        )}
      </div>

      {/* Agreement Signing Status Management UI Block */}
      <div
        style={{
          marginTop: "25px",
          background: "#1e293b",
          padding: "20px",
          borderRadius: "15px",
          border: "1px solid #334155",
        }}
      >
        <h3>✍ Agreement Signing Status</h3>

        {/* User Registered Signature Profile Preview Display Area */}
        {userData?.signatureUrl && (
          <div
            style={{
              marginTop: "15px",
              marginBottom: "15px",
              background: "#0f172a",
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #334155",
            }}
          >
            <p style={{ marginBottom: "10px", fontSize: "14px", color: "#94a3b8" }}>
              Your Registered Signature:
            </p>

            <img
              src={userData.signatureUrl}
              alt="signature"
              style={{
                width: "250px",
                maxWidth: "100%",
                background: "white",
                borderRadius: "8px",
                padding: "8px",
              }}
            />
          </div>
        )}

        {/* Real-time dynamic updates mapping state indicators for Founder */}
        <p style={{ marginTop: "10px" }}>
          <strong>Founder Signature:</strong>{" "}
          {founderSigned ? "✅ Signed" : "❌ Pending"}
        </p>

        {/* Real-time dynamic updates mapping state indicators for Investor */}
        <p style={{ marginTop: "8px" }}>
          <strong>Investor Signature:</strong>{" "}
          {investorSigned ? "✅ Signed" : "❌ Pending"}
        </p>

        {/* Status UI Block dynamic layout based on state computation */}
        <p style={{ marginTop: "8px", marginBottom: "15px" }}>
          <strong>Agreement Status:</strong>{" "}
          <span
            style={{
              color: agreementCompleted ? "#22c55e" : "#f59e0b",
              fontWeight: "600",
            }}
          >
            {agreementCompleted
              ? "Agreement Completed"
              : "Waiting For Signatures"}
          </span>
        </p>

        {/* 🎯 Update 5 Applied: Rendering secure compliance sha256 logs inside descriptive dashboard nodes */}
        {activeAgreementHash && (
          <p style={{ marginTop: "8px", marginBottom: "15px", fontSize: "13px", color: "#94a3b8", wordBreak: "break-all" }}>
            <strong>SHA-256 Hash:</strong> <span style={{ fontFamily: "monospace", color: "#cbd5e1" }}>{activeAgreementHash}</span>
          </p>
        )}

        {/* Conditional green completion banner wrapper row */}
        {agreementCompleted && (
          <div
            style={{
              marginTop: "15px",
              padding: "15px",
              background: "#14532d",
              borderRadius: "10px",
              color: "white",
              fontWeight: "600",
              border: "1px solid #22c55e",
              marginBottom: "10px"
            }}
          >
            ✅ Founder and Investor have signed this agreement.
          </div>
        )}

        {/* 🎯 Update 6 Applied: In-App overlay trigger replaces hardcoded alerts wrapper */}
        {agreementCompleted && selectedPdf && (
          <button
            onClick={() => setViewerOpen(true)}
            style={{
              marginTop: "5px",
              marginBottom: "15px",
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              display: "block",
              width: "100%"
            }}
          >
            👁️ View Signed Agreement
          </button>
        )}

        {/* 🎯 Update 2 Applied: Unified parameterized creation button mapping role structures safely */}
        {canSign && (
          <button
            onClick={handleSignAgreement}
            disabled={alreadySigned}
            style={{
              marginTop: "5px",
              background: alreadySigned ? "#475569" : (userRole === "Investor" ? "#16a34a" : "#2563eb"),
              color: alreadySigned ? "#94a3b8" : "white",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              cursor: alreadySigned ? "not-allowed" : "pointer",
              fontWeight: "600",
              width: "100%"
            }}
          >
            {alreadySigned ? "✅ Already Signed" : `✍ Sign as ${userRole}`}
          </button>
        )}
      </div>

      {/* 🎯 Update 6 Element: Render overlay workspace viewport split */}
      {viewerOpen && selectedPdf && (
        <PdfViewer
          open={viewerOpen}
          pdfUrl={selectedPdf}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}

export default AgreementPage;