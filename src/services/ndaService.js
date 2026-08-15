// src/utils/ndaService.js
// Centralized Enterprise NDA service layer.
// Single source of truth for agreement loading, version validation,
// acceptance persistence, duplicate prevention, audit logging and
// dashboard analytics. Used by NdaPopup, PostCard and all role dashboards.

import {
  doc,
  getDoc,
  addDoc,
  collection,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  setDoc, // STEP 1 Applied: Added cleanly without duplicate compilation tracks
} from "firebase/firestore";
import { db, auth } from "../firebase";
// STEP 1 Applied: Linked the external generation engine and modular file upload managers safely
import { generateAgreementPDF } from "./pdfService";
import { uploadDocument } from "./cloudinaryUpload";

// ---------------------------------------------------------------------------
// Agreement loading (with short-lived in-memory cache so feed rendering does
// not re-read the same template document for every protected post).
// ---------------------------------------------------------------------------

const AGREEMENT_CACHE_TTL_MS = 60 * 1000;
const agreementCache = new Map();

export async function getActiveAgreement(ndaType) {
  const type = ndaType || "Founder";
  const cached = agreementCache.get(type);

  if (cached && Date.now() - cached.fetchedAt < AGREEMENT_CACHE_TTL_MS) {
    return cached.data;
  }

  const snap = await getDoc(doc(db, "agreementTemplates", type));
  const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;

  agreementCache.set(type, { data, fetchedAt: Date.now() });
  return data;
}

export function invalidateAgreementCache(ndaType) {
  if (ndaType) {
    agreementCache.delete(ndaType);
  } else {
    agreementCache.clear();
  }
}

// ---------------------------------------------------------------------------
// Version validation
// ---------------------------------------------------------------------------

// The version a viewer must accept to unlock a post. Enterprise rule:
// the currently active template version wins, so publishing a new version
// automatically re-locks protected content until viewers re-accept.
// Falls back to the version pinned on the post when no template exists.
export function resolveRequiredNdaVersion(post, agreement) {
  const postVersion = post?.ndaVersion || 1;
  const templateVersion = agreement?.version || 0;
  return Math.max(postVersion, templateVersion) || 1;
}

export function buildAcceptanceId(postId, viewerId, version) {
  return `${postId}_${viewerId}_v${version || 1}`;
}

