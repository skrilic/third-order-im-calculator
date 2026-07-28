import React from "react";
import { createRoot } from "react-dom/client";
import { setupIonicReact } from "@ionic/react";
import {
  ClientSideRowModelModule,
  ModuleRegistry,
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
  TextFilterModule
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
