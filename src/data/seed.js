/**
 * First-run seeding.
 *
 * A fresh install has an empty database and nothing to look at, so a small
 * starter set of sites is imported once. The rule is deliberately conservative:
 * the seed is written only when every store is empty, so a user who already has
 * locations, transmitters or saved calculations never has them overwritten.
 *
 * A marker is stored alongside the result. It stops the starter data from
 * reappearing after the user has deliberately deleted it — an empty database is
 * a legitimate end state, not only a starting one.
 */

import { inspectDatabase, importGeoData } from "./database";
import { geoImportToRecords, validateGeoImport } from "../domain/geoImport";
import { seedSites } from "./seedSites";

export const SEED_STORAGE_KEY = "toic-seeded";

export function readSeedMarker(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    return target?.getItem(SEED_STORAGE_KEY) === "1";
  } catch {
    // Without storage the emptiness check alone decides.
    return false;
  }
}

export function storeSeedMarker(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(SEED_STORAGE_KEY, "1");
  } catch {
    // Seeding still applies to this session.
  }
}

/**
 * Imports the starter sites when the database is empty and has never been
 * seeded. Never throws: a failure here must not stop the application from
 * starting, so the reason is reported instead.
 *
 * @returns {Promise<{seeded: boolean, reason: string, counts?: object}>}
 */
export async function seedDatabaseIfEmpty({
  document = seedSites,
  storage
} = {}) {
  if (readSeedMarker(storage)) {
    return { seeded: false, reason: "alreadySeeded" };
  }

  let state;

  try {
    state = await inspectDatabase();
  } catch (error) {
    return { seeded: false, reason: "databaseUnavailable", error };
  }

  if (!state.isEmpty) {
    // Existing data is the answer: leave it alone and stop asking on every
    // start.
    storeSeedMarker(storage);
    return { seeded: false, reason: "existingData", counts: state.counts };
  }

  const validation = validateGeoImport(document);

  if (!validation.ok) {
    return {
      seeded: false,
      reason: "invalidSeed",
      errors: validation.errors
    };
  }

  try {
    const snapshot = await importGeoData(geoImportToRecords(document));
    storeSeedMarker(storage);

    return {
      seeded: true,
      reason: "seeded",
      counts: {
        locations: snapshot.locations.length,
        transmitters: snapshot.transmitters.length,
        adhocCalculations: (snapshot.adhocCalculations || []).length
      }
    };
  } catch (error) {
    return { seeded: false, reason: "importFailed", error };
  }
}
