import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from "react";
import {
  DEFAULT_LANGUAGE,
  readLanguage,
  storeLanguage
} from "./languagePreference";
import { translations } from "./translations";

const I18nContext = createContext(null);

function interpolate(template, params) {
  return template.replace(/\{(\w+)\}/g, (_match, key) =>
    String(params[key] ?? `{${key}}`)
  );
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    const stored = storeLanguage(nextLanguage);
    setLanguageState(stored);
    document.documentElement.lang = stored;
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      const template =
        translations[language]?.[key] ??
        translations[DEFAULT_LANGUAGE]?.[key] ??
        key;
      return interpolate(template, params);
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}

export function translateError(error, t) {
  const key = error?.message?.startsWith("errors.")
    ? error.message
    : "errors.unknown";
  return t(key);
}

export { interpolate };
