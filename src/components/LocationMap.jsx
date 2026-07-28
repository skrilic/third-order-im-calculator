import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents
} from "react-leaflet";
import { useI18n } from "../i18n/I18nProvider";
import { centerMapOnPosition } from "../utils/mapView";

const DEFAULT_CENTER = [43.8563, 18.4131];
const DEFAULT_ZOOM = 7;
const TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ??
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  import.meta.env.VITE_MAP_TILE_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng
      });
    }
  });

  return null;
}

function FitLocations({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 1) {
      map.setView(
        [locations[0].latitude, locations[0].longitude],
        13
      );
    } else if (locations.length > 1) {
      map.fitBounds(
        locations.map((location) => [
          location.latitude,
          location.longitude
        ]),
        { padding: [24, 24] }
      );
    }
  }, [locations, map]);

  return null;
}

function FocusPosition({ request }) {
  const map = useMap();

  useEffect(() => {
    if (request) {
      centerMapOnPosition(map, request);
    }
  }, [map, request]);

  return null;
}

function LocationMap({
  locations,
  selectedLocationId,
  userPosition,
  focusRequest,
  onMapClick,
  onMarkerClick
}) {
  const { t } = useI18n();

  return (
    <div
      className="location-map"
      aria-label={t("locations.mapAria")}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
      >
        <TileLayer
          attribution={TILE_ATTRIBUTION}
          url={TILE_URL}
        />
        <MapClickHandler onMapClick={onMapClick} />
        <FitLocations locations={locations} />
        <FocusPosition request={focusRequest} />
        {userPosition ? (
          <CircleMarker
            center={[
              userPosition.latitude,
              userPosition.longitude
            ]}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#0a84ff",
              fillOpacity: 1,
              weight: 3
            }}
            bubblingMouseEvents={false}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {t("locations.currentPosition", {
                accuracy:
                  userPosition.accuracy === null
                    ? "—"
                    : Math.round(userPosition.accuracy)
              })}
            </Tooltip>
          </CircleMarker>
        ) : null}
        {locations.map((location) => (
          <CircleMarker
            key={location.id}
            center={[location.latitude, location.longitude]}
            radius={location.id === selectedLocationId ? 11 : 9}
            pathOptions={{
              color:
                location.id === selectedLocationId
                  ? "#1739a4"
                  : "#3056d3",
              fillColor:
                location.id === selectedLocationId
                  ? "#f4b740"
                  : "#6f8ef6",
              fillOpacity: 0.95,
              weight: 3
            }}
            bubblingMouseEvents={false}
            eventHandlers={{
              click: () => onMarkerClick(location)
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {location.name}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default LocationMap;
