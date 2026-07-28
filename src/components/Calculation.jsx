import { useCallback, useMemo, useState } from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import { AgGridReact } from "ag-grid-react";
import { themeAlpine } from "ag-grid-community";

import AddStation from "./AddStation";
import ExportCSV from "./ExportCSV";
import StationList from "./StationList";
import { calculateIm3 } from "../domain/calculateIm3";

function createStationId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `station-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Calculation() {
  const [stationList, setStationList] = useState([]);

  const rowData = useMemo(
    () => calculateIm3(stationList),
    [stationList]
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Description",
        field: "description",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 280,
        cellStyle: { textAlign: "left" }
      },
      {
        headerName: "Frequency",
        field: "frequency",
        filter: "agTextColumnFilter",
        width: 150,
        valueFormatter: ({ value }) =>
          value === null || value === undefined || value === ""
            ? ""
            : Number(value).toFixed(2),
        comparator: (valueA, valueB) => Number(valueA) - Number(valueB)
      }
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      cellStyle: { color: "#4f5154" }
    }),
    []
  );

  const addStation = useCallback((station) => {
    setStationList((current) => [
      ...current,
      {
        ...station,
        id: createStationId()
      }
    ]);
  }, []);

  const deleteStation = useCallback((stationId) => {
    setStationList((current) =>
      current.filter((station) => station.id !== stationId)
    );
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Third-order IM calculator</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="calculator-content">
        <main className="calculator-shell">
          <p className="calculator-intro">
            Add collocated transmitters to calculate positive third-order
            intermodulation products.
          </p>

          <AddStation onAddStation={addStation} />
          <StationList
            stationList={stationList}
            onDeleteStation={deleteStation}
          />

          <IonCard className="calculator-card">
            <IonCardHeader>
              <div className="results-heading">
                <IonCardTitle>
                  Products ({rowData.length})
                </IonCardTitle>
                <ExportCSV rows={rowData} />
              </div>
            </IonCardHeader>
            <IonCardContent>
              <div className="results-grid">
                <AgGridReact
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  rowData={rowData}
                  theme={themeAlpine}
                />
              </div>
            </IonCardContent>
          </IonCard>
        </main>
      </IonContent>
    </IonPage>
  );
}

export default Calculation;
