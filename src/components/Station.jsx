import {
  IonButton,
  IonCheckbox,
  IonIcon,
  IonItem,
  IonLabel,
  IonNote
} from "@ionic/react";
import { trashOutline } from "ionicons/icons";
import { useI18n } from "../i18n/I18nProvider";

function Station({ station, label, onDelete, selected, onToggle }) {
  const { t } = useI18n();
  const isExcluded = Boolean(onToggle) && !selected;

  return (
    <IonItem className={isExcluded ? "station-item station-item--excluded" : "station-item"}>
      {onToggle ? (
        <IonCheckbox
          slot="start"
          checked={Boolean(selected)}
          onIonChange={() => onToggle(station.id)}
          aria-label={t("station.includeAria", { name: label })}
        />
      ) : null}
      <IonLabel className="ion-text-wrap">
        <h3>{label}</h3>
        {station.stationClass ? (
          <p>
            {t("transmitter.stationClassTag", {
              stationClass: station.stationClass
            })}
          </p>
        ) : null}
      </IonLabel>
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
