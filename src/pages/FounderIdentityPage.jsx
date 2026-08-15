import { useState } from "react";
import { useNavigate } from "react-router-dom";

function FounderIdentityPage() {
  const navigate = useNavigate();

  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentFile, setDocumentFile] = useState(null);

  const handleContinue = () => {
    if (
      !documentType ||
      !documentNumber ||
      !documentFile
    ) {
      alert("Please complete all fields");
      return;
    }

    navigate("/founder-preferences");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "40px",
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
          Verify Your Identity
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          We need to verify your identity
        </p>

        <div style={{ marginTop: "25px" }}>
          <label>
            <input
              type="radio"
              name="doc"
              value="Aadhaar"
              onChange={(e) =>
                setDocumentType(e.target.value)
              }
            />
            Aadhaar Card
          </label>

          <br />
          <br />

          <label>
            <input
              type="radio"
              name="doc"
              value="PAN"
              onChange={(e) =>
                setDocumentType(e.target.value)
              }
            />
            PAN Card
          </label>
        </div>

        <input
          type="text"
          placeholder="Document Number"
          value={documentNumber}
          onChange={(e) =>
            setDocumentNumber(e.target.value)
          }
          style={inputStyle}
        />

        <div style={{ marginTop: "20px" }}>
          <input
            type="file"
            onChange={(e) =>
              setDocumentFile(e.target.files[0])
            }
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "30px",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={backBtn}
          >
            Back
          </button>

          <button
            onClick={handleContinue}
            style={continueBtn}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "20px",
  borderRadius: "10px",
  border: "none",
  background: "#334155",
  color: "white",
  boxSizing: "border-box",
};

const backBtn = {
  padding: "12px 25px",
  background: "#475569",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
};

const continueBtn = {
  padding: "12px 25px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
};

export default FounderIdentityPage;