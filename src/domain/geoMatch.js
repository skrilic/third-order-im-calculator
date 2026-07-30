/**
 * Deciding when two coordinate pairs mean the same physical site.
 *
 * Two sources describing the same mast rarely agree to the last decimal: a
 * regulator export, a hand-placed marker and a GPS reading can sit a few metres
 * apart. Matching therefore uses a real distance in metres rather than a
 * degree box, which would be wider north-south than east-west and would widen
 * further towards the poles.
 *
 * The comparison is equirectangular — accurate well below a metre at these
 * distances and far cheaper than haversine.
 */

export const SITE_MATCH_RADIUS_METRES = 10;

const EARTH_RADIUS_METRES = 6371008.8;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function normalizeLongitudeDelta(delta) {
  if (delta > 180) {
    return delta - 360;
  }

  if (delta < -180) {
    return delta + 360;
  }

  return delta;
}

export function distanceInMetres(first, second) {
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(
    normalizeLongitudeDelta(second.longitude - first.longitude)
  );
  const meanLatitude = toRadians((first.latitude + second.latitude) / 2);
  const east = longitudeDelta * Math.cos(meanLatitude);

  return Math.hypot(latitudeDelta, east) * EARTH_RADIUS_METRES;
}

export function isSameSite(
  first,
  second,
  radiusMetres = SITE_MATCH_RADIUS_METRES
) {
  return distanceInMetres(first, second) < radiusMetres;
}

/**
 * The stored location that stands for the same site as `candidate`, or
 * `undefined`. The nearest one wins, so a candidate inside the radius of two
 * stored sites merges into the closer of them rather than whichever happens to
 * come first.
 */
export function findSiteWithin(
  locations,
  candidate,
  radiusMetres = SITE_MATCH_RADIUS_METRES
) {
  let match;
  let shortest = Infinity;

  for (const location of locations) {
    const distance = distanceInMetres(location, candidate);

    if (distance < radiusMetres && distance < shortest) {
      shortest = distance;
      match = location;
    }
  }

  return match;
}
