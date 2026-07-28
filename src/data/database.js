import { mergeSnapshots, validateBackup } from "../domain/backup";
import {
  normalizeLocation,
  normalizeTransmitter
} from "../domain/records";

const DATABASE_NAME = "third-order-im-calculator";
const DATABASE_VERSION = 1;
const LOCATION_STORE = "locations";
const TRANSMITTER_STORE = "transmitters";

let databasePromise;

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
    return Promise.reject(
      new Error("errors.databaseUnavailable")
    );
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(LOCATION_STORE)) {
          const locations = database.createObjectStore(LOCATION_STORE, {
            keyPath: "id"
          });
          locations.createIndex("name", "name");
        }

        if (!database.objectStoreNames.contains(TRANSMITTER_STORE)) {
          const transmitters = database.createObjectStore(
            TRANSMITTER_STORE,
            { keyPath: "id" }
          );
          transmitters.createIndex("locationId", "locationId");
        }
      };

      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          databasePromise = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        databasePromise = undefined;
        reject(request.error);
      };
      request.onblocked = () => {
        databasePromise = undefined;
        reject(new Error("errors.databaseBlocked"));
      };
    });
  }

  return databasePromise;
}

export async function getSnapshot() {
  const database = await openDatabase();
  const transaction = database.transaction(
    [LOCATION_STORE, TRANSMITTER_STORE],
    "readonly"
  );
  const locationsRequest = transaction
    .objectStore(LOCATION_STORE)
    .getAll();
  const transmittersRequest = transaction
    .objectStore(TRANSMITTER_STORE)
    .getAll();
  const [locations, transmitters] = await Promise.all([
    requestResult(locationsRequest),
    requestResult(transmittersRequest),
    transactionComplete(transaction)
  ]);

  return {
    locations: locations.sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    transmitters: transmitters.sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  };
}

export async function saveLocation(input, existing) {
  const normalized = normalizeLocation(input, existing);

  if (normalized.error) {
    throw new Error(normalized.error);
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

export async function saveTransmitter(input, existing) {
  const normalized = normalizeTransmitter(input, existing);

  if (normalized.error) {
    throw new Error(normalized.error);
  }

  const database = await openDatabase();
  const transaction = database.transaction(
    [LOCATION_STORE, TRANSMITTER_STORE],
    "readwrite"
  );
  const location = await requestResult(
    transaction.objectStore(LOCATION_STORE).get(
      normalized.transmitter.locationId
    )
  );

  if (!location) {
    transaction.abort();
    throw new Error("errors.locationMissing");
  }

  transaction
    .objectStore(TRANSMITTER_STORE)
    .put(normalized.transmitter);
  await transactionComplete(transaction);
  return normalized.transmitter;
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

async function writeSnapshot(snapshot) {
  const database = await openDatabase();
  const transaction = database.transaction(
    [LOCATION_STORE, TRANSMITTER_STORE],
    "readwrite"
  );
  const locations = transaction.objectStore(LOCATION_STORE);
  const transmitters = transaction.objectStore(TRANSMITTER_STORE);

  locations.clear();
  transmitters.clear();
  snapshot.locations.forEach((location) => locations.put(location));
  snapshot.transmitters.forEach((transmitter) =>
    transmitters.put(transmitter)
  );

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
          locations: incoming.locations,
          transmitters: incoming.transmitters
        };

  await writeSnapshot(snapshot);
  return snapshot;
}

export {
  DATABASE_NAME,
  DATABASE_VERSION,
  LOCATION_STORE,
  TRANSMITTER_STORE
};
