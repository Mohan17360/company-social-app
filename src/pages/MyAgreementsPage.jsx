import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
// ✅ Cleanly added the missing session listener import parameter
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
// STEP 1 & 5 Applied: Imported target modal component definition safely
import PdfViewer from "../components/PdfViewer";

function MyAgreementsPage() {
  const navigate = useNavigate();

  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Added search, filter, and new sorting hooks cleanly
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  // STEP 2 & 5 Applied: Added dynamic viewer interaction tracking states safely
  const [selectedPdf, setSelectedPdf] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);

  // ✅ Paste this instead: Enterprise integration protecting against cold starts and race states
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAgreements([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "agreementSignatures"),
        where("viewerId", "==", user.uid),
        orderBy("signedAt", "desc")
      );

      const unsubscribeData = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setAgreements(list);
          setLoading(false);
        },
        (error) => {
          console.error(error);
          setLoading(false);
        }
      );

      return unsubscribeData;
    });

    return () => unsubscribeAuth();
  }, []);

  const totalStorage = useMemo(() => {
    return agreements.reduce(
      (sum, item) => sum + (item.fileSize || 0),
      0
    );
  }, [agreements]);

  // Replaced filteredAgreements with combined filtration and sorting logic maps
  const filteredAgreements = [...agreements]
    .filter((agreement) => {
      const matchesSearch =
        agreement.ndaType
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        agreement.viewerName
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        agreement.status
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filterType === "All" ||
        agreement.ndaType === filterType;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "Oldest":
          return (
            (a.signedAt?.seconds || 0) -
            (b.signedAt?.seconds || 0)
          );

        case "Version":
          return (
            (b.agreementVersion || 0) -
            (a.agreementVersion || 0)
          );

        case "Name":
          return (a.ndaType || "").localeCompare(
            b.ndaType || ""
          );

        default:
          return (
            (b.signedAt?.seconds || 0) -
            (a.signedAt?.seconds || 0)
          );
      }
    });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: 30,
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 20,
          padding: "10px 18px",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          background: "#2563eb",
          color: "#fff",
        }}
      >
        ← Back
      </button>

      <h1>📄 My Agreements</h1>

      <p
        style={{
          color: "#94a3b8",
        }}
      >
        View every NDA and legal agreement you have signed.
      </p>

      {/* Inputs Discovery Block Section Control Layer */}
      <div
        style={{
          display: "flex",
          gap: 15,
          marginTop: 25,
          marginBottom: 25,
          flexWrap: "wrap",
        }}
      >
        {/* ✅ Fix Re-Applied: Naming mismatch resolved perfectly using correct setSearch handler explicitly */}
        <input
          type="text"
          placeholder="🔍 Search agreements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 260,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #334155",
            background: "#1e293b",
            color: "white",
          }}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 10,
            background: "#1e293b",
            color: "white",
            border: "1px solid #334155",
          }}
        >
          <option value="All">All Roles</option>
          <option value="Founder">Founder</option>
          <option value="Investor">Investor</option>
          <option value="Freelancer">Freelancer</option>
        </select>

        {/* Added Sort Dropdown side-by-side with Filter inputs */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 10,
            background: "#1e293b",
            color: "white",
            border: "1px solid #334155",
          }}
        >
          <option value="Newest">Newest</option>
          <option value="Oldest">Oldest</option>
          <option value="Version">Version</option>
          <option value="Name">Name</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          marginTop: 25,
          marginBottom: 30,
        }}
      >
        <StatCard
          title="Total Agreements"
          value={agreements.length}
        />

        <StatCard
          title="Storage Used"
          value={`${(totalStorage / 1024).toFixed(2)} KB`}
        />

        <StatCard
          title="Latest Version"
          value={
            agreements[0]?.agreementVersion || "-"
          }
        />

        {/* Upgraded stat component card tracking filtered results size */}
        <StatCard
          title="Filtered Results"
          value={filteredAgreements.length}
        />
      </div>

      {loading ? (
        <h3>Loading Agreements...</h3>
      ) : filteredAgreements.length === 0 ? (
        /* Patched responsive high fidelity empty metrics layout context sheets */
        <div
          style={{
            marginTop: 40,
            background: "#1e293b",
            padding: 40,
            borderRadius: 15,
            textAlign: "center",
          }}
        >
          <h2>No matching agreements found.</h2>

          <p
            style={{
              color: "#94a3b8",
            }}
          >
            Try changing your search or filter options.
          </p>
          <p style={{ color: "#64748b", marginTop: 10 }}>
            Try changing your search or filter.
          </p>
        </div>
      ) : (
        filteredAgreements.map((item) => (
          <AgreementCard
            key={item.id}
            agreement={item}
            // Passing down interactions functions mapping states safely
            onViewPdf={(url) => {
              setSelectedPdf(url);
              setViewerOpen(true);
            }}
          />
        ))
      )}

      {/* STEP 4 & 5 Applied: Embedded overlay workspace view logic inside page layout bounds split */}
      {viewerOpen && (
        <PdfViewer
          open={viewerOpen}
          pdfUrl={selectedPdf}
          onClose={() => {
            setViewerOpen(false);
            setSelectedPdf("");
          }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "#1e293b",
        padding: 20,
        borderRadius: 15,
      }}
    >
      <h4
        style={{
          color: "#94a3b8",
        }}
      >
        {title}
      </h4>

      <h2>{value}</h2>
    </div>
  );
}

function AgreementCard({ agreement, onViewPdf }) {
  return (
    <div
      style={{
        background: "#1e293b",
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
      }}
    >
      <h2>
        {agreement.ndaType} NDA
      </h2>

      <p>
        <strong>Status:</strong>{" "}
        {agreement.status}
      </p>

      <p>
        <strong>Version:</strong>{" "}
        {agreement.agreementVersion}
      </p>

      <p>
        <strong>Signed:</strong>{" "}
        {agreement.signedAt?.toDate
          ? agreement.signedAt
              .toDate()
              .toLocaleString()
          : "-"}
      </p>

      <p>
        <strong>Format:</strong>{" "}
        {agreement.fileFormat || "PDF"}
      </p>

      <p>
        <strong>Size:</strong>{" "}
        {agreement.fileSize
          ? `${(agreement.fileSize / 1024).toFixed(
              2
            )} KB`
          : "-"}
      </p>

      <p
        style={{
          wordBreak: "break-all",
          color: "#94a3b8",
          fontSize: 12,
        }}
      >
        {agreement.agreementHash}
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
        }}
      >
        {agreement.pdfUrl && (
          <>
            {/* STEP 3 & 5 Applied: Replaced text anchor node reference with modal button triggers */}
            <button
              onClick={() => onViewPdf(agreement.pdfUrl)}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              👁 View PDF
            </button>

            <a
              href={agreement.pdfUrl}
              download
              style={{
                background: "#16a34a",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              ⬇ Download
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default MyAgreementsPage;