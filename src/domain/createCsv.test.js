import { describe, expect, it } from "vitest";
import { createCsv, escapeCsvField } from "./createCsv";

describe("escapeCsvField", () => {
  it("quotes every value", () => {
    expect(escapeCsvField("100.00")).toBe('"100.00"');
  });

  it("escapes embedded double quotes", () => {
    expect(escapeCsvField('Station "A"')).toBe('"Station ""A"""');
  });

  it("normalizes nullish values to an empty field", () => {
    expect(escapeCsvField(null)).toBe('""');
    expect(escapeCsvField(undefined)).toBe('""');
  });
});

describe("createCsv", () => {
  it("creates a UTF-8 BOM and headers for an empty result set", () => {
    expect(createCsv([])).toBe(
      '\ufeff"description";"frequency"'
    );
  });

  it("uses semicolons and CRLF line endings", () => {
    const csv = createCsv([
      {
        description: "2*A(100) - B(110)",
        frequency: "90.00"
      },
      {
        description: "2*B(110) - A(100)",
        frequency: "120.00"
      }
    ]);

    expect(csv).toBe(
      '\ufeff"description";"frequency"\r\n' +
        '"2*A(100) - B(110)";"90.00"\r\n' +
        '"2*B(110) - A(100)";"120.00"'
    );
  });

  it("preserves delimiters and newlines inside quoted fields", () => {
    const csv = createCsv([
      {
        description: 'Station "A"; first line\nsecond line',
        frequency: "100.00"
      }
    ]);

    expect(csv).toContain(
      '"Station ""A""; first line\nsecond line";"100.00"'
    );
  });

  it("accepts localized column headers", () => {
    expect(createCsv([], ["Opis", "Frekvencija"])).toBe(
      '\ufeff"Opis";"Frekvencija"'
    );
  });
});
