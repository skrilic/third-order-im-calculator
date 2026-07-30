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

  it("appends several transmitters to an existing location in one go", async () => {
    const location = await database.saveLocation({
      name: "Crno Brdo",
      latitude: 43.12853,
      longitude: 17.651833
    });

    await database.saveTransmitter({
      locationId: location.id,
      name: "Existing",
      frequency: 87.8
    });

    const saved = await database.addTransmittersToLocation(location.id, [
      { id: "station-1", name: "Added A", frequency: 101.5, stationClass: "BC" },
      { id: "station-2", name: "Added B", frequency: 103.1 }
    ]);

    expect(saved).toHaveLength(2);

    const snapshot = await database.getSnapshot();
    const stored = snapshot.transmitters.filter(
      (transmitter) => transmitter.locationId === location.id
    );

    expect(stored).toHaveLength(3);
    expect(stored.find((tx) => tx.id === "station-1").stationClass).toBe("BC");
    expect(stored.find((tx) => tx.id === "station-2")).not.toHaveProperty(
      "stationClass"
    );
  });

  it("writes nothing when one added transmitter repeats a stored frequency", async () => {
    const location = await database.saveLocation({
      name: "Crno Brdo",
      latitude: 43.12853,
      longitude: 17.651833
    });

    await database.saveTransmitter({
      locationId: location.id,
      name: "Existing",
      frequency: 87.8
    });

    await expect(
      database.addTransmittersToLocation(location.id, [
        { name: "Fine", frequency: 101.5 },
        { name: "Clash", frequency: 87.8 }
      ])
    ).rejects.toThrow("errors.duplicateFrequency");

    const snapshot = await database.getSnapshot();
    expect(snapshot.transmitters).toHaveLength(1);
  });

  it("rejects a batch that repeats a frequency within itself", async () => {
    const location = await database.saveLocation({
      name: "Crno Brdo",
      latitude: 43.12853,
      longitude: 17.651833
    });

    await expect(
      database.addTransmittersToLocation(location.id, [
        { name: "A", frequency: 101.5 },
        { name: "B", frequency: 101.5 }
      ])
    ).rejects.toThrow("errors.duplicateFrequency");

    expect((await database.getSnapshot()).transmitters).toEqual([]);
  });

  it("rejects added transmitters for a missing location", async () => {
    await expect(
      database.addTransmittersToLocation("missing", [
        { name: "A", frequency: 101.5 }
      ])
    ).rejects.toThrow("errors.locationMissing");
  });

  it("re-saving the same added transmitters updates them instead of duplicating", async () => {
    const location = await database.saveLocation({
      name: "Crno Brdo",
      latitude: 43.12853,
      longitude: 17.651833
    });

    const input = [{ id: "station-1", name: "Added", frequency: 101.5 }];

    await database.addTransmittersToLocation(location.id, input);
    await database.addTransmittersToLocation(location.id, input);

    expect((await database.getSnapshot()).transmitters).toHaveLength(1);
  });

  it("stores the originating location on an ad-hoc calculation", async () => {
    const saved = await database.saveAdhocCalculation({
      name: "Crno Brdo scenario",
      stations: [{ id: "s1", name: "Tx 1", frequency: 145.5 }],
      locationId: "CRNOBRDO-01",
      locationName: "Crno Brdo"
    });

    expect(saved.locationId).toBe("CRNOBRDO-01");
    expect(saved.locationName).toBe("Crno Brdo");

    const manual = await database.saveAdhocCalculation({
      name: "Manual scenario",
      stations: []
    });

    expect(manual).not.toHaveProperty("locationId");
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
    // 101.1 added; 88.1 matched the stored record and updated it in place.
    expect(snapshot.transmitters).toHaveLength(4);

    const sljeme = snapshot.locations.find(
      (location) => location.latitude === 45.9002
    );
    expect(sljeme.name).toBe("Sljeme Alt Name");
    expect(sljeme.id).toBe("loc-1");

    const onEightyEight = snapshot.transmitters.find(
      (transmitter) => transmitter.frequency === 88.1
    );
    expect(onEightyEight.name).toBe("Sljeme FM1 Dup");
    expect(onEightyEight.id).toBe("tx-1");
  });

  it("adopts the incoming name for a site a few metres from a stored one", async () => {
    const stored = await database.saveLocation({
      name: "Fortica (stara oznaka)",
      latitude: 43.353806,
      longitude: 17.831889
    });

    await database.saveTransmitter({
      locationId: stored.id,
      name: "Postojeći odašiljač",
      frequency: 100.1
    });

    // ~8 m north of the stored position, spelled differently.
    await database.importGeoData({
      locations: [
        {
          id: "FORTICA-01",
          name: "Fortica",
          latitude: 43.353806 + 8 / 111320,
          longitude: 17.831889
        }
      ],
      transmitters: [
        {
          id: "FORTICA-01::100.1",
          locationId: "FORTICA-01",
          name: "  hrt   fortica  ",
          frequency: 100.1,
          stationClass: "BC"
        },
        {
          id: "FORTICA-01::104.3",
          locationId: "FORTICA-01",
          name: "Novi odašiljač",
          frequency: 104.3
        }
      ]
    });

    const snapshot = await database.getSnapshot();

    // One site, renamed, still at the stored coordinates.
    expect(snapshot.locations).toHaveLength(1);
    expect(snapshot.locations[0].id).toBe(stored.id);
    expect(snapshot.locations[0].name).toBe("Fortica");
    expect(snapshot.locations[0].latitude).toBe(43.353806);

    // The shared frequency was updated, the new one appended.
    expect(snapshot.transmitters).toHaveLength(2);

    const updated = snapshot.transmitters.find(
      (transmitter) => transmitter.frequency === 100.1
    );
    expect(updated.name).toBe("hrt   fortica");
    expect(updated.stationClass).toBe("BC");
    expect(updated.locationId).toBe(stored.id);

    const added = snapshot.transmitters.find(
      (transmitter) => transmitter.frequency === 104.3
    );
    expect(added.name).toBe("Novi odašiljač");
    expect(added.locationId).toBe(stored.id);
  });

  it("does not merge a site beyond the match radius", async () => {
    await database.saveLocation({
      name: "Fortica",
      latitude: 43.353806,
      longitude: 17.831889
    });

    // ~30 m north: a different site.
    await database.importGeoData({
      locations: [
        {
          id: "OTHER-01",
          name: "Druga lokacija",
          latitude: 43.353806 + 30 / 111320,
          longitude: 17.831889
        }
      ],
      transmitters: [
        {
          id: "OTHER-01::100.1",
          locationId: "OTHER-01",
          name: "Odašiljač",
          frequency: 100.1
        }
      ]
    });

    expect((await database.getSnapshot()).locations).toHaveLength(2);
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
