import { describe, expect, it } from "vitest";
import { calculateIm3 } from "./calculateIm3";

describe("calculateIm3", () => {
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
});
