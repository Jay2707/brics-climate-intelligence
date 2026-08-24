import { describe, expect, it } from "vitest";
import { hasOperationalPermission } from "./authorization";

describe("operational role policy", () => {
  it("keeps reporter evidence submission separate from review authority", () => {
    expect(hasOperationalPermission("reporter", "review_evidence")).toBe(false);
    expect(hasOperationalPermission("reporter", "draft_alert")).toBe(false);
    expect(hasOperationalPermission("reporter", "dispatch_alert")).toBe(false);
  });

  it("allows a verifier to corroborate and draft but not dispatch", () => {
    expect(hasOperationalPermission("verifier", "review_evidence")).toBe(true);
    expect(hasOperationalPermission("verifier", "draft_alert")).toBe(true);
    expect(hasOperationalPermission("verifier", "dispatch_alert")).toBe(false);
  });

  it("limits dispatch to national desks and administrators", () => {
    expect(hasOperationalPermission("national_desk", "dispatch_alert")).toBe(true);
    expect(hasOperationalPermission("admin", "dispatch_alert")).toBe(true);
    expect(hasOperationalPermission("city_desk", "dispatch_alert")).toBe(false);
  });
});
