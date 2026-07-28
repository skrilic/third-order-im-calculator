import { describe, expect, it } from "vitest";
import { matchLocationResults } from "./hashRouter";

describe("matchLocationResults", () => {
  it("extracts and decodes a location ID", () => {
    expect(
      matchLocationResults("/locations/location%201/results")
    ).toBe("location 1");
  });

  it.each([
    "/",
    "/calculate",
    "/locations/results",
    "/locations/a/edit",
    "/locations/%E0%A4%A/results"
  ])("rejects a non-matching route: %s", (path) => {
    expect(matchLocationResults(path)).toBeNull();
  });
});
