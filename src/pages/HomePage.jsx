import { IonContent, IonPage } from "@ionic/react";
import AppHeader from "../components/AppHeader";
import AppTabBar from "../components/AppTabBar";
import LocationManager from "../components/LocationManager";
import { navigateTo } from "../routing/hashRouter";
import { useI18n } from "../i18n/I18nProvider";

function HomePage() {
  const { t } = useI18n();
  return (
    <IonPage>
      <AppHeader />
      <IonContent className="calculator-content">
        <main className="calculator-shell">
          <h1 className="page-heading">{t("home.title")}</h1>
          <p className="calculator-intro">
            {t("home.intro")}
          </p>
          <LocationManager
            onCalculate={(locationId) =>
              navigateTo(
                `/locations/${encodeURIComponent(locationId)}/results`
              )
            }
          />
        </main>
      </IonContent>
      <AppTabBar activeTab="home" />
    </IonPage>
  );
}

export default HomePage;
