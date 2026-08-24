# Live Feed Decision

The first working data adapter will use the public Open-Meteo APIs from the server side. The Air Quality API exposes current and hourly PM2.5, PM10, nitrogen dioxide, aerosol optical depth, and index values; its forecast window supports several days. The Weather Forecast API exposes current and hourly wind speed, wind direction, precipitation, cloud cover, temperature, humidity, pressure, and visibility. The adapter will request only the fields needed by the dashboard and will return a typed degraded state when an upstream call is unavailable.

The public no-key route is suitable for a hackathon demonstration and should be replaced with approved national data partners, licensed satellite products, and explicit data-sharing agreements before any operational use. Source documentation reviewed: https://open-meteo.com/en/docs/air-quality-api and https://open-meteo.com/en/docs.

## Production Satellite Access Finding

Copernicus Data Space Ecosystem Sentinel Hub requires an OAuth 2.0 access token. A production integration should register an OAuth client, retain the client ID and secret only on the server, obtain tokens through the client-credentials grant at `https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token`, and cache/reuse tokens rather than minting a token per imagery request. Official source: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Overview/Authentication.html.

## Production Ground and Fire Findings

NASA FIRMS requires a free `MAP_KEY` for its API and map services; it provides MODIS and VIIRS active-fire data suitable for an agricultural-burning evidence layer. Store the key as a server-only secret and plan the product transition identified by NASA for Suomi NPP data after 1 November 2026. Official source: https://firms.modaps.eosdis.nasa.gov/api/map_key/.

OpenAQ API v3 requires a registered API key supplied as the `X-API-Key` header on each request. Keys can be issued and rotated through the OpenAQ Explorer account. Store this as a server-only `OPENAQ_API_KEY` secret and retain the source/provider metadata that OpenAQ returns with each measurement. Official source: https://docs.openaq.org/using-the-api/api-key.

## Production Meteorology Finding

ECMWF Open Data exposes a subset of real-time IFS and AIFS forecasts under CC-BY-4.0, including 10 m wind components, cloud cover, temperature, precipitation, pressure-level winds, and ensemble products. It is available at 0.25° in GRIB2; the open rolling archive only retains roughly 2–3 days of recent runs, and access is constrained by a 500-simultaneous-connection limit. Use it as a no-key secondary meteorology feed with a local ingest/cache worker and obtain an ECMWF dissemination service agreement for higher-resolution or guaranteed operational access. Official source: https://www.ecmwf.int/en/forecasts/datasets/open-data.

## Satellite Layer Implementation Finding

The operational dashboard now retrieves a server-rendered Sentinel-5P L2 layer for each configured city through the Copernicus Process API. The implementation uses the documented `sentinel-5p-l2` collection and supports NO2 plus UV aerosol index rendering. Browser verification confirmed the dashboard is receiving current public weather/air-quality values and that the city dossier exposes the satellite workflow without making Copernicus credentials available to the client.

The active signal field browser view reported five current BRICS city snapshots and an explicit live-feed state after the production credential validation. The server-side satellite renderer is independently covered by an integration test using the configured Copernicus OAuth client.

An end-to-end browser check opened the New Delhi city dossier and rendered the protected Copernicus Sentinel-5P L2 NO2 image as a fresh server-side result. The interface exposed NO2 and aerosol choices while preserving the provider credential boundary: the browser receives only rendered image data, never the OAuth client secret or access token.
