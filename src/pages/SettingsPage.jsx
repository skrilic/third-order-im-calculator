import { useCallback, useEffect, useState } from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText
} from "@ionic/react";
import AppHeader from "../components/AppHeader";
import AppTabBar from "../components/AppTabBar";
import BackupManager from "../components/BackupManager";
import { getSnapshot } from "../data/database";
import {
  translateError,
  useI18n
} from "../i18n/I18nProvider";

function SettingsPage() {
  const { language, setLanguage, t } = useI18n();
  const [counts, setCounts] = useState({
    locations: 0,
    transmitters: 0
  });
  const [error, setError] = useState("");

  const refreshCounts = useCallback(async () => {
    try {
      const snapshot = await getSnapshot();
      setCounts({
        locations: snapshot.locations.length,
        transmitters: snapshot.transmitters.length
      });
      setError("");
    } catch (loadError) {
      setError(translateError(loadError, t));
    }
  }, [t]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  return (
    <IonPage>
      <AppHeader />
      <IonContent className="calculator-content">
        <main className="calculator-shell">
          <h1 className="page-heading">{t("settings.title")}</h1>
          <p className="calculator-intro">{t("settings.intro")}</p>

          <IonCard className="calculator-card">
            <IonCardHeader>
              <IonCardTitle>{t("settings.backup")}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <BackupManager
                locationCount={counts.locations}
                transmitterCount={counts.transmitters}
                onImported={refreshCounts}
              />
              {error ? (
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>
              ) : null}
            </IonCardContent>
          </IonCard>

          <IonCard className="calculator-card">
            <IonCardHeader>
              <IonCardTitle>{t("settings.language")}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p className="settings-description">
                {t("settings.languageDescription")}
              </p>
              <IonSelect
                label={t("settings.languageLabel")}
                labelPlacement="stacked"
                value={language}
                interface="action-sheet"
                cancelText={t("common.cancel")}
                onIonChange={(event) =>
                  setLanguage(event.detail.value)
                }
              >
                <IonSelectOption value="en">
                  {t("language.en")}
                </IonSelectOption>
                <IonSelectOption value="hr">
                  {t("language.hr")}
                </IonSelectOption>
              </IonSelect>
            </IonCardContent>
          </IonCard>
        </main>
      </IonContent>
      <AppTabBar activeTab="settings" />
    </IonPage>
  );
}

export default SettingsPage;
