# Live Feed Decision

The first working data adapter will use the public Open-Meteo APIs from the server side. The Air Quality API exposes current and hourly PM2.5, PM10, nitrogen dioxide, aerosol optical depth, and index values; its forecast window supports several days. The Weather Forecast API exposes current and hourly wind speed, wind direction, precipitation, cloud cover, temperature, humidity, pressure, and visibility. The adapter will request only the fields needed by the dashboard and will return a typed degraded state when an upstream call is unavailable.

The public no-key route is suitable for a hackathon demonstration and should be replaced with approved national data partners, licensed satellite products, and explicit data-sharing agreements before any operational use. Source documentation reviewed: https://open-meteo.com/en/docs/air-quality-api and https://open-meteo.com/en/docs.
