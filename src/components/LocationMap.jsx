import { useEffect, useState } from "react";
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

const DEFAULT_CENTER = [43.772643, 17.781372];
const DEFAULT_ZOOM = 8;

const CARTO_VOYAGER_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function checkIsDark() {
  return document.documentElement.classList.contains("ion-palette-dark");
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(checkIsDark);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(checkIsDark());
    };

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"]
    });

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    mediaQuery?.addEventListener?.("change", updateTheme);

    updateTheme();

    return () => {
      observer.disconnect();
      mediaQuery?.removeEventListener?.("change", updateTheme);
    };
  }, []);

  return isDark;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();

    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  return null;
}

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
    if (!locations || locations.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      map.invalidateSize();

      const lats = locations.map((l) => l.latitude);
      const lngs = locations.map((l) => l.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const latSpread = maxLat - minLat;
      const lngSpread = maxLng - minLng;

      if (latSpread < 0.005 && lngSpread < 0.005) {
        map.setView([lats[0], lngs[0]], 11);
      } else {
        map.fitBounds(
          [
            [minLat, minLng],
            [maxLat, maxLng]
          ],
          { padding: [50, 50], maxZoom: 12 }
        );
      }
    }, 150);

    return () => clearTimeout(timer);
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
  const isDark = useDarkMode();
  const tileUrl = isDark ? CARTO_DARK_URL : CARTO_VOYAGER_URL;

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
          key={tileUrl}
          attribution={CARTO_ATTRIBUTION}
          url={tileUrl}
          subdomains="abcd"
          maxZoom={19}
        />
        <MapResizer />
        <MapClickHandler onMapClick={onMapClick} />
        <FitLocations locations={locations} />
        <FocusPosition request={focusRequest} />
        {userPosition ? (
          <CircleMarker
            center={[
              userPosition.latitude,
              userPosition.longitude
            ]}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#6366f1",
              fillOpacity: 1,
              weight: 3,
              className: "user-location-ping"
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
            radius={location.id === selectedLocationId ? 12 : 9}
            pathOptions={{
              color:
                location.id === selectedLocationId
                  ? "#ffffff"
                  : "#4f46e5",
              fillColor:
                location.id === selectedLocationId
                  ? "#f59e0b"
                  : "#6366f1",
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
