// src/pages/AdminAgreementPage.jsx
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  runTransaction,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { invalidateAgreementCache } from "../services/ndaService";

function AdminAgreementPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [originalTitle, setOriginalTitle] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  
  const [lastUpdated, setLastUpdated] = useState("");
  const [historyList, setHistoryList] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [agreementType, setAgreementType] = useState("Founder");
  const [saving, setSaving] = useState(false);
  const [previewAgreement, setPreviewAgreement] = useState(null);

  // STEP 2 & 5 Applied: Isolated dynamic state sync directly within the recommended design pattern hook matching the active tab type
  useEffect(() => {
    const loadAgreement = async () => {
      try {
        // STEP 2 Applied: Replaced static activeAgreement reference with dynamic type document binding mapping
        const agreementRef = doc(db, "agreementTemplates", agreementType);
        const snap = await getDoc(agreementRef);

        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title || "");
          setContent(data.content || "");
          setOriginalTitle(data.title || "");
          setOriginalContent(data.content || "");

          if (data.updatedAt) {
            const date = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
            setLastUpdated(date.toLocaleString("en-US", { 
              day: "numeric", month: "short", year: "numeric", 
              hour: "2-digit", minute: "2-digit" 
            }));
          }
        } else {
          setTitle("");
          setContent("");
          setOriginalTitle("");
          setOriginalContent("");
          setLastUpdated("No active document deployed");
        }

        // STEP 5 Applied: Configured target query execution sequence to capture and isolate active history versions perfectly
        const historyQuery = query(
          collection(db, "agreementHistory"),
          where("agreementType", "==", agreementType),
          orderBy("version", "desc")
        );
        const historySnap = await getDocs(historyQuery);
        const logs = historySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setHistoryList(logs);

      } catch (error) {
        console.error("Dashboard synchronization fault:", error);
      }
    };

    loadAgreement();
  }, [agreementType]);

  // Load Agreement History Library Catalog safely tied to active type mutations
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, "agreementVersions"),
            where("agreementType", "==", agreementType),
            orderBy("version", "desc")
          )
        );

        setAgreements(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        console.error("Error populating historical template structures:", error);
      }
    };

    loadHistory();
  }, [agreementType]);

  // Helper routine to execute in-place local state re-hydration during data mutations
  const triggerInlineDataRefresh = async () => {
    try {
      const agreementRef = doc(db, "agreementTemplates", agreementType);
      const snap = await getDoc(agreementRef);

      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || "");
        setContent(data.content || "");
        setOriginalTitle(data.title || "");
        setOriginalContent(data.content || "");

        if (data.updatedAt) {
          const date = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
          setLastUpdated(date.toLocaleString("en-US", { 
            day: "numeric", month: "short", year: "numeric", 
            hour: "2-digit", minute: "2-digit" 
          }));
        }
      }

      const historyQuery = query(
        collection(db, "agreementHistory"),
        where("agreementType", "==", agreementType),
        orderBy("version", "desc")
      );
      const historySnap = await getDocs(historyQuery);
      const logs = historySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setHistoryList(logs);
    } catch (error) {
      console.error("Inline refresh sync failure:", error);
    }
  };

  const saveTemplate = async () => {
    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();

    if (!normalizedTitle || !normalizedContent) {
      alert("An agreement title and full agreement content are required.");
      return;
    }

    try {
      if (title === originalTitle && content === originalContent) {
        alert("You did not change anything yet. Please modify the agreement before saving.");
        return;
      }

      setSaving(true);
      const activeRef = doc(db, "agreementTemplates", agreementType);
      const adminId = auth.currentUser?.uid;

      if (!adminId) throw new Error("Your administrator session has expired.");

      await runTransaction(db, async (transaction) => {
        const activeSnap = await transaction.get(activeRef);
        const activeData = activeSnap.exists() ? activeSnap.data() : null;
        const version = (activeData?.version || 0) + 1;

        if (activeData) {
          transaction.set(doc(collection(db, "agreementVersions")), {
            ...activeData,
            agreementType,
            status: "archived",
            archivedAt: serverTimestamp(),
            archivedBy: adminId,
          });
          transaction.set(doc(collection(db, "agreementHistory")), {
            agreementType,
            title: activeData.title || "Untitled Template",
            content: activeData.content || "",
            version: activeData.version || 1,
            archivedAt: serverTimestamp(),
            archivedBy: adminId,
          });
        }

        transaction.set(activeRef, {
          title: normalizedTitle,
          content: normalizedContent,
          version,
          status: "active",
          agreementType,
          updatedAt: serverTimestamp(),
          updatedBy: adminId,
        });
      });

      invalidateAgreementCache(agreementType);

      alert("Agreement Updated Successfully and previous copy Archived!");
      
      await triggerInlineDataRefresh();
      
      const snapshot = await getDocs(
        query(
          collection(db, "agreementVersions"),
          where("agreementType", "==", agreementType),
          orderBy("version", "desc")
        )
      );
      setAgreements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewIntent = () => {
    setTitle("");
    setContent("");
    alert("Editor cleared! Type out the layout parameters and click Save Template.");
  };

  const handleRestoreTemplate = async (archiveInstance) => {
    const confirmation = window.confirm(`Are you sure you want to rollback active layout definitions to version: "${archiveInstance.title}"?`);
    if (!confirmation) return;

    try {
      const activeRef = doc(db, "agreementTemplates", agreementType);
      const adminId = auth.currentUser?.uid;
      if (!adminId) throw new Error("Your administrator session has expired.");

      setSaving(true);
      await runTransaction(db, async (transaction) => {
        const activeSnap = await transaction.get(activeRef);
        const activeData = activeSnap.exists() ? activeSnap.data() : null;
        const version = (activeData?.version || 0) + 1;

        if (activeData) {
          transaction.set(doc(collection(db, "agreementVersions")), {
            ...activeData,
            agreementType,
            status: "archived",
            archivedAt: serverTimestamp(),
            archivedBy: adminId,
          });
          transaction.set(doc(collection(db, "agreementHistory")), {
            agreementType,
            title: activeData.title || "Untitled Template",
            content: activeData.content || "",
            version: activeData.version || 1,
            archivedAt: serverTimestamp(),
            archivedBy: adminId,
          });
        }

        transaction.set(activeRef, {
          title: archiveInstance.title || "Untitled Template",
          content: archiveInstance.content || "",
          version,
          status: "active",
          agreementType,
          updatedAt: serverTimestamp(),
          updatedBy: adminId,
        });
      });

      invalidateAgreementCache(agreementType);

      alert("Version Restored Successfully!");
      await triggerInlineDataRefresh();
    } catch (error) {
      alert("Rollback failure sequence: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReuseTemplate = (archiveInstance) => {
    setTitle(archiveInstance.title || "");
    setContent(archiveInstance.content || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "30px",
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <h2 style={{ marginBottom: "15px", color: "#f8fafc" }}>📄 Agreement Management</h2>
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "35px",
          borderBottom: "1px solid #334155",
          paddingBottom: "15px"
        }}
      >
        {["Founder", "Investor", "Freelancer"].map((type) => (
          <button
            key={type}
            onClick={() => setAgreementType(type)}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              background: agreementType === type ? "#2563eb" : "#334155",
              color: "white",
              fontWeight: "600",
              transition: "background 0.2s ease"
            }}
          >
            {type} NDA
          </button>
        ))}
      </div>

      <h1>📄 Admin {agreementType} Agreement Template</h1>

      <div
        style={{
          background: "#1e293b",
          padding: "20px",
          borderRadius: "15px",
          marginTop: "20px",
          border: "1px solid #334155",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: "#38bdf8" }}>Current Active {agreementType} Agreement</h3>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#94a3b8" }}>
            Last Updated: {lastUpdated || "No timestamp logs available"}
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={triggerInlineDataRefresh}
            style={{
              padding: "10px 18px",
              background: "#475569",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            ✏️ Edit Current
          </button>
          
          <button
            onClick={handleCreateNewIntent}
            style={{
              padding: "10px 18px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            ➕ Create New
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#1e293b",
          padding: "20px",
          borderRadius: "15px",
          marginTop: "20px",
          border: "1px solid #334155"
        }}
      >
        <input
          type="text"
          placeholder="Agreement Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "10px",
            border: "1px solid #475569",
            background: "#0f172a",
            color: "white",
            fontSize: "16px"
          }}
        />

        <textarea
          placeholder="Agreement Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: "100%",
            minHeight: "300px",
            padding: "15px",
            borderRadius: "10px",
            border: "1px solid #475569",
            background: "#0f172a",
            color: "white",
            fontSize: "14px",
            lineHeight: "1.6",
            fontFamily: "monospace"
          }}
        />

        <button
          onClick={saveTemplate}
          disabled={saving}
          style={{
            marginTop: "15px",
            padding: "12px 24px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            fontWeight: "600",
            fontSize: "15px"
          }}
        >
          💾 Save Template
        </button>
      </div>

      <div
        style={{
          background: "#1e293b",
          padding: "20px",
          borderRadius: "15px",
          marginTop: "25px",
          border: "1px solid #334155"
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#f59e0b" }}>📜 Version Archive Logs (agreementHistory)</h3>
        
        {historyList.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>No archived historical modifications discovered for {agreementType} context.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
            {historyList.map((log) => {
              const archiveDate = log.archivedAt?.toDate ? log.archivedAt.toDate().toLocaleString() : "N/A";
              return (
                <div
                  key={log.id}
                  style={{
                    background: "#0f172a",
                    padding: "15px",
                    borderRadius: "10px",
                    border: "1px solid #334155",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <strong style={{ color: "#cbd5e1" }}>{log.title} (v{log.version || 0})</strong>
                    <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#64748b" }}>Archived On: {archiveDate}</p>
                  </div>
                  
                  <button
                    onClick={() => handleRestoreTemplate(log)}
                    disabled={saving}
                    style={{
                      padding: "6px 14px",
                      background: "#d97706",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: saving ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      fontSize: "13px"
                    }}
                  >
                    🔄 Restore Version
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <h2 style={{ marginTop: "40px" }}>{agreementType} Agreement Library</h2>
      
      <div 
        className="agreement-history" 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "12px", 
          background: "#1e293b", 
          padding: "20px", 
          borderRadius: "15px", 
          marginTop: "15px",
          border: "1px solid #334155" 
        }}
      >
        {agreements.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>No active historical versions managed inside this context layer.</p>
        ) : (
          agreements.map((agreement) => (
            <div
              key={agreement.id}
              className="agreement-row"
              style={{
                background: "#0f172a",
                padding: "15px",
                borderRadius: "10px",
                border: "1px solid #334155",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px"
              }}
            >
              <div>
                <h4 style={{ margin: 0, color: "#38bdf8" }}>Version {agreement.version}</h4>
                <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: agreement.status === "active" ? "#16a34a" : "#94a3b8", fontWeight: "600" }}>
                  {agreement.status === "active" ? "✅ Active" : "📦 Archived"}
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setPreviewAgreement(agreement)}
                  style={{
                    padding: "6px 14px",
                    background: "#475569",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  Preview
                </button>
                <button
                  onClick={() => handleReuseTemplate(agreement)}
                  disabled={saving}
                  style={{
                    padding: "6px 14px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  Reuse
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {previewAgreement && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Agreement version preview"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.86)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "800px",
              maxWidth: "100%",
              maxHeight: "85vh",
              overflow: "auto",
              background: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "14px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <h3 style={{ margin: 0 }}>{previewAgreement.title || "Untitled Template"}</h3>
                <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
                  {agreementType} NDA · Version {previewAgreement.version || 1}
                </p>
              </div>
              <button
                onClick={() => setPreviewAgreement(null)}
                style={{
                  height: "36px",
                  padding: "0 12px",
                  background: "#475569",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: "#cbd5e1", lineHeight: 1.7 }}>
              {previewAgreement.content || "No agreement content is stored for this version."}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminAgreementPage;
