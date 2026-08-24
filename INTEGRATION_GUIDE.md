# BRICS Climate Intelligence — Live Deployment Guide

## What Is Active Now

The project now has a working full-stack foundation. The live signal field fetches current air-quality and weather context for New Delhi, Beijing, São Paulo, Johannesburg, and Moscow through a server-side adapter. It requests PM2.5, PM10, nitrogen dioxide, aerosol optical depth, the U.S. AQI, wind speed and direction, cloud cover, and precipitation, then caches the resulting city snapshot for five minutes. Open-Meteo documents the relevant air-quality and weather parameters and permits key-free evaluation use of its public endpoints.[1][2]

| Capability | Current implementation | Configuration required now |
|---|---|---|
| Live air quality and weather | Server-side Open-Meteo adapter with live/degraded/unavailable states | **None** for the hackathon prototype |
| Sign-in | Built-in OAuth session flow | **None**; the project identity environment is already provided |
| Roles | `reporter`, `verifier`, `city_desk`, `national_desk`, and `admin` in the database | Assign roles after the intended people first sign in |
| Evidence handling | Protected report creation, file validation, built-in object storage, and database metadata | **None**; storage credentials are platform-managed |
| Review workflow | Corroboration required before an alert can be prepared | Verifier or operational-desk role |
| Alert dispatch | Human approval, immutable dispatch timestamps, and a project-owner notification | **None** for owner notification; see optional partner delivery below |

## Roles and Their Responsibilities

The account that owns the project is automatically treated as an administrator. Any person who signs in for the first time is created as a `reporter`; this lets them submit protected evidence but not validate evidence or send operational briefings. Promote selected users through the project database interface or by calling the protected `access.assignRole` procedure as an administrator.

| Role | Can do |
|---|---|
| `reporter` | Submit consented evidence and view their own reports. |
| `verifier` | View the review queue and corroborate or reject evidence. |
| `city_desk` | Review evidence and prepare alert briefings for a city corridor. |
| `national_desk` | Review evidence, prepare briefings, and approve/dispatch alerts. |
| `admin` | All operational actions plus role assignment. |

> The review desk is deliberately hidden unless the authenticated account has a permitted operational role. The server enforces the same role gates, so hiding the UI is not the security boundary.

## Evidence Workflow

An authenticated reporter submits location, country, incident type, observation time, narrative description, consent, and an optional evidence attachment. The backend accepts JPEG, PNG, WebP, CSV, plain-text, and JSON files up to **5 MB**, saves only attachment metadata in the database, and stores the file in the managed object store. A reviewer must corroborate the report before a city or national desk can prepare an alert. An alert remains `awaiting_approval` until a national desk or administrator dispatches it.

## Optional Partner-Authority Delivery

The current dispatch action sends a protected owner notification and records the approval and dispatch timestamps. This allows the full human-reviewed alert path to be demonstrated without claiming it contacts a government authority. To deliver to an actual authority system, add one of the following only after the recipient organisation provides an approved endpoint and routing policy.

| Option | Add to deployment secrets | Implement next |
|---|---|---|
| Government/agency webhook | `ALERT_WEBHOOK_URL` and, if required, `ALERT_WEBHOOK_TOKEN` | Sign outbound requests, restrict recipients by country/role, set retry and idempotency policies, and retain delivery receipts. |
| Email/SMS provider | Provider API key and approved sender configuration | Enforce recipient allowlists, approval workflow, escalation templates, and delivery auditing. |
| National message broker | Broker credentials, topic allowlist, and partner certificate details | Perform a formal security review and introduce durable queues before sending operational messages. |

Never expose any of these values through browser-facing variables such as `VITE_*`. Add all external credentials through the project secrets settings rather than committing them to a `.env` file.

## Database Tables

The migration `drizzle/0000_broad_the_initiative.sql` has been applied. The `users` table now contains the role field; `evidence_reports` contains report metadata, consent, attachment references, and review status; `climate_alerts` contains the reviewable briefing, recipients, approval identity, and delivery state.

## Validation Completed

The project has passed `pnpm check`, `pnpm test`, and `pnpm build`. The live tRPC endpoint returned a current five-city response during validation. The client presents a clear standby or degraded state if the public source is unavailable rather than presenting stale seed data as live information.

## References

[1] [Open-Meteo Air Quality API documentation](https://open-meteo.com/en/docs/air-quality-api)

[2] [Open-Meteo Weather Forecast API documentation](https://open-meteo.com/en/docs)
