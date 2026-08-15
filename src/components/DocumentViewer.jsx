// src/components/DocumentViewer.jsx
import { useEffect, useRef, useState, useCallback } from "react";

function DocumentViewer({ document, room, onClose, onDownload }) {
  const openedAt = useRef(0);
  const closed = useRef(false);
  const isImage = document.mimeType?.startsWith("image/");
  const isPdf = document.mimeType === "application/pdf" || document.name?.toLowerCase().endsWith(".pdf");
  const officePreview = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(document.fileUrl)}`;

  // Telemetry state tracking variable for view scaling
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    openedAt.current = Date.now();
    return () => {
      if (!closed.current) onClose(Math.round((Date.now() - openedAt.current) / 1000));
    };
  }, [onClose]);

  // ✅ Step 1 Applied: Wrapped closeViewer in useCallback to enforce render safety rules
  const closeViewer = useCallback(() => {
    closed.current = true;
    onClose(Math.round((Date.now() - openedAt.current) / 1000));
  }, [onClose]);

  // ✅ Step 2 Applied: Linked closeViewer directly inside the escape listener dependency mapping arrays safely
  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") {
        closeViewer();
      }
    };

    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [closeViewer]);

  const downloadDocument = async () => {
    await onDownload();
    const link = window.document.createElement("a");
    link.href = document.fileUrl;
    link.download = document.name;
    link.rel = "noreferrer";
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`Preview ${document.name}`}>
      <div className="vdr-viewer" style={{ position: "relative", display: "flex", flexDirection: "column" }}>
        
        <div className="vdr-viewer-header">
          <div><strong>{document.name}</strong><span>{room.title}</span></div>
          <button onClick={closeViewer}>Close</button>
        </div>

        {/* Embedded modular zoom layout manager controller */}
        <div 
          className="viewer-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 15px",
            background: "#1e293b",
            borderBottom: "1px solid #334155",
            color: "white"
          }}
        >
          <button 
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            style={{ padding: "4px 10px", cursor: "pointer", background: "#334155", border: "none", color: "white", borderRadius: "4px" }}
          >
            −
          </button>
          <span style={{ minWidth: "45px", textAlign: "center", fontSize: "14px" }}>{zoom}%</span>
          <button 
            onClick={() => setZoom((z) => Math.min(300, z + 10))}
            style={{ padding: "4px 10px", cursor: "pointer", background: "#334155", border: "none", color: "white", borderRadius: "4px" }}
          >
            +
          </button>
          <button 
            onClick={() => setZoom(100)}
            style={{ padding: "4px 12px", cursor: "pointer", background: "#2563eb", border: "none", color: "white", borderRadius: "4px", marginLeft: "8px", fontWeight: "600" }}
          >
            Reset
          </button>
        </div>

        <div className="vdr-preview" style={{ position: "relative", overflow: "auto", flex: 1, minHeight: "350px", background: "#0f172a" }}>
          
          {/* Embedded absolute protection watermark sheet inside tracking layouts context */}
          <div 
            className="viewer-watermark"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-30deg)",
              fontSize: "48px",
              fontWeight: "bold",
              opacity: 0.08,
              pointerEvents: "none",
              userSelect: "none",
              textAlign: "center",
              color: "white",
              zIndex: 10
            }}
          >
            CONFIDENTIAL
            <br />
            Company Social Platform
            <br />
            {new Date().toLocaleDateString()}
          </div>

          {/* Linked transform scaling attributes and absolute piracy lockouts down inside img hooks */}
          {isImage ? (
            <img 
              src={document.fileUrl} 
              alt={document.name} 
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                transition: "0.2s",
                maxWidth: "100%",
                display: "block",
                margin: "0 auto"
              }}
            />
          ) : (
            <iframe 
              title={document.name} 
              src={isPdf ? document.fileUrl : officePreview} 
              style={{
                width: "100%",
                height: "100%",
                minHeight: "500px",
                border: "none",
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
                transition: "0.2s"
              }}
            />
          )}
        </div>

        {/* Render immutable structural data properties parameters display shelf */}
        <div 
          className="viewer-info"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            padding: "15px",
            background: "#1e293b",
            borderTop: "1px solid #334155",
            fontSize: "13px",
            color: "#cbd5e1"
          }}
        >
          <p style={{ margin: 0 }}><strong>Category:</strong> {document.category || "General"}</p>
          <p style={{ margin: 0 }}><strong>Folder:</strong> {document.folder || "General"}</p>
          <p style={{ margin: 0 }}><strong>Version:</strong> {document.version || 1}</p>
          <p style={{ margin: 0 }}><strong>Download:</strong> {document.downloadAllowed ? "Allowed" : "View Only"}</p>
          <p style={{ margin: 0 }}><strong>Status:</strong> <span style={{ color: "#10b981", fontWeight: "bold" }}>{document.status || "ACTIVE"}</span></p>
        </div>

        <div className="vdr-viewer-footer">
          <a href={document.fileUrl} target="_blank" rel="noreferrer">Open in new tab</a>
          {document.downloadAllowed && <button onClick={downloadDocument}>Download</button>}
          {!document.downloadAllowed && <span>View only — downloads are disabled by the owner.</span>}
        </div>

      </div>
    </div>
  );
}

export default DocumentViewer;