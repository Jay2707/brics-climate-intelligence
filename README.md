# BRICS Climate Intelligence

A full-stack early-warning platform for cross-border air-quality events across BRICS cities. It combines live public air-quality and weather data, server-rendered Sentinel-5P satellite layers, consented citizen evidence, and a human-approved alert workflow.

> **Status:** hackathon prototype. Live data uses public no-key sources. Alert dispatch records approvals and notifies the project owner only; it does not contact any government authority.

## Features

- **Live signal field** – Current PM2.5, PM10, NO₂, aerosol optical depth, US AQI, wind, cloud cover and precipitation for New Delhi, Beijing, São Paulo, Johannesburg and Moscow. Forecast horizons: Now, +6h, +12h, +24h. Server-side cache of 60 seconds, with manual refresh and explicit live / degraded / unavailable states.
- **City dossier** – Per-city readout plus protected Copernicus Sentinel-5P L2 imagery (NO₂ and UV aerosol index). Provider credentials never reach the browser; the client receives only the rendered image.
- **Evidence bridge** – Authenticated, consented reports (smoke/haze, industrial emissions, agricultural burning, sensor reading) with optional attachment (JPEG, PNG, WebP, CSV, TXT, JSON, up to 5 MB) stored in object storage.
- **Human-governed alerts** – Evidence must be corroborated by a reviewer before an alert briefing can be prepared. Briefings stay `awaiting_approval` until a national desk or admin dispatches them.
- **Role-based access** – Enforced on the server, not just hidden in the UI.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Radix UI / shadcn, Recharts, react-simple-maps, Framer Motion, wouter |
| API | Express, tRPC 11, superjson, zod |
| Database | MySQL via Drizzle ORM |
| Auth | OAuth session flow, JWT cookies (`jose`) |
| Storage | S3-compatible object storage |
| Tooling | TypeScript 5.9, pnpm, Vitest, Prettier, esbuild |

## Project Structure

```
client/          React app (pages, components, hooks, UI primitives)
server/          Express + tRPC backend
  _core/         Auth, context, env, LLM, maps, storage, notification helpers
  routers/       climate, satellite, evidence (evidence, alerts, access)
  liveClimate.ts Open-Meteo adapter
  satellite.ts   Copernicus Sentinel-5P Process API adapter
shared/          Types and constants shared by client and server
drizzle/         Schema, migrations, snapshots
docs/            Demo sequence, integration playbook, audits, data decisions
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10
- A MySQL database

### Install and run

```bash
pnpm install
pnpm db:push      # generate and apply migrations
pnpm dev          # development server
```

### Other scripts

| Command | Description |
|---|---|
| `pnpm check` | Type-check with `tsc --noEmit` |
| `pnpm test` | Run the Vitest suite |
| `pnpm build` | Build client (Vite) and bundle server (esbuild) into `dist/` |
| `pnpm start` | Run the production build |
| `pnpm format` | Format with Prettier |

## Configuration

Set these as server-side environment variables. Never expose secrets through `VITE_*` variables or commit a `.env` file.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Session cookie signing secret |
| `VITE_APP_ID` | OAuth application ID |
| `OAUTH_SERVER_URL` | OAuth server base URL |
| `OWNER_OPEN_ID` | Account treated as administrator |
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | Platform services (storage, notifications, LLM) |
| `COPERNICUS_CLIENT_ID` / `COPERNICUS_CLIENT_SECRET` | Required only for the Sentinel-5P satellite layer |

Live air-quality and weather data need **no API key** (Open-Meteo public endpoints). Sentinel-5P imagery needs a Copernicus Data Space OAuth client.

## Roles

New users start as `reporter`. The project owner is an administrator automatically. Promote others with the admin-only `access.assignRole` procedure or directly in the database.

| Role | Can do |
|---|---|
| `reporter` | Submit consented evidence, view own reports |
| `verifier` | View review queue, corroborate or reject evidence |
| `city_desk` | Review evidence, prepare alert briefings |
| `national_desk` | Review, prepare, and approve/dispatch alerts |
| `admin` | All of the above plus role assignment |

## API Overview (tRPC)

| Router | Procedures |
|---|---|
| `climate` | `liveSignals`, `refresh` |
| `satellite` | `getLayer` (city, `no2` or `aerosol`) |
| `evidence` | `submit`, `mine`, `reviewQueue`, `review` |
| `alerts` | `reviewQueue`, `createFromEvidence`, `dispatch` |
| `access` | `assignRole` |
| `auth` | `me`, `logout` |

## Data Sources

- [Open-Meteo Air Quality and Weather APIs](https://open-meteo.com/en/docs/air-quality-api) – live prototype feed
- Copernicus Data Space Sentinel Hub, Sentinel-5P L2 – satellite layer
- Documented for production: NASA FIRMS, OpenAQ v3, ECMWF Open Data

See `docs/live-data-decision.md` and `docs/PRODUCTION_INTEGRATION_PLAYBOOK.md` for credential requirements and the path from prototype to partner-governed production.

## Documentation

- `INTEGRATION_GUIDE.md` – live deployment, roles, evidence workflow, optional partner delivery
- `docs/HACKATHON_DEMO_SEQUENCE.md` – 90-second demo flow
- `docs/PRODUCTION_INTEGRATION_PLAYBOOK.md` – production integration steps
- `docs/COMPETITION_READINESS_AUDIT.md` – design, accessibility and attribution audit
- `docs/live-data-decision.md` – data-source decisions
- `docs/WORLD_MAP_INTEGRATION.md` – world map integration notes

## Limitations

- Public no-key data is for evaluation and non-commercial use; replace with approved national, licensed, or partner sources before operational use.
- Alert dispatch notifies the project owner only. Delivery to real authorities (webhook, email/SMS, message broker) needs an approved endpoint, recipient allowlists, retries, and a security review.
- Some UI content is illustrative and is labelled as such in the interface.

## License

MIT
