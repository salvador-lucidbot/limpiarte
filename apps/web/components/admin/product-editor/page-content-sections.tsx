"use client";

import { ClipboardList, LayoutTemplate, ListChecks, Plus, ShieldCheck } from "lucide-react";
import { PRODUCT_CONTENT_LIMITS, PRODUCT_SPEC_GROUPS, PRODUCT_SPEC_GROUP_LABELS } from "../../../lib/api/types";
import type { ProductSpecGroup } from "../../../lib/api/types";
import { cn } from "../../../lib/ui/cn";
import { ContentBlocksEditor } from "../content-blocks-editor";
import { createLocalKey, moveByKey, patchByKey, removeByKey, swapIndexes } from "../list-editing";
import type { MoveOffset } from "../list-editing";
import { LimitCounter, RowControls } from "../row-controls";
import { Button, Field, inputClass, textareaClass } from "../ui";
import { EditorNote, EditorSection, EmptyRows } from "./editor-section";
import { fieldSetter } from "./product-form-model";
import type { ProductFormHighlight, ProductFormSpec, ProductFormUpdater, ProductFormValue } from "./product-form-model";
import { PRODUCT_SECTION_ID } from "./product-sections";

const SPEC_LABEL_SUGGESTIONS: Record<ProductSpecGroup, string[]> = {
  DETALLES: ["Tipo de producto", "Uso recomendado", "Superficies", "Aroma", "Registro sanitario (INVIMA)", "País de origen", "Fabricante"],
  MEDIDAS: ["Contenido neto", "Capacidad", "Alto", "Ancho", "Profundidad", "Unidades por empaque"],
  ESTILO: ["Color", "Acabado", "Forma", "Tipo de envase"],
  CARACTERISTICAS: ["Rendimiento", "Concentración", "pH", "Dilución", "Biodegradable", "Fórmula", "Tiempo de acción"],
  MATERIALES_CUIDADO: ["Material", "Composición", "Almacenamiento", "Instrucciones de cuidado", "Vida útil"],
  GARANTIA: ["Garantía", "Soporte", "Devoluciones"]
};

interface PageContentProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
}

function moveSpecWithinGroup(specs: ProductFormSpec[], key: string, offset: MoveOffset): ProductFormSpec[] {
  const index = specs.findIndex((spec) => spec.key === key);
  const current = specs[index];
  if (!current) return specs;
  const groupIndexes = specs.flatMap((spec, position) => (spec.group === current.group ? [position] : []));
  const target = groupIndexes[groupIndexes.indexOf(index) + offset];
  if (target === undefined) return specs;
  return swapIndexes(specs, index, target);
}

export function HighlightsSection({ value, onUpdate }: PageContentProps): React.ReactNode {
  const limit = PRODUCT_CONTENT_LIMITS.highlights;
  const maxLength = PRODUCT_CONTENT_LIMITS.highlightLength;

  function patchHighlight(key: string, patch: Partial<ProductFormHighlight>): void {
    onUpdate((current) => ({ ...current, highlights: patchByKey(current.highlights, key, patch) }));
  }

  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.highlights}
      icon={ListChecks}
      title="Sobre este artículo"
      description="Viñetas cortas con los beneficios clave. Se muestran en la columna central de la ficha, en este orden."
      actions={
        <div className="flex items-center gap-3">
          <LimitCounter current={value.highlights.length} max={limit} />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={value.highlights.length >= limit}
            onClick={() =>
              onUpdate((current) =>
                current.highlights.length >= limit ? current : { ...current, highlights: [...current.highlights, { key: createLocalKey(), text: "" }] }
              )
            }
          >
            <Plus size={16} aria-hidden="true" />
            Viñeta
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {value.highlights.length === 0 && (
          <EmptyRows icon={ListChecks}>Sin viñetas. Resume en frases cortas los beneficios clave: para qué sirve, rendimiento, aroma, superficies…</EmptyRows>
        )}
        {value.highlights.length > 0 && (
          <ol className="space-y-3">
            {value.highlights.map((highlight, index) => (
              <li key={highlight.key} className="flex items-start gap-3">
                <span
                  className="mt-2.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 font-mono text-xs font-semibold text-brand-700"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <textarea
                    rows={2}
                    value={highlight.text}
                    maxLength={maxLength}
                    onChange={(event) => patchHighlight(highlight.key, { text: event.target.value })}
                    aria-label={`Viñeta ${index + 1}`}
                    placeholder="Ej.: Elimina el 99,9 % de gérmenes y bacterias sin dejar residuos."
                    className={textareaClass}
                  />
                  <p
                    className={cn(
                      "mt-1 text-right font-mono text-[0.7rem] tabular-nums text-ink-500",
                      highlight.text.length >= maxLength && "text-warning-700"
                    )}
                  >
                    {highlight.text.length}/{maxLength}
                  </p>
                </div>
                <RowControls
                  label={`la viñeta ${index + 1}`}
                  isFirst={index === 0}
                  isLast={index === value.highlights.length - 1}
                  onMove={(offset) => onUpdate((current) => ({ ...current, highlights: moveByKey(current.highlights, highlight.key, offset) }))}
                  onRemove={() => onUpdate((current) => ({ ...current, highlights: removeByKey(current.highlights, highlight.key) }))}
                />
              </li>
            ))}
          </ol>
        )}
        <EditorNote>Las viñetas vacías no se guardan. El título de esta sección se cambia en «Títulos de sección».</EditorNote>
      </div>
    </EditorSection>
  );
}

