import { BadRequestException, ConflictException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { InventoryReason } from "../../generated/prisma/client";
import type { Prisma } from "../../generated/prisma/client";
import { decimalToNumber, patchText } from "./catalog-content";

export const EDITOR_ADJUSTMENT_NOTE = "Ajuste desde el editor de producto";
export const EDITOR_INITIAL_STOCK_NOTE = "Stock inicial desde el editor de producto";

export interface OptionValueSyncInput {
  id?: string;
  value: string;
  swatchImageUrl?: string | null;
  swatchHex?: string | null;
}

export interface OptionSyncInput {
  id?: string;
  name: string;
  values: OptionValueSyncInput[];
}

export interface VariantSyncInput {
  id?: string;
  optionValues: string[];
  sku?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  stock?: number | null;
  stockBaseline?: number | null;
  imageUrl?: string | null;
  weightKg?: number | null;
  isActive?: boolean | null;
}

export interface ProductVariantsSyncInput {
  options?: OptionSyncInput[];
  variants?: VariantSyncInput[];
}

export interface RemovedVariantSummary {
  id: string;
  label: string;
  sku: string | null;
  stock: number;
  orderItems: number;
  priceListEntries: number;
  cartItems: number;
}

export interface ProductVariantsSyncResult {
  removedVariants: RemovedVariantSummary[];
}

const EXISTING_VARIANT_INCLUDE = {
  optionValues: true,
  _count: { select: { orderItems: true, priceListEntries: true, cartItems: true } }
} satisfies Prisma.ProductVariantInclude;

type ExistingOption = Prisma.ProductOptionGetPayload<{ include: { values: true } }>;
type ExistingValue = ExistingOption["values"][number];
type ExistingVariant = Prisma.ProductVariantGetPayload<{ include: typeof EXISTING_VARIANT_INCLUDE }>;

interface ResolvedOption {
  valueIdByKey: Map<string, string>;
}

interface ResolvedOptions {
  options: ResolvedOption[];
  survivingValueIds: Set<string>;
}

interface PlannedVariant {
  input: VariantSyncInput;
  valueIds: string[];
  comboKey: string;
}

interface IdUpdate<TData> {
  id: string;
  data: TData;
}

interface GroupedUpdate<TData> {
  ids: string[];
  data: TData;
}

interface ValueLabel {
  text: string;
  optionPosition: number;
}

const EMPTY_RESULT: ProductVariantsSyncResult = { removedVariants: [] };

function matchKey(value: string): string {
  return value.trim().toLocaleLowerCase("es");
}

function comboKeyOf(valueIds: string[]): string {
  return [...valueIds].sort().join("|");
}

function assertUnique(keys: string[], message: (duplicate: string) => string): void {
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) throw new BadRequestException(message(key));
    seen.add(key);
  }
}

function groupByData<TData>(updates: IdUpdate<TData>[]): GroupedUpdate<TData>[] {
  const groups = new Map<string, GroupedUpdate<TData>>();
  for (const update of updates) {
    const key = JSON.stringify(update.data);
    const group = groups.get(key);
    if (group) {
      group.ids.push(update.id);
      continue;
    }
    groups.set(key, { ids: [update.id], data: update.data });
  }
  return [...groups.values()];
}

function matchByIdThenKey<TInput extends { id?: string }, TRow extends { id: string }>(
  inputs: TInput[],
  rows: TRow[],
  inputKey: (input: TInput) => string,
  rowKey: (row: TRow) => string
): (TRow | undefined)[] {
  const available = new Map(rows.map((row) => [row.id, row]));
  const matchedById = inputs.map((input) => {
    if (!input.id) return undefined;
    const row = available.get(input.id);
    if (!row) return undefined;
    available.delete(row.id);
    return row;
  });

  const byKey = new Map<string, TRow>();
  for (const row of available.values()) {
    const key = rowKey(row);
    if (!byKey.has(key)) byKey.set(key, row);
  }

  return inputs.map((input, index) => {
    const matched = matchedById[index];
    if (matched) return matched;
    const key = inputKey(input);
    const row = byKey.get(key);
    if (!row) return undefined;
    byKey.delete(key);
    return row;
  });
}

