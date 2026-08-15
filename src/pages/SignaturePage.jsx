// src/pages/SignaturePage.jsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// Updated imports to safely pull document transaction and read tracking primitives
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function SignaturePage() {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const navigate = useNavigate();

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );

    setDrawing(true);
  };

  const draw = (e) => {
    if (!drawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";

    ctx.lineTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );

    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  // Replaced entire logic payload to pipeline raw graphics directly to Cloudinary
  const saveSignature = async () => {
    try {
      const canvas = canvasRef.current;

      const image = canvas.toDataURL("image/png");

      const blob = await (await fetch(image)).blob();

      const formData = new FormData();
      formData.append("file", blob, "signature.png");
      formData.append("upload_preset", "companysocial");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/doocnue5h/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Signature URL:", data.secure_url);

      // Injected Firestore transactional state updater path securely mapping payload URLs
      if (auth.currentUser?.uid) {
        await updateDoc(
          doc(db, "users", auth.currentUser.uid),
          {
            signatureUrl: data.secure_url,
            signatureSubmitted: true,
            signatureSubmittedAt: new Date(),
          }
        );

        // Dynamic Role-Based Router Assignment Redirection Pipeline
        const userDocSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        const role = userDocSnap.exists() ? userDocSnap.data().role : null;

        alert("Signature Uploaded and Processed Successfully");

        if (role === "Founder") {
          navigate("/founder-dashboard");
        } else if (role === "Investor") {
          navigate("/investor-dashboard");
        } else if (role === "Freelancer") {
          navigate("/freelancer-dashboard");
        } else {
          navigate("/feed");
        }
      } else {
        alert("User session not found. Please log in again.");
      }
    } catch (error) {
      console.error(error);
      alert("Upload Failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          padding: "30px",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "900px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          Digital Signature
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            marginBottom: "20px",
          }}
        >
          Draw your signature below
        </p>

        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            width: "100%",
            background: "#334155",
            borderRadius: "12px",
            border: "2px solid #475569",
            cursor: "crosshair",
          }}
        />

        <div
          style={{
            display: "flex",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={clearSignature}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "10px",
              background: "#ef4444",
              color: "white",
              cursor: "pointer",
            }}
          >
            Clear
          </button>

          <button
            onClick={saveSignature}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "10px",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
            }}
          >
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignaturePage;