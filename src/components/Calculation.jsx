import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage
} from "@ionic/react";
import { bookmarkOutline, folderOpenOutline } from "ionicons/icons";

import AddStation from "./AddStation";
import AdhocListModal from "./AdhocListModal";
import AdhocSaveModal from "./AdhocSaveModal";
import AppHeader from "./AppHeader";
import AppTabBar from "./AppTabBar";
import ResultsGrid from "./ResultsGrid";
import StationList from "./StationList";
import { calculateIm3 } from "../domain/calculateIm3";
import {
  deleteAdhocCalculation,
  getAdhocCalculations,
  saveAdhocCalculation
} from "../data/database";
import { useI18n } from "../i18n/I18nProvider";

function createStationId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `station-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Calculation({ stationList, onStationListChange }) {
  const { t } = useI18n();
  const [adhocList, setAdhocList] = useState([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingAdhoc, setEditingAdhoc] = useState(null);

  const loadAdhocData = useCallback(async () => {
    try {
      const list = await getAdhocCalculations();
      setAdhocList(list);
    } catch {
      setAdhocList([]);
    }
  }, []);

  useEffect(() => {
    loadAdhocData();
  }, [loadAdhocData]);

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

  async function handleSaveAdhoc(name) {
    await saveAdhocCalculation(
      {
        name,
        stations: stationList
      },
      editingAdhoc
    );
    setEditingAdhoc(null);
    await loadAdhocData();
  }

  async function handleDeleteAdhoc(id) {
    await deleteAdhocCalculation(id);
    await loadAdhocData();
  }

  function handleLoadAdhoc(adhoc) {
    if (Array.isArray(adhoc.stations)) {
      onStationListChange(
        adhoc.stations.map((st) => ({
          ...st,
          id: st.id || createStationId()
        }))
      );
    }
    setIsListModalOpen(false);
  }

  return (
    <IonPage>
      <AppHeader />
      <IonContent className="calculator-content">
        <main className="calculator-shell">
          <AddStation onAddStation={addStation} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "12px 0"
            }}
          >
            <IonButton
              fill="outline"
              size="small"
              disabled={stationList.length === 0}
              onClick={() => {
                setEditingAdhoc(null);
                setIsSaveModalOpen(true);
              }}
            >
              <IonIcon slot="start" icon={bookmarkOutline} />
              {t("adhoc.saveCurrent")}
            </IonButton>

            <IonButton
              fill="clear"
              size="small"
              onClick={() => setIsListModalOpen(true)}
            >
              <IonIcon slot="start" icon={folderOpenOutline} />
              {t("adhoc.savedPresets")} ({adhocList.length})
            </IonButton>
          </div>

          <StationList
            stationList={stationList}
            onDeleteStation={deleteStation}
            title={t("manual.stations")}
          />
          <ResultsGrid rows={rowData} />
        </main>
      </IonContent>

      <AdhocSaveModal
        isOpen={isSaveModalOpen}
        onDismiss={() => {
          setIsSaveModalOpen(false);
          setEditingAdhoc(null);
        }}
        onSave={handleSaveAdhoc}
      />

      <AdhocListModal
        isOpen={isListModalOpen}
        adhocList={adhocList}
        onDismiss={() => setIsListModalOpen(false)}
        onLoad={handleLoadAdhoc}
        onEditName={(adhoc) => {
          setEditingAdhoc(adhoc);
          setIsListModalOpen(false);
          setIsSaveModalOpen(true);
        }}
        onDelete={handleDeleteAdhoc}
      />

      <AppTabBar activeTab="calculate" />
    </IonPage>
  );
}

export default Calculation;
