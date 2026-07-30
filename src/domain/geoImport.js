/**
 * TOIC transmitter import format.
 *
 * The container is standard GeoJSON (RFC 7946). The `toic` foreign member
 * (permitted by RFC 7946 section 6.1) declares the property profile, so the
 * application can require one exact shape instead of guessing at column names.
 *
 * Profile `toic-sites` version 1:
 *   - one Point Feature per physical site
 *   - `properties.siteId`   stable site key, becomes the location ID
 *   - `properties.name`     site name
 *   - `properties.transmitters[]` with `name` and `frequencyMhz`
 *
 * Unknown properties are ignored, not rejected, so exports may carry extra
 * regulator metadata (organization, stationClass, serviceType) without
 * breaking. Those extras are not persisted; the database stores only the
 * location and transmitter fields.
 */

export const IMPORT_PROFILE = "toic-sites";
export const IMPORT_PROFILE_VERSION = 1;
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

const FREQUENCY_EPSILON = 0.00001;

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumberInRange(value, minimum, maximum) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function validateTransmitter(transmitter, errors, prefix, seenFrequencies) {
  if (!isPlainObject(transmitter)) {
    errors.push(`${prefix} must be an object.`);
    return;
  }

  if (!isNonEmptyString(transmitter.name)) {
    errors.push(`${prefix} must have a non-empty name.`);
  }

  const frequency = transmitter.frequencyMhz;

  if (typeof frequency !== "number" || !Number.isFinite(frequency)) {
    errors.push(`${prefix} frequencyMhz must be a number in MHz.`);
    return;
  }

  if (frequency <= 0) {
    errors.push(`${prefix} frequencyMhz must be greater than 0.`);
    return;
  }

  const duplicate = seenFrequencies.some(
    (seen) => Math.abs(seen - frequency) < FREQUENCY_EPSILON
  );

  if (duplicate) {
    errors.push(`${prefix} repeats frequency ${frequency} MHz on the same site.`);
    return;
  }

  seenFrequencies.push(frequency);
}

function validateFeature(feature, errors, index, seenSiteIds) {
  const prefix = `Feature ${index + 1}`;

  if (!isPlainObject(feature)) {
    errors.push(`${prefix} must be an object.`);
    return;
  }

  if (feature.type !== "Feature") {
    errors.push(`${prefix} type must be "Feature".`);
  }

  const geometry = feature.geometry;

  if (!isPlainObject(geometry)) {
    errors.push(`${prefix} must have a geometry object.`);
  } else if (geometry.type !== "Point") {
    errors.push(`${prefix} geometry type must be "Point".`);
  } else if (
    !Array.isArray(geometry.coordinates) ||
    geometry.coordinates.length < 2
  ) {
    errors.push(
      `${prefix} coordinates must be an array of [longitude, latitude].`
    );
  } else {
    const [longitude, latitude] = geometry.coordinates;

    if (!isFiniteNumberInRange(longitude, -180, 180)) {
      errors.push(
        `${prefix} longitude must be a number between -180 and 180 (first coordinate).`
      );
    }

    if (!isFiniteNumberInRange(latitude, -90, 90)) {
      errors.push(
        `${prefix} latitude must be a number between -90 and 90 (second coordinate).`
      );
    }
  }

  const properties = feature.properties;

  if (!isPlainObject(properties)) {
    errors.push(`${prefix} must have a properties object.`);
    return;
  }

  if (!isNonEmptyString(properties.siteId)) {
    errors.push(`${prefix} properties.siteId must be a non-empty string.`);
  } else {
    const siteId = properties.siteId.trim();

    if (seenSiteIds.has(siteId)) {
      errors.push(`${prefix} repeats siteId "${siteId}".`);
    }

    seenSiteIds.add(siteId);
  }

  if (!isNonEmptyString(properties.name)) {
    errors.push(`${prefix} properties.name must be a non-empty string.`);
  }

  if (!Array.isArray(properties.transmitters)) {
    errors.push(`${prefix} properties.transmitters must be an array.`);
    return;
  }

  if (properties.transmitters.length === 0) {
    errors.push(`${prefix} properties.transmitters must not be empty.`);
    return;
  }

  const seenFrequencies = [];

  properties.transmitters.forEach((transmitter, transmitterIndex) => {
    validateTransmitter(
      transmitter,
      errors,
      `${prefix} transmitter ${transmitterIndex + 1}`,
      seenFrequencies
    );
  });
}

export function validateGeoImport(candidate) {
  if (!isPlainObject(candidate)) {
    return {
      ok: false,
      errors: ["Import file must contain a JSON object."]
    };
  }

  const errors = [];

  if (candidate.type !== "FeatureCollection") {
    errors.push('Top-level type must be "FeatureCollection".');
  }

  if (!isPlainObject(candidate.toic)) {
    errors.push(
      `Missing "toic" member. Add {"toic":{"profile":"${IMPORT_PROFILE}","version":${IMPORT_PROFILE_VERSION}}}.`
    );
  } else {
    if (candidate.toic.profile !== IMPORT_PROFILE) {
      errors.push(
        `Unsupported profile "${candidate.toic.profile ?? ""}", expected "${IMPORT_PROFILE}".`
      );
    }

    if (candidate.toic.version !== IMPORT_PROFILE_VERSION) {
      errors.push(
        `Unsupported profile version "${candidate.toic.version ?? ""}", expected ${IMPORT_PROFILE_VERSION}.`
      );
    }
  }

  if (!Array.isArray(candidate.features)) {
    errors.push("features must be an array.");
  } else if (candidate.features.length === 0) {
    errors.push("features must contain at least one Feature.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const seenSiteIds = new Set();

  candidate.features.forEach((feature, index) => {
    validateFeature(feature, errors, index, seenSiteIds);
  });

  return {
    ok: errors.length === 0,
    errors
  };
}

/**
 * Converts a validated import document into database records.
 *
 * IDs are derived from `siteId` and frequency rather than generated randomly,
 * so importing the same file twice updates the existing rows instead of
 * appending duplicates.
 */
export function geoImportToRecords(candidate) {
  const locations = [];
  const transmitters = [];

  candidate.features.forEach((feature) => {
    const [longitude, latitude] = feature.geometry.coordinates;
    const siteId = feature.properties.siteId.trim();

    locations.push({
      id: siteId,
      name: feature.properties.name.trim(),
      latitude,
      longitude
    });

    feature.properties.transmitters.forEach((transmitter) => {
      transmitters.push({
        id: `${siteId}::${transmitter.frequencyMhz}`,
        locationId: siteId,
        name: transmitter.name.trim(),
        frequency: transmitter.frequencyMhz
      });
    });
  });

  return { locations, transmitters };
}

export function parseGeoImport(text) {
  if (new Blob([text]).size > MAX_IMPORT_BYTES) {
    throw new Error("errors.geoImportTooLarge");
  }

  let candidate;

  try {
    candidate = JSON.parse(text);
  } catch {
    throw new Error("errors.geoImportJson");
  }

  const validation = validateGeoImport(candidate);

  if (!validation.ok) {
    const error = new Error("errors.geoImportInvalid");
    error.details = validation.errors;
    throw error;
  }

  return geoImportToRecords(candidate);
}
