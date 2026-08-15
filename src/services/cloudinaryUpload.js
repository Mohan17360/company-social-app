// src/services/cloudinaryUpload.js

const CLOUD_NAME = "doocnue5h";
const UPLOAD_PRESET = "companysocial";

export async function uploadToCloudinary(
  file,
  options = {}
) {
  // Backward compatibility fallback parameter assignments block parsed cleanly
  let resourceType = "image";
  let folder = "";
  let publicId = "";

  if (typeof options === "string") {
    resourceType = options;
  } else if (options && typeof options === "object") {
    resourceType = options.resourceType || "image";
    folder = options.folder || "";
    publicId = options.publicId || "";
  }

  if (!file) {
    throw new Error("No file provided.");
  }

  const formData = new FormData();

  // Blob support (PDFs)
  if (file instanceof Blob && !(file instanceof File)) {
    file = new File([file], "document.pdf", {
      type: "application/pdf",
    });
  }

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  if (folder) {
    formData.append("folder", folder);
  }

  if (publicId) {
    formData.append("public_id", publicId);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(
      data?.error?.message ||
      "Cloudinary upload failed."
    );
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    assetId: data.asset_id,
    bytes: data.bytes,
    format: data.format,
  };
}

/**
 * Enterprise Reusable Feature: Agreement PDF Uploader
 * Specifically maps agreement metadata blobs and passes back target values
 */
export async function uploadAgreementPDF(blob, agreementId) {
  const uploadResult = await uploadToCloudinary(blob, {
    resourceType: "auto",
    folder: "company-social/agreements/founder",
    publicId: agreementId,
  });
  // Preserves enterprise contract requirements by ensuring it outputs the secure string url
  return uploadResult.url;
}

export const uploadImage = (file, options = {}) =>
  uploadToCloudinary(file, {
    resourceType: "image",
    ...options,
  });

export const uploadDocument = (file, options = {}) =>
  uploadToCloudinary(file, {
    resourceType: "auto",
    ...options,
  });

/**
 * Backward compatibility wrapper mapping
 * Wraps object resolution to return string schema directly to prevent dashboard crashes
 */
export const uploadDocumentToCloudinary = async (file) => {
  const result = await uploadDocument(file);
  return result.url;
};