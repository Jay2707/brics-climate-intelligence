import type { AppRole } from "../drizzle/schema";

export type OperationalPermission = "review_evidence" | "draft_alert" | "dispatch_alert";

const permissionMatrix: Record<OperationalPermission, AppRole[]> = {
  review_evidence: ["verifier", "city_desk", "national_desk", "admin"],
  draft_alert: ["verifier", "city_desk", "national_desk", "admin"],
  dispatch_alert: ["national_desk", "admin"],
};

export function hasOperationalPermission(role: AppRole, permission: OperationalPermission) {
  return permissionMatrix[permission].includes(role);
}
