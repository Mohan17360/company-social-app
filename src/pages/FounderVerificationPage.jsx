// src/pages/FounderVerificationPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// Mapped transitional query actions to communicate directly with Firestore collections
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function FounderVerificationPage() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [startupName, setStartupName] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [description, setDescription] = useState("");

  // Added file submission states tracking parameters
  const [certificate, setCertificate] = useState(null);
  const [pitchDeck, setPitchDeck] = useState(null);

  // Recommended Better Validation pipeline block mapped inline with Cloudinary dual-stream uploads
  const handleSubmit = async () => {
    if (
      !companyName ||
      !startupName ||
      !website ||
      !linkedin ||
      !description ||
      !certificate ||
      !pitchDeck
    ) {
      alert("Please complete all verification details.");
      return;
    }

    try {
      // Replaced old logic with a modular asset multi-part pipeline helper targeting raw attachments
      const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "companysocial");

        // Cloudinary handles PDFs/Docs gracefully under the generic auto path
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/doocnue5h/auto/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        return data.secure_url;
      };

      // Sequentially resolving separate document upload targets
      const certificateUrl = await uploadFile(certificate);
      const pitchDeckUrl = await uploadFile(pitchDeck);

      // Final mutation update passing exact storage reference string endpoints directly
      await updateDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          companyName,
          startupName,
          website,
          linkedin,
          description,
          certificateUrl,
          pitchDeckUrl,
          verificationSubmitted: true,
          verificationStatus: "Pending",
        }
      );

      navigate("/founder-identity");
    } catch (error) {
      console.error("Failed to sync structural verification fields:", error);
      alert(error.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        padding: "40px",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#1e293b",
          padding: "30px",
          borderRadius: "20px",
        }}
      >
        <h1 style={{ textAlign: "center" }}>
          Founder Verification
        </h1>

        <input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Startup Name"
          value={startupName}
          onChange={(e) => setStartupName(e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="LinkedIn"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Business Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            ...inputStyle,
            height: "120px",
          }}
        />

        <div style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Upload Business Certificate</label>
          <input
            type="file"
            onChange={(e) => setCertificate(e.target.files[0] || null)}
            style={{ color: "#94a3b8" }}
          />
          {certificate && <span style={{ fontSize: "12px", color: "#22c55e", display: "block", marginTop: "4px" }}>✓ {certificate.name}</span>}
        </div>

        <div style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Upload Pitch Deck</label>
          <input
            type="file"
            onChange={(e) => setPitchDeck(e.target.files[0] || null)}
            style={{ color: "#94a3b8" }}
          />
          {pitchDeck && <span style={{ fontSize: "12px", color: "#22c55e", display: "block", marginTop: "4px" }}>✓ {pitchDeck.name}</span>}
        </div>

        <button
          onClick={handleSubmit}
          style={{
            marginTop: "25px",
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "10px",
            background: "#2563eb",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Submit Verification
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "15px",
  borderRadius: "10px",
  border: "none",
  background: "#334155",
  color: "white",
  boxSizing: "border-box",
};

export default FounderVerificationPage;