export async function getNdaAcceptance(postId, viewerId, version) {
  const snap = await getDoc(
    doc(db, "ndaHistory", buildAcceptanceId(postId, viewerId, version))
  );
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Full access evaluation for a protected post. Returns the acceptance
// record when access is granted, plus upgrade metadata for the UI.
export async function evaluateNdaAccess(post, viewerId) {
  const agreement = await getActiveAgreement(post.ndaType);
  const requiredVersion = resolveRequiredNdaVersion(post, agreement);

  const current = await getNdaAcceptance(post.id, viewerId, requiredVersion);

  if (current) {
    return {
      granted: true,
      requiredVersion,
      agreement,
      acceptance: current,
      upgradeRequired: false,
      previousAcceptance: null,
    };
  }

  // Detect a legacy acceptance of the version pinned on the post so the UI
  // can present this as a version upgrade instead of a first acceptance.
  let previousAcceptance = null;
  const pinnedVersion = post.ndaVersion || 1;

  if (pinnedVersion !== requiredVersion) {
    previousAcceptance = await getNdaAcceptance(
      post.id,
      viewerId,
      pinnedVersion
    );
  }

  return {
    granted: false,
    requiredVersion,
    agreement,
    acceptance: null,
    upgradeRequired: Boolean(previousAcceptance),
    previousAcceptance,
  };
}

// VDR access is owner-scoped rather than post-scoped. A viewer must have
// accepted the latest NDA version for the startup owner before confidential
// room documents can be exposed.
export async function getLatestOwnerNdaAcceptance({
  ownerId,
  viewerId,
  ndaType = "Founder",
}) {
  const agreement = await getActiveAgreement(ndaType);
  const requiredVersion = agreement?.version || 1;
  const historySnap = await getDocs(
    query(collection(db, "ndaHistory"), where("viewerId", "==", viewerId))
  );

  const acceptance = historySnap.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .find(
      (entry) =>
        entry.ownerId === ownerId &&
        entry.ndaType === ndaType &&
        entry.agreementVersion === requiredVersion &&
        entry.accepted === true
    );

  return {
    granted: Boolean(acceptance),
    agreement,
    requiredVersion,
    acceptance: acceptance || null,
  };
}

// ---------------------------------------------------------------------------
// Digital signature validation
// ---------------------------------------------------------------------------

export function validateSignature(signatureUrl) {
  if (!signatureUrl || typeof signatureUrl !== "string") {
    return { valid: false, reason: "No digital signature on file." };
  }

  if (!/^https:\/\//i.test(signatureUrl)) {
    return {
      valid: false,
      reason: "Signature reference is not a secure URL.",
    };
  }

  return { valid: true, reason: "" };
}

// ---------------------------------------------------------------------------
// Legal integrity hash (SHA-256 of the agreement text a user accepted).
// Stored on every acceptance so auditors can prove which exact wording
// was on screen, independent of later template edits.
// ---------------------------------------------------------------------------

export async function sha256Hex(text) {
  try {
    const bytes = new TextEncoder().encode(text || "");
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    console.error("NDA content hashing unavailable:", error);
    return "";
  }
}

// ---------------------------------------------------------------------------
// Audit logging — append-only trail in ndaAuditLogs. Never throws so an
// audit failure can never block a legal acceptance flow.
// ---------------------------------------------------------------------------

export const NDA_AUDIT_EVENTS = {
  VIEWED: "NDA_VIEWED",
  ACCEPTED: "NDA_ACCEPTED",
  REACCEPTED: "NDA_REACCEPTED",
  DUPLICATE_BLOCKED: "NDA_DUPLICATE_BLOCKED",
  ACCEPT_FAILED: "NDA_ACCEPT_FAILED",
  DECLINED: "NDA_DECLINED",
};

export async function logNdaAudit(event, payload = {}) {
  try {
    await addDoc(collection(db, "ndaAuditLogs"), {
      event,
      actorId: auth.currentUser?.uid || "anonymous",
      actorEmail: auth.currentUser?.email || "",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "",
      ...payload,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("NDA audit log write failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Acceptance workflow — duplicate prevention, legal snapshot persistence,
// audit trail and owner notification in one call.
// ---------------------------------------------------------------------------

export async function acceptNdaAgreement({ post, viewer, agreement, signatureUrl }) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be logged in to accept an NDA.");
  }

  if (currentUser.uid === post.uid) {
    throw new Error("Content owners do not need to accept their own NDA.");
  }

  if (viewer?.role === "Admin") {
    throw new Error("Administrators bypass NDA acceptance.");
  }

  const signatureCheck = validateSignature(signatureUrl);
  if (!signatureCheck.valid) {
    throw new Error(signatureCheck.reason);
  }

  const requiredVersion = resolveRequiredNdaVersion(post, agreement);
  const docId = buildAcceptanceId(post.id, currentUser.uid, requiredVersion);
  const acceptanceRef = doc(db, "ndaHistory", docId);

  // Duplicate acceptance prevention — an existing record is honored, never
  // overwritten, so the original legal timestamp is preserved.
  const pinnedVersion = post.ndaVersion || 1;
  const contentHash = await sha256Hex(agreement?.content || "");

  // This transaction keeps acceptance idempotent even when the same viewer
  // submits from multiple tabs at the same time.
  const result = await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(acceptanceRef);
    if (existing.exists()) {
      return { status: "duplicate", isUpgrade: false };
    }

    const isUpgrade =
      pinnedVersion !== requiredVersion &&
      (await transaction.get(
        doc(
          db,
          "ndaHistory",
          buildAcceptanceId(post.id, currentUser.uid, pinnedVersion)
        )
      )).exists();

    transaction.set(acceptanceRef, {
      postId: post.id,
      postTitle: (post.content || "").slice(0, 120),
      ownerId: post.uid,
      ownerEmail: post.email || "",
      viewerId: currentUser.uid,
      viewerEmail: currentUser.email || "",
      viewerName: viewer?.name || currentUser.displayName || "Anonymous Partner",
      viewerRole: viewer?.role || "Viewer",
      ndaType: post.ndaType || "Founder",
      agreementVersion: requiredVersion,
      agreementTitle: agreement?.title || "Non-Disclosure Agreement",
      agreementContentHash: contentHash,
      agreementContentSnapshot: agreement?.content || "",
      signatureUrl,
      status: "Accepted",
      accepted: true,
      isVersionUpgrade: isUpgrade,
      acceptedAt: serverTimestamp(),
    });

    return { status: "accepted", isUpgrade };
  });

  if (result.status === "duplicate") {
    await logNdaAudit(NDA_AUDIT_EVENTS.DUPLICATE_BLOCKED, {
      postId: post.id,
      ownerId: post.uid,
      ndaType: post.ndaType || "Founder",
      agreementVersion: requiredVersion,
    });
    return { status: "duplicate", docId, requiredVersion };
  }

  await logNdaAudit(
    result.isUpgrade ? NDA_AUDIT_EVENTS.REACCEPTED : NDA_AUDIT_EVENTS.ACCEPTED,
    {
      postId: post.id,
      ownerId: post.uid,
      ndaType: post.ndaType || "Founder",
      agreementVersion: requiredVersion,
      agreementContentHash: contentHash,
      acceptanceId: docId,
    }
  );

  // ---------------------------------------------------------
  // STEP 2 Applied: Generate signed agreement PDF
  // ---------------------------------------------------------
  const pdfBlob = await generateAgreementPDF({
    agreementTitle:
      agreement?.title ||
      "Non-Disclosure Agreement",

    agreementType:
      post.ndaType || "Founder",

    agreementVersion:
      requiredVersion,

    agreementContent:
      agreement?.content || "",

    founderName:
      post.userName ||
      post.ownerName ||
      "Founder",

    signerName:
      viewer?.name ||
      currentUser.displayName ||
      currentUser.email,

    signerRole:
      viewer?.role || "Viewer",

    signedAt:
      new Date().toLocaleString(),

    agreementHash:
      contentHash,

    signatureImage:
      signatureUrl,
  });

  // ---------------------------------------------------------
  // Change 1 Applied: Extracted deep metadata values safely from uploader object
  // ---------------------------------------------------------
  const uploadResult = await uploadDocument(pdfBlob, {
    folder: `company-social/agreements/${(
      post.ndaType || "founder"
    ).toLowerCase()}`,

    publicId: docId,
  });

  const pdfUrl = uploadResult.url;

  // ---------------------------------------------------------
  // Change 2 Applied: Created legal tracking evidence with comprehensive metadata parameters
  // ---------------------------------------------------------
  await setDoc(
    doc(db, "agreementSignatures", docId),
    {
      acceptanceId: docId,

      viewerId: currentUser.uid,

      viewerName:
        viewer?.name ||
        currentUser.displayName ||
        currentUser.email,

      viewerRole:
        viewer?.role || "Viewer",

      ownerId: post.uid,

      ownerEmail:
        post.email || "",

      postId: post.id,

      ndaType:
        post.ndaType || "Founder",

      agreementVersion:
        requiredVersion,

      agreementHash:
        contentHash,

      signatureUrl,

      pdfUrl,
      
      cloudinaryPublicId: uploadResult.publicId,

      fileSize: uploadResult.bytes,

      fileFormat: uploadResult.format,

      pdfGeneratedAt: serverTimestamp(),

      status: "Signed",

      signedAt: serverTimestamp(),
    }
  );

  // NDA notification to the content owner (existing notifications schema).
  await addDoc(collection(db, "notifications"), {
    receiverId: post.uid,
    receiverEmail: post.email || post.userEmail || "",
    senderId: currentUser.uid,
    senderName: currentUser.displayName || viewer?.name || "User",
    type: result.isUpgrade ? "NDA_REACCEPTED" : "NDA_ACCEPTED",
    title: result.isUpgrade ? "NDA Re-Accepted (New Version)" : "NDA Accepted",
    message: result.isUpgrade
      ? `${currentUser.displayName || viewer?.name || "Someone"} re-accepted your NDA after the agreement was updated to v${requiredVersion}.`
      : `${currentUser.displayName || viewer?.name || "Someone"} accepted your NDA.`,
    postId: post.id,
    agreementVersion: requiredVersion,
    ndaType: post.ndaType || "Founder",
    read: false,
    createdAt: serverTimestamp(),
  });

  // Change 3 Applied: Maintained clean return response payload tracking
  return {
    status: "accepted",

    docId,

    requiredVersion,

    isUpgrade: result.isUpgrade,

    pdfUrl,
  };
}

// ---------------------------------------------------------------------------
// Dashboard analytics helpers (pure functions — safe to unit test).
// ---------------------------------------------------------------------------

export function computeNdaStats(records) {
  const list = records || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const toDate = (value) =>
    value?.toDate ? value.toDate() : value ? new Date(value) : null;

  return {
    total: list.length,
    uniqueViewers: new Set(list.map((r) => r.viewerId).filter(Boolean)).size,
    uniquePosts: new Set(list.map((r) => r.postId).filter(Boolean)).size,
    thisMonth: list.filter((r) => {
      const d = toDate(r.acceptedAt);
      return d && d >= monthStart;
    }).length,
    upgrades: list.filter((r) => r.isVersionUpgrade).length,
    byType: list.reduce((acc, r) => {
      const key = r.ndaType || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  };
}

export function filterNdaRecords(records, { search = "", ndaType = "All", role = "All" } = {}) {
  const term = search.trim().toLowerCase();

  return (records || []).filter((r) => {
    if (ndaType !== "All" && (r.ndaType || "") !== ndaType) return false;
    if (role !== "All" && (r.viewerRole || "") !== role) return false;

    if (!term) return true;

    return [
      r.viewerName,
      r.viewerEmail,
      r.viewerRole,
      r.ownerEmail,
      r.postTitle,
      r.agreementTitle,
      r.ndaType,
      String(r.agreementVersion || ""),
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(term));
  });
}