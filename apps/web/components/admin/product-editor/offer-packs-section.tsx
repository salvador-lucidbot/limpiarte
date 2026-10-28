"use client";

import { Gift, Info, Plus } from "lucide-react";
import { formatCOP } from "../../../lib/format";
import { OfferPackCards } from "../../store/product/offer-pack-cards";
import { ImageUrlField } from "../image-upload";
import { moveByKey, optionalNumber, patchByKey, removeByKey } from "../list-editing";
import { LimitCounter, RowControls } from "../row-controls";
import { Badge, Button, Field, inputClass } from "../ui";
import { EditorCallout, EditorNote, EditorSection, EmptyRows, PreviewFrame, ToggleField } from "./editor-section";
import { emptyOfferPack, OFFER_PACK_LIMITS, offerPackQuantity } from "./product-form-model";
import type { ProductFormOfferPack, ProductFormUpdater, ProductFormValue } from "./product-form-model";
import { PRODUCT_SECTION_ID } from "./product-sections";
import { offerPackToView, storeCoverImageUrl } from "./preview-adapters";

interface OfferPacksSectionProps {
  value: ProductFormValue;
  onUpdate: ProductFormUpdater;
}

function unitPriceText(pack: ProductFormOfferPack): string | null {
  const price = optionalNumber(pack.price);
  if (price === null || price <= 0) return null;
  const quantity = offerPackQuantity(pack);
  if (quantity <= 1) return `Se cobra ${formatCOP(price)} por la unidad.`;
  return `Se cobran ${formatCOP(price)} por las ${quantity} unidades: ${formatCOP(Math.round(price / quantity))} cada una.`;
}

