// src/pages/DataRoomPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/useAuth";
import DocumentViewer from "../components/DocumentViewer";
import {
  VDR_CATEGORIES,
  computeVdrStats,
  getDataRoomAccess,
  getOrCreateFounderDataRoom,
  listDataRooms,
  listRoomDocuments,
  logDocumentActivity,
  setDocumentDownloadPolicy,
  uploadVdrDocument,
  formatDocumentSize,
} from "../services/vdrService";
// ✅ Cleanly added the helper utility engine wrapper mapping parameters safely
import { isRecentDocument } from "../utils/helpers";

function DataRoomPage() {
  const { userData, user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [access, setAccess] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(VDR_CATEGORIES[0]);
  const [folder, setFolder] = useState("General");
  const [downloadAllowed, setDownloadAllowed] = useState(false);

  // Filter optimization state tracking sub-folders and selected category views
  const [activeFilterCategory, setActiveFilterCategory] = useState("All");
  const [selectedFolderGroup, setSelectedFolderGroup] = useState("All");

  // Added search and sorting selection state track variables cleanly
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Newest");

  // ✅ Deleted the old currentTimestamp hook allocation completely to maintain absolute rendering purity

  const viewer = useMemo(
    () => (userData ? { ...userData, uid: user?.uid } : null),
    [user?.uid, userData]
  );
  const isFounder = viewer?.role === "Founder";

  const loadRoom = useCallback(async (room) => {
    setLoading(true);
    try {
      // Change 4 Applied: Embedded telemetry logging trace below data room gateway resolutions
      const roomAccess = await getDataRoomAccess(room, viewer);
      console.log(roomAccess);
      
      setActiveRoom(room);
      setAccess(roomAccess);
      if (!roomAccess.granted) { 
        setDocuments([]); 
        setActivities([]); 
        return; 
      }
      
      const [roomDocuments, viewSnapshot] = await Promise.all([
        listRoomDocuments(room.id),
        getDocs(query(collection(db, "documentViews"), where("dataRoomId", "==", room.id))),
      ]);
      
      // Change 5 Applied: Added verification snapshot arrays logging outputs seamlessly
      console.log(roomDocuments);
      console.log(viewSnapshot.docs);

      setDocuments(roomDocuments);
      setActivities(viewSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    } catch (error) {
      // Change 6 Applied: Upgraded error boundaries capturing exact messages context sheets via alerts
      console.error(error);
      alert(error.message);
      setLoading(false);
    } finally { 
      setLoading(false); 
    }
  }, [viewer]);

  useEffect(() => {
    if (!viewer?.uid) return;
    
    // Change 1 Applied: Appended structural routine starting check log parameter
    const initialize = async () => {
      console.log("Initialize Started");
      try {
        if (isFounder) {
          // Change 2 Applied: Outputs populated data room schema mapping variables to debug grid
          const room = await getOrCreateFounderDataRoom(viewer);
          console.log("Founder Room:", room);
          
          // Change 3 Applied: Enforce tracking allocations checkpoints wrap indicators around load hook execution
          console.log("Calling loadRoom()");
          await loadRoom(room);
          console.log("loadRoom Finished");
          return;
        }
        const allRooms = await listDataRooms();
        const available = [];
        for (const room of allRooms) {
          const roomAccess = await getDataRoomAccess(room, viewer);
          if (roomAccess.granted) available.push(room);
        }
        setRooms(available);
        if (available[0]) await loadRoom(available[0]);
        else { 
          setAccess({ granted: false, reason: "No startup data rooms are available. Accept a founder NDA to unlock access." }); 
          setLoading(false); 
        }
      } catch (error) { 
        setAccess({ granted: false, reason: error.message }); 
        setLoading(false); 
      }
    };
    initialize();
  }, [isFounder, loadRoom, viewer]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!activeRoom || !file) return;
    try {
      setUploading(true);
      await uploadVdrDocument({ room: activeRoom, owner: viewer, file, category, folder, downloadAllowed });
      setFile(null);
      await loadRoom(activeRoom);
    } catch (error) { 
      alert(error.message); 
    } finally { 
      setUploading(false); 
    }
  };

  const openDocument = async (document) => {
    const latestAccess = await getDataRoomAccess(activeRoom, viewer);
    if (!latestAccess.granted) {
      setAccess(latestAccess);
      alert(latestAccess.reason);
      return;
    }
    await logDocumentActivity({ documentId: document.id, room: activeRoom, event: "OPENED" });
    await logDocumentActivity({ documentId: document.id, room: activeRoom, event: "VIEWED" });
    setSelectedDocument(document);
  };

  const closeDocument = async (durationSeconds) => {
    if (selectedDocument) {
      await logDocumentActivity({ documentId: selectedDocument.id, room: activeRoom, event: "TIME_SPENT", durationSeconds });
    }
    setSelectedDocument(null);
  };

  const toggleDownloadPolicy = async (document) => {
    try {
      await setDocumentDownloadPolicy({
        documentId: document.id,
        ownerId: activeRoom.ownerId,
        downloadAllowed: !document.downloadAllowed,
      });
      await loadRoom(activeRoom);
    } catch (error) {
      alert(error.message);
    }
  };

  // Compute unique directory values client-side from the document list
  const folderDirectories = useMemo(() => {
    const list = ["All"];
    documents.forEach((d) => {
      if (d.folder && !list.includes(d.folder)) list.push(d.folder);
    });
    return list;
  }, [documents]);

  // Derived state matrix executing file filtration logic seamlessly
  const filteredDocuments = useMemo(() => {
    return [...documents]
      .filter((doc) => {
        const matchCategory =
          activeFilterCategory === "All" ||
          doc.category === activeFilterCategory;

        const matchFolder =
          selectedFolderGroup === "All" ||
          doc.folder === selectedFolderGroup;

        const term = search.toLowerCase();

        const matchSearch =
          !term ||
          doc.name?.toLowerCase().includes(term) ||
          doc.category?.toLowerCase().includes(term) ||
          doc.folder?.toLowerCase().includes(term);

        return matchCategory && matchFolder && matchSearch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "Oldest":
            return (
              (a.createdAt?.seconds || 0) -
              (b.createdAt?.seconds || 0)
            );

          case "Name":
            return (a.name || "").localeCompare(b.name || "");

          case "Largest":
            return (b.size || 0) - (a.size || 0);

          case "Smallest":
            return (a.size || 0) - (b.size || 0);

          default:
            return (
              (b.createdAt?.seconds || 0) -
              (a.createdAt?.seconds || 0)
            );
        }
      });
  }, [
    documents,
    activeFilterCategory,
    selectedFolderGroup,
    search,
    sortBy,
  ]);

  const myRecentActivities = useMemo(
    () => activities
      .filter((activity) => activity.viewerId === viewer?.uid)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5),
    [activities, viewer?.uid]
  );

  const stats = computeVdrStats(documents, activities);

  return (
    <div className="vdr-page">
      <header className="vdr-hero">
        <div>
          <span>SECURE VIRTUAL DATA ROOM</span>
          <h1>{activeRoom?.title || "Virtual Data Room"}</h1>
          <p>Confidential documents protected by versioned NDA access.</p>
        </div>
        {access?.granted && (
          <span className="vdr-access">
            NDA verified {access.agreementVersion ? `· ${access.agreementVersion}` : ""}
          </span>
        )}
      </header>

      {rooms.length > 1 && (
        <div className="vdr-room-tabs">
          {rooms.map((room) => (
            <button 
              key={room.id} 
              onClick={() => loadRoom(room)} 
              className={room.id === activeRoom?.id ? "active" : ""}
            >
              {room.ownerName}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="vdr-empty">Loading secure documents…</p>
      ) : !access?.granted ? (
        <div className="vdr-empty">
          <h2>Access restricted</h2>
          <p>{access?.reason}</p>
        </div>
      ) : (
        <>
          <section className="vdr-stats">
            <article><span>Documents</span><strong>{stats.totalDocuments}</strong></article>
            <article><span>Verified viewers</span><strong>{stats.totalViewers}</strong></article>
            <article><span>Downloads</span><strong>{stats.downloads}</strong></article>
            <article><span>Most viewed</span><strong>{stats.mostViewed}</strong></article>
          </section>

          {isFounder && (
            <form className="vdr-upload" onSubmit={handleUpload}>
              <h2>Upload confidential document</h2>
              <input type="file" required onChange={(event) => setFile(event.target.files?.[0] || null)} />
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {VDR_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
              </select>
              <input value={folder} onChange={(event) => setFolder(event.target.value)} placeholder="Folder name" />
              <label>
                <input type="checkbox" checked={downloadAllowed} onChange={(event) => setDownloadAllowed(event.target.checked)} /> 
                Allow download
              </label>
              <button className="create-btn" disabled={uploading}>
                {uploading ? "Uploading…" : "Upload document"}
              </button>
            </form>
          )}

          {/* Inserted modern search query input field and sort policy block above filters */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: "280px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #334155",
                background: "#1e293b",
                color: "white",
              }}
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid #334155",
                background: "#1e293b",
                color: "white",
              }}
            >
              <option value="Newest">Newest</option>
              <option value="Oldest">Oldest</option>
              <option value="Name">Name</option>
              <option value="Largest">Largest</option>
              <option value="Smallest">Smallest</option>
            </select>
          </div>

          {/* Directory Filtering Section */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <label style={{ marginRight: "8px", fontSize: "14px", opacity: 0.8 }}>📁 Folder Group:</label>
              <select value={selectedFolderGroup} onChange={(e) => setSelectedFolderGroup(e.target.value)} style={{ padding: "6px 12px", borderRadius: "8px" }}>
                {folderDirectories.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{ marginRight: "8px", fontSize: "14px", opacity: 0.8 }}>📋 Category:</label>
              <select value={activeFilterCategory} onChange={(e) => setActiveFilterCategory(e.target.value)} style={{ padding: "6px 12px", borderRadius: "8px" }}>
                <option value="All">All Categories</option>
                {VDR_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Added text indicator showing current telemetry matching index records counts */}
          <p
            style={{
              marginBottom: "15px",
              color: "#94a3b8",
              fontSize: "14px"
            }}
          >
            Showing {filteredDocuments.length} of {documents.length} documents
          </p>

          <section className="vdr-documents">
            <h2>{isFounder ? "Your confidential documents" : "Available documents"}</h2>
            {filteredDocuments.length === 0 ? (
              <p className="vdr-empty">No documents match the active directory filter mappings.</p>
            ) : (
              filteredDocuments.map((document) => (
                <article className="vdr-document" key={document.id}>
                  <div>
                    <span>{document.category}</span>
                    
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <h3 style={{ margin: 0 }}>
                        {document.name}
                      </h3>

                      {/* Fix Applied: Cleanly calling out the abstract external evaluation mapper seamlessly without inline calculations */}
                      {isRecentDocument(document.createdAt) && (
                        <span
                          style={{
                            background: "#16a34a",
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>

                    <p>Folder: <strong>{document.folder || "General"}</strong> · Size: {formatDocumentSize(document.size)} · {document.downloadAllowed ? "Download allowed" : "View only"}</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button onClick={() => openDocument(document)}>Secure preview</button>
                    {isFounder && (
                      <button onClick={() => toggleDownloadPolicy(document)}>
                        {document.downloadAllowed ? "Set view only" : "Allow download"}
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>

          {!isFounder && myRecentActivities.length > 0 && (
            <section className="vdr-documents" style={{ marginTop: "20px" }}>
              <h2>Recent document activity</h2>
              {myRecentActivities.map((activity) => {
                const documentName = documents.find((item) => item.id === activity.documentId)?.name || "Confidential document";
                const accessedAt = activity.createdAt?.toDate?.().toLocaleString() || "Just now";
                return (
                  <article className="vdr-document" key={activity.id}>
                    <div>
                      <h3>{documentName}</h3>
                      <p>{activity.event.replaceAll("_", " ")} · Last accessed {accessedAt}</p>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}
      
      {selectedDocument && (
        <DocumentViewer 
          document={selectedDocument} 
          room={activeRoom} 
          onClose={closeDocument} 
          onDownload={() => logDocumentActivity({ documentId: selectedDocument.id, room: activeRoom, event: "DOWNLOADED" })} 
        />
      )}
    </div>
  );
}

export default DataRoomPage;