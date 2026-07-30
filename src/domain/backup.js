export const BACKUP_FORMAT = "toic-indexeddb-backup";
export const BACKUP_SCHEMA_VERSION = 1;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
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

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });

  return [...duplicates];
}

export function validateBackup(candidate) {
  const errors = [];

  if (!isPlainObject(candidate)) {
    return {
      ok: false,
      errors: ["Backup must contain a JSON object."]
    };
  }

  if (candidate.format !== BACKUP_FORMAT) {
    errors.push(`Unsupported backup format "${candidate.format ?? ""}".`);
  }

  if (candidate.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    errors.push(
      `Unsupported schema version "${candidate.schemaVersion ?? ""}".`
    );
  }

  if (!isNonEmptyString(candidate.appVersion)) {
    errors.push("Backup appVersion must be a non-empty string.");
  }

  if (
    !isNonEmptyString(candidate.exportedAt) ||
    Number.isNaN(Date.parse(candidate.exportedAt))
  ) {
    errors.push("Backup exportedAt must be a valid date.");
  }

  if (!Array.isArray(candidate.locations)) {
    errors.push("Backup locations must be an array.");
  }

  if (!Array.isArray(candidate.transmitters)) {
    errors.push("Backup transmitters must be an array.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const locationIds = candidate.locations.map((location) => location?.id);
  const transmitterIds = candidate.transmitters.map(
    (transmitter) => transmitter?.id
  );

  findDuplicates(locationIds).forEach((id) => {
    errors.push(`Duplicate location ID "${id}".`);
  });

  findDuplicates(transmitterIds).forEach((id) => {
    errors.push(`Duplicate transmitter ID "${id}".`);
  });

  candidate.locations.forEach((location, index) => {
    const prefix = `Location ${index + 1}`;

    if (!isPlainObject(location)) {
      errors.push(`${prefix} must be an object.`);
      return;
    }

    if (!isNonEmptyString(location.id)) {
      errors.push(`${prefix} must have a non-empty ID.`);
    }

    if (!isNonEmptyString(location.name)) {
      errors.push(`${prefix} must have a non-empty name.`);
    }

    if (!isFiniteNumberInRange(location.latitude, -90, 90)) {
      errors.push(`${prefix} latitude must be between -90 and 90.`);
    }

    if (!isFiniteNumberInRange(location.longitude, -180, 180)) {
      errors.push(`${prefix} longitude must be between -180 and 180.`);
    }
  });

  const validLocationIds = new Set(
    candidate.locations
      .filter((location) => isPlainObject(location))
      .map((location) => location.id)
  );

  candidate.transmitters.forEach((transmitter, index) => {
    const prefix = `Transmitter ${index + 1}`;

    if (!isPlainObject(transmitter)) {
      errors.push(`${prefix} must be an object.`);
      return;
    }

    if (!isNonEmptyString(transmitter.id)) {
      errors.push(`${prefix} must have a non-empty ID.`);
    }

    if (!isNonEmptyString(transmitter.locationId)) {
      errors.push(`${prefix} must have a non-empty locationId.`);
    } else if (!validLocationIds.has(transmitter.locationId)) {
      errors.push(
        `${prefix} references unknown location "${transmitter.locationId}".`
      );
    }

    if (!isNonEmptyString(transmitter.name)) {
      errors.push(`${prefix} must have a non-empty name.`);
    }

    if (
      typeof transmitter.frequency !== "number" ||
      !Number.isFinite(transmitter.frequency) ||
      transmitter.frequency < 0
    ) {
      errors.push(`${prefix} frequency must be a non-negative number.`);
    }
  });

  return {
    ok: errors.length === 0,
    errors
  };
}

export function createBackup(
  snapshot,
  {
    appVersion,
    exportedAt = new Date().toISOString()
  }
) {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion,
    exportedAt,
    locations: structuredClone(snapshot.locations || []),
    transmitters: structuredClone(snapshot.transmitters || []),
    adhocCalculations: structuredClone(snapshot.adhocCalculations || [])
  };
}

export function parseBackupJson(text) {
  if (new Blob([text]).size > MAX_BACKUP_BYTES) {
    throw new Error("errors.backupTooLarge");
  }

  let candidate;

  try {
    candidate = JSON.parse(text);
  } catch {
    throw new Error("errors.backupJson");
  }

  const validation = validateBackup(candidate);

  if (!validation.ok) {
    throw new Error("errors.backupInvalid");
  }

  return candidate;
}

export function analyzeImport(current, incoming) {
  const currentLocationIds = new Set(
    (current.locations || []).map((location) => location.id)
  );
  const currentTransmitterIds = new Set(
    (current.transmitters || []).map((transmitter) => transmitter.id)
  );

  return {
    locations: (incoming.locations || []).length,
    transmitters: (incoming.transmitters || []).length,
    locationConflicts: (incoming.locations || []).filter((location) =>
      currentLocationIds.has(location.id)
    ).length,
    transmitterConflicts: (incoming.transmitters || []).filter((transmitter) =>
      currentTransmitterIds.has(transmitter.id)
    ).length
  };
}

function mergeById(current, incoming) {
  const merged = new Map((current || []).map((record) => [record.id, record]));
  (incoming || []).forEach((record) => merged.set(record.id, record));
  return [...merged.values()];
}

export function mergeSnapshots(current, incoming) {
  return {
    locations: mergeById(current.locations || [], incoming.locations || []),
    transmitters: mergeById(
      current.transmitters || [],
      incoming.transmitters || []
    ),
    adhocCalculations: mergeById(
      current.adhocCalculations || [],
      incoming.adhocCalculations || []
    )
  };
}
