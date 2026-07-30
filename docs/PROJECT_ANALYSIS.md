# Architecture and project analysis

## Scope and status

TOIC is a client-side Ionic React application built with Vite. It maintains a
local IndexedDB catalog of map locations and transmitters, loads a selected
location into the calculator, calculates supported third-order intermodulation
products, renders them in AG Grid, and exports CSV results or JSON backups.

The production output serves three targets:

- static web application;
- Manifest V3 browser-extension popup;
- Capacitor web bundle.

Native Android and iOS platform projects are not yet included.

## Runtime architecture

```text
index.html
    │
    └── src/main.jsx
        ├── setupIonicReact()
        ├── register minimal AG Grid modules
        ├── seedDatabaseIfEmpty() — starter sites on a first run only
        └── App
            ├── I18nProvider
            ├── hashRouter
            ├── AppHeader
            │   └── ThemeButton
            ├── AppTabBar
            ├── HomePage
            │   └── LocationManager
            │       ├── LocationMap (React Leaflet)
            │       ├── Geolocation adapter
            │       ├── LocationFormModal
            │       ├── LocationDetailsModal
            │       └── IndexedDB adapter
            ├── Calculation (manual route)
            │   ├── AddStation
            │   ├── StationList
            │   └── ResultsGrid
            ├── LocationResultsPage
            │   ├── IndexedDB snapshot
            │   ├── StationList
            │   └── ResultsGrid
            │       ├── calculateIm3(stations)
            │       ├── AgGridReact
            │       └── ExportCSV
            └── SettingsPage
                ├── BackupManager
                └── Language selector
```

`App` owns the unsaved manual station list so it survives tab changes.
`Calculation` edits that list, while a saved location result page reads its
location and transmitter set from IndexedDB. Both routes derive results with
the pure `calculateIm3` function and render the shared `ResultsGrid`.

```js
station = {
  id: string,
  name: string,
  frequency: number
}

location = {
  id: string,
  name: string,
  latitude: number,
  longitude: number,
  createdAt: string,
  updatedAt: string
}

transmitter = {
  id: string,
  locationId: string,
  name: string,
  frequency: number,
  stationClass?: string,
  createdAt: string,
  updatedAt: string
}

result = {
  description: string,
  frequency: string
}
```

Stable station identifiers are used for React keys and deletion. Calculation
distinctness is based on array indices rather than JavaScript object identity.

## Component responsibilities

| File | Responsibility |
| --- | --- |
| `src/main.jsx` | Initializes Ionic, registers required AG Grid modules, seeds a first-run database, and renders React. |
| `src/App.jsx` | Provides the `IonApp` root. |
| `src/components/Calculation.jsx` | Edits the app-owned manual station list and composes the calculation route. |
| `src/components/AppHeader.jsx` | Renders the compact Ionic toolbar and upper-right theme action. |
| `src/components/AppTabBar.jsx` | Renders icon-based Home/Calculate/Settings mobile navigation. |
| `src/components/ThemeButton.jsx` | Selects and persists system/light/dark appearance. |
| `src/components/ResultsGrid.jsx` | Shares AG Grid and CSV output across both calculation routes. |
| `src/pages/HomePage.jsx` | Hosts map-based location/transmitter management. |
| `src/pages/LocationResultsPage.jsx` | Loads one saved location and calculates all associated transmitters. |
| `src/pages/SettingsPage.jsx` | Hosts JSON backup/import and language selection. |
| `src/routing/hashRouter.js` | Implements extension-safe hash navigation and strict result-route matching. |
| `src/i18n/I18nProvider.jsx` | Provides English-default translation lookup and persisted language changes. |
| `src/i18n/translations.js` | Contains matching English and Croatian UI catalogs. |
| `src/components/LocationManager.jsx` | Coordinates persisted data, selection, map dialogs, and backups. |
| `src/components/LocationMap.jsx` | Renders OpenStreetMap tiles and non-bubbling location markers. |
| `src/data/geolocation.js` | Normalizes explicit web, extension, Android, and iOS location requests. |
| `src/components/LocationDetailsModal.jsx` | Lists location transmitters and provides location/transmitter CRUD. |
| `src/components/BackupManager.jsx` | Previews, exports, merges, and replaces versioned JSON backups. |
| `src/components/AddStation.jsx` | Collects station input and delegates normalization to the domain layer. |
| `src/components/StationList.jsx` | Renders the current Ionic station list, with optional per-station selection. |
| `src/components/Station.jsx` | Renders one station with an accessible include checkbox and delete button. |
| `src/components/ExportCSV.jsx` | Downloads domain-serialized CSV without a third-party CSV package. |
| `src/domain/calculateIm3.js` | Contains pure formula, labeling, filtering, and rounding logic. |
| `src/domain/normalizeStation.js` | Validates and normalizes station form values; requires a name when the station can be persisted. |
| `src/domain/calculationList.js` | Builds the working station list: stored transmitters, session additions, and inclusion filtering. |
| `src/domain/createCsv.js` | Escapes and serializes result rows as spreadsheet-compatible CSV. |
| `src/domain/records.js` | Validates and normalizes persisted location/transmitter records. |
| `src/domain/backup.js` | Defines backup schema validation, parsing, conflict analysis, and merge rules. |
| `src/domain/geoMatch.js` | Decides when two coordinate pairs mean the same site, by metric distance. |
| `src/data/database.js` | Implements IndexedDB CRUD, cascade deletion, snapshots, inspection, and atomic writes. |
| `src/data/seed.js` | Imports the shipped starter sites once, only into a database with no records at all. |
| `src/data/seedSites.js` | Generated starter data, built from `data_raw/seed_sites.geojson` by `npm run build:seed`. |
| `src/theme/themePreference.js` | Resolves, stores, and applies Ionic and AG Grid theme modes. |
| `src/**/*.test.js` | Contains 181 unit, route, theme, i18n, geolocation, seeding, site-matching, and IndexedDB adapter tests across fifteen modules. |

