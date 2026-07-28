import { useCallback, useMemo } from "react";
import {
  IonContent,
  IonPage
} from "@ionic/react";

import AddStation from "./AddStation";
import AppHeader from "./AppHeader";
import AppTabBar from "./AppTabBar";
import ResultsGrid from "./ResultsGrid";
import StationList from "./StationList";
import { calculateIm3 } from "../domain/calculateIm3";
import { useI18n } from "../i18n/I18nProvider";

function createStationId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `station-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Calculation({ stationList, onStationListChange }) {
  const { t } = useI18n();
  const rowData = useMemo(
    () => calculateIm3(stationList),
    [stationList]
  );

  const addStation = useCallback((station) => {
    onStationListChange((current) => [
      ...current,
      {
        ...station,
        id: createStationId()
      }
    ]);
  }, [onStationListChange]);

  const deleteStation = useCallback((stationId) => {
    onStationListChange((current) =>
      current.filter((station) => station.id !== stationId)
    );
  }, [onStationListChange]);

  return (
    <IonPage>
      <AppHeader />
      <IonContent className="calculator-content">
        <main className="calculator-shell">
          <h1 className="page-heading">{t("manual.title")}</h1>
          <p className="calculator-intro">
            {t("manual.intro")}
          </p>

          <AddStation onAddStation={addStation} />
          <StationList
            stationList={stationList}
            onDeleteStation={deleteStation}
            title={t("manual.stations")}
          />
          <ResultsGrid rows={rowData} />
        </main>
      </IonContent>
      <AppTabBar activeTab="calculate" />
    </IonPage>
  );
}

export default Calculation;
