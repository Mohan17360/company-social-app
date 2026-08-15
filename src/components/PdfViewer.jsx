import { useState } from "react";

function PdfViewer({
  open,
  pdfUrl,
  onClose,
}) {
  const [zoom, setZoom] = useState(100);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.82)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "95%",
          height: "95%",
          background: "#111827",
          borderRadius: 15,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}

        <div
          style={{
            background: "#1e293b",
            padding: 15,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              marginRight: "auto",
            }}
          >
            📄 Agreement Viewer
          </h3>

          <button
            onClick={() =>
              setZoom((z) => Math.max(50, z - 10))
            }
          >
            ➖
          </button>

          <span>{zoom}%</span>

          <button
            onClick={() =>
              setZoom((z) => Math.min(200, z + 10))
            }
          >
            ➕
          </button>

          <a
            href={pdfUrl}
            download
            style={{
              padding: "8px 14px",
              background: "#16a34a",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            ⬇ Download
          </a>

          <button
            onClick={() => window.open(pdfUrl)}
          >
            ↗ Open
          </button>

          <button
            onClick={() => window.print()}
          >
            🖨 Print
          </button>

          <button
            onClick={onClose}
            style={{
              background: "#dc2626",
              color: "#fff",
            }}
          >
            ✕
          </button>
        </div>

        {/* PDF */}

        <div
          style={{
            flex: 1,
            background: "#374151",
          }}
        >
          <iframe
            src={pdfUrl}
            title="Agreement PDF"
            style={{
              width: `${zoom}%`,
              height: "100%",
              border: "none",
              display: "block",
              margin: "auto",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default PdfViewer;