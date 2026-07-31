import { describe, expect, it } from "vitest";
import { parseNumberFilterInput } from "./ResultsGrid";

describe("parseNumberFilterInput", () => {
  it.each([
    ["108.50", 108.5],
    ["108,50", 108.5],
    ["  135,50  ", 135.5],
    ["95.0", 95.0],
    ["95,0", 95.0],
    ["0", 0],
    ["0,0", 0]
  ])("parses %s as number %f", (input, expected) => {
    expect(parseNumberFilterInput(input)).toBe(expected);
  });

  it.each([
    [null, null],
    [undefined, null],
    ["", null],
    ["abc", null]
  ])("returns null for invalid or empty input %s", (input, expected) => {
    expect(parseNumberFilterInput(input)).toBe(expected);
  });
});
