// src/services/pdfService.js

import jsPDF from "jspdf";

/**
 * Generates a legal NDA PDF.
 * Returns a Blob.
 *
 * NOTE:
 * This service ONLY generates PDFs.
 * It does NOT upload files.
 */
export async function generateAgreementPDF({
  agreementTitle,
  agreementType,
  agreementVersion,
  agreementContent,
  founderName,
  signerName,
  signerRole,
  signedAt,
  agreementHash,
  signatureImage,
}) {
  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
  });

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Company Social Platform", 20, 20);

  pdf.setFontSize(15);
  pdf.text("Digital Non-Disclosure Agreement", 20, 30);

  // Agreement Details
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  let y = 45;

  const write = (label, value) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(label, 20, y);

    pdf.setFont("helvetica", "normal");
    pdf.text(String(value || "-"), 65, y);

    y += 8;
  };

  write("Agreement", agreementTitle);
  write("Type", agreementType);
  write("Version", agreementVersion);
  write("Founder", founderName);
  write("Signer", signerName);
  write("Role", signerRole);
  write("Signed At", signedAt);

  y += 5;

  pdf.setFont("helvetica", "bold");
  pdf.text("Agreement Content", 20, y);

  y += 8;

  pdf.setFont("helvetica", "normal");

  const wrapped = pdf.splitTextToSize(
    agreementContent || "",
    170
  );

  pdf.text(wrapped, 20, y);

  y += wrapped.length * 5 + 10;

  // Page break if needed
  if (y > 230) {
    pdf.addPage();
    y = 20;
  }

  // Agreement hash
  pdf.setFont("helvetica", "bold");
  pdf.text("Agreement Hash", 20, y);

  y += 6;

  pdf.setFontSize(8);
  pdf.setFont("courier", "normal");

  const hashLines = pdf.splitTextToSize(
    agreementHash || "",
    170
  );

  pdf.text(hashLines, 20, y);

  y += hashLines.length * 4 + 10;

  pdf.setFontSize(11);

  // Signature
  if (signatureImage) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Digital Signature", 20, y);

    try {
      pdf.addImage(
        signatureImage,
        "PNG",
        20,
        y + 5,
        60,
        25
      );
    } catch (err) {
      console.error("Signature rendering failed:", err);
    }
  }

  return pdf.output("blob");
}