function sameNumber(current: Prisma.Decimal | null, next: number | null): boolean {
  return decimalToNumber(current) === next;
}

function patchHex(value: string | null | undefined): string | null | undefined {
  const text = patchText(value);
  if (typeof text !== "string") return text;
  return text.toLowerCase();
}

function swatchChanges(
  current: ExistingValue,
  input: OptionValueSyncInput
): Pick<Prisma.ProductOptionValueUncheckedUpdateManyInput, "swatchImageUrl" | "swatchHex"> {
  const swatchImageUrl = patchText(input.swatchImageUrl);
  const swatchHex = patchHex(input.swatchHex);
  return {
    ...(swatchImageUrl !== undefined && swatchImageUrl !== current.swatchImageUrl ? { swatchImageUrl } : {}),
    ...(swatchHex !== undefined && swatchHex !== current.swatchHex ? { swatchHex } : {})
  };
}

function variantChanges(current: ExistingVariant, input: VariantSyncInput): Prisma.ProductVariantUncheckedUpdateManyInput {
  const sku = patchText(input.sku);
  const imageUrl = patchText(input.imageUrl);
  return {
    ...(sku !== undefined && sku !== current.sku ? { sku } : {}),
    ...(input.price !== undefined && !sameNumber(current.price, input.price) ? { price: input.price } : {}),
    ...(input.compareAtPrice !== undefined && !sameNumber(current.compareAtPrice, input.compareAtPrice)
      ? { compareAtPrice: input.compareAtPrice }
      : {}),
    ...(imageUrl !== undefined && imageUrl !== current.imageUrl ? { imageUrl } : {}),
    ...(input.weightKg !== undefined && !sameNumber(current.weightKg, input.weightKg) ? { weightKg: input.weightKg } : {}),
    ...(input.isActive !== undefined && input.isActive !== null && input.isActive !== current.isActive
      ? { isActive: input.isActive }
      : {})
  };
}

function stockDelta(current: ExistingVariant, input: VariantSyncInput): number {
  if (input.stock === undefined || input.stock === null) return 0;
  return input.stock - (input.stockBaseline ?? current.stock);
}

function plannedLabel(plan: PlannedVariant): string {
  return plan.input.optionValues.map((text) => text.trim()).join(" / ");
}

function valueLabels(existing: ExistingOption[]): Map<string, ValueLabel> {
  const labels = new Map<string, ValueLabel>();
  for (const option of existing) {
    for (const value of option.values) labels.set(value.id, { text: value.value, optionPosition: option.position });
  }
  return labels;
}

function existingVariantLabel(variant: ExistingVariant, labels: Map<string, ValueLabel>): string {
  const parts = variant.optionValues
    .flatMap((link) => {
      const label = labels.get(link.optionValueId);
      return label ? [label] : [];
    })
    .sort((left, right) => left.optionPosition - right.optionPosition)
    .map((label) => label.text);
  return parts.length > 0 ? parts.join(" / ") : variant.sku ?? variant.id;
}

function resolveExistingOptions(existing: ExistingOption[]): ResolvedOptions {
  const ordered = [...existing].sort((left, right) => left.position - right.position);
  const survivingValueIds = new Set<string>();
  const options = ordered.map((option) => {
    const valueIdByKey = new Map<string, string>();
    for (const value of option.values) {
      valueIdByKey.set(matchKey(value.value), value.id);
      survivingValueIds.add(value.id);
    }
    return { valueIdByKey };
  });
  return { options, survivingValueIds };
}

