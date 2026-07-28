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
  readThemePreference,
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

function ThemeButton() {
  const { t } = useI18n();
  const [preference, setPreference] = useState(readThemePreference);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    );

    function applyTheme() {
      applyThemePreference(
        document.documentElement,
        preference,
        mediaQuery?.matches ?? false
      );
    }

    applyTheme();
    mediaQuery?.addEventListener?.("change", applyTheme);
    return () =>
      mediaQuery?.removeEventListener?.("change", applyTheme);
  }, [preference]);

  function selectTheme(nextPreference) {
    const stored = storeThemePreference(nextPreference);
    setPreference(stored);
  }

  const activeOption =
    themeOptions.find((option) => option.value === preference) ??
    themeOptions[0];

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
        header={t("theme.appearance")}
        subHeader={t("theme.description")}
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
