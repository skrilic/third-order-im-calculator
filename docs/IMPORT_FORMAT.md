# Import Format Specification (Specifikacija formata za uvoz)

TOIC accepts **exactly one** import format. Files that do not match are rejected
in full, with a list of every problem found. There is no format sniffing, no
column-name guessing, and no partial import.

TOIC prihvaća **točno jedan** format za uvoz. Datoteke koje mu ne odgovaraju
odbijaju se u cijelosti, uz popis svih pronađenih problema.

---

## Profile: `toic-sites` version 1

The container is standard **GeoJSON (RFC 7946)**. The property vocabulary inside
`properties` is specific to TOIC — RFC 7946 leaves `properties` deliberately
free-form, so no standard governs it.

The `toic` member is a GeoJSON *foreign member*, explicitly permitted by
[RFC 7946 section 6.1](https://datatracker.ietf.org/doc/html/rfc7946#section-6.1).
It is how the application recognises the profile and how future versions can be
migrated. A plain GeoJSON file without it is rejected.

### Shape

```json
{
  "type": "FeatureCollection",
  "toic": { "profile": "toic-sites", "version": 1 },
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [17.651833, 43.12853]
      },
      "properties": {
        "siteId": "CRNOBRDO-01",
        "name": "Crno Brdo",
        "transmitters": [
          {
            "name": "BH Radio 1 - Crno Brdo",
            "frequencyMhz": 87.8,
            "organization": "BH Radio 1",
            "serviceType": "FM Broadcasting",
            "stationClass": "BC"
          }
        ]
      }
    }
  ]
}
```

**One Feature is one physical site.** All transmitters at that site are nested in
`properties.transmitters`. This mirrors the database, which stores locations and
transmitters in separate stores linked by ID, and it removes any need to
reconstruct sites by rounding coordinates.

### Required fields

| Field | Type | Rule |
| --- | --- | --- |
| `type` (top level) | string | Must be `"FeatureCollection"` |
| `toic.profile` | string | Must be `"toic-sites"` |
| `toic.version` | number | Must be `1` |
| `features` | array | At least one Feature |
| `features[].type` | string | Must be `"Feature"` |
| `features[].geometry.type` | string | Must be `"Point"` |
| `features[].geometry.coordinates` | array | `[longitude, latitude]` or `[longitude, latitude, elevation]` |
| `properties.siteId` | string | Non-empty, **unique within the file** |
| `properties.name` | string | Non-empty |
| `properties.transmitters` | array | At least one entry |
| `transmitters[].name` | string | Non-empty |
| `transmitters[].frequencyMhz` | number | Greater than 0, **in MHz** |

Coordinate order is **longitude first**, as RFC 7946 requires — not
`latitude, longitude`. Longitude must be within ±180, latitude within ±90. A
third coordinate is read as elevation and ignored.

### Optional fields

| Field | Type | Rule |
| --- | --- | --- |
| `transmitters[].stationClass` | string | Optional, may be empty; must be text when present |

`stationClass` **is persisted** with the transmitter and shown in the location
card, where it can also be edited. It is expected to carry ITU station-class
symbols (`BC` sound broadcasting, `BT` television broadcasting, `AT` amateur),
but the value is not checked against a controlled list. A transmitter without
one is imported normally — the key is simply omitted.

`organization` and `serviceType` are validated as unknown properties (that is,
accepted) but **not persisted**. They exist so regulator exports survive a round
trip without being rejected.

Any other unknown property is **ignored, not rejected**.

---

## Validation rules

The whole file is rejected if any of these fail. Every problem is reported at
once, prefixed with the feature number:

- Malformed JSON → `errors.geoImportJson`
- File larger than 10 MB → `errors.geoImportTooLarge`
- Any structural or field violation → `errors.geoImportInvalid`, with details

Rejected specifically:

- a repeated `siteId` anywhere in the file
- the same frequency twice on one site (within 0.00001 MHz)
- a frequency given as a string (`"87.8"` instead of `87.8`)
- a frequency of `0` or negative
- coordinates out of range, which also catches swapped `[lat, lon]` order for
  any latitude above 90

## Identity and re-import

Record IDs are derived from the file, not generated randomly:

- location ID = `siteId`
- transmitter ID = `siteId::frequencyMhz`

Importing the same file twice therefore **updates** the existing rows instead of
appending duplicates. Keep `siteId` stable across exports for this to hold.

### Matching against data you already have

IDs are only the fallback. Because two sources describing the same mast rarely
spell things the same way, identity comes from the data itself:

| Incoming | Matched against | Result |
| --- | --- | --- |
| Site | A stored site within **10 m** | Same site: keeps its stored ID and coordinates, **takes the incoming name** |
| Site | Nothing within 10 m | Added as a new location |
| Transmitter | A stored transmitter on the **same frequency at that site** | Same transmitter: keeps its stored ID and `createdAt`, **takes the incoming name** and station class |
| Transmitter | No stored transmitter on that frequency | Added to the site |

So a location is identified by **where it is**, and a transmitter by **what
frequency it runs at there**. The name is treated as a mutable attribute that
the incoming file refreshes, which is what resolves typos, spacing, casing and
one-sided renames — no fuzzy name matching is involved or needed.

Two consequences worth planning for:

- A site is never duplicated by a slightly different coordinate, and a frequency
  is never listed twice at one site.
- **Changing a frequency creates a different transmitter.** Correcting 87.8 to
  88.0 locally and then importing a file that still says 87.8 leaves both, since
  they are two different frequencies at that site. Frequency corrections belong
  in the source that produces the file.

The radius is `SITE_MATCH_RADIUS_METRES` in `src/domain/geoMatch.js`, measured
as a true distance rather than a degree box — a degree box is wider
north-south than east-west, and widens further towards the poles. The same rule
rejects a manually created location that lands on top of an existing one
(`errors.duplicateLocation`).

---

## Converting an existing export

Regulator exports are typically flat — one row per transmitter, no GeoJSON
geometry. Reshaping them is the job of the data producer (your SQL view) or of
the bundled preparation script:

```bash
node scripts/convert-regulator-export.mjs data_raw/transmitters_locations.json data_raw/transmitters.geojson
```

The script expects a JSON array with `location`, `latitude`, `longitude`,
`transmitter_name`, `frequency`, `organization_name`, `service_type` and
`station_class`. It groups rows by `location`, drops what cannot be represented,
and reports every dropped record on stderr so nothing disappears silently.
Known cases it handles:

- duplicate `(location, frequency)` rows — the first one wins
- `0,0` coordinates (null island) — a site is dropped only if *no* row for it has
  usable coordinates
- placeholder `service_type` values such as `-----------` — omitted

## Sample file

[public/samples/sample_transmitters.geojson](../public/samples/sample_transmitters.geojson)
is a valid three-site file covering collocated FM broadcast transmitters and
amateur repeaters. See [SAMPLES_DATA.md](SAMPLES_DATA.md) for public data
sources.
