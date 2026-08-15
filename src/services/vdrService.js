// src/utils/vdrService.js
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  increment, // 1. Update imports: Cleanly added increment operator bypass
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { getLatestOwnerNdaAcceptance } from "./ndaService";
import { uploadDocumentToCloudinary } from "./cloudinaryUpload";

export const VDR_CATEGORIES = [
  "Pitch Deck",
  "Financials",
  "Cap Table",
  "Business Plan",
  "Legal Documents",
  "Product Roadmap",
  "Market Research",
  "Other",
];

/**
 * Formats raw binary file sizes into standard human-readable units.
 * Critical for enterprise audit logging and UI dashboard sheets.
 */
export function formatDocumentSize(bytes) {
  if (!bytes || isNaN(bytes)) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

// 1. Updated getOrCreateFounderDataRoom() with telemetry logger parameters cleanly
export async function getOrCreateFounderDataRoom(owner) {
  console.log("getOrCreateFounderDataRoom:", owner);
  const roomRef = doc(db, "dataRooms", owner.uid);
  const existing = await getDoc(roomRef);
  if (existing.exists()) return { id: existing.id, ...existing.data() };

  const room = {
    ownerId: owner.uid,
    ownerName: owner.name || "Startup Founder",
    ownerEmail: owner.email || auth.currentUser?.email || "",
    title: `${owner.name || "Startup"} Data Room`,
    ndaType: "Founder",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(roomRef, room);
  return { id: owner.uid, ...room };
}

// 2. Updated getDataRoomAccess() with telemetry logger parameters cleanly
export async function getDataRoomAccess(room, viewer) {
  console.log("getDataRoomAccess:", room, viewer);
  if (!viewer?.uid) return { granted: false, reason: "Sign in to access this data room." };
  
  // Enterprise Access Bypass Strategy: Document Owners and Global Administrators override checks
  if (viewer.uid === room.ownerId || viewer.role === "Admin") {
    return { 
      granted: true, 
      isOwner: viewer.uid === room.ownerId, 
      isAdmin: viewer.role === "Admin",
      agreementVersion: "Bypass Authorized" 
    };
  }
  
  if (!["Investor", "Freelancer"].includes(viewer.role)) {
    return { granted: false, reason: "Your role is not eligible for this data room." };
  }

  const nda = await getLatestOwnerNdaAcceptance({
    ownerId: room.ownerId,
    viewerId: viewer.uid,
    ndaType: room.ndaType || "Founder",
  });
  
  if (!nda.granted) {
    return { granted: false, reason: `Accept ${room.ndaType || "Founder"} NDA version ${nda.requiredVersion} to continue.` };
  }

  // Hydrate mapping constraints to track cross-collection validation permissions explicitly
  await setDoc(doc(db, "documentPermissions", `${room.id}_${viewer.uid}`), {
    dataRoomId: room.id,
    ownerId: room.ownerId,
    viewerId: viewer.uid,
    viewerRole: viewer.role,
    ndaType: room.ndaType || "Founder",
    agreementVersion: nda.requiredVersion,
    acceptedNdaId: nda.acceptance.id,
    grantedAt: serverTimestamp(),
    lastValidatedAt: serverTimestamp(),
  }, { merge: true });

  return { granted: true, agreementVersion: nda.requiredVersion, acceptance: nda.acceptance };
}

export async function listDataRooms() {
  const snapshot = await getDocs(query(collection(db, "dataRooms"), where("status", "==", "active")));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
}

// 3. Updated listRoomDocuments() with telemetry logger parameters cleanly
export async function listRoomDocuments(dataRoomId) {
  console.log("listRoomDocuments:", dataRoomId);
  const snapshot = await getDocs(query(collection(db, "documents"), where("dataRoomId", "==", dataRoomId)));
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function uploadVdrDocument({ room, owner, file, category, folder, downloadAllowed }) {
  if (!file) throw new Error("Choose a document to upload.");
  
  // Deploy secure stream pipelines utilizing your global Cloudinary utility references
  const fileUrl = await uploadDocumentToCloudinary(file);
  
  // 2. Update uploadVdrDocument(): Extended document fields instantiation
  const entry = await addDoc(collection(db, "documents"), {
    dataRoomId: room.id,
    ownerId: room.ownerId,
    ownerName: room.ownerName,
    name: file.name,
    fileUrl,
    mimeType: file.type || "application/octet-stream",
    size: file.size || 0,
    category,
    folder: folder.trim() || "General",
    downloadAllowed: Boolean(downloadAllowed),
    uploadedBy: owner.uid,
    uploadedByName: owner.name || auth.currentUser?.displayName || "Founder",
    
    // Direct operational telemetry parameters mapping securely
    viewCount: 0,
    downloadCount: 0,
    averageViewTime: 0,
    lastViewedAt: null,
    lastViewedBy: null,
    version: 1,
    status: "ACTIVE",
    confidential: true,
    watermarkEnabled: true,
    
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return entry.id;
}

export async function setDocumentDownloadPolicy({ documentId, ownerId, downloadAllowed }) {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== ownerId) {
    throw new Error("Only the document owner can change download permissions.");
  }

  await updateDoc(doc(db, "documents", documentId), {
    downloadAllowed: Boolean(downloadAllowed),
    permissionUpdatedAt: serverTimestamp(),
    permissionUpdatedBy: currentUser.uid,
  });
}

export async function logDocumentActivity({ documentId, room, event, durationSeconds = 0 }) {
  const viewer = auth.currentUser;
  if (!viewer) return;
  
  await addDoc(collection(db, "documentViews"), {
    documentId,
    dataRoomId: room.id,
    ownerId: room.ownerId,
    viewerId: viewer.uid,
    viewerEmail: viewer.email || "",
    event, // OPENED, VIEWED, DOWNLOADED, TIME_SPENT
    durationSeconds: Number(durationSeconds),
    createdAt: serverTimestamp(),
  });

  if (["OPENED", "VIEWED", "DOWNLOADED"].includes(event)) {
    try {
      await updateDoc(doc(db, "documents", documentId), {
        lastAccessedAt: serverTimestamp(),
        lastAccessedBy: viewer.uid,
        lastAccessEvent: event,
      });
    } catch (error) {
      console.error("Document last-access update failed:", error);
    }
  }
}

// 3. Add below logDocumentActivity(): Views incremental tracking mutator workflow
export async function incrementDocumentView(documentId) {
  try {
    await updateDoc(doc(db, "documents", documentId), {
      viewCount: increment(1),
      lastViewedAt: serverTimestamp(),
      lastViewedBy: auth.currentUser?.uid || "",
    });
  } catch (error) {
    console.error(error);
  }
}

// 4. Add: Downloads incremental tracking mutator workflow
export async function incrementDownloadCount(documentId) {
  try {
    await updateDoc(doc(db, "documents", documentId), {
      downloadCount: increment(1),
    });
  } catch (error) {
    console.error(error);
  }
}

// 5. Add: Rolling historical mathematical average computing workspace execution pipeline
export async function updateAverageReadingTime(
  documentId,
  durationSeconds
) {
  try {
    const ref = doc(db, "documents", documentId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();
    const totalViews = Math.max(data.viewCount || 1, 1);
    const currentAverage = data.averageViewTime || 0;

    const newAverage =
      (
        currentAverage * (totalViews - 1) +
        durationSeconds
      ) / totalViews;

    await updateDoc(ref, {
      averageViewTime: Math.round(newAverage),
    });

  } catch (error) {
    console.error(error);
  }
}

// 6. Extend computeVdrStats(): Added aggregated time allocations calculations
export function computeVdrStats(documents, activities) {
  const views = activities.filter((item) => item.event === "VIEWED" || item.event === "OPENED");
  const downloads = activities.filter((item) => item.event === "DOWNLOADED");
  
  const counts = views.reduce((map, item) => {
    map[item.documentId] = (map[item.documentId] || 0) + 1;
    return map;
  }, {});
  
  const topDocumentId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  
  const totalViewTime = activities
    .filter((item) => item.event === "TIME_SPENT")
    .reduce(
      (sum, item) => sum + (item.durationSeconds || 0),
      0
    );

  const averageReadTime =
    views.length > 0
      ? Math.round(totalViewTime / views.length)
      : 0;

  return {
    totalDocuments: documents.length,
    totalViewers: new Set(views.map((item) => item.viewerId)).size,
    downloads: downloads.length,
    mostViewed: documents.find((item) => item.id === topDocumentId)?.name || "No document views yet",
    
    // Newly appended aggregation matrix parameters
    averageReadTime,
    totalViews: views.length,
  };
}