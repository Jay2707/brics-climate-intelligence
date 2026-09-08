# World Map Integration

## What Changed

The regional-only signal field now uses a full-world interactive atlas. Users can pan and zoom across the complete world basemap, follow thin corridor lines from the BRICS network anchor to active city signals, and select a city marker to open the existing live dossier. The original evidence, forecast-horizon, country-filter, reviewer, and alert flows remain unchanged.

## AeroSentinel Ideas Applied

The attached AeroSentinel repository contributed three useful product decisions. First, the map is treated as a **corridor intelligence surface** rather than a decorative locator: lines connect the BRICS network context to the city-level signal anchors. Second, the dashboard uses an evidence-to-forecast vocabulary—local signal, detection, forecast, and coordination—that matches the repository’s report, hotspot, forecast, and alert modules. Third, the map keeps a clear distinction between a global geographic context layer and the currently available live signal set.

The AeroSentinel corridor SVG itself was not copied into the product because it only covered the NCR–Punjab bounding box. Instead, its corridor semantics were translated into a world-scale interactive map using the `react-simple-maps` renderer and the `world-atlas` country dataset.

## Current Live Scope

| Map layer | Current implementation | Credential status |
|---|---|---|
| World basemap | `world-atlas` 110m country geometry rendered in the browser | No API key required |
| City signals | Existing server-side live climate adapter for New Delhi, Beijing, São Paulo, Johannesburg, and Moscow | Uses the project’s existing weather/air-quality configuration |
| City dossier | Existing weather, monitoring, forecast, and protected Copernicus layer route | Copernicus server credentials remain server-only |
| Corridor links | BRICS network context lines to selected live city anchors | Derived from the active signal set; not presented as a pollutant plume itself |
| Citizen evidence | Existing consented evidence workflow and reviewer desk | Authentication and storage configuration required |

## Source and Provenance Boundary

The map geometry is geographic context, not a pollution measurement. A marker is a live signal only when the server climate response provides a current snapshot; otherwise the UI retains the safe loading, partial, or unavailable state. Satellite imagery and ground observations remain separate dossier layers. The interface does not claim that a corridor line is a measured plume unless an authorised partner feed supplies that observation.

## Production Expansion Path

The next data layers from the AeroSentinel product brief can be added without changing the map contract: NASA FIRMS active-fire detections, OpenAQ monitoring stations, Sentinel-5P NO₂ and aerosol raster tiles, and partner-authorised weather or ECMWF forecast grids. Each source should arrive through a server-side adapter with provider attribution, timestamp, freshness state, and licensing notes. Federated model outputs should be rendered as forecast or confidence layers, not mixed silently into raw observations.

## API-Key Guidance

The world basemap itself does not need a key. The current public weather/air-quality feed uses the existing no-key path. Production satellite imagery uses the existing server-only `COPERNICUS_CLIENT_ID` and `COPERNICUS_CLIENT_SECRET`. Ground monitoring requires `OPENAQ_API_KEY`, active-fire context requires `FIRMS_MAP_KEY`, and any partner-authorised weather, authority webhook, or federated model endpoint should be configured server-side through the project secrets mechanism.

## Accessibility and Interaction

Markers are keyboard reachable SVG groups with Enter/Space activation, and the map exposes a descriptive accessible label. Touch users can pan and zoom the world map, while the existing city dossier provides the precise values and source context that should not be inferred from marker position alone.

## Validation

The integration was checked with TypeScript, the existing eleven-test suite, production build, desktop full-page screenshot, and mobile full-page screenshot. The full-world atlas renders inside the existing signal layout without requiring a frontend provider key.
