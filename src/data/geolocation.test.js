import { describe, expect, it, vi } from "vitest";
import {
  getCurrentDevicePosition,
  mapGeolocationError,
  normalizePosition,
  POSITION_OPTIONS
} from "./geolocation";

function position() {
  return {
    coords: {
      latitude: 43.8563,
      longitude: 18.4131,
      accuracy: 12.5
    },
    timestamp: 1234
  };
}

describe("getCurrentDevicePosition", () => {
  it("uses the web permission prompt through getCurrentPosition", async () => {
    const geolocation = {
      checkPermissions: vi.fn(),
      requestPermissions: vi.fn(),
      getCurrentPosition: vi.fn(async () => position())
    };

    await expect(
      getCurrentDevicePosition({ geolocation, platform: "web" })
    ).resolves.toEqual({
      latitude: 43.8563,
      longitude: 18.4131,
      accuracy: 12.5,
      timestamp: 1234
    });
    expect(geolocation.checkPermissions).not.toHaveBeenCalled();
    expect(geolocation.requestPermissions).not.toHaveBeenCalled();
    expect(geolocation.getCurrentPosition).toHaveBeenCalledWith(
      POSITION_OPTIONS
    );
  });

  it("requests an optional extension permission from the user gesture", async () => {
    const extensionPermissions = {
      request: vi.fn(async () => true)
    };
    const geolocation = {
      getCurrentPosition: vi.fn(async () => position())
    };

    await getCurrentDevicePosition({
      geolocation,
      platform: "web",
      extensionPermissions
    });

    expect(extensionPermissions.request).toHaveBeenCalledWith({
      permissions: ["geolocation"]
    });
  });

  it("stops when the optional extension permission is denied", async () => {
    const extensionPermissions = {
      request: vi.fn(async () => false)
    };
    const geolocation = {
      getCurrentPosition: vi.fn()
    };

    await expect(
      getCurrentDevicePosition({
        geolocation,
        platform: "web",
        extensionPermissions
      })
    ).rejects.toThrow("errors.locationPermissionDenied");
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it("uses an existing native permission", async () => {
    const geolocation = {
      checkPermissions: vi.fn(async () => ({
        location: "granted",
        coarseLocation: "granted"
      })),
      requestPermissions: vi.fn(),
      getCurrentPosition: vi.fn(async () => position())
    };

    await getCurrentDevicePosition({
      geolocation,
      platform: "android"
    });

    expect(geolocation.requestPermissions).not.toHaveBeenCalled();
  });

  it("requests native permission only when needed", async () => {
    const geolocation = {
      checkPermissions: vi.fn(async () => ({
        location: "prompt",
        coarseLocation: "prompt"
      })),
      requestPermissions: vi.fn(async () => ({
        location: "granted",
        coarseLocation: "granted"
      })),
      getCurrentPosition: vi.fn(async () => position())
    };

    await getCurrentDevicePosition({
      geolocation,
      platform: "ios"
    });

    expect(geolocation.requestPermissions).toHaveBeenCalledWith({
      permissions: ["location"]
    });
  });

  it("does not try to re-prompt after a native denial", async () => {
    const geolocation = {
      checkPermissions: vi.fn(async () => ({
        location: "denied",
        coarseLocation: "denied"
      })),
      requestPermissions: vi.fn(),
      getCurrentPosition: vi.fn()
    };

    await expect(
      getCurrentDevicePosition({
        geolocation,
        platform: "android"
      })
    ).rejects.toThrow("errors.locationPermissionDenied");
    expect(geolocation.requestPermissions).not.toHaveBeenCalled();
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });
});

describe("geolocation validation and errors", () => {
  it("rejects invalid plugin coordinates", () => {
    expect(() =>
      normalizePosition({
        coords: { latitude: 100, longitude: 18, accuracy: 10 }
      })
    ).toThrow("errors.locationUnavailable");
  });

  it.each([
    ["OS-PLUG-GLOC-0003", "errors.locationPermissionDenied"],
    ["OS-PLUG-GLOC-0007", "errors.locationServicesDisabled"],
    ["OS-PLUG-GLOC-0010", "errors.locationTimeout"],
    ["another-code", "errors.locationUnavailable"]
  ])("maps %s to %s", (code, expected) => {
    expect(mapGeolocationError({ code })).toBe(expected);
  });
});