export function SpecsSection({ value, onUpdate }: PageContentProps): React.ReactNode {
  const limit = PRODUCT_CONTENT_LIMITS.specs;
  const limitReached = value.specs.length >= limit;

  function patchSpec(key: string, patch: Partial<ProductFormSpec>): void {
    onUpdate((current) => ({ ...current, specs: patchByKey(current.specs, key, patch) }));
  }

  function addSpec(group: ProductSpecGroup): void {
    onUpdate((current) =>
      current.specs.length >= limit
        ? current
        : { ...current, specs: [...current.specs, { key: createLocalKey(), group, label: "", value: "", isKey: false }] }
    );
  }

  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.specs}
      icon={ClipboardList}
      title="Especificaciones"
      description="Cada grupo es un acordeón de «Información del producto». Marca «Tabla principal» para repetir el dato junto al precio."
      actions={<LimitCounter current={value.specs.length} max={limit} />}
    >
      <div className="space-y-4">
        {PRODUCT_SPEC_GROUPS.map((group) => {
          const rows = value.specs.filter((spec) => spec.group === group);
          const datalistId = `spec-sugerencias-${group.toLowerCase()}`;
          return (
            <fieldset key={group} className="min-w-0 rounded-2xl border border-ink-200 p-4">
              <legend className="px-1 text-sm font-bold text-brand-900">{PRODUCT_SPEC_GROUP_LABELS[group]}</legend>
              <datalist id={datalistId}>
                {SPEC_LABEL_SUGGESTIONS[group].map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              {rows.length > 0 && (
                <div className="space-y-2">
                  {rows.map((spec, index) => {
                    const rowLabel = spec.label.trim() || `la fila ${index + 1} de ${PRODUCT_SPEC_GROUP_LABELS[group]}`;
                    return (
                      <div
                        key={spec.key}
                        className="grid gap-2 rounded-xl bg-ink-50 p-2 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto_auto] md:items-center"
                      >
                        <input
                          list={datalistId}
                          value={spec.label}
                          maxLength={PRODUCT_CONTENT_LIMITS.specLabelLength}
                          placeholder="Etiqueta"
                          onChange={(event) => patchSpec(spec.key, { label: event.target.value })}
                          aria-label={`Etiqueta de ${rowLabel}`}
                          className={inputClass}
                        />
                        <input
                          value={spec.value}
                          maxLength={PRODUCT_CONTENT_LIMITS.specValueLength}
                          placeholder="Valor"
                          onChange={(event) => patchSpec(spec.key, { value: event.target.value })}
                          aria-label={`Valor de ${rowLabel}`}
                          className={inputClass}
                        />
                        <label className="flex items-center gap-2 px-1 text-xs font-medium whitespace-nowrap text-ink-700">
                          <input
                            type="checkbox"
                            checked={spec.isKey}
                            onChange={(event) => patchSpec(spec.key, { isKey: event.target.checked })}
                            className="size-4 accent-brand-700"
                          />
                          Tabla principal
                        </label>
                        <RowControls
                          label={rowLabel}
                          isFirst={index === 0}
                          isLast={index === rows.length - 1}
                          onMove={(offset) => onUpdate((current) => ({ ...current, specs: moveSpecWithinGroup(current.specs, spec.key, offset) }))}
                          onRemove={() => onUpdate((current) => ({ ...current, specs: removeByKey(current.specs, spec.key) }))}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              <Button type="button" variant="ghost" size="sm" disabled={limitReached} onClick={() => addSpec(group)} className="mt-2 whitespace-normal">
                <Plus size={16} aria-hidden="true" />
                Agregar en «{PRODUCT_SPEC_GROUP_LABELS[group]}»
              </Button>
            </fieldset>
          );
        })}
        <EditorNote>La marca, las dimensiones y el peso se agregan solos a la tabla principal.</EditorNote>
      </div>
    </EditorSection>
  );
}

export function WarrantySection({ value, onUpdate }: PageContentProps): React.ReactNode {
  const set = fieldSetter(onUpdate);
  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.warranty}
      icon={ShieldCheck}
      title="Garantía"
      description="Se muestra en «Garantía y asistencia» de la ficha. Déjalo vacío si el producto no tiene garantía propia."
    >
      <Field label="Garantía y asistencia del producto">
        <textarea
          rows={4}
          value={value.warrantyText}
          maxLength={PRODUCT_CONTENT_LIMITS.warrantyLength}
          onChange={(event) => set("warrantyText", event.target.value)}
          placeholder="Ej.: Garantía de calidad de 6 meses desde la compra. Si el producto llega en mal estado, escríbenos por WhatsApp con la foto del empaque."
          className={textareaClass}
        />
      </Field>
    </EditorSection>
  );
}

export function VisualContentSection({ value, onUpdate }: PageContentProps): React.ReactNode {
  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.visualContent}
      icon={LayoutTemplate}
      title="Contenido visual"
      description="Bloques con imágenes diseñadas que van en «Descripción del producto». Los de la marca (se editan en Marcas) aparecen después, en «Desde la marca»."
    >
      <ContentBlocksEditor
        blocks={value.contentBlocks}
        onUpdate={(update) => onUpdate((current) => ({ ...current, contentBlocks: update(current.contentBlocks) }))}
        emptyMessage="Sin bloques. Agrega imágenes de beneficios, modo de uso o comparativas para enriquecer la ficha."
      />
    </EditorSection>
  );
}
