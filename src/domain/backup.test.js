import { describe, expect, it } from "vitest";
import {
  analyzeImport,
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  createBackup,
  mergeSnapshots,
  parseBackupJson,
  validateBackup
} from "./backup";

function validBackup() {
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: "1.0.0",
    exportedAt: "2026-07-28T12:00:00.000Z",
    locations: [
      {
        id: "location-1",
        name: "Main site",
        latitude: 43.8563,
        longitude: 18.4131
      }
    ],
    transmitters: [
      {
        id: "transmitter-1",
        locationId: "location-1",
        name: "Repeater A",
        frequency: 145.725
      }
    ]
  };
}

describe("validateBackup", () => {
  it("accepts a valid versioned backup", () => {
    expect(validateBackup(validBackup())).toEqual({
      ok: true,
      errors: []
    });
  });

  it("rejects unsupported format and schema versions", () => {
    const backup = validBackup();
    backup.format = "another-format";
    backup.schemaVersion = 99;

    const validation = validateBackup(backup);

    expect(validation.ok).toBe(false);
    expect(validation.errors).toHaveLength(2);
  });

  it("rejects invalid coordinates and frequencies", () => {
    const backup = validBackup();
    backup.locations[0].latitude = 100;
    backup.transmitters[0].frequency = -1;

    const validation = validateBackup(backup);

    expect(validation.ok).toBe(false);
    expect(validation.errors.join(" ")).toContain("latitude");
    expect(validation.errors.join(" ")).toContain("frequency");
  });

  it("rejects duplicate IDs and orphaned transmitters", () => {
    const backup = validBackup();
    backup.locations.push({ ...backup.locations[0] });
    backup.transmitters[0].locationId = "missing-location";

    const validation = validateBackup(backup);

    expect(validation.ok).toBe(false);
    expect(validation.errors.join(" ")).toContain(
      "Duplicate location ID"
    );
    expect(validation.errors.join(" ")).toContain("unknown location");
  });
});

describe("backup serialization and import planning", () => {
  it("creates a detached backup envelope", () => {
    const snapshot = {
      locations: validBackup().locations,
      transmitters: validBackup().transmitters
    };
    const backup = createBackup(snapshot, {
      appVersion: "2.0.0",
      exportedAt: "2026-07-28T15:00:00.000Z"
    });

    snapshot.locations[0].name = "Changed later";

    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(backup.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(backup.appVersion).toBe("2.0.0");
    expect(backup.locations[0].name).toBe("Main site");
  });

  it("parses valid JSON and reports malformed JSON", () => {
    expect(parseBackupJson(JSON.stringify(validBackup()))).toEqual(
      validBackup()
    );
    expect(() => parseBackupJson("{not json")).toThrow(
      "errors.backupJson"
    );
  });

  it("counts ID conflicts before import", () => {
    const incoming = validBackup();
    incoming.locations.push({
      id: "location-2",
      name: "Second",
      latitude: 44,
      longitude: 18
    });

    expect(
      analyzeImport(
        {
          locations: [{ id: "location-1" }],
          transmitters: [{ id: "transmitter-1" }]
        },
        incoming
      )
    ).toEqual({
      locations: 2,
      transmitters: 1,
      locationConflicts: 1,
      transmitterConflicts: 1
    });
  });

  it("merges by stable ID with incoming records winning", () => {
    const current = {
      locations: [
        { id: "location-1", name: "Old" },
        { id: "location-2", name: "Keep" }
      ],
      transmitters: []
    };
    const incoming = {
      locations: [{ id: "location-1", name: "New" }],
      transmitters: [{ id: "transmitter-1", name: "Added" }]
    };

    expect(mergeSnapshots(current, incoming)).toEqual({
      locations: [
        { id: "location-1", name: "New" },
        { id: "location-2", name: "Keep" }
      ],
      transmitters: [{ id: "transmitter-1", name: "Added" }],
      adhocCalculations: []
    });
  });
});
