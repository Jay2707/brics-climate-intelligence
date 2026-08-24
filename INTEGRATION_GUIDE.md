# BRICS Climate Intelligence — Integration Guide

This hackathon build is a **frontend prototype**. It intentionally uses illustrative readings and does not submit reports, call data providers, store evidence, or issue operational alerts. Before a real deployment, connect a secure backend and replace the demo objects in `client/src/pages/Home.tsx` with authenticated data flows.

## 1. Core Data You Need to Connect

| Capability | Recommended input | What your code needs | Typical secret/configuration |
|---|---|---|---|
| Ground air quality | Official city/national AQ monitoring APIs and approved low-cost sensor networks | A normalised endpoint that returns station ID, coordinates, timestamp, PM2.5/PM10/NO₂/O₃, quality flags | `AIR_QUALITY_API_KEY`, provider base URL, station allowlist |
| Satellite pollution | Sentinel-5P / Copernicus services, NASA Earthdata products, or a licensed imagery provider | Scheduled ingestion that clips satellite rasters to corridors and extracts pollutant/thermal features | `COPERNICUS_CLIENT_ID`, `COPERNICUS_CLIENT_SECRET` or `NASA_EARTHDATA_TOKEN` |
| Weather and dispersion | National meteorological services, ECMWF, Open-Meteo, or another licensed forecast provider | Wind, boundary-layer height, precipitation, temperature, and forecast time grid | `WEATHER_API_KEY`, provider base URL, model version |
| Citizen evidence | A secure form API plus object storage | Signed image upload URLs, metadata validation, consent capture, moderation/verification queue | `STORAGE_BUCKET`, storage credentials, `REPORTS_API_URL` |
| Geospatial map | The included map integration can be enabled in the frontend | Base map, country/city boundaries, sensor and alert layers | No separate key is needed for the included map proxy in this project template |
| Alerts and partner coordination | Email/SMS/push/webhook service and partner directory | Alert template, recipient policy, escalation rules, delivery audit log | `ALERT_WEBHOOK_URL`, email/SMS provider credentials, partner contact IDs |
| Authentication | A trusted identity provider for agency users and moderators | Role checks for public reporter, verifier, city desk, national desk, and administrator | OAuth client ID/secret, redirect URLs, JWT signing secret |

## 2. Environment Variables

Create a local `.env` file for development and add matching secrets in your deployment settings. **Never put private keys in a `VITE_` variable**, because values with that prefix are sent to the browser.

```bash
# Server-only secrets — keep private
AIR_QUALITY_API_KEY=replace_with_provider_key
AIR_QUALITY_API_BASE_URL=https://provider.example/api
WEATHER_API_KEY=replace_with_provider_key
WEATHER_API_BASE_URL=https://provider.example/api
COPERNICUS_CLIENT_ID=replace_with_client_id
COPERNICUS_CLIENT_SECRET=replace_with_client_secret
NASA_EARTHDATA_TOKEN=optional_provider_token
STORAGE_BUCKET=your-secure-evidence-bucket
STORAGE_REGION=your-region
ALERT_WEBHOOK_URL=https://your-alert-service.example/webhook
JWT_SECRET=generate_a_long_random_secret
OAUTH_CLIENT_ID=replace_with_client_id
OAUTH_CLIENT_SECRET=replace_with_client_secret

# Browser-safe values only
VITE_APP_ENV=development
VITE_PUBLIC_MAP_STYLE_ID=optional_public_style_id
```

## 3. Backend Work Required Before Going Live

The current project is intentionally frontend-only. To operate it safely, add server-side routes or services for the following responsibilities:

| Route/service | Responsibility | Security requirements |
|---|---|---|
| `GET /api/signals` | Return normalised and time-bounded hotspot cards for the map. | Rate limiting, cached upstream calls, response schema validation. |
| `GET /api/forecast` | Return corridor forecast layers and confidence for selected forecast windows. | Provider credential isolation, provenance and model-version metadata. |
| `POST /api/reports/upload-url` | Create a short-lived signed URL for image/sensor evidence upload. | Auth or anti-abuse control, file type/size allowlist, malware scanning. |
| `POST /api/reports` | Save structured field reports and place them in a verification queue. | Consent record, encryption at rest, coarse location options, audit trail. |
| `POST /api/alerts/brief` | Create a human-reviewed alert brief and deliver it to permitted desks. | Role-based access, approval step, idempotency key, delivery logs. |

## 4. Data Model to Keep Consistent

Use one shared shape across all providers so the map, forecast, and alert logic can interoperate.

```ts
type PollutionSignal = {
  id: string;
  countryCode: "BR" | "RU" | "IN" | "CN" | "ZA";
  location: { lat: number; lng: number; precisionMeters?: number };
  observedAt: string; // ISO 8601
  pollutant: "pm25" | "pm10" | "no2" | "o3" | "smoke";
  value?: number;
  unit?: string;
  sourceKinds: Array<"official_station" | "low_cost_sensor" | "satellite" | "weather_model" | "citizen_report">;
  confidence: number; // 0–1
  verificationStatus: "unreviewed" | "corroborated" | "verified" | "rejected";
  forecast: { horizonHours: number; affectedCorridorIds: string[]; modelVersion: string }[];
};
```

## 5. Privacy, Governance, and Safety Checklist

Citizen reports can include identifiable images, precise locations, and sensitive environmental claims. Show clear consent, allow a reporter to reduce location precision, delete raw evidence on a documented retention schedule, and require human review before public attribution or authority escalation. For cross-border model sharing, exchange the minimum necessary derived features and maintain a record of model version, source provenance, and confidence rather than automatically sharing raw media.

## 6. Where to Change the Demo Data

The interactive map’s demonstration signals are located in:

```text
client/src/pages/Home.tsx → const signals = [...]
```

Replace this constant with a typed data-fetching layer once a backend is available. The report drawer currently shows a successful demo toast; change its submit handler to upload evidence and call `POST /api/reports` only after the server-side protections above are implemented.

## 7. Practical Hackathon Scope

For a strong demo, connect one air-quality source, one weather source, and a simple secure report endpoint first. Then show how the same `PollutionSignal` structure can accept satellite and partner-model data. This demonstrates interoperability without pretending that every national dataset or alert channel is already live.

