# Location database and backup guide

## Purpose

The persistent catalog groups collocated transmitters by named geographic
location. Selecting a location sends all of its transmitters to the existing
IM3 domain calculation; the calculator does not duplicate persisted state.

## Map workflow

- Clicking an empty map point opens **New location**. The clicked latitude and
  longitude are fixed for that creation step, so only a name is required.
- Clicking an existing marker opens that location's detail dialog. Marker click
  events do not bubble to the map, so they cannot also create a new location.
- The detail dialog shows every associated transmitter and exposes **Add**,
  individual edit/delete actions, **Edit location**, and **Delete location**.
- Deleting a location also deletes every transmitter that references it.
- **Calculate** opens that location's result route and loads all transmitters
  belonging to it into the shared AG Grid calculation view.

The map is a data-entry aid rather than a geocoder: clicking a point records
its coordinates, but the application does not infer a place name or call a
reverse-geocoding service.

## IndexedDB schema

Database name: `third-order-im-calculator`  
Database version: `1`

### `locations`

Key path: `id`  
Index: `name`

```js
{
  id: string,
  name: string,
  latitude: number,  // -90 through 90
  longitude: number, // -180 through 180
  createdAt: string, // ISO 8601
  updatedAt: string  // ISO 8601
}
```

### `transmitters`

Key path: `id`  
Index: `locationId`

```js
{
  id: string,
  locationId: string,
  name: string,
  frequency: number, // finite and non-negative
  createdAt: string, // ISO 8601
  updatedAt: string  // ISO 8601
}
```

IDs are stable UUIDs where the platform supports `crypto.randomUUID()`.
Location and transmitter names are required in the persistent catalog.

## Transaction guarantees

- Individual saves and deletes use read/write transactions.
- A transmitter is saved only if its parent location exists.
- Location deletion and deletion of its transmitters share one transaction.
- JSON replacement clears and repopulates both stores in one transaction.
  Failure aborts the complete write instead of leaving a partial database.
- Export reads both stores through one read-only transaction.

## Backup format

Every export is UTF-8 JSON with an ISO-dated filename and the following
envelope:

```json
{
  "format": "toic-indexeddb-backup",
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "exportedAt": "2026-07-28T12:00:00.000Z",
  "locations": [],
  "transmitters": []
}
```

`format` identifies TOIC backups. `schemaVersion` versions the persisted data
contract independently of the application release. A future schema change must
add an explicit migration before increasing the accepted version.

## Import validation

Before presenting import actions, the application verifies:

- a maximum file size of 5 MB;
- valid JSON and the expected top-level object;
- the exact format and supported schema version;
- valid application version and export timestamp metadata;
- location/transmitter arrays;
- non-empty, unique IDs;
- non-empty names;
- finite coordinates within geographic limits;
- finite, non-negative frequencies;
- a parent location for every transmitter.

No IndexedDB write begins when validation fails.

## Merge and replace semantics

The preview reports incoming location and transmitter counts plus ID conflicts.

**Merge**

- keeps current records absent from the backup;
- adds backup records with new IDs;
- replaces current records when the same stable ID occurs in the backup;
- writes the resulting dataset atomically.

**Replace all**

- discards current records;
- writes only the validated backup records;
- performs clear-and-repopulate as one atomic transaction.

The dialog offers **Export current data first** before either action, which is
especially important before **Replace all**.

All backup actions are grouped under the **Settings** route instead of the map
CRUD screen.

## Storage boundaries and recovery

IndexedDB is isolated by application origin. The web application, unpacked or
published extension, separate browser profiles, and a Capacitor WebView do not
automatically share a database. JSON export/import is therefore both the
backup mechanism and the supported transfer path between installations.

The current download adapter targets the web and browser-extension builds.
Native Android or iOS delivery should replace it with a Capacitor Filesystem
and Share adapter when native platforms are added.

## OpenStreetMap operation

The default tile URL is the standard OpenStreetMap service and visible
attribution is always rendered. Deployments with sustained traffic or an SLA
should configure a suitable tile provider through `VITE_MAP_TILE_URL` and
`VITE_MAP_TILE_ATTRIBUTION`. The application neither bulk-downloads nor caches
tiles for offline use.
