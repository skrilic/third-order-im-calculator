import { useCallback, useEffect, useState } from "react";
import {
  IonAlert,
  IonBadge,
  IonButton,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSpinner,
  IonText
} from "@ionic/react";
import {
  addOutline,
  calculatorOutline,
  createOutline,
  locateOutline,
  locationOutline,
  trashOutline
} from "ionicons/icons";
import {
  deleteLocation,
  deleteTransmitter,
  getSnapshot,
  saveLocation,
  saveTransmitter
} from "../data/database";
import LocationDetailsModal from "./LocationDetailsModal";
import LocationFormModal from "./LocationFormModal";
import LocationMap from "./LocationMap";
import {
  translateError,
  useI18n
} from "../i18n/I18nProvider";
import { getCurrentDevicePosition } from "../data/geolocation";

function LocationManager({ onCalculate }) {
  const { t } = useI18n();
  const [snapshot, setSnapshot] = useState({
    locations: [],
    transmitters: []
  });
  const [error, setError] = useState("");
  const [newCoordinates, setNewCoordinates] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [activeLocationId, setActiveLocationId] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [permissionAlertOpen, setPermissionAlertOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const nextSnapshot = await getSnapshot();
      setSnapshot(nextSnapshot);
      setError("");
      return nextSnapshot;
    } catch (loadError) {
      setError(translateError(loadError, t));
      return null;
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeLocation = snapshot.locations.find(
    (location) => location.id === activeLocationId
  );
  const activeTransmitters = snapshot.transmitters.filter(
    (transmitter) => transmitter.locationId === activeLocationId
  );

  async function handleSaveLocation(input, existing) {
    const saved = await saveLocation(input, existing);
    setNewCoordinates(null);
    setEditingLocation(null);
    setActiveLocationId(saved.id);
    await loadData();
  }

  async function handleDeleteLocation(locationId) {
    await deleteLocation(locationId);
    setActiveLocationId(null);
    await loadData();
  }

  async function handleSaveTransmitter(input, existing) {
    await saveTransmitter(input, existing);
    await loadData();
  }

  async function handleDeleteTransmitter(transmitterId) {
    await deleteTransmitter(transmitterId);
    await loadData();
  }

  async function centerOnDevice() {
    setLocating(true);
    setLocationStatus("");
    setError("");

    try {
      const position = await getCurrentDevicePosition();
      setUserPosition(position);
      setFocusRequest({
        ...position,
        requestId: Date.now()
      });
      setLocationStatus(
        t("locations.centered", {
          accuracy:
            position.accuracy === null
              ? "—"
              : Math.round(position.accuracy)
        })
      );
    } catch (locationError) {
      setError(translateError(locationError, t));
      if (
        locationError?.message === "errors.locationPermissionDenied" ||
        locationError?.message === "errors.locationServicesDisabled"
      ) {
        setPermissionAlertOpen(true);
      }
    } finally {
      setLocating(false);
    }
  }

  function focusLocationOnMap(location) {
    setFocusRequest({
      latitude: location.latitude,
      longitude: location.longitude,
      requestId: Date.now()
    });
  }

  return (
    <div className="dashboard-layout">
      {/* Map Column / Section */}
      <div className="dashboard-map-section">
        <div className="location-map-wrapper">
          <div className="location-map-floating-controls">
            <IonButton
              size="small"
              shape="round"
              className="fab-location-btn"
              color="primary"
              disabled={locating}
              onClick={centerOnDevice}
            >
              {locating ? (
                <IonSpinner slot="start" name="crescent" />
              ) : (
                <IonIcon slot="start" icon={locateOutline} />
              )}
              {locating
                ? t("locations.locating")
                : t("locations.center")}
            </IonButton>
            {locationStatus ? (
              <div className="location-status-badge">
                {locationStatus}
              </div>
            ) : null}
          </div>
          <LocationMap
            locations={snapshot.locations}
            selectedLocationId={activeLocationId}
            userPosition={userPosition}
            focusRequest={focusRequest}
            onMapClick={setNewCoordinates}
            onMarkerClick={(location) =>
              setActiveLocationId(location.id)
            }
          />
        </div>
      </div>

      {/* Saved Locations List Section */}
      <div className="dashboard-list-section">
        {/* Tapping the map is the quickest way in, but it is invisible until
            someone tries it, so the same action is offered as a button. Empty
            coordinates open the form with editable latitude and longitude. */}
        <div className="location-add-row">
          <IonButton
            size="small"
            onClick={() =>
              setNewCoordinates({ latitude: "", longitude: "" })
            }
          >
            <IonIcon slot="start" icon={addOutline} />
            {t("locations.addNew")}
          </IonButton>
          <span className="location-add-hint">
            {t("locations.addNewHint")}
          </span>
        </div>

        <IonList inset={true} className="dashboard-locations-list">
          <IonListHeader>
            <IonLabel>{t("locations.cardTitle")}</IonLabel>
            <IonBadge color="primary" slot="end">
              {snapshot.locations.length}
            </IonBadge>
          </IonListHeader>

          {snapshot.locations.length === 0 ? (
            <IonItem lines="none">
              <IonLabel className="ion-text-wrap" color="medium" style={{ fontSize: "0.9rem" }}>
                {t("locations.empty")}
              </IonLabel>
            </IonItem>
          ) : (
            snapshot.locations.map((location) => {
              const txCount = snapshot.transmitters.filter(
                (tx) => tx.locationId === location.id
              ).length;

              return (
                <IonItemSliding key={location.id}>
                  <IonItem
                    button
                    detail={false}
                    onClick={() => setActiveLocationId(location.id)}
                  >
                    <IonIcon slot="start" icon={locationOutline} color="primary" />
                    <IonLabel>
                      <h2>{location.name}</h2>
                      <p>
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                    </IonLabel>
                    <IonBadge slot="end" color="light" style={{ fontSize: "0.78rem" }}>
                      {txCount} {t("transmitter.countTag")}
                    </IonBadge>
                    <IonButton
                      slot="end"
                      fill="clear"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        focusLocationOnMap(location);
                      }}
                      title={t("locations.center")}
                    >
                      <IonIcon slot="icon-only" icon={locateOutline} />
                    </IonButton>
                    <IonButton
                      slot="end"
                      fill="clear"
                      size="small"
                      color="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCalculate(location.id);
                      }}
                      title={t("location.calculate")}
                    >
                      <IonIcon slot="icon-only" icon={calculatorOutline} />
                    </IonButton>
                  </IonItem>

                  <IonItemOptions side="end">
                    <IonItemOption
                      color="primary"
                      onClick={() => setEditingLocation(location)}
                    >
                      <IonIcon slot="icon-only" icon={createOutline} />
                    </IonItemOption>
                    <IonItemOption
                      color="danger"
                      onClick={() => handleDeleteLocation(location.id)}
                    >
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              );
            })
          )}
        </IonList>

        {error ? (
          <IonText color="danger" style={{ display: "block", padding: "0 16px" }}>
            <p>{error}</p>
          </IonText>
        ) : null}
      </div>

      <LocationFormModal
        isOpen={Boolean(newCoordinates) || Boolean(editingLocation)}
        coordinates={newCoordinates}
        location={editingLocation}
        onDismiss={() => {
          setNewCoordinates(null);
          setEditingLocation(null);
        }}
        onSave={handleSaveLocation}
      />
      <LocationDetailsModal
        location={activeLocation}
        transmitters={activeTransmitters}
        onDismiss={() => setActiveLocationId(null)}
        onCalculate={onCalculate}
        onEditLocation={(location) => {
          setActiveLocationId(null);
          setEditingLocation(location);
        }}
        onDeleteLocation={handleDeleteLocation}
        onSaveTransmitter={handleSaveTransmitter}
        onDeleteTransmitter={handleDeleteTransmitter}
      />
      <IonAlert
        isOpen={permissionAlertOpen}
        header={t("locationPermission.title")}
        message={t("locationPermission.message")}
        buttons={[t("common.close")]}
        onDidDismiss={() => setPermissionAlertOpen(false)}
      />
    </div>
  );
}

export default LocationManager;
