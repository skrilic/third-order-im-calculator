import { describe, expect, it } from "vitest";
import {
  IMPORT_PROFILE,
  IMPORT_PROFILE_VERSION,
  MAX_IMPORT_BYTES,
  geoImportToRecords,
  parseGeoImport,
  validateGeoImport
} from "./geoImport";

function createFeature(overrides = {}) {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [17.651833, 43.12853]
    },
    properties: {
      siteId: "CRNOBRDO-01",
      name: "Crno Brdo",
      transmitters: [
        { name: "BH Radio 1 - Crno Brdo", frequencyMhz: 87.8 }
      ],
      ...overrides.properties
    },
    ...overrides.feature
  };
}

function createDocument(features = [createFeature()]) {
  return {
    type: "FeatureCollection",
    toic: { profile: IMPORT_PROFILE, version: IMPORT_PROFILE_VERSION },
    features
  };
}

describe("validateGeoImport", () => {
  it("accepts a minimal valid document", () => {
    expect(validateGeoImport(createDocument())).toEqual({ ok: true, errors: [] });
  });

  it("rejects a non-object candidate", () => {
    const result = validateGeoImport([]);

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it("rejects a plain GeoJSON file without the toic profile member", () => {
    const document = createDocument();
    delete document.toic;

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('Missing "toic" member');
  });

  it("rejects an unknown profile name", () => {
    const document = createDocument();
    document.toic.profile = "toic-transmitters";

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("Unsupported profile");
  });

  it("rejects a future profile version", () => {
    const document = createDocument();
    document.toic.version = 2;

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("Unsupported profile version");
  });

  it("rejects a wrong top-level type", () => {
    const document = createDocument();
    document.type = "Feature";

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("FeatureCollection");
  });

  it("rejects an empty feature list", () => {
    const result = validateGeoImport(createDocument([]));

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("at least one Feature");
  });

  it("rejects non-Point geometry", () => {
    const document = createDocument([
      createFeature({
        feature: {
          geometry: { type: "Polygon", coordinates: [] }
        }
      })
    ]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('geometry type must be "Point"');
  });

  it("rejects coordinates outside the valid range", () => {
    const document = createDocument([
      createFeature({
        feature: {
          geometry: { type: "Point", coordinates: [200, 100] }
        }
      })
    ]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it("rejects swapped coordinate order that leaves latitude out of range", () => {
    // [lat, lon] instead of [lon, lat]: 143.5 is not a valid latitude.
    const document = createDocument([
      createFeature({
        feature: {
          geometry: { type: "Point", coordinates: [43.12853, 143.5] }
        }
      })
    ]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("latitude");
  });

  it("accepts a third elevation coordinate", () => {
    const document = createDocument([
      createFeature({
        feature: {
          geometry: { type: "Point", coordinates: [17.651833, 43.12853, 1420] }
        }
      })
    ]);

    expect(validateGeoImport(document).ok).toBe(true);
  });

  it("requires siteId", () => {
    const document = createDocument([
      createFeature({ properties: { siteId: "  " } })
    ]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("siteId");
  });

  it("rejects duplicate siteId values", () => {
    const document = createDocument([createFeature(), createFeature()]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('repeats siteId "CRNOBRDO-01"');
  });

  it("requires a non-empty transmitter list", () => {
    const document = createDocument([
      createFeature({ properties: { transmitters: [] } })
    ]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("must not be empty");
  });

  it("rejects a string frequency", () => {
    const document = createDocument([
      createFeature({
        properties: {
          transmitters: [{ name: "Tx", frequencyMhz: "87.8" }]
        }
      })
    ]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("frequencyMhz must be a number");
  });

  it("rejects a zero frequency", () => {
    const document = createDocument([
      createFeature({
        properties: {
          transmitters: [{ name: "Tx", frequencyMhz: 0 }]
        }
      })
    ]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("greater than 0");
  });

  it("rejects a repeated frequency on the same site", () => {
    const document = createDocument([
      createFeature({
        properties: {
          transmitters: [
            { name: "Tx A", frequencyMhz: 87.8 },
            { name: "Tx B", frequencyMhz: 87.8 }
          ]
        }
      })
    ]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("repeats frequency");
  });

  it("allows the same frequency on different sites", () => {
    const document = createDocument([
      createFeature(),
      createFeature({
        properties: { siteId: "FORTICA-01", name: "Fortica" },
        feature: {
          geometry: { type: "Point", coordinates: [17.831889, 43.353806] }
        }
      })
    ]);

    expect(validateGeoImport(document).ok).toBe(true);
  });

  it("ignores unknown regulator metadata properties", () => {
    const document = createDocument([
      createFeature({
        properties: {
          organization: "BH Radio 1",
          stationClass: "BC",
          serviceType: "FM Broadcasting",
          transmitters: [
            {
              name: "BH Radio 1 - Crno Brdo",
              frequencyMhz: 87.8,
              organization: "BH Radio 1",
              stationClass: "BC"
            }
          ]
        }
      })
    ]);

    expect(validateGeoImport(document).ok).toBe(true);
  });

  it("rejects a non-string stationClass", () => {
    const document = createDocument([
      createFeature({
        properties: {
          transmitters: [
            { name: "Tx", frequencyMhz: 87.8, stationClass: 12 }
          ]
        }
      })
    ]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("stationClass");
  });

  it("accepts a missing or empty stationClass", () => {
    const document = createDocument([
      createFeature({
        properties: {
          transmitters: [
            { name: "Tx A", frequencyMhz: 87.8, stationClass: "" },
            { name: "Tx B", frequencyMhz: 91.3 }
          ]
        }
      })
    ]);

    expect(validateGeoImport(document).ok).toBe(true);
  });

  it("reports every problem in the file, not just the first", () => {
    const document = createDocument([
      createFeature({ properties: { siteId: "", name: "" } }),
      createFeature({
        properties: {
          siteId: "OK-01",
          transmitters: [{ name: "", frequencyMhz: -1 }]
        }
      })
    ]);

    const result = validateGeoImport(document);

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});

describe("geoImportToRecords", () => {
  it("maps a site to one location and its nested transmitters", () => {
    const document = createDocument([
      createFeature({
        properties: {
          transmitters: [
            { name: "BH Radio 1", frequencyMhz: 87.8 },
            { name: "Radio Bobar", frequencyMhz: 105.5 }
          ]
        }
      })
    ]);

    const records = geoImportToRecords(document);

    expect(records.locations).toEqual([
      {
        id: "CRNOBRDO-01",
        name: "Crno Brdo",
        latitude: 43.12853,
        longitude: 17.651833
      }
    ]);
    expect(records.transmitters).toEqual([
      {
        id: "CRNOBRDO-01::87.8",
        locationId: "CRNOBRDO-01",
        name: "BH Radio 1",
        frequency: 87.8
      },
      {
        id: "CRNOBRDO-01::105.5",
        locationId: "CRNOBRDO-01",
        name: "Radio Bobar",
        frequency: 105.5
      }
    ]);
  });

  it("persists stationClass and omits the key when it is absent or blank", () => {
    const document = createDocument([
      createFeature({
        properties: {
          transmitters: [
            { name: "Broadcast", frequencyMhz: 87.8, stationClass: " BC " },
            { name: "Blank", frequencyMhz: 91.3, stationClass: "  " },
            { name: "Missing", frequencyMhz: 105.5 }
          ]
        }
      })
    ]);

    const records = geoImportToRecords(document);

    expect(records.transmitters[0].stationClass).toBe("BC");
    expect(records.transmitters[1]).not.toHaveProperty("stationClass");
    expect(records.transmitters[2]).not.toHaveProperty("stationClass");
  });

  it("reads coordinates as [longitude, latitude]", () => {
    const records = geoImportToRecords(createDocument());

    expect(records.locations[0].longitude).toBe(17.651833);
    expect(records.locations[0].latitude).toBe(43.12853);
  });

  it("derives stable IDs so repeated conversion is idempotent", () => {
    const first = geoImportToRecords(createDocument());
    const second = geoImportToRecords(createDocument());

    expect(first).toEqual(second);
  });

  it("trims surrounding whitespace in names and site IDs", () => {
    const document = createDocument([
      createFeature({
        properties: {
          siteId: "  CRNOBRDO-01  ",
          name: "  Crno Brdo  ",
          transmitters: [{ name: "  Tx  ", frequencyMhz: 87.8 }]
        }
      })
    ]);

    const records = geoImportToRecords(document);

    expect(records.locations[0].id).toBe("CRNOBRDO-01");
    expect(records.locations[0].name).toBe("Crno Brdo");
    expect(records.transmitters[0].name).toBe("Tx");
    expect(records.transmitters[0].locationId).toBe("CRNOBRDO-01");
  });
});

describe("parseGeoImport", () => {
  it("parses a valid document into records", () => {
    const records = parseGeoImport(JSON.stringify(createDocument()));

    expect(records.locations).toHaveLength(1);
    expect(records.transmitters).toHaveLength(1);
  });

  it("throws a translatable key for malformed JSON", () => {
    expect(() => parseGeoImport("{ not json")).toThrow("errors.geoImportJson");
  });

  it("throws a translatable key with details for an invalid document", () => {
    let caught;

    try {
      parseGeoImport(JSON.stringify({ type: "FeatureCollection", features: [] }));
    } catch (error) {
      caught = error;
    }

    expect(caught.message).toBe("errors.geoImportInvalid");
    expect(caught.details.length).toBeGreaterThan(0);
  });

  it("rejects a file larger than the size limit", () => {
    const oversized = "x".repeat(MAX_IMPORT_BYTES + 1);

    expect(() => parseGeoImport(oversized)).toThrow("errors.geoImportTooLarge");
  });
});
