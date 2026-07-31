import { useEffect, useState } from "react";
import {
  IonActionSheet,
  IonButton,
  IonIcon
} from "@ionic/react";
import {
  checkmarkOutline,
  contrastOutline,
  moonOutline,
  sunnyOutline
} from "ionicons/icons";
import {
  applyThemePreference,
  readMapThemePreference,
  readThemePreference,
  storeMapThemePreference,
  storeThemePreference
} from "../theme/themePreference";
import { useI18n } from "../i18n/I18nProvider";

const themeOptions = [
  {
    value: "system",
    labelKey: "theme.system",
    icon: contrastOutline
  },
  {
    value: "light",
    labelKey: "theme.light",
    icon: sunnyOutline
  },
  {
    value: "dark",
    labelKey: "theme.dark",
    icon: moonOutline
  }
];

function ThemeButton({ mode = "app" }) {
  const { t } = useI18n();
  const readFn = mode === "map" ? readMapThemePreference : readThemePreference;
  const storeFn = mode === "map" ? storeMapThemePreference : storeThemePreference;

  const [preference, setPreference] = useState(readFn);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setPreference(readFn());
  }, [mode]);

  useEffect(() => {
    const eventName = mode === "map" ? "toic-map-theme-change" : "toic-theme-change";

    function handleExternalChange() {
      setPreference(readFn());
    }

    window.addEventListener(eventName, handleExternalChange);
    return () => window.removeEventListener(eventName, handleExternalChange);
  }, [mode]);

  useEffect(() => {
    if (mode !== "app") return;

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

    function applyTheme() {
      applyThemePreference(
        document.documentElement,
        preference,
        mediaQuery?.matches ?? false
      );
    }

    applyTheme();
    mediaQuery?.addEventListener?.("change", applyTheme);
    return () => mediaQuery?.removeEventListener?.("change", applyTheme);
  }, [mode, preference]);

  function selectTheme(nextPreference) {
    const stored = storeFn(nextPreference);
    setPreference(stored);
  }

  const activeOption =
    themeOptions.find((option) => option.value === preference) ??
    themeOptions[0];

  const headerText = mode === "map" ? t("theme.mapAppearance") : t("theme.appearance");
  const subHeaderText = mode === "map" ? t("theme.mapDescription") : t("theme.description");

  return (
    <>
      <IonButton
        onClick={() => setIsOpen(true)}
        aria-label={t("theme.button", {
          theme: t(activeOption.labelKey)
        })}
      >
        <IonIcon slot="icon-only" icon={activeOption.icon} />
      </IonButton>
      <IonActionSheet
        isOpen={isOpen}
        header={headerText}
        subHeader={subHeaderText}
        onDidDismiss={() => setIsOpen(false)}
        buttons={[
          ...themeOptions.map((option) => ({
            text: t(option.labelKey),
            icon:
              option.value === preference
                ? checkmarkOutline
                : option.icon,
            handler: () => selectTheme(option.value)
          })),
          {
            text: t("common.cancel"),
            role: "cancel"
          }
        ]}
      />
    </>
  );
}

export default ThemeButton;
