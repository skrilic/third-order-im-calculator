import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonNote
} from "@ionic/react";
import { trashOutline } from "ionicons/icons";
import { useI18n } from "../i18n/I18nProvider";

function Station({ station, label, onDelete }) {
  const { t } = useI18n();
  return (
    <IonItem>
      <IonLabel>{label}</IonLabel>
      <IonNote slot="end" className="station-frequency">
        {station.frequency}
      </IonNote>
      {onDelete ? (
        <IonButton
          slot="end"
          fill="clear"
          color="danger"
          onClick={() => onDelete(station.id)}
          aria-label={t("station.deleteAria", { name: label })}
        >
          <IonIcon slot="icon-only" icon={trashOutline} />
        </IonButton>
      ) : null}
    </IonItem>
  );
}

export default Station;
