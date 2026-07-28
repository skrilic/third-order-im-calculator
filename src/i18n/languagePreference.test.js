import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  readLanguage,
  storeLanguage
} from "./languagePreference";
import { interpolate } from "./I18nProvider";
import { translations } from "./translations";

describe("language preference", () => {
  it.each([
    ["en", "en"],
    ["hr", "hr"],
    ["de", DEFAULT_LANGUAGE],
    [null, DEFAULT_LANGUAGE]
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeLanguage(input)).toBe(expected);
  });

  it("defaults to English and stores a supported language", () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn()
    };

    expect(readLanguage(storage)).toBe("en");
    expect(storeLanguage("hr", storage)).toBe("hr");
    expect(storage.setItem).toHaveBeenCalledWith(
      LANGUAGE_STORAGE_KEY,
      "hr"
    );
  });

  it("interpolates named values", () => {
    expect(interpolate("{count} items", { count: 3 })).toBe(
      "3 items"
    );
  });

  it("contains the same keys in English and Croatian", () => {
    expect(Object.keys(translations.hr).sort()).toEqual(
      Object.keys(translations.en).sort()
    );
  });
});
