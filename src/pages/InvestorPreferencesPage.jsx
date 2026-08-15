import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function InvestorPreferencesPage() {
  const navigate = useNavigate();

  const [investmentRange, setInvestmentRange] =
    useState("");

  const [preferredStage, setPreferredStage] =
    useState("");

  const [industries, setIndustries] =
    useState("");

  const [meetingMode, setMeetingMode] =
    useState("");

  const handleFinish = async () => {
    if (
      !investmentRange ||
      !preferredStage ||
      !industries ||
      !meetingMode
    ) {
      alert("Please complete all fields.");
      return;
    }

    try {
      await updateDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          investmentRange,
          preferredStage,
          industries,
          meetingMode,
        }
      );

      navigate("/signature");
    } catch (error) {
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
          Investor Preferences
        </h1>

        <select
          value={investmentRange}
          onChange={(e) =>
            setInvestmentRange(e.target.value)
          }
          style={inputStyle}
        >
          <option value="">
            Select Investment Range
          </option>
          <option>₹1L - ₹10L</option>
          <option>₹10L - ₹50L</option>
          <option>₹50L - ₹5Cr</option>
          <option>₹5Cr+</option>
        </select>

        <select
          value={preferredStage}
          onChange={(e) =>
            setPreferredStage(e.target.value)
          }
          style={inputStyle}
        >
          <option value="">
            Preferred Startup Stage
          </option>
          <option>Idea Stage</option>
          <option>MVP Stage</option>
          <option>Seed Stage</option>
          <option>Growth Stage</option>
        </select>

        <input
          type="text"
          placeholder="Industries Of Interest"
          value={industries}
          onChange={(e) =>
            setIndustries(e.target.value)
          }
          style={inputStyle}
        />

        <select
          value={meetingMode}
          onChange={(e) =>
            setMeetingMode(e.target.value)
          }
          style={inputStyle}
        >
          <option value="">
            Preferred Meeting Mode
          </option>
          <option>Online</option>
          <option>Offline</option>
          <option>Both</option>
        </select>

        <button
          onClick={handleFinish}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "14px",
            border: "none",
            borderRadius: "10px",
            background: "#2563eb",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Continue To Signature
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

export default InvestorPreferencesPage;