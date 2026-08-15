// src/pages/InvestorVerificationPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function InvestorVerificationPage() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [investmentFirm, setInvestmentFirm] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [investmentFocus, setInvestmentFocus] = useState("");

  const [certificate, setCertificate] = useState(null);
  const [portfolio, setPortfolio] = useState(null);

  const handleSubmit = async () => {
    if (
      !companyName ||
      !investmentFirm ||
      !website ||
      !linkedin ||
      !investmentFocus ||
      !certificate ||
      !portfolio
    ) {
      alert("Please complete all verification details.");
      return;
    }

    try {
      const uploadFile = async (file) => {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("upload_preset", "companysocial");

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

      const certificateUrl = await uploadFile(certificate);
      const portfolioUrl = await uploadFile(portfolio);

      await updateDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          companyName,
          investmentFirm,
          website,
          linkedin,
          investmentFocus,
          certificateUrl,
          portfolioUrl,

          verificationSubmitted: true,
          verificationStatus: "Pending",
        }
      );

      navigate("/investor-identity");
    } catch (error) {
      console.error(error);
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
          Investor Verification
        </h1>

        <input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) =>
            setCompanyName(e.target.value)
          }
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Investment Firm"
          value={investmentFirm}
          onChange={(e) =>
            setInvestmentFirm(e.target.value)
          }
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Website"
          value={website}
          onChange={(e) =>
            setWebsite(e.target.value)
          }
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="LinkedIn"
          value={linkedin}
          onChange={(e) =>
            setLinkedin(e.target.value)
          }
          style={inputStyle}
        />

        <textarea
          placeholder="Investment Focus"
          value={investmentFocus}
          onChange={(e) =>
            setInvestmentFocus(e.target.value)
          }
          style={{
            ...inputStyle,
            height: "120px",
          }}
        />

        <div style={{ marginTop: "15px" }}>
          <label>
            Upload Registration Certificate
          </label>

          <input
            type="file"
            onChange={(e) =>
              setCertificate(
                e.target.files[0] || null
              )
            }
          />
        </div>

        <div style={{ marginTop: "15px" }}>
          <label>
            Upload Portfolio Document
          </label>

          <input
            type="file"
            onChange={(e) =>
              setPortfolio(
                e.target.files[0] || null
              )
            }
          />
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

export default InvestorVerificationPage;