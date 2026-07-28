import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

const POSITION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000,
  enableLocationFallback: true
};

function hasLocationPermission(status) {
  return (
    status?.location === "granted" ||
    status?.coarseLocation === "granted"
  );
}

function mapGeolocationError(error) {
  if (error?.message?.startsWith("errors.")) {
    return error.message;
  }

  if (
    error?.code === "OS-PLUG-GLOC-0003" ||
    error?.code === "OS-PLUG-GLOC-0008" ||
    error?.code === 1
  ) {
    return "errors.locationPermissionDenied";
  }

  if (
    [
      "OS-PLUG-GLOC-0007",
      "OS-PLUG-GLOC-0009",
      "OS-PLUG-GLOC-0017"
    ].includes(error?.code)
  ) {
    return "errors.locationServicesDisabled";
  }

  if (
    error?.code === "OS-PLUG-GLOC-0010" ||
    error?.code === 3
  ) {
    return "errors.locationTimeout";
  }

  return "errors.locationUnavailable";
}

function normalizePosition(position) {
  const latitude = Number(position?.coords?.latitude);
  const longitude = Number(position?.coords?.longitude);
  const accuracy = Number(position?.coords?.accuracy);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("errors.locationUnavailable");
  }

  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
    timestamp: Number(position.timestamp) || Date.now()
  };
}

function getExtensionPermissionsApi() {
  const chromeApi = globalThis.chrome;
  if (
    chromeApi?.runtime?.id &&
    chromeApi?.permissions?.request
  ) {
    return chromeApi.permissions;
  }

  const browserApi = globalThis.browser;
  if (
    browserApi?.runtime?.id &&
    browserApi?.permissions?.request
  ) {
    return browserApi.permissions;
  }

  return null;
}

export async function getCurrentDevicePosition({
  geolocation = Geolocation,
  platform = Capacitor.getPlatform(),
  extensionPermissions = getExtensionPermissionsApi()
} = {}) {
  try {
    if (platform === "web" && extensionPermissions) {
      const granted = await extensionPermissions.request({
        permissions: ["geolocation"]
      });

      if (!granted) {
        throw new Error("errors.locationPermissionDenied");
      }
    } else if (platform !== "web") {
      let permission = await geolocation.checkPermissions();

      if (!hasLocationPermission(permission)) {
        if (
          permission.location === "denied" &&
          permission.coarseLocation === "denied"
        ) {
          throw new Error("errors.locationPermissionDenied");
        }

        permission = await geolocation.requestPermissions({
          permissions: ["location"]
        });
      }

      if (!hasLocationPermission(permission)) {
        throw new Error("errors.locationPermissionDenied");
      }
    }

    const position = await geolocation.getCurrentPosition(
      POSITION_OPTIONS
    );
    return normalizePosition(position);
  } catch (error) {
    throw new Error(mapGeolocationError(error));
  }
}

export {
  hasLocationPermission,
  mapGeolocationError,
  normalizePosition,
  getExtensionPermissionsApi,
  POSITION_OPTIONS
};
