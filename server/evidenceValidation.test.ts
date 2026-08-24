import { describe, expect, it } from "vitest";
import { validateEvidenceAttachment } from "./evidenceValidation";

describe("validateEvidenceAttachment", () => {
  it("accepts a permitted evidence file and makes its file name safe", () => {
    const result = validateEvidenceAttachment({ fileName: "field photo!.png", mimeType: "image/png", dataBase64: Buffer.from("evidence").toString("base64") });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.safeFileName).toBe("field_photo_.png");
  });

  it("rejects a disallowed evidence type", () => {
    const result = validateEvidenceAttachment({ fileName: "unsafe.exe", mimeType: "application/octet-stream", dataBase64: Buffer.from("x").toString("base64") });
    expect(result).toMatchObject({ valid: false });
  });
});
