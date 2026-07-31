import { useCallback, useEffect, useState } from "react";
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText
} from "@ionic/react";
import {
  colorPaletteOutline,
  informationCircleOutline,
  languageOutline,
  layersOutline
} from "ionicons/icons";
import AppHeader from "../components/AppHeader";
import AppTabBar from "../components/AppTabBar";
import BackupManager from "../components/BackupManager";
import MapLayerButton from "../components/MapLayerButton";
import ThemeButton from "../components/ThemeButton";
import { getSnapshot } from "../data/database";
import packageInfo from "../../package.json";
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
          <IonList inset={true}>
            <IonListHeader>
              <IonLabel>{t("settings.preferences")}</IonLabel>
            </IonListHeader>
            <IonItem>
              <IonIcon slot="start" icon={languageOutline} color="primary" />
              <IonLabel>{t("settings.languageLabel")}</IonLabel>
              <IonSelect
                slot="end"
                value={language}
                interface="action-sheet"
                cancelText={t("common.cancel")}
                onIonChange={(event) => setLanguage(event.detail.value)}
              >
                <IonSelectOption value="en">
                  {t("language.en")}
                </IonSelectOption>
                <IonSelectOption value="hr">
                  {t("language.hr")}
                </IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonIcon slot="start" icon={colorPaletteOutline} color="primary" />
              <IonLabel>{t("theme.mapAppearance")}</IonLabel>
              <div slot="end">
                <ThemeButton mode="map" />
              </div>
            </IonItem>
            <IonItem>
              <IonIcon slot="start" icon={layersOutline} color="primary" />
              <IonLabel>{t("theme.mapLayer")}</IonLabel>
              <div slot="end">
                <MapLayerButton />
              </div>
            </IonItem>
          </IonList>

          <BackupManager
            locationCount={counts.locations}
            transmitterCount={counts.transmitters}
            onImported={refreshCounts}
          />

          {error ? (
            <IonText color="danger" style={{ padding: "0 16px" }}>
              <p>{error}</p>
            </IonText>
          ) : null}

          <IonList inset={true}>
            <IonListHeader>
              <IonLabel>{t("settings.about")}</IonLabel>
            </IonListHeader>
            <IonItem>
              <IonIcon slot="start" icon={informationCircleOutline} color="medium" />
              <IonLabel>{t("settings.version")}</IonLabel>
              <IonNote slot="end">v{packageInfo.version}</IonNote>
            </IonItem>
          </IonList>
        </main>
      </IonContent>
      <AppTabBar activeTab="settings" />
    </IonPage>
  );
}

export default SettingsPage;
