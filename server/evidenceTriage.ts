import { alertSeverities } from "../drizzle/schema";

export type EvidenceTriage = {
  classification: string;
  severity: (typeof alertSeverities)[number];
  confidence: number;
};

export const fallbackEvidenceTriage: EvidenceTriage = {
  classification: "Triage pending human corroboration.",
  severity: "watch",
  confidence: 0,
};

export function normalizeEvidenceTriage(content: string | undefined): EvidenceTriage {
  if (!content) return fallbackEvidenceTriage;
  try {
    const parsed = JSON.parse(content) as { classification?: unknown; severity?: unknown; confidence?: unknown };
    const severity = typeof parsed.severity === "string" && alertSeverities.includes(parsed.severity as (typeof alertSeverities)[number])
      ? parsed.severity as (typeof alertSeverities)[number]
      : fallbackEvidenceTriage.severity;
    const confidence = typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
      : fallbackEvidenceTriage.confidence;
    return {
      classification: typeof parsed.classification === "string" && parsed.classification.trim().length > 0
        ? parsed.classification.trim().slice(0, 1000)
        : fallbackEvidenceTriage.classification,
      severity,
      confidence,
    };
  } catch {
    return fallbackEvidenceTriage;
  }
}
