# Development and distribution guide

## Prerequisites

- Node.js 22.12 or newer
- npm
- A Chromium-based browser for extension testing
- Platform-specific tooling only after a Capacitor native platform is added

Vite 8 defines the effective Node.js minimum. TypeScript 5.9 is an explicit
development dependency because Capacitor CLI 8 loads `capacitor.config.ts`.

## Install and run

```bash
npm ci
npm run dev
```

Create and preview a production build:

```bash
npm run build
npm run preview
```

Vite writes production output to `build/`, which is ignored by Git.

## Available npm scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Alias for the Vite development server. |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Creates the web/extension/Capacitor bundle in `build/`. |
| `npm run preview` | Serves the production bundle locally. |
| `npm test` | Runs the Vitest suite once. |

## Project structure

```text
.
├── index.html                    Vite HTML entry point
├── vite.config.js                Relative base, build output, chunk strategy
├── capacitor.config.ts           Capacitor application configuration
├── docs/                         User, development, analysis, and migration docs
├── public/                       Extension manifests, icons, and static files
├── src/
│   ├── components/               Ionic form/list/export and AG Grid view
│   ├── data/                     IndexedDB CRUD, cascade delete, and import
│   │                              plus Capacitor geolocation adapter
│   ├── domain/                   Pure calculation, validation, merge, and tests
│   ├── i18n/                     English/Croatian catalogs, provider, storage
│   ├── pages/                    Home/map and saved-location result pages
│   ├── routing/                  Dependency-free hash router and route tests
│   ├── theme/                    Palettes, preference logic, styles, and tests
│   ├── utils/                    Browser download adapter
│   ├── App.jsx                   Ionic application root
│   └── main.jsx                  Ionic and AG Grid initialization
├── package.json                  Direct runtime/development dependencies
└── package-lock.json             Reproducible dependency graph
```

## Dependency security

Run both audits:

```bash
npm audit
npm audit --omit=dev
```

The repository does not use npm `overrides`. Do not add one as the first
response to an advisory. Prefer, in order:

1. update the direct parent within its compatible version range;
2. update or replace the direct dependency that owns the affected subtree;
3. remove an unused dependency;
4. use a narrowly scoped, documented override only as temporary containment.

If an override becomes unavoidable, record its parent, advisory, compatibility
evidence, addition date, and removal condition.

Do not routinely run `npm audit fix --force`; it can replace direct dependencies
with incompatible versions. A regular `npm audit fix` may be used after its
proposed compatible changes have been reviewed.

## Testing

The current Vitest suite contains 80 tests across ten modules:

- IM3 formulas, candidate counts, positivity filtering, fallback labels,
  rounding, duplicate operands, and input immutability;
- station-name trimming, numeric conversion, zero, and invalid frequencies;
- CSV headers, UTF-8 BOM, semicolon delimiters, CRLF lines, quotes, nullish
  values, and embedded delimiters/newlines;
- location and transmitter normalization, coordinate limits, required
  relationships, and stable metadata;
- backup envelopes, schema validation, referential integrity, conflict
  analysis, JSON parsing, and deterministic merge behavior;
- IndexedDB create/update/delete, cascade deletion, missing-location
  protection, merge, atomic replacement, and rejection without data loss;
- saved-location result route matching, URL decoding, and malformed route
  rejection;
- theme normalization, system resolution, persistent storage, Ionic dark-class
  application, browser color scheme, and AG Grid theme mode;
- language normalization, English fallback, local persistence, interpolation,
  translation-catalog parity, and localized CSV headers;
- web/extension/native geolocation permission flow, position normalization,
  invalid coordinates, error-code mapping, and plugin options.

Run it with:

```bash
npm test
```

`fake-indexeddb` is a development-only dependency used to exercise the actual
database adapter without a browser. Recommended next tests are Ionic component
interactions, the browser download side effect, map event propagation, and an
end-to-end extension popup smoke test.

## Application routes

TOIC uses a small local hash router instead of a routing dependency:

| Route | Purpose |
| --- | --- |
| `#/` | OpenStreetMap location and transmitter CRUD. |
| `#/calculate` | Unsaved manual station entry and calculation. |
| `#/settings` | JSON data backup and application-language selection. |
| `#/locations/:id/results` | Read a saved location and render its IM3 products. |

