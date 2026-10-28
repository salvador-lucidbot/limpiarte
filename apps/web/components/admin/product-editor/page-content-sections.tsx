"use client";

import { PRODUCT_CONTENT_LIMITS, PRODUCT_SPEC_GROUPS, PRODUCT_SPEC_GROUP_LABELS } from "../../../lib/api/types";
import type { ProductSpecGroup } from "../../../lib/api/types";
import { IconPlus } from "../../icons";
import { ContentBlocksEditor } from "../content-blocks-editor";
import { createLocalKey, moveByKey, patchByKey, removeByKey, swapIndexes } from "../list-editing";
import type { MoveOffset } from "../list-editing";
import { LimitCounter, RowControls } from "../row-controls";
import { Button, Card, Field, inputClass } from "../ui";
import { fieldSetter } from "./product-form-model";
import type { ProductFormHighlight, ProductFormSpec, ProductFormUpdater, ProductFormValue } from "./product-form-model";

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
    <Card
      id="producto-sobre"
      title="Sobre este artículo"
      actions={
        <div className="flex items-center gap-3">
          <LimitCounter current={value.highlights.length} max={limit} />
          <Button
            type="button"
            variant="secondary"
            disabled={value.highlights.length >= limit}
            onClick={() =>
              onUpdate((current) =>
                current.highlights.length >= limit ? current : { ...current, highlights: [...current.highlights, { key: createLocalKey(), text: "" }] }
              )
            }
          >
            <IconPlus size={15} />
            Viñeta
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        {value.highlights.length === 0 && (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-400">
            Sin viñetas. Resume en frases cortas los beneficios clave: para qué sirve, rendimiento, aroma, superficies…
          </p>
        )}
        <ol className="space-y-2">
          {value.highlights.map((highlight, index) => (
            <li key={highlight.key} className="flex items-start gap-2">
              <span className="mt-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700" aria-hidden>
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <textarea
                  rows={2}
                  value={highlight.text}
                  maxLength={maxLength}
                  onChange={(event) => patchHighlight(highlight.key, { text: event.target.value })}
                  aria-label={`Viñeta ${index + 1}`}
                  placeholder="Ej.: Elimina el 99,9 % de gérmenes y bacterias sin dejar residuos."
                  className={inputClass}
                />
                <p className={`mt-0.5 text-right text-[11px] ${highlight.text.length >= maxLength ? "text-amber-700" : "text-stone-400"}`}>
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
        <p className="text-xs text-stone-400">Se muestran en la columna central de la ficha, en este mismo orden. Las viñetas vacías no se guardan.</p>
      </div>
    </Card>
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
    <Card id="producto-especificaciones" title="Especificaciones" actions={<LimitCounter current={value.specs.length} max={limit} />}>
      <div className="space-y-4">
        <p className="text-sm text-stone-500">
          Cada grupo es un acordeón de «Información del producto». Marca «Mostrar en la tabla principal» para que el dato aparezca también en la tabla de
          atributos junto al precio (la marca, las dimensiones y el peso se agregan solos).
        </p>
        {PRODUCT_SPEC_GROUPS.map((group) => {
          const rows = value.specs.filter((spec) => spec.group === group);
          const datalistId = `spec-sugerencias-${group.toLowerCase()}`;
          return (
            <fieldset key={group} className="rounded-xl border border-stone-200 p-4">
              <legend className="px-1 text-sm font-semibold text-navy-900">{PRODUCT_SPEC_GROUP_LABELS[group]}</legend>
              <datalist id={datalistId}>
                {SPEC_LABEL_SUGGESTIONS[group].map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              <div className="space-y-2">
                {rows.map((spec, index) => {
                  const rowLabel = spec.label.trim() || `la fila ${index + 1} de ${PRODUCT_SPEC_GROUP_LABELS[group]}`;
                  return (
                    <div key={spec.key} className="grid gap-2 rounded-lg bg-stone-50 p-2 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_auto_auto] md:items-center">
                      <input
                        list={datalistId}
                        value={spec.label}
                        maxLength={PRODUCT_CONTENT_LIMITS.specLabelLength}
                        placeholder="Etiqueta"
                        onChange={(event) => patchSpec(spec.key, { label: event.target.value })}
                        aria-label={`Etiqueta de ${rowLabel}`}
                        className={`${inputClass} bg-white`}
                      />
                      <input
                        value={spec.value}
                        maxLength={PRODUCT_CONTENT_LIMITS.specValueLength}
                        placeholder="Valor"
                        onChange={(event) => patchSpec(spec.key, { value: event.target.value })}
                        aria-label={`Valor de ${rowLabel}`}
                        className={`${inputClass} bg-white`}
                      />
                      <label className="flex items-center gap-2 whitespace-nowrap text-xs text-stone-600">
                        <input
                          type="checkbox"
                          checked={spec.isKey}
                          onChange={(event) => patchSpec(spec.key, { isKey: event.target.checked })}
                          className="h-4 w-4 accent-brand-600"
                        />
                        Mostrar en la tabla principal
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
              <button
                type="button"
                disabled={limitReached}
                onClick={() => addSpec(group)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-40"
              >
                <IconPlus size={14} />
                Agregar en «{PRODUCT_SPEC_GROUP_LABELS[group]}»
              </button>
            </fieldset>
          );
        })}
      </div>
    </Card>
  );
}

export function WarrantySection({ value, onUpdate }: PageContentProps): React.ReactNode {
  const set = fieldSetter(onUpdate);
  return (
    <Card id="producto-garantia" title="Garantía">
      <Field label="Garantía y asistencia del producto">
        <textarea
          rows={4}
          value={value.warrantyText}
          maxLength={PRODUCT_CONTENT_LIMITS.warrantyLength}
          onChange={(event) => set("warrantyText", event.target.value)}
          placeholder="Ej.: Garantía de calidad de 6 meses desde la compra. Si el producto llega en mal estado, escríbenos por WhatsApp con la foto del empaque."
          className={inputClass}
        />
      </Field>
      <p className="mt-2 text-xs text-stone-400">Se muestra en «Garantía y asistencia» de la ficha. Déjalo vacío si el producto no tiene garantía propia.</p>
    </Card>
  );
}

export function VisualContentSection({ value, onUpdate }: PageContentProps): React.ReactNode {
  return (
    <Card id="producto-contenido-visual" title="Contenido visual (Descripción del producto)">
      <p className="mb-4 text-sm text-stone-500">
        Bloques con imágenes diseñadas que se muestran en «Descripción del producto». Los bloques de la marca (se editan en Marcas) aparecen después de
        estos, como contenido «Desde la marca».
      </p>
      <ContentBlocksEditor
        blocks={value.contentBlocks}
        onUpdate={(update) => onUpdate((current) => ({ ...current, contentBlocks: update(current.contentBlocks) }))}
        emptyMessage="Sin bloques. Agrega imágenes de beneficios, modo de uso o comparativas para enriquecer la ficha."
      />
    </Card>
  );
}
