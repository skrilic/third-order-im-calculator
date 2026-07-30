const frequencyError = "errors.frequencyInvalid";
const nameError = "errors.transmitterName";

/**
 * A station name is optional for a throwaway manual calculation, but required
 * as soon as the station can end up in the transmitters store — that store
 * rejects nameless rows. `requireName` picks which of the two applies.
 */
export function normalizeStation(input, { requireName = false } = {}) {
  const rawFrequency = String(input.frequency ?? "").trim();
  const frequency = Number(rawFrequency);

  if (
    rawFrequency === "" ||
    !Number.isFinite(frequency) ||
    frequency < 0
  ) {
    return {
      error: frequencyError,
      station: null
    };
  }

  const name = String(input.name ?? "").trim();

  if (requireName && !name) {
    return {
      error: nameError,
      station: null
    };
  }

  const station = {
    name,
    frequency
  };

  // Optional ITU station class, carried only when it was actually entered.
  const stationClass = String(input.stationClass ?? "").trim();

  if (stationClass) {
    station.stationClass = stationClass;
  }

  return {
    error: "",
    station
  };
}

export { frequencyError, nameError };
