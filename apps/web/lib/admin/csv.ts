export interface CsvTable {
  headers: string[];
  rows: Record<string, string>[];
}

function splitCells(text: string): string[][] {
  const normalized = text.replace(/^﻿/, "");
  const table: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];

    if (insideQuotes) {
      if (char !== '"') {
        cell += char;
        continue;
      }
      if (normalized[index + 1] === '"') {
        cell += '"';
        index += 1;
        continue;
      }
      insideQuotes = false;
      continue;
    }

    if (char === '"') {
      insideQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\r") continue;
    if (char === "\n") {
      row.push(cell);
      table.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell);
  table.push(row);

  return table.filter((cells) => cells.some((value) => value.trim().length > 0));
}

export function parseCsv(text: string): CsvTable {
  const table = splitCells(text);
  const headerCells = table[0];
  if (!headerCells) return { headers: [], rows: [] };

  const headers = headerCells.map((header) => header.trim());
  const rows = table.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? "").trim();
    });
    return row;
  });

  return { headers, rows };
}

export function slugToTitle(slug: string): string {
  const words = slug.split("-").filter(Boolean).join(" ");
  if (words.length === 0) return slug;
  return words.charAt(0).toUpperCase() + words.slice(1);
}
