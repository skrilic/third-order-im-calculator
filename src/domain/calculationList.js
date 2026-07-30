/**
 * The working station list behind a location's calculation.
 *
 * A location's saved transmitters are the starting point, but a calculation is
 * an experiment: transmitters can be left out of it, and extra ones can be
 * tried out before anything is written back to the database. Stations are
 * therefore tagged with their origin — `location` for rows that already exist
 * in the transmitters store, `added` for rows that only exist in this session.
 */

export const STATION_SOURCE_LOCATION = "location";
export const STATION_SOURCE_ADDED = "added";

export function transmitterToStation(transmitter) {
  const station = {
    id: transmitter.id,
    name: transmitter.name,
    frequency: transmitter.frequency,
    source: STATION_SOURCE_LOCATION
  };

  const stationClass = String(transmitter.stationClass ?? "").trim();

  if (stationClass) {
    station.stationClass = stationClass;
  }

  return station;
}

export function createAddedStation(station, id) {
  const added = {
    id,
    name: String(station.name ?? "").trim(),
    frequency: Number(station.frequency),
    source: STATION_SOURCE_ADDED
  };

  const stationClass = String(station.stationClass ?? "").trim();

  if (stationClass) {
    added.stationClass = stationClass;
  }

  return added;
}

export function isAddedStation(station) {
  return station?.source === STATION_SOURCE_ADDED;
}

/**
 * Stations that cannot be written to a location because they have no name.
 * The transmitters store requires one, so this is checked before the save is
 * offered rather than after it fails.
 */
export function unnamedStations(stations) {
  return stations.filter((station) => !String(station.name ?? "").trim());
}

/**
 * The stations that actually feed the calculation: everything in the list
 * except the IDs the user has switched off.
 */
export function includedStations(stations, excludedIds) {
  const excluded = excludedIds instanceof Set ? excludedIds : new Set(excludedIds);
  return stations.filter((station) => !excluded.has(station.id));
}

export function addedStations(stations) {
  return stations.filter(isAddedStation);
}

/**
 * The working list: the location's stored transmitters, followed by the
 * stations added in this session that are not stored yet. Keyed by ID, so a
 * station that has just been written to the location is not listed twice.
 */
export function mergeStations(transmitters, added) {
  const stations = transmitters.map(transmitterToStation);
  const known = new Set(stations.map((station) => station.id));

  (added || []).forEach((station) => {
    if (!known.has(station.id)) {
      stations.push(station);
    }
  });

  return stations;
}

/**
 * Drops the in-memory `source` tag before a list is persisted, so stored
 * ad-hoc calculations hold plain stations.
 */
export function stationsForStorage(stations) {
  return stations.map(({ source, ...station }) => station);
}

/**
 * Turns the stations added in this session into transmitter inputs for a
 * location. The IDs are kept, so saving the same list twice updates the same
 * rows and the user's include/exclude choices survive the reload.
 */
export function stationsToTransmitterInputs(stations, locationId) {
  return addedStations(stations).map((station) => {
    const input = {
      id: station.id,
      locationId,
      name: station.name,
      frequency: station.frequency
    };

    if (station.stationClass) {
      input.stationClass = station.stationClass;
    }

    return input;
  });
}
