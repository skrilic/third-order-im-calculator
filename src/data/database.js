import { mergeSnapshots, validateBackup } from "../domain/backup";
import { findSiteWithin } from "../domain/geoMatch";
import {
  normalizeLocation,
  normalizeTransmitter
} from "../domain/records";

const DATABASE_NAME = "third-order-im-calculator";
const DATABASE_VERSION = 3;
const LOCATION_STORE = "locations";
const TRANSMITTER_STORE = "transmitters";
const ADHOC_STORE = "adhocCalculations";
const FREQUENCY_EPSILON = 0.00001;

let indexedDbPromise;

// Fallback IndexedDB engine helper functions
function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("errors.databaseAborted"));
  });
}

export function openDatabase() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("errors.databaseUnavailable"));
  }

  if (!indexedDbPromise) {
    indexedDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(LOCATION_STORE)) {
          const locations = database.createObjectStore(LOCATION_STORE, {
            keyPath: "id"
          });
          locations.createIndex("name", "name");
        }

        let transmitters;
        if (!database.objectStoreNames.contains(TRANSMITTER_STORE)) {
          transmitters = database.createObjectStore(
            TRANSMITTER_STORE,
            { keyPath: "id" }
          );
        } else {
          transmitters = request.transaction.objectStore(TRANSMITTER_STORE);
        }

        if (!transmitters.indexNames.contains("locationId")) {
          transmitters.createIndex("locationId", "locationId");
        }

        if (!database.objectStoreNames.contains(ADHOC_STORE)) {
          database.createObjectStore(ADHOC_STORE, { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          indexedDbPromise = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        indexedDbPromise = undefined;
        reject(request.error);
      };
      request.onblocked = () => {
        indexedDbPromise = undefined;
        reject(new Error("errors.databaseBlocked"));
      };
    });
  }

  return indexedDbPromise;
}

export async function getSnapshot() {
  const database = await openDatabase();
  const stores = [LOCATION_STORE, TRANSMITTER_STORE];
  if (database.objectStoreNames.contains(ADHOC_STORE)) {
    stores.push(ADHOC_STORE);
  }

  const transaction = database.transaction(stores, "readonly");
  const locationsRequest = transaction.objectStore(LOCATION_STORE).getAll();
  const transmittersRequest = transaction.objectStore(TRANSMITTER_STORE).getAll();
  const adhocRequest = database.objectStoreNames.contains(ADHOC_STORE)
    ? transaction.objectStore(ADHOC_STORE).getAll()
    : null;

  const [locations, transmitters, adhocCalculations] = await Promise.all([
    requestResult(locationsRequest),
    requestResult(transmittersRequest),
    adhocRequest ? requestResult(adhocRequest) : Promise.resolve([]),
    transactionComplete(transaction)
  ]);

  return {
    locations: locations.sort((a, b) => a.name.localeCompare(b.name)),
    transmitters: transmitters.sort((a, b) => a.name.localeCompare(b.name)),
    adhocCalculations: (adhocCalculations || []).sort((a, b) =>
      (b.updatedAt || "").localeCompare(a.updatedAt || "")
    )
  };
}

/**
 * Reports whether the application's database and its stores are in place and
 * whether they hold anything yet.
 *
 * Opening the database creates any missing store through the upgrade handler,
 * so `missingStores` is a diagnostic rather than an expected state. `isEmpty`
 * is what first-run seeding keys off: it is true only when every store is
 * empty, so existing data is never overwritten.
 */
export async function inspectDatabase() {
  const database = await openDatabase();
  const missingStores = [LOCATION_STORE, TRANSMITTER_STORE, ADHOC_STORE].filter(
    (store) => !database.objectStoreNames.contains(store)
  );

  const snapshot = await getSnapshot();
  const counts = {
    locations: (snapshot.locations || []).length,
    transmitters: (snapshot.transmitters || []).length,
    adhocCalculations: (snapshot.adhocCalculations || []).length
  };

  return {
    missingStores,
    counts,
    isEmpty:
      counts.locations === 0 &&
      counts.transmitters === 0 &&
      counts.adhocCalculations === 0
  };
}

export async function saveLocation(input, existing) {
  const normalized = normalizeLocation(input, existing);

  if (normalized.error) {
    throw new Error(normalized.error);
  }

  const currentSnapshot = await getSnapshot();
  const duplicateLoc = findSiteWithin(
    (currentSnapshot.locations || []).filter(
      (loc) => loc.id !== normalized.location.id
    ),
    normalized.location
  );

  if (duplicateLoc) {
    throw new Error("errors.duplicateLocation");
  }

  const database = await openDatabase();
  const transaction = database.transaction(LOCATION_STORE, "readwrite");
  transaction.objectStore(LOCATION_STORE).put(normalized.location);
  await transactionComplete(transaction);
  return normalized.location;
}

