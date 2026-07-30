import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION
} from "../domain/backup";

const databaseName = "third-order-im-calculator";
let database;

function deleteTestDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Test database deletion was blocked."));
  });
}

function importPayload(locations, transmitters) {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: "1.0.0",
    exportedAt: "2026-07-28T12:00:00.000Z",
    locations,
    transmitters
  };
}

beforeEach(async () => {
  vi.resetModules();
  await deleteTestDatabase();
  database = await import("./database");
});

afterEach(async () => {
  const connection = await database.openDatabase();
  connection.close();
  await deleteTestDatabase();
});

describe("IndexedDB CRUD", () => {
  it("creates and updates a location and transmitter", async () => {
    const location = await database.saveLocation({
      name: "Main site",
      latitude: 43.8563,
      longitude: 18.4131
    });
    const transmitter = await database.saveTransmitter({
      locationId: location.id,
      name: "Repeater A",
      frequency: 145.725
    });

    await database.saveLocation(
      {
        ...location,
        name: "Renamed site"
      },
      location
    );
    await database.saveTransmitter(
      {
        ...transmitter,
        frequency: 145.75
      },
      transmitter
    );

    const snapshot = await database.getSnapshot();

    expect(snapshot.locations).toHaveLength(1);
    expect(snapshot.locations[0]).toMatchObject({
      id: location.id,
      name: "Renamed site"
    });
    expect(snapshot.transmitters[0]).toMatchObject({
      id: transmitter.id,
      frequency: 145.75
    });
  });

  it("cascade-deletes a location's transmitters", async () => {
    const location = await database.saveLocation({
      name: "Temporary",
      latitude: 44,
      longitude: 18
    });
    await database.saveTransmitter({
      locationId: location.id,
      name: "A",
      frequency: 100
    });

    await database.deleteLocation(location.id);

    expect(await database.getSnapshot()).toEqual({
      locations: [],
      transmitters: [],
      adhocCalculations: []
    });
  });

  it("rejects a transmitter for a missing location", async () => {
    await expect(
      database.saveTransmitter({
        locationId: "missing",
        name: "A",
        frequency: 100
      })
    ).rejects.toThrow("errors.locationMissing");
  });

  it("rejects a transmitter with a duplicate frequency at the same location", async () => {
    const location = await database.saveLocation({
      name: "Repeater Site",
      latitude: 45.0,
      longitude: 16.0
    });

    await database.saveTransmitter({
      locationId: location.id,
      name: "Tx 1",
      frequency: 145.725
    });

    await expect(
      database.saveTransmitter({
        locationId: location.id,
        name: "Tx 2 Duplicate",
        frequency: 145.725
      })
    ).rejects.toThrow("errors.duplicateFrequency");
  });

  it("rejects saving a location with duplicate GPS coordinates", async () => {
    await database.saveLocation({
      name: "Site A",
      latitude: 45.9002,
      longitude: 15.9481
    });

    await expect(
      database.saveLocation({
        name: "Site B Duplicate GPS",
        latitude: 45.9002,
        longitude: 15.9481
      })
    ).rejects.toThrow("errors.duplicateLocation");
  });

  it("atomically imports geo data and merges duplicate GPS locations without duplicating", async () => {
    const geoData1 = {
      locations: [
        { id: "loc-1", name: "Sljeme", latitude: 45.9002, longitude: 15.9481 },
        { id: "loc-2", name: "Trebević", latitude: 43.8563, longitude: 18.4131 }
      ],
      transmitters: [
        { id: "tx-1", locationId: "loc-1", name: "Sljeme FM1", frequency: 88.1 },
        { id: "tx-2", locationId: "loc-1", name: "Sljeme FM2", frequency: 93.7 },
        { id: "tx-3", locationId: "loc-2", name: "Trebević PMR", frequency: 145.625 }
      ]
    };

    await database.importGeoData(geoData1);

    // Re-importing same coordinates under a different name/ID
    const geoData2 = {
      locations: [
        { id: "loc-3", name: "Sljeme Alt Name", latitude: 45.9002, longitude: 15.9481 }
      ],
      transmitters: [
        { id: "tx-4", locationId: "loc-3", name: "Sljeme FM3", frequency: 101.1 },
        { id: "tx-5", locationId: "loc-3", name: "Sljeme FM1 Dup", frequency: 88.1 }
      ]
    };

    await database.importGeoData(geoData2);

    const snapshot = await database.getSnapshot();
    expect(snapshot.locations).toHaveLength(2); // Still 2 locations!
    expect(snapshot.transmitters).toHaveLength(4); // 88.1 dup was skipped, 101.1 added!
  });

  it("creates, updates, and deletes an ad-hoc calculation", async () => {
    const saved = await database.saveAdhocCalculation({
      name: "Adhoc Test",
      stations: [{ name: "Tx 1", frequency: 145.5 }]
    });

    expect(saved.name).toBe("Adhoc Test");
    expect(saved.stations).toHaveLength(1);

    const list = await database.getAdhocCalculations();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(saved.id);

    await database.saveAdhocCalculation(
      {
        ...saved,
        name: "Updated Adhoc Test"
      },
      saved
    );

    const updatedList = await database.getAdhocCalculations();
    expect(updatedList[0].name).toBe("Updated Adhoc Test");

    await database.deleteAdhocCalculation(saved.id);
    expect(await database.getAdhocCalculations()).toEqual([]);
  });

  it("rejects an ad-hoc calculation without a name", async () => {
    await expect(
      database.saveAdhocCalculation({
        name: "   ",
        stations: []
      })
    ).rejects.toThrow("errors.adhocNameRequired");
  });
});

