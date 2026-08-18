"use client";

import { useState } from "react";
import { Button, Card } from "../../../../../components/admin/ui";
import { IconDownload } from "../../../../../components/icons";
import { useAdminRequest } from "../../../../../lib/admin/use-admin-api";

interface ImportResult {
  created: number;
  errors: { row: number; message: string }[];
}

const TEMPLATE = "name,sku,categorySlug,brandName,basePrice,stock,description,presentation,weightKg";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headerLine = lines[0];
  if (!headerLine) return [];

  const headers = headerLine.split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

export default function BulkImportPage(): React.ReactNode {
  const request = useAdminRequest();
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function onFileSelected(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file, "utf-8");
  }

  async function submit(): Promise<void> {
    setSubmitting(true);
    setErrorMessage(null);
    setResult(null);
    try {
      const rows = parseCsv(csvText).map((row) => ({
        name: row.name ?? "",
        sku: row.sku || undefined,
        categorySlug: row.categorySlug || undefined,
        brandName: row.brandName || undefined,
        basePrice: Number(row.basePrice ?? 0),
        stock: row.stock ? Number(row.stock) : undefined,
        description: row.description || undefined,
        presentation: row.presentation || undefined,
        weightKg: row.weightKg ? Number(row.weightKg) : undefined
      }));
      if (rows.length === 0) throw new Error("El archivo no contiene filas");
      const importResult = await request<ImportResult>("/admin/catalog/products/bulk-import", "POST", { rows });
      setResult(importResult);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo importar");
    } finally {
      setSubmitting(false);
    }
  }

  function downloadTemplate(): void {
    const blob = new Blob([`${TEMPLATE}\nJabón multiusos,JAB-001,limpieza-general,Limpiarte,25000,50,Jabón concentrado,1 L,1.1`], {
      type: "text/csv"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "plantilla-productos.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">Carga masiva de productos</h1>

      <Card title="1. Descarga la plantilla">
        <p className="mb-3 text-sm text-stone-600">
          Usa la plantilla CSV con las columnas: <code className="rounded bg-stone-100 px-1">{TEMPLATE}</code>
        </p>
        <Button variant="secondary" onClick={downloadTemplate} className="flex items-center gap-2">
          <IconDownload size={15} />
          Descargar plantilla CSV
        </Button>
      </Card>

      <Card title="2. Sube o pega el contenido">
        <input type="file" accept=".csv,text/csv" onChange={onFileSelected} className="mb-3 block text-sm" />
        <textarea
          rows={8}
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          placeholder={TEMPLATE}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs"
        />
        {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
        <div className="mt-3">
          <Button disabled={submitting || !csvText.trim()} onClick={() => void submit()}>
            {submitting ? "Importando…" : "Importar productos"}
          </Button>
        </div>
      </Card>

      {result && (
        <Card title="Resultado">
          <p className="text-sm text-emerald-700">✓ {result.created} productos creados (en estado borrador)</p>
          {result.errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-red-600">
              {result.errors.map((error) => (
                <li key={error.row}>
                  Fila {error.row}: {error.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
