#!/usr/bin/env node
/**
 * Converts a flat regulator export (one record per transmitter) into the
 * GeoJSON import profile the application requires.
 *
 * This is a one-off data-preparation tool, not part of the application. The
 * app deliberately accepts only the `toic-sites` profile; reshaping foreign
 * exports happens here or in the upstream SQL view.
 *
 * Usage:
 *   node scripts/convert-regulator-export.mjs <input.json> [output.geojson]
 *
 * Expected input: a JSON array of objects with these fields:
 *   location, latitude, longitude, transmitter_name, frequency,
 *   organization_name, service_type, station_class
 *
 * Records that cannot be represented are dropped and reported on stderr, so
 * the emitted file always passes validateGeoImport.
 */

import { readFileSync, writeFileSync } from "node:fs";

const IMPORT_PROFILE = "toic-sites";
const IMPORT_PROFILE_VERSION = 1;
const FREQUENCY_EPSILON = 0.00001;
const COORDINATE_EPSILON = 0.0001;
const SERVICE_TYPE_PLACEHOLDER = /^-+$/;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function cleanString(value) {
  return String(value ?? "").trim();
}

function isUsableCoordinate(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }

  // Null island: almost always a missing value rather than a real site.
  return Math.abs(latitude) > COORDINATE_EPSILON ||
    Math.abs(longitude) > COORDINATE_EPSILON;
}

function optionalProperty(target, key, value) {
  const cleaned = cleanString(value);

  if (cleaned && !SERVICE_TYPE_PLACEHOLDER.test(cleaned)) {
    target[key] = cleaned;
  }
}

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath) {
  fail(
    "Usage: node scripts/convert-regulator-export.mjs <input.json> [output.geojson]"
  );
}

let records;

try {
  records = JSON.parse(readFileSync(inputPath, "utf8"));
} catch (error) {
  fail(`Cannot read ${inputPath}: ${error.message}`);
}

if (!Array.isArray(records)) {
  fail(`${inputPath} must contain a JSON array of transmitter records.`);
}

const sites = new Map();
const warnings = [];

records.forEach((record, index) => {
  const rowLabel = `row ${index + 1}`;
  const siteId = cleanString(record.location);

  if (!siteId) {
    warnings.push(`${rowLabel}: dropped, empty location.`);
    return;
  }

  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);
  const name = cleanString(record.transmitter_name);
  const frequency = Number(record.frequency);

  if (!name) {
    warnings.push(`${rowLabel} (${siteId}): dropped, empty transmitter_name.`);
    return;
  }

  if (!Number.isFinite(frequency) || frequency <= 0) {
    warnings.push(
      `${rowLabel} (${siteId}): dropped, frequency "${record.frequency}" is not a positive number.`
    );
    return;
  }

  let site = sites.get(siteId);

  if (!site) {
    site = { siteId, latitude: null, longitude: null, transmitters: [] };
    sites.set(siteId, site);
  }

  if (isUsableCoordinate(latitude, longitude)) {
    if (site.latitude === null) {
      site.latitude = latitude;
      site.longitude = longitude;
    } else if (
      Math.abs(site.latitude - latitude) > COORDINATE_EPSILON ||
      Math.abs(site.longitude - longitude) > COORDINATE_EPSILON
    ) {
      warnings.push(
        `${rowLabel} (${siteId}): conflicting coordinates ${latitude},${longitude}; keeping ${site.latitude},${site.longitude}.`
      );
    }
  } else {
    warnings.push(
      `${rowLabel} (${siteId}): unusable coordinates ${record.latitude},${record.longitude}.`
    );
  }

  const clash = site.transmitters.find(
    (transmitter) =>
      Math.abs(transmitter.frequencyMhz - frequency) < FREQUENCY_EPSILON
  );

  if (clash) {
    warnings.push(
      `${rowLabel} (${siteId}): dropped duplicate ${frequency} MHz, already held by "${clash.name}".`
    );
    return;
  }

  const transmitter = { name, frequencyMhz: frequency };
  optionalProperty(transmitter, "organization", record.organization_name);
  optionalProperty(transmitter, "serviceType", record.service_type);
  optionalProperty(transmitter, "stationClass", record.station_class);

  site.transmitters.push(transmitter);
});

const features = [];

for (const site of sites.values()) {
  if (site.latitude === null) {
    warnings.push(
      `site ${site.siteId}: dropped entirely, no usable coordinates in any row.`
    );
    continue;
  }

  if (site.transmitters.length === 0) {
    warnings.push(`site ${site.siteId}: dropped entirely, no valid transmitters.`);
    continue;
  }

  features.push({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [site.longitude, site.latitude]
    },
    properties: {
      siteId: site.siteId,
      name: site.siteId,
      transmitters: site.transmitters
    }
  });
}

if (features.length === 0) {
  fail("No convertible records found.");
}

const document = {
  type: "FeatureCollection",
  toic: { profile: IMPORT_PROFILE, version: IMPORT_PROFILE_VERSION },
  features
};

const target = outputPath ?? inputPath.replace(/\.json$/i, "") + ".geojson";
writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`, "utf8");

const transmitterCount = features.reduce(
  (total, feature) => total + feature.properties.transmitters.length,
  0
);

if (warnings.length > 0) {
  process.stderr.write(`${warnings.length} record(s) needed attention:\n`);
  warnings.forEach((warning) => process.stderr.write(`  ${warning}\n`));
  process.stderr.write("\n");
}

process.stdout.write(
  `Wrote ${target}: ${features.length} site(s), ${transmitterCount} transmitter(s) from ${records.length} input row(s).\n`
);
