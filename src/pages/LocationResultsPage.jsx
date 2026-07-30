import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IonAlert,
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText
} from "@ionic/react";
import {
  arrowBackOutline,
  bookmarkOutline,
  saveOutline
} from "ionicons/icons";
import AddStation from "../components/AddStation";
import AdhocSaveModal from "../components/AdhocSaveModal";
import AppHeader from "../components/AppHeader";
import AppTabBar from "../components/AppTabBar";
import ResultsGrid from "../components/ResultsGrid";
import StationList from "../components/StationList";
import {
  addTransmittersToLocation,
  getSnapshot,
  saveAdhocCalculation
} from "../data/database";
import { calculateIm3 } from "../domain/calculateIm3";
import {
  addedStations,
  createAddedStation,
  includedStations,
  isAddedStation,
  mergeStations,
  stationsForStorage,
  stationsToTransmitterInputs,
  unnamedStations
} from "../domain/calculationList";
import { navigateTo } from "../routing/hashRouter";
import {
  translateError,
  useI18n
} from "../i18n/I18nProvider";

function createStationId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `station-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function LocationResultsPage({ locationId }) {
  const { t } = useI18n();
  const [location, setLocation] = useState(null);
  const [transmitters, setTransmitters] = useState([]);
  const [added, setAdded] = useState([]);
  const [excludedIds, setExcludedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [confirmSaveToLocation, setConfirmSaveToLocation] = useState(false);

  const loadLocation = useCallback(async () => {
    const snapshot = await getSnapshot();
    const nextLocation = snapshot.locations.find(
      (candidate) => candidate.id === locationId
    );

    if (!nextLocation) {
      throw new Error("errors.locationMissing");
    }

    setLocation(nextLocation);
    setTransmitters(
      snapshot.transmitters.filter(
        (transmitter) => transmitter.locationId === locationId
      )
    );
  }, [locationId]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        await loadLocation();
      } catch (loadError) {
        if (active) {
          setError(translateError(loadError, t));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [loadLocation, t]);

  // A different location means a fresh calculation.
  useEffect(() => {
    setAdded([]);
    setExcludedIds(new Set());
    setStatus("");
  }, [locationId]);

  const stations = useMemo(
    () => mergeStations(transmitters, added),
    [transmitters, added]
  );

  const selectedIds = useMemo(
    () =>
      new Set(
        stations
          .map((station) => station.id)
          .filter((id) => !excludedIds.has(id))
      ),
    [stations, excludedIds]
  );

  const calculationStations = useMemo(
    () => includedStations(stations, excludedIds),
    [stations, excludedIds]
  );

  const rows = useMemo(
    () => calculateIm3(calculationStations),
    [calculationStations]
  );

  const unsaved = useMemo(() => addedStations(stations), [stations]);
  const unsavedCount = unsaved.length;
  const unnamed = useMemo(() => unnamedStations(unsaved), [unsaved]);

  const toggleStation = useCallback((stationId) => {
    setStatus("");
    setExcludedIds((current) => {
      const next = new Set(current);

      if (next.has(stationId)) {
        next.delete(stationId);
      } else {
        next.add(stationId);
      }

      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (selectAll) => {
      setStatus("");
      setExcludedIds(
        selectAll ? new Set() : new Set(stations.map((station) => station.id))
      );
    },
    [stations]
  );

  const addStation = useCallback((station) => {
    setStatus("");
    setError("");
    setAdded((current) => [
      ...current,
      createAddedStation(station, createStationId())
    ]);
  }, []);

  const removeStation = useCallback((stationId) => {
    setStatus("");
    setAdded((current) =>
      current.filter((station) => station.id !== stationId)
    );
    setExcludedIds((current) => {
      if (!current.has(stationId)) {
        return current;
      }

      const next = new Set(current);
      next.delete(stationId);
      return next;
    });
  }, []);

  async function handleSaveAdhoc(name) {
    await saveAdhocCalculation({
      name,
      stations: stationsForStorage(calculationStations),
      locationId,
      locationName: location?.name ?? ""
    });
    setStatus(t("locationResults.savedAdhoc"));
  }

  // A transmitter without a name cannot be stored, so the save is refused
  // before it is offered rather than failing halfway through the write.
  function requestSaveToLocation() {
    setStatus("");

    if (unnamed.length > 0) {
      setError(
        t("locationResults.nameRequired", {
          frequency: unnamed[0].frequency
        })
      );
      return;
    }

    setError("");
    setConfirmSaveToLocation(true);
  }

  async function handleSaveToLocation() {
    setError("");
    setStatus("");

    try {
      const inputs = stationsToTransmitterInputs(stations, locationId);
      await addTransmittersToLocation(locationId, inputs);
      setAdded([]);
      await loadLocation();
      setStatus(
        t("locationResults.savedToLocation", { count: inputs.length })
      );
    } catch (saveError) {
      setError(translateError(saveError, t));
    }
  }

  return (
    <IonPage>
      <AppHeader />
      <IonContent className="calculator-content">
        <main className="calculator-shell">
          <IonButton
            fill="clear"
            className="back-button"
            onClick={() => navigateTo("/")}
          >
            <IonIcon slot="start" icon={arrowBackOutline} />
            {t("locationResults.back")}
          </IonButton>

          {loading ? (
            <div className="page-loading">
              <IonSpinner />
              {t("locationResults.loading")}
            </div>
          ) : null}

          {error && !location ? (
            <IonText color="danger">
              <h1 className="page-heading">
                {t("locationResults.unavailable")}
              </h1>
              <p>{error}</p>
            </IonText>
          ) : null}

          {location ? (
            <>
              <h1 className="page-heading">{location.name}</h1>
              <p className="calculator-intro">
                {t("locationResults.intro", {
                  latitude: location.latitude.toFixed(6),
                  longitude: location.longitude.toFixed(6)
                })}
              </p>

              <AddStation
                onAddStation={addStation}
                withStationClass
                requireName
              />

              <div className="calculation-actions">
                <IonButton
                  fill="outline"
                  size="small"
                  disabled={calculationStations.length === 0}
                  onClick={() => setIsSaveModalOpen(true)}
                >
                  <IonIcon slot="start" icon={bookmarkOutline} />
                  {t("locationResults.saveAdhoc")}
                </IonButton>

                <IonButton
                  fill="clear"
                  size="small"
                  disabled={unsavedCount === 0}
                  onClick={requestSaveToLocation}
                >
                  <IonIcon slot="start" icon={saveOutline} />
                  {t("locationResults.saveToLocation", {
                    count: unsavedCount
                  })}
                </IonButton>
              </div>

              {error ? (
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>
              ) : null}

              {status ? (
                <IonText color="success">
                  <p>{status}</p>
                </IonText>
              ) : null}

              <StationList
                stationList={stations}
                title={t("locationResults.transmitters")}
                selectedIds={selectedIds}
                onToggleStation={toggleStation}
                onToggleAll={toggleAll}
                onDeleteStation={removeStation}
                isStationDeletable={isAddedStation}
              />
              <ResultsGrid rows={rows} />
            </>
          ) : null}
        </main>
      </IonContent>

      <AdhocSaveModal
        isOpen={isSaveModalOpen}
        onDismiss={() => setIsSaveModalOpen(false)}
        onSave={handleSaveAdhoc}
      />

      <IonAlert
        isOpen={confirmSaveToLocation}
        header={t("locationResults.saveToLocationTitle")}
        message={t("locationResults.saveToLocationMessage", {
          count: unsavedCount,
          name: location?.name ?? ""
        })}
        buttons={[
          {
            text: t("common.cancel"),
            role: "cancel",
            handler: () => setConfirmSaveToLocation(false)
          },
          {
            text: t("common.save"),
            handler: () => {
              handleSaveToLocation();
              setConfirmSaveToLocation(false);
            }
          }
        ]}
        onDidDismiss={() => setConfirmSaveToLocation(false)}
      />

      <AppTabBar activeTab="home" />
    </IonPage>
  );
}

export default LocationResultsPage;
