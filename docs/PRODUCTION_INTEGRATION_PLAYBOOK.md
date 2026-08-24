# BRICS Climate Intelligence: Production Data and Federation Playbook

## Deployment Position

The dashboard now operates with three live data paths. The first is the existing no-key public weather and air-quality adapter. The second is a server-rendered Copernicus Sentinel-5P atmospheric layer, authenticated using the configured OAuth client and exposed to the browser only as a rendered image. The third is the prepared ground-observation and active-fire credential path, validated against OpenAQ and NASA FIRMS, ready for the next ingestion adapters.

> A production federated platform must keep **source data, consent, jurisdiction, uncertainty, and model provenance** separate. It should not treat a satellite raster, a low-cost sensor, and a citizen report as equivalent evidence.

## Required Environment Variables

All values below are server-only secrets. Do not place them in a `VITE_*` variable, a browser request, a source file, a test fixture, or a public dataset URL.

| Variable | Status | Purpose | Obtain from |
|---|---|---|---|
| `COPERNICUS_CLIENT_ID` | Required for live atmospheric satellite layers | OAuth client ID for Sentinel Hub Process/Catalog API | Copernicus Data Space dashboard → OAuth clients |
| `COPERNICUS_CLIENT_SECRET` | Required for live atmospheric satellite layers | OAuth client secret used to obtain short-lived server access tokens | Copernicus Data Space dashboard → OAuth clients |
| `FIRMS_MAP_KEY` | Required for the active-fire adapter | Near-real-time MODIS/VIIRS fire detections and fire map services | NASA FIRMS map-key request page |
| `OPENAQ_API_KEY` | Required for global ground-observation adapter | OpenAQ v3 current observations, metadata, providers, and source licences | OpenAQ Explorer account |
| `ALERT_WEBHOOK_URL` | Required before external authority delivery | Approved authority or operations-desk endpoint | Partner authority / coordination centre |
| `ALERT_WEBHOOK_TOKEN` | Required if the authority endpoint uses bearer authentication | Signs or authenticates alert delivery | Partner authority / coordination centre |
| `FEDERATION_CLIENT_ID` | Required for country-node exchange | OIDC client ID for a federation partner | Each approved national node |
| `FEDERATION_CLIENT_SECRET` | Required for country-node exchange | OIDC client secret for short-lived federation tokens | Each approved national node |
| `FEDERATION_CA_CERT` | Required for mutual TLS deployments | PEM certificate authority chain used to verify partner nodes | Federation trust authority |
| `FEDERATION_CLIENT_CERT` | Required for mutual TLS deployments | PEM client certificate for this platform’s node identity | Federation trust authority |
| `FEDERATION_CLIENT_KEY` | Required for mutual TLS deployments | PEM private key paired with the client certificate | Federation trust authority / HSM export workflow |
| `MODEL_REGISTRY_URL` | Required for federated model versioning | Partner-approved registry for signed model manifests and evaluation reports | Consortium platform team |

The built-in base-map proxy requires no separate user Google Maps key. The existing Open-Meteo implementation also requires no key for its current public-feed use case. ECMWF Open Data can serve as a no-key secondary weather source, but a service agreement is appropriate for guaranteed, higher-resolution, or higher-volume operations.[1]

## Recommended Operational Datasets

| Decision layer | Production dataset | Variables to ingest | Format and refresh expectation | Integration role |
|---|---|---|---|---|
| Meteorology | ECMWF IFS/AIFS Open Data, then a licensed/national forecast feed for SLA coverage | 10 m wind components, pressure-level wind, boundary-layer proxies, cloud cover, precipitation, temperature, humidity | GRIB2; publish ingest products on model-cycle cadence | Drives transport, dispersion, and uncertainty envelopes |
| Satellite atmosphere | Copernicus Sentinel-5P Level 2 | `NO2`, `AER_AI_340_380` or `AER_AI_354_388`, CO, SO₂, O₃ where scientifically suitable | Process API for display; GeoTIFF/COG for science workflow; do not interpret no-data as zero | Identifies regional trace-gas and aerosol patterns |
| Fire and burning | NASA FIRMS VIIRS NOAA-20/NOAA-21 and MODIS products | Latitude, longitude, acquisition time, confidence, FRP, instrument, day/night | CSV, GeoJSON conversion, or map service; ingest near-real-time intervals | Detects agricultural-burning candidate sources and supports plume attribution |
| Ground observations | OpenAQ v3 plus direct contracts with national monitoring networks | PM2.5, PM10, NO₂, SO₂, CO, O₃, AQI, station metadata, measurement flags, licence | Provider timestamps must remain UTC; retain source owner/licence and QA flags | Validates satellite and model signals near communities |
| Citizen evidence | Secure first-party reports and calibrated partner sensors | Consent, geometry precision policy, media hash, observation time, device/sensor QA, verification state | Object storage plus database metadata; never expose raw private evidence by default | Supplies local context, not unverified truth |