export async function deleteLocation(locationId) {
  const database = await openDatabase();
  const transaction = database.transaction(
    [LOCATION_STORE, TRANSMITTER_STORE],
    "readwrite"
  );

  transaction.objectStore(LOCATION_STORE).delete(locationId);

  const transmitterStore = transaction.objectStore(TRANSMITTER_STORE);
  const cursorRequest = transmitterStore
    .index("locationId")
    .openKeyCursor(IDBKeyRange.only(locationId));

  cursorRequest.onsuccess = () => {
    const cursor = cursorRequest.result;
    if (cursor) {
      transmitterStore.delete(cursor.primaryKey);
      cursor.continue();
    }
  };

  await transactionComplete(transaction);
}

/**
 * Merges an import into the stored catalog.
 *
 * Identity comes from the data, not from the names, because two sources
 * describing the same site rarely spell things the same way:
 *
 * - a **location** is identified by its position. A site within
 *   `SITE_MATCH_RADIUS_METRES` of a stored one is that stored site: it keeps
 *   its ID and coordinates, so its transmitters stay attached, and takes the
 *   incoming name as the more recent spelling.
 * - a **transmitter** is identified by its frequency at that location. A
 *   matching frequency updates the stored record's name and station class
 *   instead of being dropped or added a second time; a new frequency is added.
 *
 * The import therefore never duplicates a site or a frequency, and typos,
 * casing, spacing and renames in either source resolve to the incoming name.
 */
export async function importGeoData(geoData) {
  const current = await getSnapshot();

  const locationsMap = new Map((current.locations || []).map((l) => [l.id, l]));
  const locIdMap = new Map();

  for (const locInput of geoData.locations || []) {
    const norm = normalizeLocation(locInput);
    if (norm.error || !norm.location) {
      continue;
    }
    const incomingLoc = norm.location;

    const existingGpsLoc = findSiteWithin(
      [...locationsMap.values()],
      incomingLoc
    );

    if (existingGpsLoc) {
      // The same mast under a different name: adopt the name, keep the stored
      // identity and position.
      locationsMap.set(existingGpsLoc.id, {
        ...existingGpsLoc,
        name: incomingLoc.name,
        updatedAt: incomingLoc.updatedAt
      });
      locIdMap.set(locInput.id, existingGpsLoc.id);
      if (incomingLoc.id) {
        locIdMap.set(incomingLoc.id, existingGpsLoc.id);
      }
    } else {
      const matchById = locationsMap.get(incomingLoc.id);
      const finalLoc = matchById ? { ...matchById, ...incomingLoc } : incomingLoc;
      locationsMap.set(finalLoc.id, finalLoc);
      locIdMap.set(locInput.id, finalLoc.id);
      if (incomingLoc.id) {
        locIdMap.set(incomingLoc.id, finalLoc.id);
      }
    }
  }

  const mergedLocations = [...locationsMap.values()];
  const transmittersMap = new Map((current.transmitters || []).map((t) => [t.id, t]));

  for (const txInput of geoData.transmitters || []) {
    const targetLocationId =
      locIdMap.get(txInput.locationId) || txInput.locationId;

    const locExists = mergedLocations.some((l) => l.id === targetLocationId);
    if (!locExists) {
      continue;
    }

    // The frequency is the natural key at a location, so an existing record on
    // that frequency is the one being described — whatever either side calls
    // it. Passing it as `existing` keeps its ID and createdAt while the
    // incoming name and station class overwrite the stored ones.
    const incomingFrequency = Number(txInput.frequency);
    const existingOnFrequency = Number.isFinite(incomingFrequency)
      ? [...transmittersMap.values()].find(
          (candidate) =>
            candidate.locationId === targetLocationId &&
            Math.abs(candidate.frequency - incomingFrequency) <
              FREQUENCY_EPSILON
        )
      : undefined;

    const norm = normalizeTransmitter(
      { ...txInput, locationId: targetLocationId },
      existingOnFrequency ?? {}
    );

    if (norm.error || !norm.transmitter) {
      continue;
    }

    transmittersMap.set(norm.transmitter.id, norm.transmitter);
  }

  const mergedTransmitters = [...transmittersMap.values()];

  const newSnapshot = {
    locations: mergedLocations,
    transmitters: mergedTransmitters,
    adhocCalculations: current.adhocCalculations || []
  };

  await writeSnapshot(newSnapshot);
  return newSnapshot;
}

