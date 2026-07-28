export const LANGUAGE_STORAGE_KEY = "toic-language";
export const SUPPORTED_LANGUAGES = ["en", "hr"];
export const DEFAULT_LANGUAGE = "en";

export function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value)
    ? value
    : DEFAULT_LANGUAGE;
}

export function readLanguage(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    return normalizeLanguage(target?.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function storeLanguage(language, storage) {
  const normalized = normalizeLanguage(language);

  try {
    const target = storage ?? globalThis.localStorage;
    target?.setItem(LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // The selected language still applies for this session.
  }

  return normalized;
}
