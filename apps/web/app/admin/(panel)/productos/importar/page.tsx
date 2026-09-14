"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, inputClass } from "../../../../../components/admin/ui";
import { IconAlertTriangle, IconCheck, IconCheckCircle, IconDownload, IconPlus, IconUpload, IconX } from "../../../../../components/icons";
import { parseCsv, slugToTitle } from "../../../../../lib/admin/csv";
import { useAdminGet, useAdminRequest } from "../../../../../lib/admin/use-admin-api";
import { Loader } from "../../../../../components/loader";

const TEMPLATE = "name,sku,categorySlug,brandName,basePrice,stock,description,presentation,weightKg";
const MAX_REQUESTS = 40;

type Stage = "idle" | "analyzing" | "resolving" | "creating" | "importing" | "done";
type ResolutionMode = "create" | "existing" | "skip";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

interface ImportRow {
  line: number;
  name: string;
  sku?: string;
  categorySlug?: string;
  brandName?: string;
  basePrice: number | null;
  stock?: number;
  description?: string;
  presentation?: string;
  weightKg?: number;
}

interface PendingCategory {
  slug: string;
  count: number;
  mode: ResolutionMode;
  newName: string;
  existingSlug: string;
}

interface RowError {
  line: number;
  name: string;
  message: string;
}

interface ActivityStep {
  id: string;
  label: string;
  status: "running" | "done" | "error";
  detail?: string;
}

interface BulkImportResponse {
  created: number;
  errors: { row: number; message: string }[];
}

