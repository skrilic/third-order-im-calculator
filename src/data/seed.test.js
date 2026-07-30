import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateGeoImport } from "../domain/geoImport";
import { seedSites } from "./seedSites";

const SEED_SOURCE_PATH = new URL(
  "../../data_raw/seed_sites.geojson",
  import.meta.url
);

const databaseName = "third-order-im-calculator";
let database;
let seed;

function createStorage() {
  const entries = new Map();

  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => entries.set(key, String(value))
  };
}

function deleteTestDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Test database deletion was blocked."));
  });
}

beforeEach(async () => {
  vi.resetModules();
  await deleteTestDatabase();
  database = await import("./database");
  seed = await import("./seed");
});

afterEach(async () => {
  const connection = await database.openDatabase();
  connection.close();
  await deleteTestDatabase();
});

describe("shipped seed document", () => {
  it("matches the import profile the application accepts", () => {
    expect(validateGeoImport(seedSites)).toEqual({ ok: true, errors: [] });
  });

  // The starter set may be curated — transmitters come and go as the data is
  // corrected — but these three sites are the agreed starting point.
  it("contains the three starter sites", () => {
    expect(
      seedSites.features.map((feature) => feature.properties.siteId)
    ).toEqual(
      expect.arrayContaining(["FORTICA-01", "GRDONJ-01", "SIBOVI-01"])
    );
  });

  // The module is generated from the hand-edited source. If they drift, the
  // source was edited without running `npm run build:seed` and the application
  // would ship stale starter data.
  it("is in sync with data_raw/seed_sites.geojson", () => {
    const source = JSON.parse(readFileSync(SEED_SOURCE_PATH, "utf8"));

    expect(seedSites).toEqual(source);
  });
});

describe("inspectDatabase", () => {
  it("creates the stores and reports a fresh database as empty", async () => {
    const state = await database.inspectDatabase();

    expect(state.missingStores).toEqual([]);
    expect(state.isEmpty).toBe(true);
    expect(state.counts).toEqual({
      locations: 0,
      transmitters: 0,
      adhocCalculations: 0
    });
  });

  it("reports a database that holds only an ad-hoc calculation as non-empty", async () => {
    await database.saveAdhocCalculation({ name: "Scratch", stations: [] });

    const state = await database.inspectDatabase();

    expect(state.isEmpty).toBe(false);
    expect(state.counts.adhocCalculations).toBe(1);
  });
});

describe("seedDatabaseIfEmpty", () => {
  it("imports the starter sites into an empty database", async () => {
    const storage = createStorage();
    const result = await seed.seedDatabaseIfEmpty({ storage });

    // Counts are derived from the shipped document, not hard-coded: curating
    // the starter data must not break the suite.
    const expectedSites = seedSites.features.map(
      (feature) => feature.properties.siteId
    );
    const expectedTransmitters = seedSites.features.flatMap(
      (feature) => feature.properties.transmitters
    );

    expect(result.seeded).toBe(true);
    expect(result.counts.locations).toBe(expectedSites.length);

    const snapshot = await database.getSnapshot();

    expect(snapshot.locations.map((location) => location.id).sort()).toEqual(
      [...expectedSites].sort()
    );
    expect(snapshot.transmitters).toHaveLength(expectedTransmitters.length);
    expect(seed.readSeedMarker(storage)).toBe(true);
  });

  it("carries every station class from the seed document into the database", async () => {
    await seed.seedDatabaseIfEmpty({ storage: createStorage() });

    const snapshot = await database.getSnapshot();
    const stored = new Map(
      snapshot.transmitters.map((transmitter) => [transmitter.id, transmitter])
    );

    seedSites.features.forEach((feature) => {
      feature.properties.transmitters.forEach((transmitter) => {
        const record = stored.get(
          `${feature.properties.siteId}::${transmitter.frequencyMhz}`
        );

        expect(record).toBeDefined();
        expect(record.stationClass).toBe(transmitter.stationClass);
      });
    });
  });

  it("leaves an existing location untouched and imports nothing", async () => {
    const storage = createStorage();
    const existing = await database.saveLocation({
      name: "My own site",
      latitude: 45,
      longitude: 16
    });

    const result = await seed.seedDatabaseIfEmpty({ storage });

    expect(result.seeded).toBe(false);
    expect(result.reason).toBe("existingData");

    const snapshot = await database.getSnapshot();

    expect(snapshot.locations).toHaveLength(1);
    expect(snapshot.locations[0].id).toBe(existing.id);
  });

  it("does not seed a second time once the marker is set", async () => {
    const storage = createStorage();

    await seed.seedDatabaseIfEmpty({ storage });

    const second = await seed.seedDatabaseIfEmpty({ storage });

    expect(second).toEqual({ seeded: false, reason: "alreadySeeded" });
    expect((await database.getSnapshot()).locations).toHaveLength(
      seedSites.features.length
    );
  });

  it("does not bring the starter data back after the user deletes it", async () => {
    const storage = createStorage();

    await seed.seedDatabaseIfEmpty({ storage });

    const snapshot = await database.getSnapshot();
    for (const location of snapshot.locations) {
      await database.deleteLocation(location.id);
    }

    const result = await seed.seedDatabaseIfEmpty({ storage });

    expect(result.seeded).toBe(false);
    expect((await database.getSnapshot()).locations).toEqual([]);
  });

  it("writes nothing when the seed document does not match the profile", async () => {
    const storage = createStorage();
    const result = await seed.seedDatabaseIfEmpty({
      storage,
      document: { type: "FeatureCollection", features: [] }
    });

    expect(result.seeded).toBe(false);
    expect(result.reason).toBe("invalidSeed");
    expect((await database.getSnapshot()).locations).toEqual([]);
    expect(seed.readSeedMarker(storage)).toBe(false);
  });

  it("reports a failure instead of throwing when the database is unavailable", async () => {
    const storage = createStorage();
    const originalIndexedDb = globalThis.indexedDB;
    globalThis.indexedDB = undefined;

    try {
      vi.resetModules();
      const isolated = await import("./seed");
      const result = await isolated.seedDatabaseIfEmpty({ storage });

      expect(result.seeded).toBe(false);
      expect(result.reason).toBe("databaseUnavailable");
    } finally {
      globalThis.indexedDB = originalIndexedDb;
    }
  });
});
