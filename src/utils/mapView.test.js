import { describe, expect, it, vi } from "vitest";
import {
  centerMapOnPosition,
  MINIMUM_FOCUS_ZOOM,
  toMapCenter
} from "./mapView";

function createMap(zoom = 7) {
  return {
    flyTo: vi.fn(() => {
      throw new Error("flyTo must not be used");
    }),
    getZoom: vi.fn(() => zoom),
    invalidateSize: vi.fn(),
    setView: vi.fn(),
    stop: vi.fn()
  };
}

describe("map view", () => {
  it("centers without Leaflet's size-sensitive flyTo animation", () => {
    const map = createMap();

    expect(
      centerMapOnPosition(map, {
        latitude: 45.815,
        longitude: 15.9819
      })
    ).toBe(true);

    expect(map.stop).toHaveBeenCalledOnce();
    expect(map.invalidateSize).toHaveBeenCalledWith({
      animate: false,
      pan: false
    });
    expect(map.setView).toHaveBeenCalledWith(
      [45.815, 15.9819],
      MINIMUM_FOCUS_ZOOM,
      { animate: false }
    );
    expect(map.flyTo).not.toHaveBeenCalled();
  });

  it("keeps an existing zoom level above the focus minimum", () => {
    const map = createMap(17);

    centerMapOnPosition(map, {
      latitude: 43.8563,
      longitude: 18.4131
    });

    expect(map.setView).toHaveBeenCalledWith(
      [43.8563, 18.4131],
      17,
      { animate: false }
    );
  });

  it("uses the focus minimum when Leaflet has no valid zoom yet", () => {
    const map = createMap(Number.NaN);

    centerMapOnPosition(map, {
      latitude: 43.8563,
      longitude: 18.4131
    });

    expect(map.setView).toHaveBeenCalledWith(
      [43.8563, 18.4131],
      MINIMUM_FOCUS_ZOOM,
      { animate: false }
    );
  });

  it.each([
    null,
    {},
    { latitude: Number.NaN, longitude: 18 },
    { latitude: 43, longitude: Number.POSITIVE_INFINITY },
    { latitude: 91, longitude: 18 },
    { latitude: 43, longitude: -181 },
    { latitude: "43", longitude: "18" }
  ])("does not pass invalid coordinates to Leaflet: %o", (position) => {
    const map = createMap();

    expect(centerMapOnPosition(map, position)).toBe(false);
    expect(map.stop).not.toHaveBeenCalled();
    expect(map.invalidateSize).not.toHaveBeenCalled();
    expect(map.setView).not.toHaveBeenCalled();
  });

  it("returns a Leaflet center only for valid numeric coordinates", () => {
    expect(
      toMapCenter({ latitude: -90, longitude: 180 })
    ).toEqual([-90, 180]);
    expect(
      toMapCenter({ latitude: undefined, longitude: 18 })
    ).toBeNull();
  });
});