async function syncOptions(
  tx: Prisma.TransactionClient,
  productId: string,
  existing: ExistingOption[],
  inputs: OptionSyncInput[]
): Promise<ResolvedOptions> {
  assertUnique(
    inputs.map((option) => matchKey(option.name)),
    () => "Hay dos opciones con el mismo nombre"
  );
  for (const option of inputs) {
    if (option.values.length === 0) throw new BadRequestException(`La opción «${option.name.trim()}» no tiene valores`);
    assertUnique(
      option.values.map((value) => matchKey(value.value)),
      () => `La opción «${option.name.trim()}» tiene valores repetidos`
    );
  }

  const matchedOptions = matchByIdThenKey(inputs, existing, (option) => matchKey(option.name), (option) => matchKey(option.name));
  const keptOptionIds = new Set(matchedOptions.flatMap((option) => (option ? [option.id] : [])));
  const removedOptionIds = existing.filter((option) => !keptOptionIds.has(option.id)).map((option) => option.id);

  const optionRowsToCreate: Prisma.ProductOptionCreateManyInput[] = [];
  const valueRowsToCreate: Prisma.ProductOptionValueCreateManyInput[] = [];
  const removedValueIds: string[] = [];
  const optionUpdates: IdUpdate<Prisma.ProductOptionUncheckedUpdateManyInput>[] = [];
  const valueUpdates: IdUpdate<Prisma.ProductOptionValueUncheckedUpdateManyInput>[] = [];
  const survivingValueIds = new Set<string>();

  const options = inputs.map((input, optionIndex): ResolvedOption => {
    const name = input.name.trim();
    const current = matchedOptions[optionIndex];
    const optionId = current?.id ?? randomUUID();

    if (!current) optionRowsToCreate.push({ id: optionId, productId, name, position: optionIndex });
    if (current && (current.name !== name || current.position !== optionIndex)) {
      optionUpdates.push({ id: optionId, data: { name, position: optionIndex } });
    }

    const currentValues = current?.values ?? [];
    const matchedValues = matchByIdThenKey(input.values, currentValues, (value) => matchKey(value.value), (value) => matchKey(value.value));
    const keptValueIds = new Set(matchedValues.flatMap((value) => (value ? [value.id] : [])));
    removedValueIds.push(...currentValues.filter((value) => !keptValueIds.has(value.id)).map((value) => value.id));

    const valueIdByKey = new Map<string, string>();
    input.values.forEach((valueInput, valueIndex) => {
      const text = valueInput.value.trim();
      const currentValue = matchedValues[valueIndex];
      const valueId = currentValue?.id ?? randomUUID();
      valueIdByKey.set(matchKey(text), valueId);
      survivingValueIds.add(valueId);

      if (!currentValue) {
        valueRowsToCreate.push({
          id: valueId,
          optionId,
          value: text,
          position: valueIndex,
          swatchImageUrl: patchText(valueInput.swatchImageUrl) ?? null,
          swatchHex: patchHex(valueInput.swatchHex) ?? null
        });
        return;
      }

      const data: Prisma.ProductOptionValueUncheckedUpdateManyInput = {
        ...(currentValue.value !== text ? { value: text } : {}),
        ...(currentValue.position !== valueIndex ? { position: valueIndex } : {}),
        ...swatchChanges(currentValue, valueInput)
      };
      if (Object.keys(data).length > 0) valueUpdates.push({ id: valueId, data });
    });

    return { valueIdByKey };
  });

  if (removedOptionIds.length > 0) await tx.productOption.deleteMany({ where: { id: { in: removedOptionIds }, productId } });
  if (removedValueIds.length > 0) await tx.productOptionValue.deleteMany({ where: { id: { in: removedValueIds } } });
  if (optionRowsToCreate.length > 0) await tx.productOption.createMany({ data: optionRowsToCreate });
  if (valueRowsToCreate.length > 0) await tx.productOptionValue.createMany({ data: valueRowsToCreate });
  for (const group of groupByData(optionUpdates)) {
    await tx.productOption.updateMany({ where: { id: { in: group.ids }, productId }, data: group.data });
  }
  for (const group of groupByData(valueUpdates)) {
    await tx.productOptionValue.updateMany({ where: { id: { in: group.ids } }, data: group.data });
  }

  return { options, survivingValueIds };
}

