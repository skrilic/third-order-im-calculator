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
      transmitters: []
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
      transmitters: []
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
