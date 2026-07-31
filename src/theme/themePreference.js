import { useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "toic-theme";
export const MAP_THEME_STORAGE_KEY = "toic-map-theme";
export const MAP_LAYER_STORAGE_KEY = "toic-map-layer";

export const THEME_PREFERENCES = ["system", "light", "dark"];
export const MAP_LAYERS = ["standard", "satellite", "topographic"];

export function normalizeThemePreference(value) {
  return THEME_PREFERENCES.includes(value) ? value : "system";
}

export function normalizeMapLayerPreference(value) {
  return MAP_LAYERS.includes(value) ? value : "standard";
}

export function resolveTheme(preference, prefersDark) {
  const normalized = normalizeThemePreference(preference);

  if (normalized === "system") {
    return prefersDark ? "dark" : "light";
  }

  return normalized;
}

export function readThemePreference(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    return normalizeThemePreference(target?.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function storeThemePreference(preference, storage) {
  const normalized = normalizeThemePreference(preference);

  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(THEME_STORAGE_KEY, normalized);
  } catch {
    // The selected theme still applies for this session.
  }

  try {
    globalThis.dispatchEvent?.(
      new CustomEvent("toic-theme-change", { detail: normalized })
    );
  } catch {
    // Event dispatch optional in non-browser envs
  }

  return normalized;
}

export function applyThemePreference(root, preference, prefersDark) {
  const resolved = resolveTheme(preference, prefersDark);

  root.classList.toggle("ion-palette-dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.dataset.agThemeMode = resolved;
  root.style.colorScheme = resolved;
  return resolved;
}

export function readMapThemePreference(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    return normalizeThemePreference(target?.getItem(MAP_THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function storeMapThemePreference(preference, storage) {
  const normalized = normalizeThemePreference(preference);

  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(MAP_THEME_STORAGE_KEY, normalized);
  } catch {
    // The selected theme still applies for this session.
  }

  try {
    globalThis.dispatchEvent?.(
      new CustomEvent("toic-map-theme-change", { detail: normalized })
    );
  } catch {
    // Event dispatch optional in non-browser envs
  }

  return normalized;
}

export function resolveMapTheme(preference, prefersDark) {
  return resolveTheme(preference, prefersDark);
}

export function useMapTheme() {
  const [preference, setPreference] = useState(readMapThemePreference);
  const [prefersDark, setPrefersDark] = useState(
    () => globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false
  );

  useEffect(() => {
    const handleMapThemeChange = () => {
      setPreference(readMapThemePreference());
    };
    const mediaQuery = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
    const handleMediaChange = (e) => {
      setPrefersDark(e.matches);
    };

    globalThis.addEventListener?.("toic-map-theme-change", handleMapThemeChange);
    globalThis.addEventListener?.("storage", handleMapThemeChange);
    mediaQuery?.addEventListener?.("change", handleMediaChange);

    return () => {
      globalThis.removeEventListener?.("toic-map-theme-change", handleMapThemeChange);
      globalThis.removeEventListener?.("storage", handleMapThemeChange);
      mediaQuery?.removeEventListener?.("change", handleMediaChange);
    };
  }, []);

  return resolveMapTheme(preference, prefersDark);
}

export function readMapLayerPreference(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    return normalizeMapLayerPreference(target?.getItem(MAP_LAYER_STORAGE_KEY));
  } catch {
    return "standard";
  }
}

export function storeMapLayerPreference(layer, storage) {
  const normalized = normalizeMapLayerPreference(layer);

  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(MAP_LAYER_STORAGE_KEY, normalized);
  } catch {
    // The selected layer still applies for this session.
  }

  try {
    globalThis.dispatchEvent?.(
      new CustomEvent("toic-map-layer-change", { detail: normalized })
    );
  } catch {
    // Event dispatch optional in non-browser envs
  }

  return normalized;
}

export function useMapLayer() {
  const [layer, setLayer] = useState(readMapLayerPreference);

  useEffect(() => {
    const handleMapLayerChange = () => {
      setLayer(readMapLayerPreference());
    };

    globalThis.addEventListener?.("toic-map-layer-change", handleMapLayerChange);
    globalThis.addEventListener?.("storage", handleMapLayerChange);

    return () => {
      globalThis.removeEventListener?.("toic-map-layer-change", handleMapLayerChange);
      globalThis.removeEventListener?.("storage", handleMapLayerChange);
    };
  }, []);

  return layer;
}