function planVariants(resolved: ResolvedOptions, inputs: VariantSyncInput[]): PlannedVariant[] {
  if (inputs.length > 0 && resolved.options.length === 0) {
    throw new BadRequestException("Las variantes necesitan al menos una opción");
  }

  const planned = inputs.map((input): PlannedVariant => {
    const label = input.optionValues.join(" / ");
    if (input.optionValues.length !== resolved.options.length) {
      throw new BadRequestException(`La variante «${label}» debe tener un valor por cada opción`);
    }
    const valueIds = input.optionValues.map((text, index) => {
      const valueId = resolved.options[index]?.valueIdByKey.get(matchKey(text));
      if (!valueId) throw new BadRequestException(`Valor de opción inválido: ${text}`);
      return valueId;
    });
    return { input, valueIds, comboKey: comboKeyOf(valueIds) };
  });

  assertUnique(
    planned.map((variant) => variant.comboKey),
    () => "Hay dos variantes con la misma combinación de opciones"
  );
  assertUnique(
    planned.flatMap((variant) => {
      const sku = patchText(variant.input.sku);
      return sku ? [sku.toLowerCase()] : [];
    }),
    (sku) => `El SKU ${sku} está repetido en las variantes`
  );

  return planned;
}

async function syncVariants(
  tx: Prisma.TransactionClient,
  productId: string,
  existing: ExistingVariant[],
  labels: Map<string, ValueLabel>,
  resolved: ResolvedOptions,
  inputs: VariantSyncInput[],
  actorId: string | null
): Promise<ProductVariantsSyncResult> {
  const planned = planVariants(resolved, inputs);
  const survivingComboKey = (variant: ExistingVariant): string =>
    comboKeyOf(
      variant.optionValues.map((link) => link.optionValueId).filter((valueId) => resolved.survivingValueIds.has(valueId))
    );

  const matched = matchByIdThenKey(planned.map((plan) => ({ id: plan.input.id, plan })), existing, (entry) => entry.plan.comboKey, survivingComboKey);
  const keptVariantIds = new Set(matched.flatMap((variant) => (variant ? [variant.id] : [])));
  const removedVariants = existing.filter((variant) => !keptVariantIds.has(variant.id));

  const updates = planned.flatMap((plan, index) => {
    const current = matched[index];
    if (!current) return [];
    const delta = stockDelta(current, plan.input);
    if (current.stock + delta < 0) {
      throw new ConflictException(
        `El stock de «${plannedLabel(plan)}» cambió mientras editabas (ahora hay ${current.stock} unidades): recarga el producto antes de guardar.`
      );
    }
    const data: Prisma.ProductVariantUncheckedUpdateManyInput = {
      ...variantChanges(current, plan.input),
      ...(delta !== 0 ? { stock: { increment: delta } } : {})
    };
    return [{ current, plan, delta, data }];
  });

  const skuReleases = updates
    .filter((update) => update.data.sku !== undefined && update.current.sku !== null)
    .map((update) => update.current.id);

  const newVariants = planned.flatMap((plan, index) => (matched[index] ? [] : [{ id: randomUUID(), plan }]));

  const claimedSkus = [
    ...updates.flatMap((update) => (typeof update.data.sku === "string" ? [update.data.sku] : [])),
    ...newVariants.flatMap(({ plan }) => {
      const sku = patchText(plan.input.sku);
      return sku ? [sku] : [];
    })
  ];
  if (claimedSkus.length > 0) {
    const taken = await tx.productVariant.findFirst({
      where: { sku: { in: claimedSkus }, productId: { not: productId } },
      select: { sku: true }
    });
    if (taken) throw new ConflictException(`El SKU ${taken.sku ?? ""} ya está en uso en otro producto`);
  }

  if (removedVariants.length > 0) {
    await tx.productVariant.deleteMany({ where: { id: { in: removedVariants.map((variant) => variant.id) }, productId } });
  }
  if (skuReleases.length > 0) await tx.productVariant.updateMany({ where: { id: { in: skuReleases } }, data: { sku: null } });

  const changedVariants = updates.flatMap((update) => (Object.keys(update.data).length > 0 ? [{ id: update.current.id, data: update.data }] : []));
  for (const group of groupByData(changedVariants)) {
    await tx.productVariant.updateMany({ where: { id: { in: group.ids }, productId }, data: group.data });
  }

  const staleLinks: Prisma.VariantOptionValueWhereInput[] = [];
  const linksToCreate: Prisma.VariantOptionValueCreateManyInput[] = [];
  for (const update of updates) {
    const currentValueIds = update.current.optionValues
      .map((link) => link.optionValueId)
      .filter((valueId) => resolved.survivingValueIds.has(valueId));
    const targetValueIds = new Set(update.plan.valueIds);
    const staleValueIds = currentValueIds.filter((valueId) => !targetValueIds.has(valueId));
    const missingValueIds = update.plan.valueIds.filter((valueId) => !currentValueIds.includes(valueId));
    if (staleValueIds.length > 0) staleLinks.push({ variantId: update.current.id, optionValueId: { in: staleValueIds } });
    linksToCreate.push(...missingValueIds.map((optionValueId) => ({ variantId: update.current.id, optionValueId })));
  }
  if (staleLinks.length > 0) await tx.variantOptionValue.deleteMany({ where: { OR: staleLinks } });

  if (newVariants.length > 0) {
    await tx.productVariant.createMany({
      data: newVariants.map(({ id, plan }) => ({
        id,
        productId,
        sku: patchText(plan.input.sku) ?? null,
        price: plan.input.price ?? null,
        compareAtPrice: plan.input.compareAtPrice ?? null,
        stock: plan.input.stock ?? 0,
        imageUrl: patchText(plan.input.imageUrl) ?? null,
        weightKg: plan.input.weightKg ?? null,
        isActive: plan.input.isActive ?? true
      }))
    });
    linksToCreate.push(...newVariants.flatMap(({ id, plan }) => plan.valueIds.map((optionValueId) => ({ variantId: id, optionValueId }))));
  }
  if (linksToCreate.length > 0) await tx.variantOptionValue.createMany({ data: linksToCreate });

  const movements: Prisma.InventoryMovementCreateManyInput[] = [
    ...updates.flatMap((update) =>
      update.delta === 0
        ? []
        : [
            {
              productId,
              variantId: update.current.id,
              quantityDelta: update.delta,
              reason: InventoryReason.ADJUSTMENT,
              note: EDITOR_ADJUSTMENT_NOTE,
              userId: actorId
            }
          ]
    ),
    ...newVariants.flatMap(({ id, plan }) => {
      const stock = plan.input.stock ?? 0;
      if (stock <= 0) return [];
      return [
        {
          productId,
          variantId: id,
          quantityDelta: stock,
          reason: InventoryReason.ADJUSTMENT,
          note: EDITOR_INITIAL_STOCK_NOTE,
          userId: actorId
        }
      ];
    })
  ];
  if (movements.length > 0) await tx.inventoryMovement.createMany({ data: movements });

  return {
    removedVariants: removedVariants.map((variant) => ({
      id: variant.id,
      label: existingVariantLabel(variant, labels),
      sku: variant.sku,
      stock: variant.stock,
      orderItems: variant._count.orderItems,
      priceListEntries: variant._count.priceListEntries,
      cartItems: variant._count.cartItems
    }))
  };
}

export async function syncProductVariants(
  tx: Prisma.TransactionClient,
  productId: string,
  input: ProductVariantsSyncInput,
  actorId: string | null
): Promise<ProductVariantsSyncResult> {
  if (!input.options && !input.variants) return EMPTY_RESULT;
  if (input.options && !input.variants) {
    throw new BadRequestException("Las variantes deben enviarse junto con las opciones");
  }

  const current = await tx.product.findUnique({
    where: { id: productId },
    select: {
      options: { include: { values: true } },
      variants: { include: EXISTING_VARIANT_INCLUDE }
    }
  });
  if (!current) throw new BadRequestException("Producto no encontrado");

  const labels = valueLabels(current.options);
  const resolved = input.options
    ? await syncOptions(tx, productId, current.options, input.options)
    : resolveExistingOptions(current.options);

  return syncVariants(tx, productId, current.variants, labels, resolved, input.variants ?? [], actorId);
}
