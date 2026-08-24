export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const permittedEvidenceMimeTypes = ["image/jpeg", "image/png", "image/webp", "text/csv", "text/plain", "application/json"] as const;

export type EvidenceAttachmentInput = { fileName: string; mimeType: string; dataBase64: string };

export function validateEvidenceAttachment(attachment: EvidenceAttachmentInput): { valid: true; bytes: Buffer; safeFileName: string } | { valid: false; reason: string } {
  if (!permittedEvidenceMimeTypes.includes(attachment.mimeType as (typeof permittedEvidenceMimeTypes)[number])) {
    return { valid: false, reason: "Only JPEG, PNG, WebP, CSV, text, and JSON evidence files are allowed." };
  }
  const bytes = Buffer.from(attachment.dataBase64, "base64");
  if (bytes.length === 0 || bytes.length > MAX_EVIDENCE_BYTES) {
    return { valid: false, reason: "Evidence files must be between 1 byte and 5 MB." };
  }
  const safeFileName = attachment.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "evidence-file";
  return { valid: true, bytes, safeFileName };
}
