export const THEME_STORAGE_KEY = "toic-theme";
export const THEME_PREFERENCES = ["system", "light", "dark"];

export function normalizeThemePreference(value) {
  return THEME_PREFERENCES.includes(value) ? value : "system";
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

export function storeThemePreference(
  preference,
  storage
) {
  const normalized = normalizeThemePreference(preference);

  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(THEME_STORAGE_KEY, normalized);
  } catch {
    // The selected theme still applies for this session.
  }

  return normalized;
}

export function applyThemePreference(
  root,
  preference,
  prefersDark
) {
  const resolved = resolveTheme(preference, prefersDark);

  root.classList.toggle("ion-palette-dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.dataset.agThemeMode = resolved;
  root.style.colorScheme = resolved;
  return resolved;
}
