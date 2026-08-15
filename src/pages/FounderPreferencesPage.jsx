import { useState } from "react";
import { useNavigate } from "react-router-dom";

function FounderPreferencesPage() {
  const navigate = useNavigate();

  const [investmentStage, setInvestmentStage] = useState("");
  const [availability, setAvailability] = useState("");
  const [interests, setInterests] = useState([]);

  const handleInterestChange = (value) => {
    if (interests.includes(value)) {
      setInterests(
        interests.filter((item) => item !== value)
      );
    } else {
      setInterests([...interests, value]);
    }
  };

  const handleComplete = () => {
    if (
      !investmentStage ||
      !availability ||
      interests.length === 0
    ) {
      alert("Please complete all fields");
      return;
    }

    navigate("/signature");
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
          Personalize Your Experience
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          Tell us what you're looking for
        </p>

        <div style={{ marginTop: "25px" }}>
          <label>Preferred Investment Stage</label>

          <select
            value={investmentStage}
            onChange={(e) =>
              setInvestmentStage(e.target.value)
            }
            style={inputStyle}
          >
            <option value="">
              Select Investment Stage
            </option>
            <option value="Seed Stage">
              Seed Stage
            </option>
            <option value="Early Stage">
              Early Stage
            </option>
            <option value="Growth Stage">
              Growth Stage
            </option>
            <option value="Mature Stage">
              Mature Stage
            </option>
          </select>
        </div>

        <div style={{ marginTop: "25px" }}>
          <label>Areas Of Interest</label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3,1fr)",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            {[
              "SaaS",
              "AI",
              "FinTech",
              "Healthcare",
              "E-Commerce",
              "EdTech",
              "Blockchain",
              "CleanTech",
            ].map((item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={interests.includes(item)}
                  onChange={() =>
                    handleInterestChange(item)
                  }
                />{" "}
                {item}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "25px" }}>
          <label>Availability</label>

          <select
            value={availability}
            onChange={(e) =>
              setAvailability(e.target.value)
            }
            style={inputStyle}
          >
            <option value="">
              Select Availability
            </option>
            <option value="Daily">
              Daily
            </option>
            <option value="Weekly">
              Weekly
            </option>
            <option value="Monthly">
              Monthly
            </option>
          </select>
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
            onClick={handleComplete}
            style={completeBtn}
          >
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "10px",
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

const completeBtn = {
  padding: "12px 25px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
};

export default FounderPreferencesPage;