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
  frequency: number,     // finite and non-negative
  stationClass?: string, // optional ITU class (BC, BT, AT…)
  createdAt: string,     // ISO 8601
  updatedAt: string      // ISO 8601
}
```

IDs are stable UUIDs where the platform supports `crypto.randomUUID()`.
Location and transmitter names are required in the persistent catalog.

`stationClass` is optional and may be left empty. The key is written only when
it has a value, so clearing the field in the location card removes it rather
than storing an empty string.

## First-run seeding

A fresh install starts with an empty database and nothing on the map, so the
application ships with a small starter set: **FORTICA-01**, **GRDONJ-01** and
**SIBOVI-01**. The transmitter set is curated by hand, so its size changes; the
current contents are `data_raw/seed_sites.geojson`.

`seedDatabaseIfEmpty()` in `src/data/seed.js` runs once from `src/main.jsx`,
before the first render, so the starter sites are on the map immediately rather
than after a refresh.

What it checks, in order:

1. **The seed marker.** `localStorage["toic-seeded"]` — if seeding has already
   been decided once, nothing happens at all.
2. **The database and its stores.** `inspectDatabase()` opens the database,
   which creates `locations`, `transmitters` and `adhocCalculations` through the
   upgrade handler if they are missing, and reports the row count of each.
3. **Emptiness.** The seed is written **only when all three stores are empty**.
   A single saved location, transmitter or ad-hoc calculation is enough to skip
   it, so existing data is never overwritten or merged into. In that case the
   marker is set too, so the check stops running on every start.

The seed itself is `src/data/seedSites.js`, a plain `toic-sites` document. It is
validated by `validateGeoImport()` and imported through `importGeoData()` — the
same path as a file the user picks — so it cannot introduce records that a
manual import would have rejected. An invalid or failed seed is reported in the
console and leaves the database untouched; it never blocks startup.

It is bundled as a module rather than fetched from `public/`: a first-run
`fetch()` is one more thing to fail behind the extension CSP or a Capacitor
`file://` origin, and the starter data has to be there before the first render.

Because the marker is set after a successful seed, deleting the starter
locations is permanent: they do not reappear on the next launch. An empty
database is a legitimate end state, not only a starting one. Clearing site data
(which drops `localStorage` as well as IndexedDB) resets that decision.

### Editing the starter data

The seed has its own source, edited by hand:

```text
data_raw/seed_sites.geojson     edit this
        │
        │  npm run build:seed   validates, then converts
        v
src/data/seedSites.js           generated — never edit directly
```

`data_raw/seed_sites.geojson` is deliberately **independent of**
`data_raw/transmitters.geojson`. Refreshing the full regulator export therefore
never silently rewrites the starter set, and correcting an outdated starter
frequency does not mean touching a 400 KB file.

Adding, removing or renaming a starter site is an ordinary edit to that file:
sites are Features, transmitters are entries in `properties.transmitters`. The
format is the one in [IMPORT_FORMAT.md](IMPORT_FORMAT.md).

`build:seed` validates the file with the same `validateGeoImport()` the
application applies to a user-supplied import. Every problem is listed at once
and **nothing is written** when validation fails, so a broken edit cannot reach
the bundle:

```text
$ npm run build:seed
data_raw/seed_sites.geojson does not match the toic-sites import profile (3 problem(s)). Nothing was written.
  - Feature 1 transmitter 1 frequencyMhz must be a number in MHz.
  - Feature 2 repeats siteId "FORTICA-01".
  - Feature 3 properties.name must be a non-empty string.
```

`seed.test.js` asserts that the generated module still matches the source file,
so editing the GeoJSON and forgetting to regenerate fails the test suite rather
than shipping stale starter data. Its counts are derived from the document, so
curating the starter set does not break the suite.

### Importing the full export over a curated seed

Worth knowing before correcting starter data by hand: importing
`data_raw/transmitters.geojson` afterwards **undoes those corrections**, because
both files derive the same IDs (`siteId`, `siteId::frequencyMhz`) and import
merges by ID.

| Hand edit in the seed | After importing the full export |
| --- | --- |
| Renamed a transmitter | Overwritten with the export's name |
| Changed a station class | Overwritten with the export's class |
| Deleted an outdated transmitter | **Restored** — the export still lists it |
| Corrected a frequency | **Both** rows present: the correction and the export's stale one, as a different frequency is a different transmitter |
| Renamed a location | Overwritten with the export's name |
| Moved a marker by a few metres | Position preserved; the site is matched and reused, not duplicated |

So the corrections belong upstream, in whatever produces the regulator export,
not only in the seed — the seed is the starting point for a fresh install, not a
patch layer over the full data set.

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

## GeoJSON import: how records are matched

JSON **backup** import merges strictly by record ID (see below). **GeoJSON**
import is different, because it merges two independently maintained catalogs
where the same mast may be spelled differently on each side. Identity is taken
from the data:

- a **location** is identified by its position — a site within
  `SITE_MATCH_RADIUS_METRES` (10 m) of a stored one *is* that site. It keeps its
  stored ID and coordinates, so its transmitters stay attached, and takes the
  incoming name.
- a **transmitter** is identified by its frequency at that location. A matching
  frequency updates the stored record's name and station class in place, keeping
  its ID and `createdAt`. A frequency not present at the site is added.

Names are therefore attributes the import refreshes, never keys. That is what
makes typos, stray spaces, casing differences and one-sided renames converge
instead of producing a second copy, without any fuzzy name matching. A site is
never duplicated by a slightly different coordinate, and a frequency is never
listed twice at one site.

The corollary: **a changed frequency is a different transmitter**, so an
outdated frequency in the imported file is added alongside a locally corrected
one rather than replacing it.

Distance is measured with `distanceInMetres()` in `src/domain/geoMatch.js`
rather than a degree box, which would be wider north-south than east-west and
would widen towards the poles. When several stored sites fall inside the radius,
the nearest one wins. `saveLocation()` uses the same rule to reject a manually
created location placed on top of an existing one.

## Merge and replace semantics

These apply to JSON **backup** import, which merges by record ID only.

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
