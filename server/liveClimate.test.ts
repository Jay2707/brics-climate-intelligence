import { describe, expect, it } from "vitest";
import { classifyAirQuality } from "./liveClimate";

describe("classifyAirQuality", () => {
  it("maps the current index into the three operational presentation bands", () => {
    expect(classifyAirQuality(42)).toBe("Watch");
    expect(classifyAirQuality(128)).toBe("Elevated");
    expect(classifyAirQuality(184)).toBe("High");
  });
});
