import { describe, expect, it, vi } from "vitest";
import {
  applyThemePreference,
  normalizeThemePreference,
  readThemePreference,
  resolveTheme,
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
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeThemePreference(input)).toBe(expected);
  });

  it("resolves the system preference from the media query", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("keeps an explicit theme regardless of the system setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("reads, validates, and writes the preference", () => {
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
