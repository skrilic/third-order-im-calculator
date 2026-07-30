# Third-order intermodulation calculator

Third-order intermodulation calculator (TOIC) is an Ionic React application for
calculating third-order intermodulation products for collocated transmitters.
The same Vite build can run on the web, as a Manifest V3 browser extension, or
inside a Capacitor native application.

For a set of entered frequencies, the application evaluates:

<p>
  f<sub>IM</sub> = 2f<sub>x</sub> - f<sub>y</sub>
  &nbsp;and&nbsp;
  f<sub>IM</sub> = f<sub>x</sub> + f<sub>y</sub> - f<sub>z</sub>
</p>

Only products greater than zero are displayed.

## Features

- Responsive Ionic interface for web and mobile form factors.
- Mobile application shell with an Ionic top toolbar, bottom
  Home/Calculate/Settings tab bar, safe-area-aware layout, and persistent
  system/light/dark themes.
- Dependency-free English/Croatian i18n infrastructure with English as the
  default language and a locally persisted language choice.
- Create, edit, and delete named map locations and their transmitters.
- Open a saved location's result route to calculate with every associated
  transmitter.
- Add locations by clicking OpenStreetMap and manage existing data by clicking
  its marker.
- Center the map on the current device position through the official Capacitor
  Geolocation plugin after an explicit user permission action.
- Store locations and transmitters persistently in IndexedDB.
- Export and import validated, versioned JSON backups with merge and atomic
  replace modes.
- Retain manual frequency entry for quick, unsaved calculations.
- Navigate between the map, manual calculator, and location results through
  extension-safe hash routes.
- Calculate supported IM3 products through a tested pure domain function.
- Sort and filter results with AG Grid.
- Export results as a semicolon-delimited UTF-8 CSV file.
- Build a Manifest V3 extension and Capacitor-compatible web bundle.

## Requirements

- Node.js 22.12 or newer
- npm

## Quick start

```bash
npm ci
npm run dev
```

Vite serves the development application at `http://localhost:5173`.

Application routes:

- `#/` — location map and CRUD;
- `#/calculate` — manual calculator;
- `#/settings` — data backup and application language;
- `#/locations/:id/results` — calculated results for a saved location.

## Verification

```bash
npm test
npm run build
npm audit
```

The production files are written to `build/`. The repository intentionally has
no npm `overrides`; transitive security updates are resolved through compatible
package releases and a regenerated lockfile.

## Distribution

### Browser extension

Run `npm run build`, then load `build/` as an unpacked extension in a
Chromium-based browser. Vite uses a relative public base so generated assets
resolve from the extension directory. `public/manifest.json` is the active
Manifest V3 definition.

### Capacitor

`capacitor.config.ts` uses `build/` as its web directory. The Capacitor CLI and
TypeScript are development dependencies. Native Android and iOS projects are
not yet included; add the selected platform before running sync/open commands.

## Documentation

- [User guide](docs/index.md)
- [Location database and backup guide](docs/DATA_MANAGEMENT.md)
- [Transmitter import format specification](docs/IMPORT_FORMAT.md)
- [Sample test data and external databases](docs/SAMPLES_DATA.md)
- [Geolocation integration and native permissions](docs/GEOLOCATION.md)
- [Development and distribution guide](docs/DEVELOPMENT.md)
- [Architecture and project analysis](docs/PROJECT_ANALYSIS.md)
- [Vite and Ionic migration record](docs/MIGRATION_VITE_IONIC.md)

## Transmitter import

The importer accepts exactly one format: the `toic-sites` GeoJSON profile, one
Point feature per site with its transmitters nested in the feature properties.
Files that do not match are rejected in full with a list of every problem found —
there is no format sniffing and no partial import. See
[docs/IMPORT_FORMAT.md](docs/IMPORT_FORMAT.md) for the specification.

A valid sample is provided in `public/samples/sample_transmitters.geojson`. Flat,
one-row-per-transmitter regulator exports can be reshaped with:

```bash
node scripts/convert-regulator-export.mjs <input.json> [output.geojson]
```

See [docs/SAMPLES_DATA.md](docs/SAMPLES_DATA.md) for external database references.

## Current limitations

- Manual calculation entries are held only in memory and disappear on refresh;
  saved locations and transmitters persist in IndexedDB.
- IndexedDB storage is local to each browser profile, extension origin, or native
  WebView. Use JSON export to move or preserve data.
- Frequency units are not enforced in manual entry; the import format requires
  MHz via the `frequencyMhz` field.
- Equal output frequencies are retained as separate formula products.
- Native Android and iOS platform projects are not part of the repository.
