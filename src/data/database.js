import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import { mergeSnapshots, validateBackup } from "../domain/backup";
import {
  normalizeLocation,
  normalizeTransmitter
} from "../domain/records";

const DATABASE_NAME = "third-order-im-calculator";
const DATABASE_VERSION = 3;
const LOCATION_STORE = "locations";
const TRANSMITTER_STORE = "transmitters";
const ADHOC_STORE = "adhocCalculations";
const SQLITE_DB_NAME = "toic_sqlite_db";

let indexedDbPromise;
let sqliteConnection;
let sqliteDb;

// Check if running on native mobile device (iOS/Android)
function isNativeSqliteAvailable() {
  return Capacitor.isNativePlatform();
}

// Initialize SQLite connection and database schema
async function getSqliteDatabase() {
  if (sqliteDb) {
    return sqliteDb;
  }

  if (!sqliteConnection) {
    sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  sqliteDb = await sqliteConnection.createConnection(
    SQLITE_DB_NAME,
    false,
    "no-encryption",
    1,
    false
  );

  await sqliteDb.open();

  const createSchemaSql = `
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transmitters (
      id TEXT PRIMARY KEY NOT NULL,
      locationId TEXT NOT NULL,
      name TEXT NOT NULL,
      frequency REAL NOT NULL,
      FOREIGN KEY (locationId) REFERENCES locations(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS adhoc_calculations (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      stationsJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `;

  await sqliteDb.execute(createSchemaSql);
  return sqliteDb;
}

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
  if (isNativeSqliteAvailable()) {
    return getSqliteDatabase();
  }

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
  if (isNativeSqliteAvailable()) {
    const db = await getSqliteDatabase();
    const locResult = await db.query("SELECT * FROM locations ORDER BY name ASC;");
    const txResult = await db.query("SELECT * FROM transmitters ORDER BY name ASC;");
    const adhocResult = await db.query("SELECT * FROM adhoc_calculations ORDER BY updatedAt DESC;");

    const locations = (locResult.values || []).map((l) => ({
      id: l.id,
      name: l.name,
      latitude: Number(l.latitude),
      longitude: Number(l.longitude)
    }));

    const transmitters = (txResult.values || []).map((t) => ({
      id: t.id,
      locationId: t.locationId,
      name: t.name,
      frequency: Number(t.frequency)
    }));

    const adhocCalculations = (adhocResult.values || []).map((a) => ({
      id: a.id,
      name: a.name,
      stations: JSON.parse(a.stationsJson || "[]"),
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    }));

    return { locations, transmitters, adhocCalculations };
  }

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

export async function saveLocation(input, existing) {
  const normalized = normalizeLocation(input, existing);

  if (normalized.error) {
    throw new Error(normalized.error);
  }

  const currentSnapshot = await getSnapshot();
  const duplicateLoc = (currentSnapshot.locations || []).find(
    (loc) =>
      loc.id !== normalized.location.id &&
      Math.abs(loc.latitude - normalized.location.latitude) < 0.0001 &&
      Math.abs(loc.longitude - normalized.location.longitude) < 0.0001
  );

  if (duplicateLoc) {
    throw new Error("errors.duplicateLocation");
  }

  if (isNativeSqliteAvailable()) {
    const db = await getSqliteDatabase();
    const loc = normalized.location;
    const sql = `
      INSERT OR REPLACE INTO locations (id, name, latitude, longitude)
      VALUES (?, ?, ?, ?);
    `;
    await db.run(sql, [loc.id, loc.name, loc.latitude, loc.longitude]);
    return loc;
  }

  const database = await openDatabase();
  const transaction = database.transaction(LOCATION_STORE, "readwrite");
  transaction.objectStore(LOCATION_STORE).put(normalized.location);
  await transactionComplete(transaction);
  return normalized.location;
}

export async function deleteLocation(locationId) {
  if (isNativeSqliteAvailable()) {
    const db = await getSqliteDatabase();
    await db.run("PRAGMA foreign_keys = ON;");
    await db.run("DELETE FROM locations WHERE id = ?;", [locationId]);
    return;
  }

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

    // Check if a location with matching GPS coordinates already exists
    const existingGpsLoc = [...locationsMap.values()].find(
      (l) =>
        Math.abs(l.latitude - incomingLoc.latitude) < 0.0001 &&
        Math.abs(l.longitude - incomingLoc.longitude) < 0.0001
    );

    if (existingGpsLoc) {
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
    const targetLocationId = locIdMap.get(txInput.locationId) || txInput.locationId;
    const norm = normalizeTransmitter({ ...txInput, locationId: targetLocationId });
    if (norm.error || !norm.transmitter) {
      continue;
    }
    const tx = norm.transmitter;

    const locExists = mergedLocations.some((l) => l.id === tx.locationId);
    if (!locExists) {
      continue;
    }

    const isDup = [...transmittersMap.values()].some(
      (existing) =>
        existing.locationId === tx.locationId &&
        existing.id !== tx.id &&
        Math.abs(existing.frequency - tx.frequency) < 0.00001
    );

    if (!isDup) {
      transmittersMap.set(tx.id, tx);
    }
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

  if (isNativeSqliteAvailable()) {
    const db = await getSqliteDatabase();
    const locCheck = await db.query(
      "SELECT id FROM locations WHERE id = ?;",
      [normalized.transmitter.locationId]
    );

    if (!locCheck.values || locCheck.values.length === 0) {
      throw new Error("errors.locationMissing");
    }

    const dupCheck = await db.query(
      "SELECT id FROM transmitters WHERE locationId = ? AND frequency = ? AND id != ?;",
      [
        normalized.transmitter.locationId,
        normalized.transmitter.frequency,
        normalized.transmitter.id
      ]
    );

    if (dupCheck.values && dupCheck.values.length > 0) {
      throw new Error("errors.duplicateFrequency");
    }

    const tx = normalized.transmitter;
    const sql = `
      INSERT OR REPLACE INTO transmitters (id, locationId, name, frequency)
      VALUES (?, ?, ?, ?);
    `;
    await db.run(sql, [tx.id, tx.locationId, tx.name, tx.frequency]);
    return tx;
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
            Math.abs(tx.frequency - normalized.transmitter.frequency) < 0.00001
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

export async function deleteTransmitter(transmitterId) {
  if (isNativeSqliteAvailable()) {
    const db = await getSqliteDatabase();
    await db.run("DELETE FROM transmitters WHERE id = ?;", [transmitterId]);
    return;
  }

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

  if (isNativeSqliteAvailable()) {
    const db = await getSqliteDatabase();
    const sql = `
      INSERT OR REPLACE INTO adhoc_calculations (id, name, stationsJson, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?);
    `;
    await db.run(sql, [
      adhoc.id,
      adhoc.name,
      JSON.stringify(adhoc.stations),
      adhoc.createdAt,
      adhoc.updatedAt
    ]);
    return adhoc;
  }

  const database = await openDatabase();
  const transaction = database.transaction(ADHOC_STORE, "readwrite");
  transaction.objectStore(ADHOC_STORE).put(adhoc);
  await transactionComplete(transaction);
  return adhoc;
}

export async function deleteAdhocCalculation(adhocId) {
  if (isNativeSqliteAvailable()) {
    const db = await getSqliteDatabase();
    await db.run("DELETE FROM adhoc_calculations WHERE id = ?;", [adhocId]);
    return;
  }

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
  if (isNativeSqliteAvailable()) {
    const db = await getSqliteDatabase();
    await db.run("DELETE FROM transmitters;");
    await db.run("DELETE FROM locations;");
    await db.run("DELETE FROM adhoc_calculations;");

    for (const loc of snapshot.locations || []) {
      await db.run(
        "INSERT INTO locations (id, name, latitude, longitude) VALUES (?, ?, ?, ?);",
        [loc.id, loc.name, loc.latitude, loc.longitude]
      );
    }

    for (const tx of snapshot.transmitters || []) {
      await db.run(
        "INSERT INTO transmitters (id, locationId, name, frequency) VALUES (?, ?, ?, ?);",
        [tx.id, tx.locationId, tx.name, tx.frequency]
      );
    }

    for (const adhoc of snapshot.adhocCalculations || []) {
      await db.run(
        "INSERT INTO adhoc_calculations (id, name, stationsJson, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?);",
        [
          adhoc.id,
          adhoc.name,
          JSON.stringify(adhoc.stations || []),
          adhoc.createdAt || new Date().toISOString(),
          adhoc.updatedAt || new Date().toISOString()
        ]
      );
    }
    return;
  }

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
