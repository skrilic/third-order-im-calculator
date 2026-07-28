# Vite and Ionic migration record

## Goal

Replace the deprecated Create React App toolchain and recurring npm override
maintenance with a small, explicit Vite + Ionic React architecture while
preserving web, browser-extension, and Capacitor output.

## Completed changes

- Replaced `react-scripts` with Vite 8 and the Vite React plugin.
- Moved the HTML entry point from `public/index.html` to root `index.html`.
- Configured relative asset paths and retained `build/` as output.
- Added an `IonApp`/`IonPage`/`IonContent` application shell.
- Replaced native form/list/button elements and MUI icons with Ionic components
  and Ionicons.
- Replaced the Papa Parse wrapper with a small local CSV serializer.
- Extracted IM3 calculation into a pure domain module.
- Added Vitest unit tests for calculation, input normalization, and CSV output.
- Replaced object-reference distinctness with index-based formula operands.
- Added stable station IDs and consistent fallback labels.
- Moved `@capacitor/cli` to `devDependencies`.
- Declared compatible TypeScript explicitly for `capacitor.config.ts`.
- Removed every npm override and regenerated `package-lock.json`.

## Removed dependency families

- Create React App and its Webpack/Jest development tree
- Material UI/Emotion icon stack
- `react-papaparse`
- unused Capacitor plugins
- testing libraries that had no tests
- all 21 transitive package overrides

The installation changed from roughly 1,425 packages in the old audit graph to
approximately 200 packages in the new lockfile graph, including optional and
peer packages.

## Compatibility decisions

### Browser extension

Vite uses `base: "./"` so `build/index.html` references local extension assets.
The Manifest V3 file remains in `public/` and is copied to the build root.

### Capacitor

The Vite output directory remains `build/`, matching `capacitor.config.ts`.
TypeScript 5.9 is used because Capacitor CLI 8's TypeScript configuration loader
is not compatible with TypeScript 7.

### AG Grid

Only the client-side row model and text filter modules are registered. Vendor
chunk groups separate AG Grid, Ionic, and React for caching and inspection.

## Verification outcome

```text
npm test       22 tests passed
npm run build  succeeded
npm audit      0 known vulnerabilities
npx cap config succeeded
```

Interactive browser automation was attempted but no controllable browser
session was available in the execution environment. Manual extension and device
smoke testing remain release checklist items.

## Next phase

The next phase should add component/end-to-end tests and one native Capacitor
platform. It should not reintroduce global overrides as a substitute for direct
dependency maintenance.
