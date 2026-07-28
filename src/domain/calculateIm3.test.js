import { describe, expect, it } from "vitest";
import { calculateIm3 } from "./calculateIm3";

describe("calculateIm3", () => {
  it("returns no products for fewer than two stations", () => {
    expect(calculateIm3([])).toEqual([]);
    expect(
      calculateIm3([{ name: "A", frequency: 100 }])
    ).toEqual([]);
  });

  it("calculates both ordered two-frequency products", () => {
    const results = calculateIm3([
      { name: "A", frequency: 100 },
      { name: "B", frequency: 110 }
    ]);

    expect(results).toEqual([
      {
        description: "2*A(100) - B(110)",
        frequency: "90.00"
      },
      {
        description: "2*B(110) - A(100)",
        frequency: "120.00"
      }
    ]);
  });

  it("adds each unique three-frequency combination", () => {
    const results = calculateIm3([
      { name: "A", frequency: 100 },
      { name: "B", frequency: 110 },
      { name: "C", frequency: 120 }
    ]);

    expect(results).toHaveLength(9);
    expect(results).toContainEqual({
      description: "A(100) + B(110) - C(120)",
      frequency: "90.00"
    });
    expect(results).toContainEqual({
      description: "A(100) + C(120) - B(110)",
      frequency: "110.00"
    });
    expect(results).toContainEqual({
      description: "B(110) + C(120) - A(100)",
      frequency: "130.00"
    });
  });

  it("generates the expected unfiltered candidate count", () => {
    const results = calculateIm3([
      { name: "A", frequency: 100 },
      { name: "B", frequency: 101 },
      { name: "C", frequency: 102 },
      { name: "D", frequency: 103 }
    ]);

    expect(results).toHaveLength(24);
  });

  it("excludes zero and negative products", () => {
    const results = calculateIm3([
      { name: "A", frequency: 10 },
      { name: "B", frequency: 20 }
    ]);

    expect(results).toEqual([
      {
        description: "2*B(20) - A(10)",
        frequency: "30.00"
      }
    ]);
  });

  it("uses fallback names and rounds results to two decimal places", () => {
    const results = calculateIm3([
      { name: "", frequency: 100.126 },
      { name: "B", frequency: 100 }
    ]);

    expect(results[0]).toEqual({
      description: "2*F0(100.126) - B(100)",
      frequency: "100.25"
    });
  });

  it("treats duplicate station entries as distinct operands", () => {
    const results = calculateIm3([
      { name: "A", frequency: 100 },
      { name: "A", frequency: 100 }
    ]);

    expect(results).toHaveLength(2);
    expect(results.every((result) => result.frequency === "100.00"))
      .toBe(true);
  });

  it("does not mutate the station input", () => {
    const stations = [
      { id: "a", name: "A", frequency: 100 },
      { id: "b", name: "B", frequency: 110 }
    ];
    const snapshot = structuredClone(stations);

    calculateIm3(stations);

    expect(stations).toEqual(snapshot);
  });
});
