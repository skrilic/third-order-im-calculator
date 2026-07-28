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
│   ├── domain/                   Pure IM3 calculation and unit tests
│   ├── theme/                    Ionic variables and responsive styles
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

The current Vitest suite covers:

- both ordered `2fx - fy` products;
- unique `fx + fy - fz` combinations;
- exclusion of zero and negative products;
- fallback station labels;
- rounding to two decimal places.

Run it with:

```bash
npm test
```

Recommended next tests are Ionic component interactions, CSV escaping/download,
and an end-to-end extension popup smoke test.

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
6. test adding, deleting, filtering, and CSV export in the browser;
7. load `build/` as an unpacked extension;
8. verify intentional versions in `package.json` and both extension manifests.