export async function saveTransmitter(input, existing) {
  const normalized = normalizeTransmitter(input, existing);

  if (normalized.error) {
    throw new Error(normalized.error);
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [LOCATION_STORE, TRANSMITTER_STORE],
      "readwrite"
    );

    let isSettled = false;
    transaction.onerror = () => {
      if (!isSettled) {
        isSettled = true;
        reject(transaction.error ?? new Error("errors.databaseAborted"));
      }
    };
    transaction.onabort = () => {
      if (!isSettled) {
        isSettled = true;
        reject(transaction.error ?? new Error("errors.databaseAborted"));
      }
    };
    transaction.oncomplete = () => {
      if (!isSettled) {
        isSettled = true;
        resolve(normalized.transmitter);
      }
    };

    const locationStore = transaction.objectStore(LOCATION_STORE);
    const transmitterStore = transaction.objectStore(TRANSMITTER_STORE);

    const locReq = locationStore.get(normalized.transmitter.locationId);

    locReq.onerror = () => {
      if (!isSettled) {
        isSettled = true;
        transaction.abort();
        reject(locReq.error ?? new Error("errors.databaseAborted"));
      }
    };

    locReq.onsuccess = () => {
      if (!locReq.result) {
        if (!isSettled) {
          isSettled = true;
          transaction.abort();
          reject(new Error("errors.locationMissing"));
        }
        return;
      }

      const allTxReq = transmitterStore.getAll();

      allTxReq.onerror = () => {
        if (!isSettled) {
          isSettled = true;
          transaction.abort();
          reject(allTxReq.error ?? new Error("errors.databaseAborted"));
        }
      };

      allTxReq.onsuccess = () => {
        const allTx = allTxReq.result || [];
        const isDuplicate = allTx.some(
          (tx) =>
            tx.locationId === normalized.transmitter.locationId &&
            tx.id !== normalized.transmitter.id &&
            Math.abs(tx.frequency - normalized.transmitter.frequency) <
              FREQUENCY_EPSILON
        );

        if (isDuplicate) {
          if (!isSettled) {
            isSettled = true;
            transaction.abort();
            reject(new Error("errors.duplicateFrequency"));
          }
          return;
        }

        transmitterStore.put(normalized.transmitter);
      };
    };
  });
}

/**
 * Appends several transmitters to an existing location in one transaction.
 *
 * Used when a calculation that was extended with ad-hoc transmitters is written
 * back to its location. It is all-or-nothing: if any entry is invalid or
 * repeats a frequency — either one already stored at the location or another
 * one in the same batch — nothing is written.
 */
export async function addTransmittersToLocation(locationId, inputs) {
  const pending = [];

  for (const input of inputs || []) {
    const normalized = normalizeTransmitter({ ...input, locationId });

    if (normalized.error) {
      throw new Error(normalized.error);
    }

    const repeatsBatch = pending.some(
      (candidate) =>
        Math.abs(candidate.frequency - normalized.transmitter.frequency) <
        FREQUENCY_EPSILON
    );

    if (repeatsBatch) {
      throw new Error("errors.duplicateFrequency");
    }

    pending.push(normalized.transmitter);
  }

  if (pending.length === 0) {
    return [];
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [LOCATION_STORE, TRANSMITTER_STORE],
      "readwrite"
    );

    let isSettled = false;

    function fail(error) {
      if (isSettled) {
        return;
      }
      isSettled = true;
      transaction.abort();
      reject(error);
    }

    transaction.onerror = () => {
      if (!isSettled) {
        isSettled = true;
        reject(transaction.error ?? new Error("errors.databaseAborted"));
      }
    };
    transaction.onabort = () => {
      if (!isSettled) {
        isSettled = true;
        reject(transaction.error ?? new Error("errors.databaseAborted"));
      }
    };
    transaction.oncomplete = () => {
      if (!isSettled) {
        isSettled = true;
        resolve(pending);
      }
    };

    const transmitterStore = transaction.objectStore(TRANSMITTER_STORE);
    const locationRequest = transaction
      .objectStore(LOCATION_STORE)
      .get(locationId);

    locationRequest.onerror = () =>
      fail(locationRequest.error ?? new Error("errors.databaseAborted"));

    locationRequest.onsuccess = () => {
      if (!locationRequest.result) {
        fail(new Error("errors.locationMissing"));
        return;
      }

      const existingRequest = transmitterStore.getAll();

      existingRequest.onerror = () =>
        fail(existingRequest.error ?? new Error("errors.databaseAborted"));

      existingRequest.onsuccess = () => {
        const stored = existingRequest.result || [];

        const collides = pending.some((transmitter) =>
          stored.some(
            (existing) =>
              existing.locationId === locationId &&
              existing.id !== transmitter.id &&
              Math.abs(existing.frequency - transmitter.frequency) <
                FREQUENCY_EPSILON
          )
        );

        if (collides) {
          fail(new Error("errors.duplicateFrequency"));
          return;
        }

        pending.forEach((transmitter) => transmitterStore.put(transmitter));
      };
    };
  });
}

