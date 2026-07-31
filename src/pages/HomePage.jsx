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
      <IonContent className="calculator-content" scrollY={false}>
        <main className="calculator-shell calculator-shell--fixed" style={{ padding: "8px" }}>
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
