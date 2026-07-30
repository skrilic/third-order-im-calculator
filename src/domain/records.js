function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

export function normalizeLocation(
  input,
  existing = {},
  now = new Date().toISOString()
) {
  const name = String(input.name ?? "").trim();
  const rawLatitude = String(input.latitude ?? "").trim();
  const rawLongitude = String(input.longitude ?? "").trim();
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (!name) {
    return { error: "errors.locationName", location: null };
  }

  if (
    rawLatitude === "" ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    return {
      error: "errors.latitude",
      location: null
    };
  }

  if (
    rawLongitude === "" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      error: "errors.longitude",
      location: null
    };
  }

  return {
    error: "",
    location: {
      ...existing,
      id: existing.id ?? input.id ?? createId("location"),
      name,
      latitude,
      longitude,
      createdAt: existing.createdAt ?? now,
      updatedAt: now
    }
  };
}

export function normalizeTransmitter(
  input,
  existing = {},
  now = new Date().toISOString()
) {
  const name = String(input.name ?? "").trim();
  const locationId = String(
    input.locationId ?? existing.locationId ?? ""
  ).trim();
  const rawFrequency = String(input.frequency ?? "").trim();
  const frequency = Number(rawFrequency);

  if (!locationId) {
    return {
      error: "errors.transmitterLocation",
      transmitter: null
    };
  }

  if (!name) {
    return { error: "errors.transmitterName", transmitter: null };
  }

  if (
    rawFrequency === "" ||
    !Number.isFinite(frequency) ||
    frequency < 0
  ) {
    return {
      error: "errors.frequencyInvalid",
      transmitter: null
    };
  }

  return {
    error: "",
    transmitter: {
      ...existing,
      id: existing.id ?? input.id ?? createId("transmitter"),
      locationId,
      name,
      frequency,
      createdAt: existing.createdAt ?? now,
      updatedAt: now
    }
  };
}
