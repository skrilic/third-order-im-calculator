import {
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import ThemeButton from "./ThemeButton";

function AppHeader() {
  return (
    <IonHeader translucent className="app-header">
      <IonToolbar>
        <IonTitle>
          <div className="brand-logo-container">
            <img
              src="/images/app_icon_minimal.png"
              alt="TOIC Logo"
              className="brand-logo-img"
            />
            <span className="brand-name">TOIC</span>
            <span className="brand-badge">RF IM3</span>
          </div>
        </IonTitle>
        <IonButtons slot="end">
          <ThemeButton />
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
}

export default AppHeader;