function toNumber(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/\s/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildRows(csvText: string): ImportRow[] {
  return parseCsv(csvText).rows.map((row, index) => ({
    line: index + 2,
    name: row.name ?? "",
    sku: row.sku || undefined,
    categorySlug: row.categorySlug || undefined,
    brandName: row.brandName || undefined,
    basePrice: toNumber(row.basePrice ?? "") ?? null,
    stock: toNumber(row.stock ?? ""),
    description: row.description || undefined,
    presentation: row.presentation || undefined,
    weightKg: toNumber(row.weightKg ?? "")
  }));
}

function validateRow(row: ImportRow): string | null {
  if (row.name.trim().length < 2) return "El nombre debe tener al menos 2 caracteres";
  if (row.basePrice === null) return "El precio está vacío o no es un número";
  if (row.basePrice < 0) return "El precio no puede ser negativo";
  if (row.stock !== undefined && (!Number.isInteger(row.stock) || row.stock < 0)) {
    return "El stock debe ser un número entero mayor o igual a 0";
  }
  if (row.weightKg !== undefined && row.weightKg < 0) return "El peso no puede ser negativo";
  return null;
}

function toPayload(row: ImportRow): Record<string, unknown> {
  return {
    name: row.name,
    sku: row.sku,
    categorySlug: row.categorySlug,
    brandName: row.brandName,
    basePrice: row.basePrice,
    stock: row.stock,
    description: row.description,
    presentation: row.presentation,
    weightKg: row.weightKg
  };
}

export default function BulkImportPage(): React.ReactNode {
  const request = useAdminRequest();
  const { data: categories, reload: reloadCategories } = useAdminGet<CategoryRow[]>("/admin/catalog/categories");

  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [pendingCategories, setPendingCategories] = useState<PendingCategory[]>([]);
  const [processed, setProcessed] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [invalidRows, setInvalidRows] = useState<RowError[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [steps, setSteps] = useState<ActivityStep[]>([]);
  const stepCounter = useRef(0);
  const logRef = useRef<HTMLDivElement | null>(null);

  function pushStep(label: string): string {
    stepCounter.current += 1;
    const id = `step-${stepCounter.current}`;
    setSteps((current) => [...current, { id, label, status: "running" }]);
    return id;
  }

  function closeStep(id: string, status: "done" | "error", detail?: string): void {
    setSteps((current) => current.map((step) => (step.id === id ? { ...step, status, detail } : step)));
  }

  const isBusy = stage === "analyzing" || stage === "creating" || stage === "importing";
  const overlayVisible = stage !== "idle";
  const progress = rows.length > 0 ? Math.round((processed / rows.length) * 100) : 0;

  useEffect(() => {
    if (!isBusy) return;

    function warnBeforeUnload(event: BeforeUnloadEvent): void {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isBusy]);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [steps]);

  const existingSlugs = useMemo(() => new Set((categories ?? []).map((category) => category.slug)), [categories]);

  function onFileSelected(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file, "utf-8");
  }

  function resetState(): void {
    setStage("idle");
    setRows([]);
    setPendingCategories([]);
    setProcessed(0);
    setCreatedCount(0);
    setErrors([]);
    setInvalidRows([]);
    setTotalRows(0);
    setFatalError(null);
    setSteps([]);
    stepCounter.current = 0;
  }

  function analyze(): void {
    setFatalError(null);
    setErrors([]);
    setProcessed(0);
    setCreatedCount(0);
    setSteps([]);
    stepCounter.current = 0;
    setStage("analyzing");

    const parsed = buildRows(csvText);
    if (parsed.length === 0) {
      setFatalError("El archivo no contiene filas de productos.");
      setStage("done");
      return;
    }

    setTotalRows(parsed.length);

    const rejected: RowError[] = [];
    const valid: ImportRow[] = [];
    for (const row of parsed) {
      const problem = validateRow(row);
      if (problem) {
        rejected.push({ line: row.line, name: row.name, message: problem });
        continue;
      }
      valid.push(row);
    }

    setInvalidRows(rejected);
    setRows(valid);

    if (valid.length === 0) {
      setErrors(rejected);
      setFatalError("Ninguna fila del archivo tiene el formato mínimo requerido.");
      setStage("done");
      return;
    }

    const missing = new Map<string, number>();
    for (const row of valid) {
      if (!row.categorySlug) continue;
      if (existingSlugs.has(row.categorySlug)) continue;
      missing.set(row.categorySlug, (missing.get(row.categorySlug) ?? 0) + 1);
    }

    if (missing.size === 0) {
      void runImport(valid, rejected);
      return;
    }

    setPendingCategories(
      [...missing.entries()].map(([slug, count]) => ({
        slug,
        count,
        mode: "create",
        newName: slugToTitle(slug),
        existingSlug: categories?.[0]?.slug ?? ""
      }))
    );
    setStage("resolving");
  }

  function updatePending(slug: string, patch: Partial<PendingCategory>): void {
    setPendingCategories((current) => current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)));
  }

  async function applyResolutions(): Promise<void> {
    setFatalError(null);
    setStage("creating");

    const remap = new Map<string, string | null>();

    for (const pending of pendingCategories) {
      if (pending.mode === "skip") {
        remap.set(pending.slug, null);
        const stepId = pushStep(`Omitiendo la categoría «${pending.slug}»`);
        closeStep(stepId, "done", `${pending.count} producto(s) se importarán sin categoría`);
        continue;
      }

      if (pending.mode === "existing") {
        remap.set(pending.slug, pending.existingSlug);
        const target = (categories ?? []).find((category) => category.slug === pending.existingSlug);
        const stepId = pushStep(`Reasignando «${pending.slug}»`);
        closeStep(stepId, "done", `${pending.count} producto(s) usarán «${target?.name ?? pending.existingSlug}»`);
        continue;
      }

      const stepId = pushStep(`Creando la categoría «${pending.newName.trim()}»`);
      try {
        await request("/admin/catalog/categories", "POST", {
          name: pending.newName.trim(),
          slug: pending.slug,
          isActive: true
        });
        remap.set(pending.slug, pending.slug);
        closeStep(stepId, "done", `${pending.count} producto(s) quedarán en esta categoría`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo crear la categoría";
        closeStep(stepId, "error", message);
        setFatalError(`No se pudo crear la categoría «${pending.newName.trim()}»: ${message}`);
        setStage("resolving");
        return;
      }
    }

    const reloadStep = pushStep("Actualizando el catálogo de categorías");
    await reloadCategories();
    closeStep(reloadStep, "done");

    const resolved = rows.map((row) => {
      if (!row.categorySlug || !remap.has(row.categorySlug)) return row;
      return { ...row, categorySlug: remap.get(row.categorySlug) ?? undefined };
    });

    setRows(resolved);
    await runImport(resolved, invalidRows);
  }

  async function importBatch(batch: ImportRow[], collected: RowError[]): Promise<number> {
    try {
      const result = await request<BulkImportResponse>("/admin/catalog/products/bulk-import", "POST", {
        rows: batch.map(toPayload)
      });

      for (const error of result.errors) {
        const source = batch[error.row - 1];
        collected.push({ line: source?.line ?? 0, name: source?.name ?? "", message: error.message });
      }

      return result.created;
    } catch (batchError) {
      if (batch.length === 1) {
        const source = batch[0];
        collected.push({
          line: source?.line ?? 0,
          name: source?.name ?? "",
          message: batchError instanceof Error ? batchError.message : "Fila rechazada por el servidor"
        });
        return 0;
      }

      const retryStep = pushStep(`Un lote fue rechazado: reintentando ${batch.length} filas una por una`);
      let created = 0;
      for (const row of batch) {
        created += await importBatch([row], collected);
      }
      closeStep(retryStep, "done", `${created} de ${batch.length} recuperadas`);
      return created;
    }
  }

  async function runImport(target: ImportRow[], rejected: RowError[]): Promise<void> {
    setStage("importing");
    setProcessed(0);
    setCreatedCount(0);

    const batchSize = Math.max(10, Math.ceil(target.length / MAX_REQUESTS));
    const collected: RowError[] = [];
    let created = 0;

    try {
      for (let start = 0; start < target.length; start += batchSize) {
        const batch = target.slice(start, start + batchSize);
        const errorsBefore = collected.length;
        const stepId = pushStep(`Importando productos ${start + 1} a ${start + batch.length} de ${target.length}`);

        const batchCreated = await importBatch(batch, collected);
        created += batchCreated;

        const batchErrors = collected.length - errorsBefore;
        closeStep(
          stepId,
          batchErrors > 0 ? "error" : "done",
          batchErrors > 0 ? `${batchCreated} creados · ${batchErrors} con error` : `${batchCreated} creados`
        );

        setProcessed(start + batch.length);
        setCreatedCount(created);
      }
    } catch (error) {
      setFatalError(error instanceof Error ? error.message : "Se interrumpió la importación");
    }

    setErrors([...rejected, ...collected].sort((left, right) => left.line - right.line));
    setStage("done");
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
        <label className="mb-3 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:border-brand-500 hover:bg-brand-100">
          <IconUpload size={16} />
          {fileName ?? "Seleccionar archivo CSV"}
          <input type="file" accept=".csv,text/csv" onChange={onFileSelected} className="sr-only" />
        </label>
        {fileName && <p className="mb-2 text-xs text-stone-500">Puedes volver a hacer clic para cambiar el archivo.</p>}
        <textarea
          rows={8}
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          placeholder={TEMPLATE}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs"
        />
        <p className="mt-2 text-xs text-stone-400">
          Las categorías que no existan se detectan antes de importar y podrás crearlas o reemplazarlas sin salir de la ventana.
        </p>
        <div className="mt-3">
          <Button disabled={!csvText.trim() || categories === null} onClick={analyze} className="flex items-center gap-2">
            {categories === null ? <Loader size="sm" label="Cargando categorías" className="py-0" /> : "Importar productos"}
          </Button>
        </div>
      </Card>

      {overlayVisible && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Importación de productos"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/70 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            {stage === "analyzing" && (
              <div className="space-y-3 py-6 text-center">
                <p className="text-lg font-semibold text-navy-900">Analizando el archivo…</p>
                <p className="text-sm text-stone-500">Revisando filas y comparando categorías contra el catálogo.</p>
              </div>
            )}

            {stage === "resolving" && (
              <div className="space-y-5">
                <header className="space-y-1">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-900">
                    <IconAlertTriangle size={19} className="text-amber-500" />
                    Categorías que no existen
                  </h2>
                  <p className="text-sm text-stone-600">
                    Encontramos {pendingCategories.length} categoría(s) sin crear en el catálogo. Decide qué hacer con cada una: la
                    decisión se aplica a todos los productos de esa categoría.
                  </p>
                  {invalidRows.length > 0 && (
                    <p className="text-sm text-amber-700">
                      {invalidRows.length} fila(s) del archivo tienen datos inválidos y se omitirán. Las verás detalladas al final.
                    </p>
                  )}
                </header>

                <div className="space-y-4">
                  {pendingCategories.map((pending) => (
                    <div key={pending.slug} className="rounded-xl border border-stone-200 p-4">
                      <p className="mb-3 text-sm font-semibold text-navy-900">
                        <code className="rounded bg-stone-100 px-1.5 py-0.5">{pending.slug}</code>
                        <span className="ml-2 font-normal text-stone-500">{pending.count} producto(s)</span>
                      </p>

                      <div className="space-y-2.5">
                        <label className="flex items-center gap-2 text-sm text-stone-700">
                          <input
                            type="radio"
                            name={`mode-${pending.slug}`}
                            checked={pending.mode === "create"}
                            onChange={() => updatePending(pending.slug, { mode: "create" })}
                            className="accent-brand-600"
                          />
                          Crear categoría nueva
                        </label>
                        {pending.mode === "create" && (
                          <div className="ml-6">
                            <input
                              value={pending.newName}
                              onChange={(event) => updatePending(pending.slug, { newName: event.target.value })}
                              placeholder="Nombre visible de la categoría"
                              className={inputClass}
                            />
                          </div>
                        )}

                        <label className="flex items-center gap-2 text-sm text-stone-700">
                          <input
                            type="radio"
                            name={`mode-${pending.slug}`}
                            checked={pending.mode === "existing"}
                            disabled={(categories ?? []).length === 0}
                            onChange={() => updatePending(pending.slug, { mode: "existing" })}
                            className="accent-brand-600"
                          />
                          Usar una categoría existente
                          {(categories ?? []).length === 0 && (
                            <span className="text-xs text-stone-400">(no hay categorías creadas)</span>
                          )}
                        </label>
                        {pending.mode === "existing" && (
                          <div className="ml-6">
                            <select
                              value={pending.existingSlug}
                              onChange={(event) => updatePending(pending.slug, { existingSlug: event.target.value })}
                              className={inputClass}
                            >
                              {(categories ?? []).map((category) => (
                                <option key={category.id} value={category.slug}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <label className="flex items-center gap-2 text-sm text-stone-700">
                          <input
                            type="radio"
                            name={`mode-${pending.slug}`}
                            checked={pending.mode === "skip"}
                            onChange={() => updatePending(pending.slug, { mode: "skip" })}
                            className="accent-brand-600"
                          />
                          Importar sin categoría
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {fatalError && <p className="text-sm text-red-600">{fatalError}</p>}

                <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
                  <Button variant="secondary" onClick={resetState}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => void applyResolutions()}
                    disabled={pendingCategories.some((pending) => pending.mode === "create" && pending.newName.trim().length < 2)}
                    className="flex items-center gap-2"
                  >
                    <IconPlus size={15} />
                    Continuar e importar {rows.length} productos
                  </Button>
                </div>
              </div>
            )}

            {(stage === "creating" || stage === "importing") && (
              <div className="space-y-4 py-4">
                <h2 className="text-lg font-semibold text-navy-900">
                  {stage === "creating" ? "Creando categorías…" : "Importando productos…"}
                </h2>
                <p className="text-sm text-stone-600">No cierres esta ventana hasta que termine el proceso.</p>

                <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${stage === "creating" ? 4 : Math.max(progress, 4)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-navy-900">
                    {processed} de {rows.length} procesados
                  </span>
                  <span className="text-emerald-700">{createdCount} creados</span>
                </div>

                <ActivityLog steps={steps} containerRef={logRef} />
              </div>
            )}

            {stage === "done" && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-900">
                  {fatalError ? (
                    <IconAlertTriangle size={19} className="text-red-500" />
                  ) : (
                    <IconCheckCircle size={19} className="text-emerald-500" />
                  )}
                  {fatalError ? "Importación incompleta" : "Importación finalizada"}
                </h2>

                {fatalError && <p className="text-sm text-red-600">{fatalError}</p>}

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-stone-50 p-3">
                    <p className="text-xl font-bold text-navy-900">{totalRows}</p>
                    <p className="text-xs text-stone-500">Filas del archivo</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xl font-bold text-emerald-700">{createdCount}</p>
                    <p className="text-xs text-emerald-600">Creados en borrador</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="text-xl font-bold text-red-600">{errors.length}</p>
                    <p className="text-xs text-red-500">Con error</p>
                  </div>
                </div>

                {steps.length > 0 && <ActivityLog steps={steps} containerRef={logRef} />}

                {errors.length > 0 && (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-stone-200">
                    <ul className="divide-y divide-stone-100 text-sm">
                      {errors.map((error) => (
                        <li key={`${error.line}-${error.name}`} className="px-3 py-2">
                          <span className="font-medium text-navy-900">Fila {error.line}</span>
                          {error.name && <span className="text-stone-500"> · {error.name}</span>}
                          <p className="text-xs text-red-600">{error.message}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end border-t border-stone-100 pt-4">
                  <Button onClick={resetState} className="flex items-center gap-2">
                    <IconX size={15} />
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityLog({
  steps,
  containerRef
}: {
  steps: ActivityStep[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}): React.ReactNode {
  if (steps.length === 0) return null;

  return (
    <div ref={containerRef} className="max-h-52 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-3">
      <ul className="space-y-1.5 text-sm">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">
              {step.status === "running" && <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />}
              {step.status === "done" && <IconCheck size={14} className="text-emerald-600" />}
              {step.status === "error" && <IconAlertTriangle size={14} className="text-amber-600" />}
            </span>
            <span className="flex-1">
              <span className={step.status === "running" ? "text-navy-900" : "text-stone-600"}>{step.label}</span>
              {step.detail && <span className="block text-xs text-stone-400">{step.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
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
