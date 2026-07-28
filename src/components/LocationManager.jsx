import { useCallback, useEffect, useState } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonSpinner,
  IonText
} from "@ionic/react";
import { locateOutline } from "ionicons/icons";
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
    } finally {
      setLocating(false);
    }
  }

  return (
    <IonCard className="calculator-card">
      <IonCardHeader>
        <IonCardTitle>{t("locations.cardTitle")}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p className="location-help">
          {t("locations.help")}
        </p>
        <div className="location-map-actions">
          <IonButton
            size="small"
            fill="outline"
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

        {error ? (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        ) : null}
        {locationStatus ? (
          <IonText color="success">
            <p>{locationStatus}</p>
          </IonText>
        ) : null}
      </IonCardContent>

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
    </IonCard>
  );
}

export default LocationManager;
