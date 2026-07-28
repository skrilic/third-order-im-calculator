import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList
} from "@ionic/react";
import Station from "./Station";
import { stationLabel } from "../domain/calculateIm3";

function StationList({ stationList, onDeleteStation }) {
  return (
    <IonCard className="calculator-card">
      <IonCardHeader>
        <IonCardTitle>Stations ({stationList.length})</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {stationList.length === 0 ? (
          <p className="station-list-empty">
            No stations have been added yet.
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