## Calculation behavior

For every ordered pair of distinct indices:

<p>2f<sub>x</sub> - f<sub>y</sub></p>

This creates `n(n - 1)` candidates before positive-result filtering.

For each unordered addition pair and a distinct subtraction index:

<p>f<sub>x</sub> + f<sub>y</sub> - f<sub>z</sub></p>

This creates `n(n - 1)(n - 2) / 2` candidates. For `n >= 3`, the combined
pre-filter total is `n²(n - 1) / 2`, so runtime growth is cubic.

The domain function:

- starts calculating at two stations;
- adds three-frequency products at three stations;
- retains only values greater than zero;
- formats frequencies with `toFixed(2)`;
- preserves separate formula rows even when output frequencies match;
- applies consistent `F[index]` fallback names.

## State and data flow

1. `HomePage` provides location/transmitter CRUD without owning calculation
   state.
2. **Calculate** on a marker navigates to
   `#/locations/:id/results`.
3. `LocationResultsPage` reads IndexedDB and filters transmitters by
   `locationId`.
4. The `#/calculate` route builds a separate in-memory station set.
5. `calculateIm3` derives a new result array for either calculation page.
6. AG Grid receives the result rows for sorting and filtering.
7. `ExportCSV` receives the same full result array.

Saved catalog data remains local to the current origin. Manual entries remain
in React memory and clear on refresh. JSON backup is the explicit portability
and recovery mechanism.

## Build and distribution architecture

Vite uses:

- root `index.html` as the entry;
- `base: "./"` for extension-compatible relative asset URLs;
- `build/` as output for Capacitor compatibility;
- the `public/` directory for untransformed manifests and icons;
- explicit React, Ionic, and AG Grid vendor chunks.

The current output keeps application code separate from the large UI libraries.
AG Grid registers only its client-side row model and text filter modules rather
than `AllCommunityModule`.

## Dependency and security status

The Create React App toolchain, `react-scripts`, `webpack-dev-server`,
Material UI icon stack, Papa Parse wrapper, and all 21 npm overrides have been
removed.

The direct dependency set is now:

| Area | Implementation |
| --- | --- |
| UI runtime | React 19 and Ionic React 8 |
| Data grid | AG Grid Community 36 |
| Map | Leaflet 1.9 and React Leaflet 5 |
| Icons | Ionicons 8 |
| Build | Vite 8 and React plugin |
| Tests | Vitest 4 |
| Native wrapper | Capacitor Core/CLI 8 |
| Device position | Capacitor Geolocation 8.2 |
| Config loader | TypeScript 5.9 |

As of 28 July 2026:

- `npm audit` reports zero known vulnerabilities;
- the lockfile has no `overrides`;
- `shell-quote`, `websocket-driver`, `fast-uri`, `react-scripts`, and
  `webpack-dev-server` are not installed;
- Capacitor's patched `tar` and `brace-expansion` versions are resolved through
  their normal compatible ranges.

An audit is a time-specific dependency database check, not proof of application
security. It should remain part of CI and release verification.

## Verified project health

| Check | Result |
| --- | --- |
| `npm test` | Eighty domain, route, theme, i18n, geolocation, and IndexedDB adapter tests pass. |
| `npm run build` | Vite production build succeeds. |
| `npm audit` | Zero known vulnerabilities. |
| `npx cap config` | TypeScript configuration loads successfully. |
| Extension payload | Manifest V3, icons, relative JS/CSS, and popup HTML are present in `build/`. |
| Browser automation | Not run in this environment because no controllable browser session was available. |

## Strengths

- Domain calculations are isolated from React lifecycle code.
- The dependency graph is much smaller and contains no global overrides.
- Ionic components improve mobile layout and control semantics.
- The toolbar, bottom tab bar, theme action, and safe-area-aware Ionic shell
  follow a native-mobile navigation pattern.
- The same output contract is preserved for extensions and Capacitor.
- CSV export no longer requires a separate parser dependency.
- IndexedDB writes preserve referential integrity and use atomic transactions.
- Versioned JSON backups provide explicit local-data portability and recovery.
- Tests cover numerical rules, persistence, backup validation, and merge rules.

## Remaining priorities

### High priority

1. Add component tests for map event propagation, modal feedback, deletion,
   and the download side effect.
2. Perform manual and automated smoke tests of the Manifest V3 popup.
3. Add CI steps for install, audit, test, build, and Capacitor config validation.
4. Add migrations when a second persisted schema version is introduced.

### Medium priority

1. Add an explicit frequency unit selector or project-wide unit setting.
2. Add optional output-frequency deduplication/grouping.
3. Consider lazy-loading AG Grid if initial mobile startup becomes a concern.
4. Synchronize the package and extension release versions.

### Native delivery

1. Select Android and/or iOS as the first supported platform.
2. Add the matching Capacitor platform dependency and generated project.
3. Configure native application icons, splash screens, signing, and CI builds.
4. Test safe-area, keyboard, and file-download behavior on physical devices.
