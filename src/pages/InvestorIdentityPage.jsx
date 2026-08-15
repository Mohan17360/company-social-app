// src/pages/InvestorIdentityPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function InvestorIdentityPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  const handleContinue = async () => {
    if (
      !fullName ||
      !designation ||
      !experience ||
      !location ||
      !bio
    ) {
      alert("Please complete all fields.");
      return;
    }

    try {
      await updateDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          fullName,
          designation,
          experience,
          location,
          bio,
        }
      );

      navigate("/investor-preferences");
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
          Investor Identity
        </h1>

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) =>
            setFullName(e.target.value)
          }
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Designation"
          value={designation}
          onChange={(e) =>
            setDesignation(e.target.value)
          }
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Years Of Experience"
          value={experience}
          onChange={(e) =>
            setExperience(e.target.value)
          }
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) =>
            setLocation(e.target.value)
          }
          style={inputStyle}
        />

        <textarea
          placeholder="Investor Bio"
          value={bio}
          onChange={(e) =>
            setBio(e.target.value)
          }
          style={{
            ...inputStyle,
            height: "120px",
          }}
        />

        <button
          onClick={handleContinue}
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
          Continue
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

export default InvestorIdentityPage;