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

These are validated only if present and are **not persisted** — the database
stores just the location and transmitter fields above. They exist so regulator
exports survive a round trip without being stripped:

`organization`, `serviceType`, `stationClass`

`stationClass` is expected to carry ITU station-class symbols (`BC` sound
broadcasting, `BT` television broadcasting, `AT` amateur), but the value is not
checked against a controlled list.

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

Merging against existing data still matches locations by coordinate proximity
first (within 0.0001°), so a site already saved manually is reused rather than
duplicated.

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
