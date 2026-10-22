import { describe, expect, it } from "vitest";
import { fallbackEvidenceTriage, normalizeEvidenceTriage } from "./evidenceTriage";

describe("evidence triage normalization", () => {
  it("accepts a valid structured response", () => {
    expect(normalizeEvidenceTriage(JSON.stringify({ classification: "Likely open waste burning", severity: "high", confidence: 88 }))).toEqual({
      classification: "Likely open waste burning",
      severity: "high",
      confidence: 88,
    });
  });

  it("clamps unsafe confidence and falls back on unknown severity", () => {
    expect(normalizeEvidenceTriage(JSON.stringify({ classification: " smoke plume ", severity: "urgent", confidence: 140 }))).toEqual({
      classification: "smoke plume",
      severity: "watch",
      confidence: 100,
    });
  });

  it("never blocks intake when the model response is unavailable", () => {
    expect(normalizeEvidenceTriage("not-json")).toEqual(fallbackEvidenceTriage);
    expect(normalizeEvidenceTriage(undefined)).toEqual(fallbackEvidenceTriage);
  });
});
