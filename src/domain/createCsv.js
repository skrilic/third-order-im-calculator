function escapeCsvField(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function createCsv(rows) {
  const lines = [
    ["description", "frequency"],
    ...rows.map((row) => [row.description, row.frequency])
  ];

  const content = lines
    .map((line) => line.map(escapeCsvField).join(";"))
    .join("\r\n");

  return `\ufeff${content}`;
}

export { escapeCsvField };
