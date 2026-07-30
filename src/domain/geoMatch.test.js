import { describe, expect, it } from "vitest";
import {
  SITE_MATCH_RADIUS_METRES,
  distanceInMetres,
  findSiteWithin,
  isSameSite
} from "./geoMatch";

// One degree of latitude is about 111.32 km, so this is a convenient way to
// express a known north-south offset in metres.
function metresNorth(location, metres) {
  return {
    ...location,
    latitude: location.latitude + metres / 111320
  };
}

const site = { id: "FORTICA-01", latitude: 43.353806, longitude: 17.831889 };

describe("distanceInMetres", () => {
  it("is zero for the same point", () => {
    expect(distanceInMetres(site, { ...site })).toBeCloseTo(0, 6);
  });

  it("measures a known north-south offset", () => {
    expect(distanceInMetres(site, metresNorth(site, 100))).toBeCloseTo(100, 0);
  });

  it("is symmetric", () => {
    const other = metresNorth(site, 25);

    expect(distanceInMetres(site, other)).toBeCloseTo(
      distanceInMetres(other, site),
      9
    );
  });

  it("does not treat opposite sides of the antimeridian as far apart", () => {
    expect(
      distanceInMetres(
        { latitude: 0, longitude: 179.9999 },
        { latitude: 0, longitude: -179.9999 }
      )
    ).toBeLessThan(30);
  });

  it("measures east-west offsets shorter than north-south ones at this latitude", () => {
    const northSouth = distanceInMetres(site, {
      ...site,
      latitude: site.latitude + 0.0001
    });
    const eastWest = distanceInMetres(site, {
      ...site,
      longitude: site.longitude + 0.0001
    });

    expect(eastWest).toBeLessThan(northSouth);
  });
});

describe("isSameSite", () => {
  it("accepts a reading a few metres away", () => {
    expect(isSameSite(site, metresNorth(site, 8))).toBe(true);
  });

  it("rejects a reading beyond the radius", () => {
    expect(isSameSite(site, metresNorth(site, 12))).toBe(false);
  });

  it("uses a 10 metre radius by default", () => {
    expect(SITE_MATCH_RADIUS_METRES).toBe(10);
    expect(isSameSite(site, metresNorth(site, 9.9))).toBe(true);
    expect(isSameSite(site, metresNorth(site, 10.1))).toBe(false);
  });

  it("accepts a wider radius when asked", () => {
    expect(isSameSite(site, metresNorth(site, 40), 50)).toBe(true);
  });
});

describe("findSiteWithin", () => {
  it("returns nothing when every stored site is too far away", () => {
    expect(findSiteWithin([metresNorth(site, 500)], site)).toBeUndefined();
  });

  it("returns the nearest site rather than the first one inside the radius", () => {
    const near = { ...metresNorth(site, 2), id: "near" };
    const far = { ...metresNorth(site, 9), id: "far" };

    expect(findSiteWithin([far, near], site).id).toBe("near");
  });

  it("tolerates an empty catalog", () => {
    expect(findSiteWithin([], site)).toBeUndefined();
  });
});
