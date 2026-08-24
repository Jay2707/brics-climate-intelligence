# Full-Stack Upgrade Checklist

- [x] Upgrade the project with database, authentication, and secure file storage support.
- [x] Define the pollution-signal, evidence-report, verification, and alert data model.
- [x] Add a live public weather and air-quality adapter with safe fallback states.
- [x] Add role-aware access for reporter, verifier, city desk, national desk, and administrator workflows.
- [x] Implement secure evidence upload, verification actions, and human-reviewed alert briefing.
- [x] Update the dashboard UI to surface live status, connected-source health, and role-specific actions.
- [x] Validate the build, role gates, and secure submission paths; document required secrets and activation steps.
- [x] Add an in-product reviewer desk for corroborating submitted evidence, drafting an alert, and dispatching approved briefings by role.
- [x] Add automated tests for reporter, reviewer, and dispatcher role-gate decisions.
- [x] Add a live detail drawer that presents a consistent city snapshot whenever a map pin, focus card, or country filter is selected.
- [x] Add explicit refresh, loading, stale-data, and live-response feedback to the operational signal field.
- [x] Improve map and interaction controls for touch-first mobile use and keyboard accessibility.
- [x] Document the no-key public data path and the API keys required for partner-grade air-quality, satellite, and authority-alert integrations.
- [x] Validate interactive desktop and mobile workflows after the upgrade.
- [x] Define the production source architecture for weather, satellite, ground-air-quality, and federated-model data.
- [x] Research official provider credentials, licensing, data formats, refresh expectations, and BRICS coverage.
- [x] Add production integration configuration placeholders and a map-layer implementation plan without exposing credentials to the browser.
- [x] Publish the exact environment-variable, dataset, governance, and rollout checklist for an operational deployment.
