const MINIMUM_FOCUS_ZOOM = 15;

export function toMapCenter(position) {
  const latitude = position?.latitude;
  const longitude = position?.longitude;

  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return [latitude, longitude];
}

export function centerMapOnPosition(map, position) {
  const center = toMapCenter(position);

  if (!center) {
    return false;
  }

  const currentZoom = map.getZoom();
  const zoom = Number.isFinite(currentZoom)
    ? Math.max(currentZoom, MINIMUM_FOCUS_ZOOM)
    : MINIMUM_FOCUS_ZOOM;

  map.stop();
  map.invalidateSize({ animate: false, pan: false });
  map.setView(center, zoom, { animate: false });

  return true;
}

export { MINIMUM_FOCUS_ZOOM };
