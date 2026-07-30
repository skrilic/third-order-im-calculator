import {
  IonFooter,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton
} from "@ionic/react";
import {
  calculator,
  calculatorOutline,
  home,
  homeOutline,
  settings,
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
          className={activeTab === "home" ? "tab-selected" : ""}
          onClick={() => navigateTo("/")}
        >
          <IonIcon icon={activeTab === "home" ? home : homeOutline} />
          <IonLabel>{t("nav.home")}</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="calculate"
          selected={activeTab === "calculate"}
          className={activeTab === "calculate" ? "tab-selected" : ""}
          onClick={() => navigateTo("/calculate")}
        >
          <IonIcon icon={activeTab === "calculate" ? calculator : calculatorOutline} />
          <IonLabel>{t("nav.calculate")}</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="settings"
          selected={activeTab === "settings"}
          className={activeTab === "settings" ? "tab-selected" : ""}
          onClick={() => navigateTo("/settings")}
        >
          <IonIcon icon={activeTab === "settings" ? settings : settingsOutline} />
          <IonLabel>{t("nav.settings")}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonFooter>
  );
}

export default AppTabBar;
