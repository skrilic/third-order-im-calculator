import { describe, expect, it } from "vitest";
import {
  STATION_SOURCE_ADDED,
  STATION_SOURCE_LOCATION,
  addedStations,
  createAddedStation,
  includedStations,
  isAddedStation,
  mergeStations,
  stationsForStorage,
  stationsToTransmitterInputs,
  transmitterToStation,
  unnamedStations
} from "./calculationList";

function createTransmitter(overrides = {}) {
  return {
    id: "tx-1",
    locationId: "loc-1",
    name: "BH Radio 1",
    frequency: 87.8,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("transmitterToStation", () => {
  it("keeps only the calculation fields and tags the origin", () => {
    expect(transmitterToStation(createTransmitter())).toEqual({
      id: "tx-1",
      name: "BH Radio 1",
      frequency: 87.8,
      source: STATION_SOURCE_LOCATION
    });
  });

  it("carries a station class and omits a blank one", () => {
    expect(
      transmitterToStation(createTransmitter({ stationClass: " BC " }))
        .stationClass
    ).toBe("BC");
    expect(
      transmitterToStation(createTransmitter({ stationClass: "  " }))
    ).not.toHaveProperty("stationClass");
  });
});

describe("createAddedStation", () => {
  it("normalizes an added station and tags it as unsaved", () => {
    expect(
      createAddedStation(
        { name: "  Scratch  ", frequency: "101.5", stationClass: "bc" },
        "station-1"
      )
    ).toEqual({
      id: "station-1",
      name: "Scratch",
      frequency: 101.5,
      stationClass: "bc",
      source: STATION_SOURCE_ADDED
    });
  });

  it("accepts an unnamed station", () => {
    const station = createAddedStation({ frequency: 101.5 }, "station-1");

    expect(station.name).toBe("");
    expect(isAddedStation(station)).toBe(true);
  });
});

describe("mergeStations", () => {
  it("lists stored transmitters first, then the unsaved additions", () => {
    const stations = mergeStations(
      [createTransmitter(), createTransmitter({ id: "tx-2", frequency: 91.3 })],
      [createAddedStation({ name: "Scratch", frequency: 101.5 }, "station-1")]
    );

    expect(stations.map((station) => station.id)).toEqual([
      "tx-1",
      "tx-2",
      "station-1"
    ]);
    expect(addedStations(stations)).toHaveLength(1);
  });

  it("does not list an addition twice once it has been stored", () => {
    const added = createAddedStation(
      { name: "Scratch", frequency: 101.5 },
      "station-1"
    );
    const stations = mergeStations(
      [createTransmitter({ id: "station-1", name: "Scratch", frequency: 101.5 })],
      [added]
    );

    expect(stations).toHaveLength(1);
    expect(stations[0].source).toBe(STATION_SOURCE_LOCATION);
  });

  it("tolerates a missing additions list", () => {
    expect(mergeStations([createTransmitter()], undefined)).toHaveLength(1);
  });
});

describe("includedStations", () => {
  it("drops the excluded IDs and keeps the rest in order", () => {
    const stations = mergeStations(
      [
        createTransmitter(),
        createTransmitter({ id: "tx-2", frequency: 91.3 }),
        createTransmitter({ id: "tx-3", frequency: 105.5 })
      ],
      []
    );

    expect(
      includedStations(stations, new Set(["tx-2"])).map((s) => s.id)
    ).toEqual(["tx-1", "tx-3"]);
  });

  it("accepts a plain array of excluded IDs", () => {
    const stations = mergeStations([createTransmitter()], []);

    expect(includedStations(stations, ["tx-1"])).toEqual([]);
  });
});

describe("unnamedStations", () => {
  it("finds the stations that cannot be written to a location", () => {
    const stations = [
      createAddedStation({ name: "Named", frequency: 101.5 }, "station-1"),
      createAddedStation({ frequency: 103.1 }, "station-2"),
      createAddedStation({ name: "   ", frequency: 105.5 }, "station-3")
    ];

    expect(unnamedStations(stations).map((station) => station.id)).toEqual([
      "station-2",
      "station-3"
    ]);
  });

  it("returns nothing when every station is named", () => {
    expect(unnamedStations(mergeStations([createTransmitter()], []))).toEqual([]);
  });
});

describe("stationsForStorage", () => {
  it("strips the in-memory origin tag", () => {
    const stored = stationsForStorage(
      mergeStations([createTransmitter({ stationClass: "BC" })], [])
    );

    expect(stored).toEqual([
      { id: "tx-1", name: "BH Radio 1", frequency: 87.8, stationClass: "BC" }
    ]);
  });
});

describe("stationsToTransmitterInputs", () => {
  it("converts only the unsaved stations and keeps their IDs", () => {
    const stations = mergeStations(
      [createTransmitter()],
      [
        createAddedStation(
          { name: "Scratch", frequency: 101.5, stationClass: "BC" },
          "station-1"
        ),
        createAddedStation({ name: "Other", frequency: 103.1 }, "station-2")
      ]
    );

    expect(stationsToTransmitterInputs(stations, "loc-1")).toEqual([
      {
        id: "station-1",
        locationId: "loc-1",
        name: "Scratch",
        frequency: 101.5,
        stationClass: "BC"
      },
      {
        id: "station-2",
        locationId: "loc-1",
        name: "Other",
        frequency: 103.1
      }
    ]);
  });

  it("returns nothing when there is nothing new to save", () => {
    expect(
      stationsToTransmitterInputs(mergeStations([createTransmitter()], []), "loc-1")
    ).toEqual([]);
  });
});