Sentinel Hub documents `sentinel-5p-l2` as the relevant data collection and identifies NO₂ and aerosol-index bands; it also recommends using `dataMask` to distinguish no-data pixels from zero measurements.[2] NASA FIRMS requires a free map key for API and map-service access and publishes near-real-time MODIS and VIIRS detections.[3] OpenAQ v3 authenticates requests through the `X-API-Key` header and requires the application to preserve its attribution and provider metadata.[4]

## Map-Layer Architecture

The browser should never call Copernicus, OpenAQ, NASA FIRMS, or a national provider directly. The production route is:

1. A server connector retrieves a provider response with the relevant secret and validates the source timestamp, response schema, and licence metadata.
2. A normalisation worker writes raw provenance to object storage and a derived, geographically clipped product to the data store.
3. A tile/render service creates short-lived PNG, COG, or vector-tile responses for the dashboard. The current dashboard demonstrates this pattern with server-rendered Sentinel-5P NO₂ and aerosol images.
4. The client receives only the clipped render, timestamp, layer identifier, cache state, uncertainty notice, and attribution—not a provider key, OAuth token, raw protected record, or unrestricted dataset URL.

For a full regional map, store science-grade rasters as Cloud Optimized GeoTIFF or Zarr/Parquet derivatives and publish tiles through a controlled renderer. Use PostGIS for station points, reports, corridor geometries, and alert zones. Keep every raster/vector record with `source`, `observed_at`, `ingested_at`, `licence`, `quality_flag`, `spatial_resolution`, `temporal_resolution`, and `processing_version` fields.

## Federated Model Contract

Federation is an operating model, not a single public API. Each BRICS participant should operate a country node within its own approved jurisdiction. The node keeps raw sensor, citizen, and restricted national data locally; it exchanges only a signed model update, calibrated aggregate, uncertainty metric, evaluation summary, and data-availability statement.

| Exchange object | Minimum fields | Security and governance requirement |
|---|---|---|
| Model manifest | model ID, semantic version, feature schema hash, training window, validation score, known limitations | Signed by the issuing node; registry verifies the signature before promotion |
| Aggregated update | partner node ID, aggregation round, clipped/secure update, sample-size band, differential-privacy budget if used | Mutual TLS plus OIDC token; do not include row-level measurements or unreviewed citizen media |
| Prediction envelope | corridor geometry, horizon, value, confidence interval, model version, source timestamp | Include expiry time and explainability/provenance links |
| Alert recommendation | severity, affected zone, evidence IDs, uncertainty, responsible desk, human-approval state | Cannot reach an authority endpoint until a permitted reviewer approves it |

Use a partner-specific OpenID Connect issuer and mutual TLS for node-to-node authentication. `FEDERATION_*` variables above belong in server secrets or a dedicated key-management system; production private keys should be generated and retained in an HSM/KMS where possible. Do not begin model exchange until each participant has signed the same data-sharing agreement, model-card template, incident-response process, retention schedule, and cross-border legal basis.

## Production Rollout Order

Start with the already validated Copernicus layer and the public weather feed, then add FIRMS active-fire ingestion. Add OpenAQ only as a supplementary global index; for authority-facing dashboards, make direct agreements with the relevant Brazilian, Russian, Indian, Chinese, and South African national or municipal monitoring bodies. Calibrate against regulatory-grade stations before exposing health-risk labels. Finally, launch federation in a two-node sandbox with a single approved corridor, signed manifests, rollback controls, and human review before widening to all partner desks.

## References

[1] [ECMWF Open Data](https://www.ecmwf.int/en/forecasts/datasets/open-data)

[2] [Copernicus Sentinel-5P Level 2 data documentation](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/S5PL2.html)

[3] [NASA FIRMS MAP_KEY documentation](https://firms.modaps.eosdis.nasa.gov/api/map_key/)

[4] [OpenAQ API key documentation](https://docs.openaq.org/using-the-api/api-key)
