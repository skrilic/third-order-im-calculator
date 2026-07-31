import React from "react";
import { createRoot } from "react-dom/client";
import { setupIonicReact } from "@ionic/react";
import {
  ClientSideRowModelModule,
  ModuleRegistry,
  NumberFilterModule,
  TextFilterModule
} from "ag-grid-community";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/palettes/dark.class.css";
import "leaflet/dist/leaflet.css";
import "./theme/app.css";

import App from "./App";
import { seedDatabaseIfEmpty } from "./data/seed";
import {
  applyThemePreference,
  readThemePreference
} from "./theme/themePreference";
import { readLanguage } from "./i18n/languagePreference";

setupIonicReact();
applyThemePreference(
  document.documentElement,
  readThemePreference(),
  window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false
);
document.documentElement.lang = readLanguage();
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule
]);

// Seeding runs before the first render so the map and the location list show
// the starter sites immediately instead of appearing after a refresh. It never
// throws, and an unusable database is reported by the screens themselves.
const seedResult = await seedDatabaseIfEmpty();

if (seedResult.seeded) {
  console.info(
    `Intermod: seeded ${seedResult.counts.locations} starter locations.`
  );
} else if (seedResult.error || seedResult.errors) {
  console.warn("Intermod: starter data not seeded —", seedResult.reason);
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
