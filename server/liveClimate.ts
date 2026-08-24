/**
 * Public, no-key atmospheric adapter for the hackathon preview.
 * Replace this source with approved national and satellite partners before operational use.
 */
export type LiveRisk = "Watch" | "Elevated" | "High";

export type LiveClimateSignal = {
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  aqi: number;
  pm25: number;
  pm10: number;
  nitrogenDioxide: number;
  aerosolOpticalDepth: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  precipitation: number;
  forecastAqiInSixHours: number | null;
  trend: "rising" | "stable" | "improving";
  risk: LiveRisk;
  observedAt: string;
};

export type LiveClimateResponse = {
  status: "live" | "degraded" | "unavailable";
  provider: "Open-Meteo public forecast";
  updatedAt: string;
  message: string;
  signals: LiveClimateSignal[];
};

type CityDefinition = Pick<LiveClimateSignal, "city" | "country" | "countryCode" | "latitude" | "longitude">;
type AirResponse = { current?: Record<string, number | string>; hourly?: { time?: string[]; us_aqi?: number[] } };
type WeatherResponse = { current?: Record<string, number | string> };

export const BRICS_CITIES: CityDefinition[] = [
  { city: "New Delhi", country: "India", countryCode: "IN", latitude: 28.6139, longitude: 77.209 },
  { city: "Beijing", country: "China", countryCode: "CN", latitude: 39.9042, longitude: 116.4074 },
  { city: "São Paulo", country: "Brazil", countryCode: "BR", latitude: -23.5505, longitude: -46.6333 },
  { city: "Johannesburg", country: "South Africa", countryCode: "ZA", latitude: -26.2041, longitude: 28.0473 },
  { city: "Moscow", country: "Russia", countryCode: "RU", latitude: 55.7558, longitude: 37.6173 },
];

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedSnapshot: { expiresAt: number; value: LiveClimateResponse } | null = null;

const toNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;

export function classifyAirQuality(aqi: number): LiveRisk {
  if (aqi >= 151) return "High";
  if (aqi >= 101) return "Elevated";
  return "Watch";
}

function getSixHourForecast(air: AirResponse, observedAt: string, currentAqi: number): { forecast: number | null; trend: LiveClimateSignal["trend"] } {
  const targetTime = new Date(new Date(observedAt).getTime() + 6 * 60 * 60 * 1000).getTime();
  const times = air.hourly?.time ?? [];
  const values = air.hourly?.us_aqi ?? [];
  const index = times.findIndex(time => new Date(time).getTime() >= targetTime);
  const forecast = index >= 0 ? values[index] ?? null : null;
  if (forecast === null) return { forecast: null, trend: "stable" };
  if (forecast >= currentAqi + 8) return { forecast, trend: "rising" };
  if (forecast <= currentAqi - 8) return { forecast, trend: "improving" };
  return { forecast, trend: "stable" };
}

async function fetchCitySnapshot(city: CityDefinition): Promise<LiveClimateSignal> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    timezone: "auto",
  });
  const airParams = new URLSearchParams(params);
  airParams.set("current", "us_aqi,pm2_5,pm10,nitrogen_dioxide,aerosol_optical_depth");
  airParams.set("hourly", "us_aqi");
  airParams.set("forecast_days", "1");

  const weatherParams = new URLSearchParams(params);
  weatherParams.set("current", "temperature_2m,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,weather_code");

  const [airResponse, weatherResponse] = await Promise.all([
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`, { signal: AbortSignal.timeout(9_000) }),
    fetch(`https://api.open-meteo.com/v1/forecast?${weatherParams}`, { signal: AbortSignal.timeout(9_000) }),
  ]);
  if (!airResponse.ok || !weatherResponse.ok) throw new Error(`Live source failed for ${city.city}`);

  const [air, weather] = await Promise.all([airResponse.json() as Promise<AirResponse>, weatherResponse.json() as Promise<WeatherResponse>]);
  const airCurrent = air.current ?? {};
  const weatherCurrent = weather.current ?? {};
  const observedAt = typeof airCurrent.time === "string" ? airCurrent.time : new Date().toISOString();
  const aqi = toNumber(airCurrent.us_aqi);
  const { forecast, trend } = getSixHourForecast(air, observedAt, aqi);

  return {
    ...city,
    aqi,
    pm25: toNumber(airCurrent.pm2_5),
    pm10: toNumber(airCurrent.pm10),
    nitrogenDioxide: toNumber(airCurrent.nitrogen_dioxide),
    aerosolOpticalDepth: toNumber(airCurrent.aerosol_optical_depth),
    windSpeed: toNumber(weatherCurrent.wind_speed_10m),
    windDirection: toNumber(weatherCurrent.wind_direction_10m),
    cloudCover: toNumber(weatherCurrent.cloud_cover),
    precipitation: toNumber(weatherCurrent.precipitation),
    forecastAqiInSixHours: forecast,
    trend,
    risk: classifyAirQuality(aqi),
    observedAt,
  };
}

export async function getLiveClimateSnapshot(): Promise<LiveClimateResponse> {
  if (cachedSnapshot && cachedSnapshot.expiresAt > Date.now()) return cachedSnapshot.value;

  const settled = await Promise.allSettled(BRICS_CITIES.map(fetchCitySnapshot));
  const signals = settled.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
  const status: LiveClimateResponse["status"] = signals.length === BRICS_CITIES.length ? "live" : signals.length > 0 ? "degraded" : "unavailable";
  const value: LiveClimateResponse = {
    status,
    provider: "Open-Meteo public forecast",
    updatedAt: new Date().toISOString(),
    message: status === "live" ? "All selected BRICS city snapshots are current." : status === "degraded" ? "Some city snapshots are temporarily unavailable; the available data remains live." : "The public live source is temporarily unavailable.",
    signals,
  };
  if (signals.length > 0) cachedSnapshot = { expiresAt: Date.now() + CACHE_TTL_MS, value };
  return value;
}
