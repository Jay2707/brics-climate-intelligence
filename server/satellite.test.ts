import { describe, expect, it } from "vitest";
import { getSatelliteLayer } from "./satellite";

describe("Copernicus Sentinel-5P satellite integration", () => {
  it("returns a rendered live NO2 layer for a configured BRICS city", async () => {
    const layer = await getSatelliteLayer({ city: "New Delhi", layer: "no2" });
    expect(layer.city).toBe("New Delhi");
    expect(layer.source).toBe("Copernicus Sentinel-5P L2");
    expect(layer.imageBase64.length).toBeGreaterThan(100);
  }, 60_000);
});