export async function deleteTransmitter(transmitterId) {
  const database = await openDatabase();
  const transaction = database.transaction(
    TRANSMITTER_STORE,
    "readwrite"
  );
  transaction.objectStore(TRANSMITTER_STORE).delete(transmitterId);
  await transactionComplete(transaction);
}

/* Ad-Hoc Calculation Presets CRUD */
function createAdhocId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `adhoc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function saveAdhocCalculation(input, existing = null) {
  const name = String(input?.name || "").trim();
  if (!name) {
    throw new Error("errors.adhocNameRequired");
  }

  const stations = Array.isArray(input?.stations) ? input.stations : [];
  const now = new Date().toISOString();
  const adhoc = {
    id: existing?.id || input?.id || createAdhocId(),
    name,
    stations,
    createdAt: existing?.createdAt || input?.createdAt || now,
    updatedAt: now
  };

  // A calculation started from a location keeps a note of where it came from;
  // a purely manual one carries neither key.
  const locationId = String(
    input?.locationId ?? existing?.locationId ?? ""
  ).trim();
  const locationName = String(
    input?.locationName ?? existing?.locationName ?? ""
  ).trim();

  if (locationId) {
    adhoc.locationId = locationId;
  }

  if (locationName) {
    adhoc.locationName = locationName;
  }

  const database = await openDatabase();
  const transaction = database.transaction(ADHOC_STORE, "readwrite");
  transaction.objectStore(ADHOC_STORE).put(adhoc);
  await transactionComplete(transaction);
  return adhoc;
}

export async function deleteAdhocCalculation(adhocId) {
  const database = await openDatabase();
  const transaction = database.transaction(ADHOC_STORE, "readwrite");
  transaction.objectStore(ADHOC_STORE).delete(adhocId);
  await transactionComplete(transaction);
}

export async function getAdhocCalculations() {
  const snapshot = await getSnapshot();
  return snapshot.adhocCalculations || [];
}

async function writeSnapshot(snapshot) {
  const database = await openDatabase();
  const stores = [LOCATION_STORE, TRANSMITTER_STORE];
  if (database.objectStoreNames.contains(ADHOC_STORE)) {
    stores.push(ADHOC_STORE);
  }

  const transaction = database.transaction(stores, "readwrite");
  const locations = transaction.objectStore(LOCATION_STORE);
  const transmitters = transaction.objectStore(TRANSMITTER_STORE);

  locations.clear();
  transmitters.clear();
  (snapshot.locations || []).forEach((location) => locations.put(location));
  (snapshot.transmitters || []).forEach((transmitter) =>
    transmitters.put(transmitter)
  );

  if (database.objectStoreNames.contains(ADHOC_STORE)) {
    const adhocStore = transaction.objectStore(ADHOC_STORE);
    adhocStore.clear();
    (snapshot.adhocCalculations || []).forEach((adhoc) =>
      adhocStore.put(adhoc)
    );
  }

  await transactionComplete(transaction);
}

export async function importSnapshot(incoming, mode) {
  const validation = validateBackup(incoming);

  if (!validation.ok) {
    throw new Error("errors.backupInvalid");
  }

  if (mode !== "merge" && mode !== "replace") {
    throw new Error("errors.importMode");
  }

  const snapshot =
    mode === "merge"
      ? mergeSnapshots(await getSnapshot(), incoming)
      : {
          locations: incoming.locations || [],
          transmitters: incoming.transmitters || [],
          adhocCalculations: incoming.adhocCalculations || []
        };

  await writeSnapshot(snapshot);
  return snapshot;
}

export {
  DATABASE_NAME,
  DATABASE_VERSION,
  LOCATION_STORE,
  TRANSMITTER_STORE,
  ADHOC_STORE
};
