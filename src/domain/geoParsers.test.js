import { describe, expect, it } from "vitest";
import {
  parseCsvTransmitters,
  parseGeoFile,
  parseGeoJsonTransmitters
} from "./geoParsers";

describe("parseCsvTransmitters", () => {
  it("parses valid CSV text with locations and frequencies", () => {
    const csv = `name,latitude,longitude,frequency
Main FM Site,43.8563,18.4131,98.5
Main FM Site,43.8563,18.4131,102.1
PMR Tower,44.1000,17.9000,145.750`;

    const result = parseCsvTransmitters(csv);

    expect(result.locations).toHaveLength(2);
    expect(result.transmitters).toHaveLength(3);

    expect(result.locations[0]).toMatchObject({
      name: "Main FM Site",
      latitude: 43.8563,
      longitude: 18.4131
    });

    const mainTxList = result.transmitters.filter(
      (tx) => tx.locationId === result.locations[0].id
    );
    expect(mainTxList).toHaveLength(2);
    expect(mainTxList[0].frequency).toBe(98.5);
    expect(mainTxList[1].frequency).toBe(102.1);
  });

  it("throws error for missing coordinate columns", () => {
    const csv = `name,frequency\nStation 1,98.5`;
    expect(() => parseCsvTransmitters(csv)).toThrow("errors.csvMissingCoordinates");
  });

  it("filters out duplicate frequencies at the same location", () => {
    const csv = `name,latitude,longitude,frequency
Main FM Site,43.8563,18.4131,98.5
Main FM Site,43.8563,18.4131,98.5
Main FM Site,43.8563,18.4131,102.1`;

    const result = parseCsvTransmitters(csv);
    expect(result.locations).toHaveLength(1);
    expect(result.transmitters).toHaveLength(2);
    expect(result.transmitters[0].frequency).toBe(98.5);
    expect(result.transmitters[1].frequency).toBe(102.1);
  });
});

describe("parseGeoJsonTransmitters", () => {
  it("parses valid GeoJSON FeatureCollection", () => {
    const geojson = JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [18.4131, 43.8563]
          },
          properties: {
            name: "Radio Sljeme FM",
            frequency: 88.1
          }
        }
      ]
    });

    const result = parseGeoJsonTransmitters(geojson);

    expect(result.locations).toHaveLength(1);
    expect(result.transmitters).toHaveLength(1);
    expect(result.locations[0].name).toBe("Radio Sljeme FM");
    expect(result.transmitters[0].frequency).toBe(88.1);
  });

  it("filters out duplicate frequencies at the same location in GeoJSON", () => {
    const geojson = JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [15.9481, 45.9002] },
          properties: { name: "Sljeme FM1", frequency: 88.1 }
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [15.9481, 45.9002] },
          properties: { name: "Sljeme FM1 Dup", frequency: 88.1 }
        }
      ]
    });

    const result = parseGeoJsonTransmitters(geojson);
    expect(result.locations).toHaveLength(1);
    expect(result.transmitters).toHaveLength(1);
    expect(result.transmitters[0].frequency).toBe(88.1);
  });

  it("auto-detects CSV or GeoJSON in parseGeoFile", () => {
    const csv = `lat,lng,freq,name\n43.5,16.4,101.5,Split FM`;
    const result = parseGeoFile(csv, "data.csv");
    expect(result.locations).toHaveLength(1);
    expect(result.transmitters[0].frequency).toBe(101.5);
  });
});
