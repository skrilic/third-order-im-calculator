import { describe, expect, it } from "vitest";
import {
  frequencyError,
  nameError,
  normalizeStation
} from "./normalizeStation";

describe("normalizeStation", () => {
  it("trims the name and converts a decimal frequency to a number", () => {
    expect(
      normalizeStation({
        name: "  Station A  ",
        frequency: "100.25"
      })
    ).toEqual({
      error: "",
      station: {
        name: "Station A",
        frequency: 100.25
      }
    });
  });

  it("accepts zero as an input frequency", () => {
    expect(
      normalizeStation({
        name: "",
        frequency: "0"
      })
    ).toEqual({
      error: "",
      station: {
        name: "",
        frequency: 0
      }
    });
  });

  it.each([
    ["an empty value", ""],
    ["whitespace", "   "],
    ["a negative number", "-0.01"],
    ["a non-numeric value", "abc"],
    ["positive infinity", "Infinity"]
  ])("rejects %s", (_label, frequency) => {
    expect(
      normalizeStation({
        name: "Station",
        frequency
      })
    ).toEqual({
      error: frequencyError,
      station: null
    });
  });

  it.each([
    ["an empty name", ""],
    ["a whitespace-only name", "   "],
    ["a missing name", undefined]
  ])("rejects %s when a name is required", (_label, name) => {
    expect(
      normalizeStation({ name, frequency: "100.25" }, { requireName: true })
    ).toEqual({
      error: nameError,
      station: null
    });
  });

  it("accepts a named station when a name is required", () => {
    expect(
      normalizeStation(
        { name: "  Tx  ", frequency: "100.25" },
        { requireName: true }
      )
    ).toEqual({
      error: "",
      station: { name: "Tx", frequency: 100.25 }
    });
  });

  it("reports an invalid frequency before a missing name", () => {
    expect(
      normalizeStation({ name: "", frequency: "abc" }, { requireName: true })
        .error
    ).toBe(frequencyError);
  });

  it("handles missing properties without throwing", () => {
    expect(normalizeStation({})).toEqual({
      error: frequencyError,
      station: null
    });
  });
});
