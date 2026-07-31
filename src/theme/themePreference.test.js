import { describe, expect, it, vi } from "vitest";
import {
  applyThemePreference,
  MAP_LAYER_STORAGE_KEY,
  MAP_THEME_STORAGE_KEY,
  normalizeMapLayerPreference,
  normalizeThemePreference,
  readMapLayerPreference,
  readMapThemePreference,
  readThemePreference,
  resolveMapTheme,
  resolveTheme,
  storeMapLayerPreference,
  storeMapThemePreference,
  storeThemePreference,
  THEME_STORAGE_KEY
} from "./themePreference";

describe("theme preference", () => {
  it.each([
    ["system", "system"],
    ["light", "light"],
    ["dark", "dark"],
    ["unknown", "system"],
    [null, "system"]
  ])("normalizes theme %s to %s", (input, expected) => {
    expect(normalizeThemePreference(input)).toBe(expected);
  });

  it.each([
    ["standard", "standard"],
    ["satellite", "satellite"],
    ["topographic", "topographic"],
    ["unknown", "standard"],
    [null, "standard"]
  ])("normalizes map layer %s to %s", (input, expected) => {
    expect(normalizeMapLayerPreference(input)).toBe(expected);
  });

  it("resolves the system preference from the media query", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("keeps an explicit theme regardless of the system setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("reads, validates, and writes the app theme preference", () => {
    const storage = {
      getItem: vi.fn(() => "dark"),
      setItem: vi.fn()
    };

    expect(readThemePreference(storage)).toBe("dark");
    expect(storeThemePreference("light", storage)).toBe("light");
    expect(storage.setItem).toHaveBeenCalledWith(
      THEME_STORAGE_KEY,
      "light"
    );
  });

  it("reads, validates, and writes the map theme preference", () => {
    const storage = {
      getItem: vi.fn(() => "light"),
      setItem: vi.fn()
    };

    expect(readMapThemePreference(storage)).toBe("light");
    expect(storeMapThemePreference("dark", storage)).toBe("dark");
    expect(storage.setItem).toHaveBeenCalledWith(
      MAP_THEME_STORAGE_KEY,
      "dark"
    );
  });

  it("reads, validates, and writes the map layer preference", () => {
    const storage = {
      getItem: vi.fn(() => "satellite"),
      setItem: vi.fn()
    };

    expect(readMapLayerPreference(storage)).toBe("satellite");
    expect(storeMapLayerPreference("topographic", storage)).toBe("topographic");
    expect(storage.setItem).toHaveBeenCalledWith(
      MAP_LAYER_STORAGE_KEY,
      "topographic"
    );
  });

  it("resolves map theme independently", () => {
    expect(resolveMapTheme("system", true)).toBe("dark");
    expect(resolveMapTheme("light", true)).toBe("light");
  });

  it("applies the resolved class and browser color scheme", () => {
    const root = {
      classList: { toggle: vi.fn() },
      dataset: {},
      style: {}
    };

    expect(applyThemePreference(root, "system", true)).toBe("dark");
    expect(root.classList.toggle).toHaveBeenCalledWith(
      "ion-palette-dark",
      true
    );
    expect(root.dataset.theme).toBe("dark");
    expect(root.dataset.agThemeMode).toBe("dark");
    expect(root.style.colorScheme).toBe("dark");
  });
});
