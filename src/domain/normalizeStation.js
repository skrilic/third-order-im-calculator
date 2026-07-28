const frequencyError =
  "Enter a valid non-negative transmitting frequency.";

export function normalizeStation(input) {
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

  return {
    error: "",
    station: {
      name: String(input.name ?? "").trim(),
      frequency
    }
  };
}

export { frequencyError };
