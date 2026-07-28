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
- Add and remove stations with validation and stable identifiers.
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
- [Development and distribution guide](docs/DEVELOPMENT.md)
- [Architecture and project analysis](docs/PROJECT_ANALYSIS.md)
- [Vite and Ionic migration record](docs/MIGRATION_VITE_IONIC.md)

## Current limitations

- Stations are held only in memory and disappear on refresh.
- Frequency units are not enforced.
- Equal output frequencies are retained as separate formula products.
- Native Android and iOS platform projects are not part of the repository.
