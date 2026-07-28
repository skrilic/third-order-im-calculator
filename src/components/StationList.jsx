import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList
} from "@ionic/react";
import Station from "./Station";
import { stationLabel } from "../domain/calculateIm3";
import { useI18n } from "../i18n/I18nProvider";

function StationList({
  stationList,
  onDeleteStation,
  title
}) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("manual.stations");
  return (
    <IonCard className="calculator-card">
      <IonCardHeader>
        <IonCardTitle>
          {resolvedTitle} ({stationList.length})
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {stationList.length === 0 ? (
          <p className="station-list-empty">
            {t("station.empty")}
          </p>
        ) : (
          <IonList lines="full">
            {stationList.map((station, index) => (
              <Station
                key={station.id}
                station={station}
                label={stationLabel(station, index)}
                onDelete={onDeleteStation}
              />
            ))}
          </IonList>
        )}
      </IonCardContent>
    </IonCard>
  );
}

export default StationList;