Hash paths do not require server fallback rules, work in the Manifest V3 popup,
and preserve browser back/forward behavior. Route parameters are encoded before
navigation and decoded only after a strict path match.

## Mobile shell and themes

Every route renders the same mobile navigation pattern:

- `AppHeader` uses `IonToolbar`, shows the compact `TOIC` name, and places the
  appearance action in the upper-right corner;
- `AppTabBar` uses `IonTabBar`/`IonTabButton` for icon-labeled **Home**,
  **Calculate**, and **Settings** destinations;
- manual stations are owned by `App`, so switching tabs does not clear an
  unfinished calculation.

The saved `toic-theme` preference is `system`, `light`, or `dark`. It is applied
before the first React render, avoiding a light-theme flash. Dark mode uses the
official Ionic class palette. The resolved theme is also written to
`data-ag-theme-mode`, allowing AG Grid's variable colour scheme to switch
without rebuilding the grid.

## Localization

`I18nProvider` exposes the active language, its setter, and the `t()` lookup
function. Catalogs are flat key/value maps in `src/i18n/translations.js`.
English is both the default and fallback language; Croatian supplies the same
key set, enforced by a unit test.

The `toic-language` localStorage entry stores `en` or `hr`. The HTML `lang`
attribute is set before the first React render and updated when the selection
changes. Localization covers Ionic navigation, forms, CRUD dialogs, validation
errors, backup flow, AG Grid filter/sort text, empty states, accessibility
labels, and CSV headers.

The other persisted preference is `toic-theme`, whose accepted values are
`system`, `light`, and `dark`.

## Map configuration

The default map uses the standard OpenStreetMap tile service. A deployment can
select another compatible provider without changing source:

```bash
VITE_MAP_TILE_URL="https://example.com/{z}/{x}/{y}.png" \
VITE_MAP_TILE_ATTRIBUTION="Map data attribution" \
npm run build
```

Both values are compiled into the client bundle. Do not put a private,
unrestricted provider secret in a `VITE_` variable. OpenStreetMap attribution
must remain visible when OpenStreetMap data or tiles are used. The application
does not prefetch tiles or implement offline tile downloading.

## Geolocation

`@capacitor/geolocation` is pinned to 8.2.0 and wrapped by
`src/data/geolocation.js`. The UI invokes it only from the explicit location
button. The adapter skips native permission methods on web, requests foreground
permission on Android/iOS, and supports optional WebExtension permission.

Native permission entries and the boundary for the future automatic mode are
documented in [GEOLOCATION.md](GEOLOCATION.md). Because generated native
platform projects are not yet committed, run the documented manifest/Info.plist
step immediately after adding a platform and before `npx cap sync`.

## Browser extension build

```bash
npm run build
```

Then:

1. open the browser's extension management page;
2. enable developer mode;
3. choose **Load unpacked**;
4. select `build/`;
5. open TOIC from the extensions toolbar.

Vite's `base: "./"` makes emitted JS and CSS references relative to
`build/index.html`. `public/manifest.json` is copied as the active Manifest V3
manifest. `public/manifest v2.json` remains a legacy alternative and is not
selected automatically.

## Vite chunk strategy

The configuration separates React, Ionic, and AG Grid into stable vendor chunks.
This improves cache behavior and keeps application code small. Ionic and AG Grid
are substantial UI libraries, so the configured warning threshold is 1,200 kB
uncompressed; current vendor chunks remain well below that threshold and below
approximately 230 kB each when gzip-compressed.

## Capacitor status

| Setting | Value |
| --- | --- |
| Application ID | `third.order.im.calculator` |
| Application name | `third-order-im-calculator` |
| Web directory | `build` |

Validate the configuration with:

```bash
npx cap config
```

There is no `android/` or `ios/` directory and no platform package yet. Once a
platform is deliberately added, rebuild before running its Capacitor sync
command.

## Verification checklist

Before publishing:

1. run `npm ci`;
2. run `npm audit` and `npm audit --omit=dev`;
3. run `npm test`;
4. run `npm run build`;
5. validate `npx cap config`;
6. test the empty-map click, marker click, current-position button,
   permission-denied path, location/transmitter CRUD, filtering, CSV export,
   and both JSON import modes in the browser;
7. load `build/` as an unpacked extension;
8. verify intentional versions in `package.json` and both extension manifests.
