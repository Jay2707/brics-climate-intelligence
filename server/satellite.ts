export type SatelliteLayer = "no2" | "aerosol";

type SatelliteRequest = { city: string; layer: SatelliteLayer };
type SatelliteLayerResponse = {
  city: string;
  layer: SatelliteLayer;
  source: "Copernicus Sentinel-5P L2";
  capturedAt: string;
  imageBase64: string;
  cacheStatus: "fresh" | "cached";
};

const CITY_BOUNDS: Record<string, [number, number, number, number]> = {
  "New Delhi": [76.75, 28.36, 77.55, 28.95],
  Beijing: [115.85, 39.55, 116.75, 40.25],
  "São Paulo": [-47.0, -23.95, -46.2, -23.25],
  Johannesburg: [27.8, -26.55, 28.7, -25.85],
  Moscow: [36.85, 55.45, 38.1, 56.05],
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process";
const TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
let cachedToken: { value: string; expiresAt: number } | null = null;
const layerCache = new Map<string, { value: SatelliteLayerResponse; expiresAt: number }>();

function requireSecret(name: "COPERNICUS_CLIENT_ID" | "COPERNICUS_CLIENT_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to enable the Copernicus satellite layer.`);
  return value;
}

async function getCopernicusToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: requireSecret("COPERNICUS_CLIENT_ID"),
    client_secret: requireSecret("COPERNICUS_CLIENT_SECRET"),
  });
  const response = await fetch(TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error(`Copernicus authentication failed with status ${response.status}.`);
  const payload = await response.json() as { access_token?: string; expires_in?: number };
  if (!payload.access_token) throw new Error("Copernicus authentication did not return an access token.");
  cachedToken = { value: payload.access_token, expiresAt: Date.now() + Math.max(60, (payload.expires_in ?? 300) - 60) * 1000 };
  return cachedToken.value;
}

function evalscript(layer: SatelliteLayer) {
  if (layer === "aerosol") {
    return `//VERSION=3
function setup() { return { input: ["AER_AI_354_388", "dataMask"], output: { bands: 4 } }; }
function evaluatePixel(s) { if (s.dataMask === 0) return [0, 0, 0, 0]; const v = Math.max(0, Math.min(1, s.AER_AI_354_388 / 5)); return [v, 0.75 * (1 - v), 0.25, 0.78]; }`;
  }
  return `//VERSION=3
function setup() { return { input: ["NO2", "dataMask"], output: { bands: 4 } }; }
function evaluatePixel(s) { if (s.dataMask === 0) return [0, 0, 0, 0]; const v = Math.max(0, Math.min(1, (s.NO2 - 0.00002) / 0.00025)); return [0.2 + 0.8 * v, 0.75 * (1 - v), 0.15 * (1 - v), 0.82]; }`;
}

export async function getSatelliteLayer({ city, layer }: SatelliteRequest): Promise<SatelliteLayerResponse> {
  const bbox = CITY_BOUNDS[city];
  if (!bbox) throw new Error("The requested satellite city boundary is not configured.");
  const cacheKey = `${city}:${layer}`;
  const cached = layerCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return { ...cached.value, cacheStatus: "cached" };

  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const response = await fetch(PROCESS_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${await getCopernicusToken()}`, "content-type": "application/json" },
    body: JSON.stringify({
      input: {
        bounds: { bbox, properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" } },
        data: [{ type: "sentinel-5p-l2", dataFilter: { timeRange: { from: from.toISOString(), to: now.toISOString() }, mosaickingOrder: "mostRecent" } }],
      },
      output: { width: 640, height: 440, responses: [{ identifier: "default", format: { type: "image/png" } }] },
      evalscript: evalscript(layer),
    }),
  });
  if (!response.ok) throw new Error(`Copernicus Process API returned status ${response.status}.`);
  const imageBase64 = Buffer.from(await response.arrayBuffer()).toString("base64");
  if (imageBase64.length < 100) throw new Error("Copernicus did not return a usable satellite image.");
  const value: SatelliteLayerResponse = { city, layer, source: "Copernicus Sentinel-5P L2", capturedAt: now.toISOString(), imageBase64, cacheStatus: "fresh" };
  layerCache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
