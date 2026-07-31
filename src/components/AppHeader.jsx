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
              alt="Intermod RF Sites"
              className="brand-logo-img"
            />
            {/* The badge completes the name: "Intermod" is what people say,
                "RF Sites" is the rest of what the store lists. */}
            <span className="brand-name">Intermod</span>
            <span className="brand-badge">RF Sites</span>
          </div>
        </IonTitle>
        <IonButtons slot="end">
          <ThemeButton mode="app" />
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
}

export default AppHeader;
