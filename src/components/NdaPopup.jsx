import { useState, useEffect, useRef, useCallback } from "react";

function NdaPopup({
  open,
  onClose,
  agreement,
  signatureUrl,
  onAccept,
  loading,
  // Enterprise extensions (all optional — existing callers keep working)
  requiredVersion,
  upgradeRequired,
  ndaType,
  onDecline,
}) {
  const [readChecked, setReadChecked] = useState(false);
  const [agreeChecked, setAgreeChecked] = useState(false);
  // Legal review enforcement: the accept path stays locked until the
  // viewer has scrolled the agreement to the end (auto-unlocks when the
  // content fits without scrolling).
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollRef = useRef(null);

  // 🔥 PHASE 1 Applied: Added specific telemetry state trackers for real-time document delivery
  const [downloadUrl, setDownloadUrl] = useState("");
  const [success, setSuccess] = useState(false);
  const [statusText, setStatusText] = useState("");

  const evaluateScrollPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) {
      setScrolledToEnd(true);
    }
  }, []);

  useEffect(() => {
    if (open) {
      // Content shorter than the viewport needs no scrolling.
      const id = requestAnimationFrame(evaluateScrollPosition);
      return () => cancelAnimationFrame(id);
    }
  }, [open, agreement?.content, evaluateScrollPosition]);

  if (!open) return null;

  const effectiveVersion = requiredVersion || agreement?.version || 1;

  const effectiveDate = agreement?.updatedAt?.toDate
    ? agreement.updatedAt.toDate().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const canAccept =
    readChecked &&
    agreeChecked &&
    scrolledToEnd &&
    signatureUrl;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "900px",
          maxWidth: "95%",
          maxHeight: "90vh",
          overflow: "hidden",
          background: "#1e293b",
          borderRadius: "16px",
          border: "1px solid #334155",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}

        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #334155",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h2 style={{ margin: 0 }}>
              🔒 Non-Disclosure Agreement
            </h2>

            <div style={{ display: "flex", gap: "8px" }}>
              {ndaType && (
                <span
                  style={{
                    background: "#2563eb",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {ndaType} NDA
                </span>
              )}
              <span
                style={{
                  background: "#334155",
                  color: "#cbd5e1",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                Version {effectiveVersion}
              </span>
            </div>
          </div>

          <p
            style={{
              color: "#94a3b8",
              marginTop: "10px",
            }}
          >
            Please review this agreement before accessing
            confidential content.
            {effectiveDate && ` Effective: ${effectiveDate}.`}
          </p>

          {upgradeRequired && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                background: "#78350f",
                border: "1px solid #f59e0b",
                borderRadius: "10px",
                color: "#fde68a",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              ⚠️ This agreement has been updated since you last accepted
              it. You must review and accept version {effectiveVersion} to
              regain access.
            </div>
          )}
        </div>

        {/* Agreement */}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
          }}
          ref={scrollRef}
          onScroll={evaluateScrollPosition}
        >
          <h3>
            {agreement?.title || "Agreement"}
          </h3>

          <div
            style={{
              marginTop: "15px",
              whiteSpace: "pre-wrap",
              lineHeight: "1.8",
              color: "#cbd5e1",
            }}
          >
            {agreement?.content ||
              "Agreement content is currently unavailable. Please try again later."}
          </div>

          {!scrolledToEnd && (
            <div
              style={{
                marginTop: "15px",
                color: "#f59e0b",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              ↓ Scroll to the end of the agreement to enable acceptance.
            </div>
          )}

          <hr
            style={{
              margin: "25px 0",
              borderColor: "#334155",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "12px",
            }}
          >
            <input
              type="checkbox"
              checked={readChecked}
              onChange={(e) =>
                setReadChecked(e.target.checked)
              }
            />

            {" "}I have read the agreement.
          </label>

          <label
            style={{
              display: "block",
              marginBottom: "20px",
            }}
          >
            <input
              type="checkbox"
              checked={agreeChecked}
              onChange={(e) =>
                setAgreeChecked(e.target.checked)
              }
            />

            {" "}I legally agree to all terms.
          </label>

          <h4>Digital Signature</h4>

          {signatureUrl ? (
            <img
              src={signatureUrl}
              alt="Signature"
              style={{
                width: "250px",
                background: "white",
                padding: "10px",
                borderRadius: "10px",
              }}
            />
          ) : (
            <div
              style={{
                color: "#ef4444",
                fontWeight: "bold",
              }}
            >
              No Digital Signature Found
            </div>
          )}

          {/* 🔥 PHASE 3 Applied: Embedded success log layer capturing dynamic digital agreement downloads */}
          {success && (
            <div
              style={{
                marginTop: 25,
                padding: 15,
                background: "#14532d",
                borderRadius: 10,
                border: "1px solid #22c55e",
              }}
            >
              <div
                style={{
                  color: "#4ade80",
                  fontWeight: 700,
                }}
              >
                ✅ Agreement Successfully Signed
              </div>

              <div
                style={{
                  color: "#d1fae5",
                  marginTop: 10,
                }}
              >
                Your digital agreement has been securely stored.
              </div>

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 15,
                    padding: "10px 18px",
                    background: "#2563eb",
                    color: "#fff",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  📄 Download Signed Agreement
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            padding: "20px",
            borderTop: "1px solid #334155",
          }}
        >
          <div
            style={{
              margin: 0,
              marginRight: "auto",
              alignSelf: "center",
              maxWidth: "420px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              By accepting, you enter a legally binding agreement. Your
              acceptance, signature, agreement version and timestamp are
              recorded for audit purposes.
            </p>

            {/* 🔥 PHASE 5 Applied: Injected real-time dynamic text descriptors beneath legal notifications */}
            {loading && (
              <div
                style={{
                  color: "#38bdf8",
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                {statusText || "Generating Agreement..."}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (onDecline) onDecline();
              onClose();
            }}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          {/* 🔥 PHASE 2 & 4 Applied: Upgraded asynchronous submission event bindings and updated textual loader status indicators */}
          <button
            disabled={!canAccept || loading}
            onClick={async () => {
              try {
                setStatusText("Generating signed agreement...");
                const result = await onAccept();
                if (result?.status === "accepted") {
                  setDownloadUrl(result.pdfUrl || "");
                  setSuccess(true);
                  setStatusText("Agreement successfully signed.");
                }
              } catch (err) {
                console.error(err);
                setStatusText("Failed to complete agreement.");
              }
            }}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: canAccept ? "pointer" : "not-allowed",
              background: canAccept
                ? "#16a34a"
                : "#475569",
              color: "white",
              fontWeight: "600",
            }}
          >
            {loading
              ? statusText || "Generating Agreement..."
              : `Accept NDA (v${effectiveVersion})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NdaPopup;