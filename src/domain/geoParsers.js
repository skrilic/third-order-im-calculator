function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeHeaderName(header) {
  return String(header || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findHeaderIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const norm = normalizeHeaderName(name);
    const index = headers.findIndex((h) => normalizeHeaderName(h) === norm);
    if (index !== -1) {
      return index;
    }
  }
  return -1;
}

function createRecordId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function parseCsvTransmitters(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error("errors.csvEmpty");
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const latIndex = findHeaderIndex(rawHeaders, [
    "latitude",
    "lat",
    "y",
    "lat_wgs84",
    "sirina"
  ]);
  const lngIndex = findHeaderIndex(rawHeaders, [
    "longitude",
    "lng",
    "lon",
    "x",
    "lon_wgs84",
    "duzina"
  ]);
  const nameIndex = findHeaderIndex(rawHeaders, [
    "name",
    "location",
    "site",
    "station",
    "title",
    "naziv",
    "lokacija"
  ]);
  const freqIndex = findHeaderIndex(rawHeaders, [
    "frequency",
    "freq",
    "freq_mhz",
    "frequency_mhz",
    "frekvencija",
    "channel"
  ]);

  if (latIndex === -1 || lngIndex === -1) {
    throw new Error("errors.csvMissingCoordinates");
  }

  const locationMap = new Map();
  const transmitters = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const lat = parseFloat(cols[latIndex]);
    const lng = parseFloat(cols[lngIndex]);
    const freq = freqIndex !== -1 ? parseFloat(cols[freqIndex]) : NaN;
    const name =
      (nameIndex !== -1 ? cols[nameIndex] : "") || `Station ${i}`;

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      continue;
    }

    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    let location = locationMap.get(key);

    if (!location) {
      location = {
        id: createRecordId("location"),
        name,
        latitude: lat,
        longitude: lng,
        frequencies: new Set()
      };
      locationMap.set(key, location);
    }

    if (!Number.isNaN(freq) && freq >= 0) {
      if (!location.frequencies.has(freq)) {
        location.frequencies.add(freq);
        transmitters.push({
          id: createRecordId("transmitter"),
          locationId: location.id,
          name: nameIndex !== -1 && cols[nameIndex] ? cols[nameIndex] : `Tx ${freq} MHz`,
          frequency: freq
        });
      }
    }
  }

  const locations = [...locationMap.values()].map(({ frequencies, ...loc }) => loc);

  return {
    locations,
    transmitters
  };
}

export function parseGeoJsonTransmitters(geoJsonText) {
  let data;
  try {
    data = typeof geoJsonText === "string" ? JSON.parse(geoJsonText) : geoJsonText;
  } catch {
    throw new Error("errors.geoJsonInvalidJson");
  }

  const features =
    data.type === "FeatureCollection"
      ? data.features || []
      : data.type === "Feature"
      ? [data]
      : Array.isArray(data)
      ? data
      : [];

  if (features.length === 0) {
    throw new Error("errors.geoJsonEmpty");
  }

  const locationMap = new Map();
  const transmitters = [];

  features.forEach((feature, index) => {
    const geometry = feature.geometry || feature;
    if (geometry.type !== "Point" || !Array.isArray(geometry.coordinates)) {
      return;
    }

    const [lng, lat] = geometry.coordinates.map(Number);
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return;
    }

    const props = feature.properties || {};
    const name =
      props.name || props.site || props.title || props.location || `Feature ${index + 1}`;
    const freq = parseFloat(
      props.frequency || props.freq || props.freq_mhz || props.frequency_mhz || props.channel
    );

    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    let location = locationMap.get(key);

    if (!location) {
      location = {
        id: createRecordId("location"),
        name,
        latitude: lat,
        longitude: lng,
        frequencies: new Set()
      };
      locationMap.set(key, location);
    }

    if (!Number.isNaN(freq) && freq >= 0) {
      if (!location.frequencies.has(freq)) {
        location.frequencies.add(freq);
        transmitters.push({
          id: createRecordId("transmitter"),
          locationId: location.id,
          name: props.tx_name || props.name || `Tx ${freq} MHz`,
          frequency: freq
        });
      }
    }
  });

  const locations = [...locationMap.values()].map(({ frequencies, ...loc }) => loc);

  return {
    locations,
    transmitters
  };
}

export function parseGeoFile(content, fileName = "") {
  const ext = fileName.split(".").pop().toLowerCase();
  if (ext === "csv" || content.trim().startsWith("name,") || content.includes("latitude")) {
    return parseCsvTransmitters(content);
  }
  return parseGeoJsonTransmitters(content);
}