describe("IndexedDB import", () => {
  it("merges records and replaces matching IDs", async () => {
    await database.importSnapshot(
      importPayload(
        [
          {
            id: "location-1",
            name: "Old",
            latitude: 43,
            longitude: 18
          }
        ],
        []
      ),
      "replace"
    );

    await database.importSnapshot(
      importPayload(
        [
          {
            id: "location-1",
            name: "New",
            latitude: 43,
            longitude: 18
          },
          {
            id: "location-2",
            name: "Added",
            latitude: 44,
            longitude: 18
          }
        ],
        [
          {
            id: "transmitter-1",
            locationId: "location-2",
            name: "A",
            frequency: 100
          }
        ]
      ),
      "merge"
    );

    const snapshot = await database.getSnapshot();
    expect(snapshot.locations.map(({ id, name }) => ({ id, name })))
      .toEqual([
        { id: "location-2", name: "Added" },
        { id: "location-1", name: "New" }
      ]);
    expect(snapshot.transmitters).toHaveLength(1);
  });

  it("atomically replaces all existing data", async () => {
    const oldLocation = await database.saveLocation({
      name: "Old",
      latitude: 43,
      longitude: 18
    });
    await database.saveTransmitter({
      locationId: oldLocation.id,
      name: "Old transmitter",
      frequency: 90
    });

    await database.importSnapshot(
      importPayload(
        [
          {
            id: "location-new",
            name: "New",
            latitude: 45,
            longitude: 19
          }
        ],
        []
      ),
      "replace"
    );

    expect(await database.getSnapshot()).toEqual({
      locations: [
        {
          id: "location-new",
          name: "New",
          latitude: 45,
          longitude: 19
        }
      ],
      transmitters: [],
      adhocCalculations: []
    });
  });

  it("does not modify data when validation fails", async () => {
    await database.saveLocation({
      name: "Keep",
      latitude: 43,
      longitude: 18
    });
    const before = await database.getSnapshot();
    const invalid = importPayload([], [
      {
        id: "orphan",
        locationId: "missing",
        name: "A",
        frequency: 100
      }
    ]);

    await expect(
      database.importSnapshot(invalid, "replace")
    ).rejects.toThrow("errors.backupInvalid");
    expect(await database.getSnapshot()).toEqual(before);
  });
});
