import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonNote
} from "@ionic/react";
import { trashOutline } from "ionicons/icons";

function Station({ station, label, onDelete }) {
  return (
    <IonItem>
      <IonLabel>{label}</IonLabel>
      <IonNote slot="end" className="station-frequency">
        {station.frequency}
      </IonNote>
      <IonButton
        slot="end"
        fill="clear"
        color="danger"
        onClick={() => onDelete(station.id)}
        aria-label={`Delete ${label}`}
      >
        <IonIcon slot="icon-only" icon={trashOutline} />
      </IonButton>
    </IonItem>
  );
}

export default Station;
