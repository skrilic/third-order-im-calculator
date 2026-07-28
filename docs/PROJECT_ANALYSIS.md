# Architecture and project analysis

## Scope and status

TOIC is a client-side Ionic React application built with Vite. It accepts
transmitter names and frequencies, calculates supported third-order
intermodulation products, renders them in AG Grid, and exports a CSV file.

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
        └── App
            └── Calculation
                ├── AddStation
                ├── StationList
                │   └── Station
                ├── normalizeStation(input)
                ├── calculateIm3(stations)
                ├── AgGridReact
                └── ExportCSV
                    └── createCsv(rows)
```

`Calculation` owns only the source station list. Results are derived with
`useMemo` from the pure `calculateIm3` function, avoiding duplicated mutable
state and calculation effects.

```js
station = {
  id: string,
  name: string,
  frequency: number
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
| `src/main.jsx` | Initializes Ionic, registers required AG Grid modules, and renders React. |
| `src/App.jsx` | Provides the `IonApp` root. |
| `src/components/Calculation.jsx` | Owns stations and composes the Ionic page, derived results, and grid. |
| `src/components/AddStation.jsx` | Collects station input and delegates normalization to the domain layer. |
| `src/components/StationList.jsx` | Renders the current Ionic station list. |
| `src/components/Station.jsx` | Renders one station with an accessible delete button. |
| `src/components/ExportCSV.jsx` | Downloads domain-serialized CSV without a third-party CSV package. |
| `src/domain/calculateIm3.js` | Contains pure formula, labeling, filtering, and rounding logic. |
| `src/domain/normalizeStation.js` | Validates and normalizes station form values. |
| `src/domain/createCsv.js` | Escapes and serializes result rows as spreadsheet-compatible CSV. |
| `src/domain/*.test.js` | Contains 22 unit tests for the three domain modules. |

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

1. `AddStation` converts a valid input frequency to a number.
2. `Calculation` appends a fresh station with a stable ID.
3. `calculateIm3` derives a new result array.
4. AG Grid receives the result rows for sorting and filtering.
5. `ExportCSV` receives the same full result array.
6. Deletion filters by station ID and automatically derives new results.

No data leaves React memory. Refreshing the application clears all stations.

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
| Data grid | AG Grid Community 35 |
| Icons | Ionicons 8 |
| Build | Vite 8 and React plugin |
| Tests | Vitest 4 |
| Native wrapper | Capacitor Core/CLI 8 |
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
| `npm test` | Twenty-two domain unit tests pass. |
| `npm run build` | Vite production build succeeds. |
| `npm audit` | Zero known vulnerabilities. |
| `npx cap config` | TypeScript configuration loads successfully. |
| Extension payload | Manifest V3, icons, relative JS/CSS, and popup HTML are present in `build/`. |
| Browser automation | Not run in this environment because no controllable browser session was available. |

## Strengths

- Domain calculations are isolated from React lifecycle code.
- The dependency graph is much smaller and contains no global overrides.
- Ionic components improve mobile layout and control semantics.
- The same output contract is preserved for extensions and Capacitor.
- CSV export no longer requires a separate parser dependency.
- Tests cover numerical rules, input normalization, and CSV serialization.

## Remaining priorities

### High priority

1. Add component tests for form feedback, deletion, and the download side effect.
2. Perform manual and automated smoke tests of the Manifest V3 popup.
3. Add CI steps for install, audit, test, build, and Capacitor config validation.
4. Decide whether station state should persist locally.

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