function PackEditor({
  pack,
  index,
  total,
  onUpdate
}: {
  pack: ProductFormOfferPack;
  index: number;
  total: number;
  onUpdate: ProductFormUpdater;
}): React.ReactNode {
  const position = index + 1;
  const label = pack.title.trim() || `el pack ${position}`;
  const unitPrice = unitPriceText(pack);

  function patch(changes: Partial<ProductFormOfferPack>): void {
    onUpdate((current) => ({ ...current, offerPacks: patchByKey(current.offerPacks, pack.key, changes) }));
  }

  return (
    <li className="space-y-4 rounded-2xl border border-ink-200 p-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-brand-900">
          <span aria-hidden="true" className="font-mono text-xs text-brand-700">
            {String(position).padStart(2, "0")}
          </span>
          <span className="min-w-0 truncate">{pack.title.trim() || `Pack ${position}`}</span>
          {pack.isHighlighted && <Badge tone="brand">Recomendado</Badge>}
        </h3>
        <RowControls
          label={label}
          isFirst={index === 0}
          isLast={index === total - 1}
          onMove={(offset) => onUpdate((current) => ({ ...current, offerPacks: moveByKey(current.offerPacks, pack.key, offset) }))}
          onRemove={() => onUpdate((current) => ({ ...current, offerPacks: removeByKey(current.offerPacks, pack.key) }))}
        />
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Antetítulo (opcional)" hint="Texto corto en mayúsculas sobre el título.">
          <input
            value={pack.eyebrow}
            maxLength={OFFER_PACK_LIMITS.eyebrowLength}
            placeholder="Ej.: Más vendido"
            onChange={(event) => patch({ eyebrow: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Título" required>
          <input
            value={pack.title}
            maxLength={OFFER_PACK_LIMITS.titleLength}
            placeholder="Ej.: Para toda la casa durante 3 meses"
            onChange={(event) => patch({ title: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Etiqueta destacada" required hint="Va en la franja de color de la tarjeta.">
          <input
            value={pack.badgeLabel}
            maxLength={OFFER_PACK_LIMITS.badgeLength}
            placeholder="Ej.: Lleva 3 unidades"
            onChange={(event) => patch({ badgeLabel: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Cantidad de unidades" required hint={`Entre 1 y ${OFFER_PACK_LIMITS.quantity}.`}>
          <input
            type="number"
            min={1}
            max={OFFER_PACK_LIMITS.quantity}
            step={1}
            value={pack.quantity}
            onChange={(event) => patch({ quantity: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Precio total del pack (COP)" required hint={unitPrice ?? "Lo que paga el cliente por todas las unidades del pack."}>
          <input
            type="number"
            min={0}
            value={pack.price}
            onChange={(event) => patch({ price: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Precio anterior (tachado)" hint="Opcional. Si es mayor que el precio, la tarjeta muestra el ahorro.">
          <input
            type="number"
            min={0}
            value={pack.compareAtPrice}
            onChange={(event) => patch({ compareAtPrice: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Texto del botón" hint="Si lo dejas vacío dice «Llévalo ahora».">
          <input
            value={pack.ctaLabel}
            maxLength={OFFER_PACK_LIMITS.ctaLength}
            placeholder="Llévalo ahora"
            onChange={(event) => patch({ ctaLabel: event.target.value })}
            className={inputClass}
          />
        </Field>
        <ToggleField
          label="Marcar como recomendado"
          description="Resalta la tarjeta con el sello «Recomendado»."
          checked={pack.isHighlighted}
          onChange={(isHighlighted) => patch({ isHighlighted })}
          className="self-end"
        />
        <div className="sm:col-span-2">
          <ImageUrlField
            label="Imagen del pack"
            value={pack.imageUrl}
            onChange={(imageUrl) => patch({ imageUrl })}
            hint="Cuadrada, con las unidades del pack. Si la dejas vacía se usa la portada del producto."
          />
        </div>
      </div>
    </li>
  );
}

export function OfferPacksSection({ value, onUpdate }: OfferPacksSectionProps): React.ReactNode {
  const limit = OFFER_PACK_LIMITS.packs;
  const limitReached = value.offerPacks.length >= limit;
  const views = value.offerPacks.map(offerPackToView);

  return (
    <EditorSection
      id={PRODUCT_SECTION_ID.offerPacks}
      icon={Gift}
      title="Packs de oferta"
      description="Tarjetas de compra por cantidad (por ejemplo 1, 2 o 3 unidades) que se muestran en la ficha. Hasta 4 packs."
      actions={
        <div className="flex items-center gap-3">
          <LimitCounter current={value.offerPacks.length} max={limit} />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={limitReached}
            onClick={() =>
              onUpdate((current) => (current.offerPacks.length >= limit ? current : { ...current, offerPacks: [...current.offerPacks, emptyOfferPack()] }))
            }
          >
            <Plus size={16} aria-hidden="true" />
            Pack
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <EditorCallout icon={Info}>
          El precio del pack es el <strong>total</strong> que se cobra por esa cantidad de unidades, no el precio de cada una. Si el pack de 3 unidades
          vale {formatCOP(90000)}, escribe 90000: el cliente paga eso en total, no 3 × {formatCOP(90000)}.
        </EditorCallout>

        {value.offerPacks.length === 0 && (
          <EmptyRows icon={Gift}>Sin packs. Agrega uno para ofrecer descuentos por llevar más unidades.</EmptyRows>
        )}

        {value.offerPacks.length > 0 && (
          <ol className="space-y-4">
            {value.offerPacks.map((pack, index) => (
              <PackEditor key={pack.key} pack={pack} index={index} total={value.offerPacks.length} onUpdate={onUpdate} />
            ))}
          </ol>
        )}

        {views.length > 0 && (
          <PreviewFrame title="Vista previa en la tienda">
            <OfferPackCards packs={views} productName={value.name.trim() || "este producto"} fallbackImageUrl={storeCoverImageUrl(value.images)} />
          </PreviewFrame>
        )}

        <EditorNote>Las tarjetas de la vista previa no agregan al carrito. El orden de la lista es el orden en la ficha.</EditorNote>
      </div>
    </EditorSection>
  );
}
