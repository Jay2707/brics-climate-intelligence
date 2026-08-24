import { describe, expect, it } from "vitest";

const requiredSecret = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
};

describe("production data-provider credentials", () => {
  it("obtains a server-side Copernicus OAuth access token", async () => {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: requiredSecret("COPERNICUS_CLIENT_ID"),
      client_secret: requiredSecret("COPERNICUS_CLIENT_SECRET"),
    });
    const response = await fetch("https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { access_token?: string; expires_in?: number };
    expect(payload.access_token).toEqual(expect.any(String));
    expect(payload.access_token?.length).toBeGreaterThan(20);
    expect(payload.expires_in).toBeGreaterThan(0);
  }, 30_000);

  it("accepts the OpenAQ ground-monitoring key", async () => {
    const response = await fetch("https://api.openaq.org/v3/locations?limit=1", {
      headers: { "X-API-Key": requiredSecret("OPENAQ_API_KEY") },
    });
    expect(response.ok).toBe(true);
    const payload = await response.json() as { results?: unknown[] };
    expect(Array.isArray(payload.results)).toBe(true);
  }, 30_000);

  it("accepts the NASA FIRMS active-fire key", async () => {
    const key = requiredSecret("FIRMS_MAP_KEY");
    const response = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/VIIRS_NOAA20_NRT/world/1`);
    expect(response.ok).toBe(true);
    const body = await response.text();
    expect(body).toContain("latitude");
  }, 30_000);
});
