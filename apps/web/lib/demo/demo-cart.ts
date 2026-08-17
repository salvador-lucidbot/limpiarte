import { CartItemView, CartView } from "../api/types";
import { demoProductCards, demoProductDetail } from "./demo-catalog";

const DEMO_CART_KEY = "limpiarte_demo_cart";

interface StoredItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
}

function readStored(): StoredItem[] {
  const raw = window.localStorage.getItem(DEMO_CART_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredItem[];
  } catch {
    return [];
  }
}

function writeStored(items: StoredItem[]): void {
  window.localStorage.setItem(DEMO_CART_KEY, JSON.stringify(items));
}

function resolveItem(stored: StoredItem): CartItemView | null {
  const card = demoProductCards().find((product) => product.id === stored.productId);
  if (!card) return null;

  const detail = demoProductDetail(card.slug);
  const variant = stored.variantId ? detail?.variants.find((entry) => entry.id === stored.variantId) : undefined;
  const unitPrice = variant ? variant.price : card.price;
  const availableStock = variant ? variant.stock : (detail?.stock ?? 10);

  return {
    id: stored.id,
    productId: stored.productId,
    variantId: stored.variantId,
    slug: card.slug,
    name: card.name,
    variantLabel: variant?.label ?? null,
    imageUrl: card.imageUrl,
    unitPrice,
    compareAtPrice: variant ? variant.compareAtPrice : card.compareAtPrice,
    quantity: stored.quantity,
    lineTotal: unitPrice * stored.quantity,
    availableStock,
    allowBackorder: false
  };
}

function buildView(): CartView {
  const items = readStored()
    .map(resolveItem)
    .filter((item): item is CartItemView => item !== null);

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    id: "demo-cart",
    sessionToken: "demo-cart",
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    discountTotal: 0,
    taxIncluded: 0,
    total: subtotal,
    coupon: null,
    couponError: null,
    shipping: null
  };
}

export function demoCartView(): CartView {
  return buildView();
}

export function demoCartAddItem(productId: string, variantId: string | null, quantity: number): CartView {
  const stored = readStored();
  const existing = stored.find((item) => item.productId === productId && item.variantId === variantId);

  if (existing) existing.quantity += quantity;
  if (!existing) {
    stored.push({ id: `demo-item-${Date.now()}`, productId, variantId, quantity });
  }

  writeStored(stored);
  return buildView();
}

export function demoCartUpdateItem(itemId: string, quantity: number): CartView {
  const stored = readStored().map((item) => (item.id === itemId ? { ...item, quantity } : item));
  writeStored(stored);
  return buildView();
}

export function demoCartRemoveItem(itemId: string): CartView {
  writeStored(readStored().filter((item) => item.id !== itemId));
  return buildView();
}
