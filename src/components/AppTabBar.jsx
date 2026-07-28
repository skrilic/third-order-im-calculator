import {
  IonFooter,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton
} from "@ionic/react";
import {
  calculatorOutline,
  homeOutline,
  settingsOutline
} from "ionicons/icons";
import { useI18n } from "../i18n/I18nProvider";
import { navigateTo } from "../routing/hashRouter";

function AppTabBar({ activeTab }) {
  const { t } = useI18n();

  return (
    <IonFooter>
      <IonTabBar className="app-tab-bar">
        <IonTabButton
          tab="home"
          selected={activeTab === "home"}
          onClick={() => navigateTo("/")}
        >
          <IonIcon icon={homeOutline} />
          <IonLabel>{t("nav.home")}</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="calculate"
          selected={activeTab === "calculate"}
          onClick={() => navigateTo("/calculate")}
        >
          <IonIcon icon={calculatorOutline} />
          <IonLabel>{t("nav.calculate")}</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="settings"
          selected={activeTab === "settings"}
          onClick={() => navigateTo("/settings")}
        >
          <IonIcon icon={settingsOutline} />
          <IonLabel>{t("nav.settings")}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonFooter>
  );
}

export default AppTabBar;
