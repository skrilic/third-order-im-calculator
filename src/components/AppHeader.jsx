import {
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import ThemeButton from "./ThemeButton";

function AppHeader() {
  return (
    <IonHeader translucent>
      <IonToolbar color="primary">
        <IonTitle>TOIC</IonTitle>
        <IonButtons slot="end">
          <ThemeButton />
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
}

export default AppHeader;
