import { describe, expect, it } from "vitest";
import {
  normalizeLocation,
  normalizeTransmitter
} from "./records";

const now = "2026-07-28T12:00:00.000Z";

describe("normalizeLocation", () => {
  it("trims a name and converts valid coordinates", () => {
    const result = normalizeLocation(
      {
        name: "  Main site  ",
        latitude: "43.8563",
        longitude: "18.4131"
      },
      { id: "location-1", createdAt: "2026-01-01T00:00:00.000Z" },
      now
    );

    expect(result).toEqual({
      error: "",
      location: {
        id: "location-1",
        name: "Main site",
        latitude: 43.8563,
        longitude: 18.4131,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: now
      }
    });
  });

  it.each([
    ["an empty name", { name: "", latitude: 0, longitude: 0 }],
    ["an empty latitude", { name: "A", latitude: "", longitude: 0 }],
    ["an empty longitude", { name: "A", latitude: 0, longitude: "" }],
    ["an invalid latitude", { name: "A", latitude: 91, longitude: 0 }],
    ["an invalid longitude", { name: "A", latitude: 0, longitude: -181 }]
  ])("rejects %s", (_label, input) => {
    expect(normalizeLocation(input, {}, now).error).not.toBe("");
  });
});

describe("normalizeTransmitter", () => {
  it("normalizes a transmitter and preserves stable metadata", () => {
    const result = normalizeTransmitter(
      {
        locationId: "location-1",
        name: "  Repeater A ",
        frequency: "145.725"
      },
      {
        id: "transmitter-1",
        locationId: "location-1",
        createdAt: "2026-01-01T00:00:00.000Z"
      },
      now
    );

    expect(result).toEqual({
      error: "",
      transmitter: {
        id: "transmitter-1",
        locationId: "location-1",
        name: "Repeater A",
        frequency: 145.725,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: now
      }
    });
  });

  it.each([
    [
      "a missing location",
      { locationId: "", name: "A", frequency: 100 }
    ],
    [
      "an empty name",
      { locationId: "location-1", name: "", frequency: 100 }
    ],
    [
      "an invalid frequency",
      { locationId: "location-1", name: "A", frequency: -1 }
    ]
  ])("rejects %s", (_label, input) => {
    expect(normalizeTransmitter(input, {}, now).error).not.toBe("");
  });
});
