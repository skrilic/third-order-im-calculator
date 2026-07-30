import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList
} from "@ionic/react";
import Station from "./Station";
import { stationLabel } from "../domain/calculateIm3";
import { useI18n } from "../i18n/I18nProvider";

/**
 * `selectedIds` switches the list into selection mode: each station gets a
 * checkbox that decides whether it takes part in the calculation. Without it
 * the list stays a plain read-only/delete list.
 */
function StationList({
  stationList,
  onDeleteStation,
  title,
  selectedIds,
  onToggleStation,
  onToggleAll,
  isStationDeletable
}) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("manual.stations");
  const selectable = Boolean(selectedIds && onToggleStation);
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds ?? []);
  const allSelected = selectable && selected.size === stationList.length;

  return (
    <IonCard className="calculator-card">
      <IonCardHeader>
        <div className="station-list-heading">
          <IonCardTitle>
            {selectable
              ? `${resolvedTitle} (${selected.size}/${stationList.length})`
              : `${resolvedTitle} (${stationList.length})`}
          </IonCardTitle>
          {selectable && onToggleAll && stationList.length > 0 ? (
            <IonButton
              size="small"
              fill="clear"
              onClick={() => onToggleAll(!allSelected)}
            >
              {allSelected ? t("station.selectNone") : t("station.selectAll")}
            </IonButton>
          ) : null}
        </div>
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
                onDelete={
                  onDeleteStation &&
                  (!isStationDeletable || isStationDeletable(station))
                    ? onDeleteStation
                    : undefined
                }
                selected={selectable ? selected.has(station.id) : undefined}
                onToggle={selectable ? onToggleStation : undefined}
              />
            ))}
          </IonList>
        )}
      </IonCardContent>
    </IonCard>
  );
}

export default StationList;
