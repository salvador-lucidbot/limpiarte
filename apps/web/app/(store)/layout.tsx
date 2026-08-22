import { apiFetch } from "../../lib/api/client";
import { CategoryNode } from "../../lib/api/types";
import { CustomerAuthProvider } from "../../lib/auth/customer-auth-context";
import { CartProvider } from "../../lib/cart/cart-context";
import { StoreFooter } from "../../components/store/store-footer";
import { StoreHeader } from "../../components/store/store-header";

async function loadCategories(): Promise<CategoryNode[]> {
  try {
    return await apiFetch<CategoryNode[]>("/catalog/categories", { revalidate: 300 });
  } catch {
    return [];
  }
}

async function loadStoreName(): Promise<string> {
  try {
    const settings = await apiFetch<Record<string, unknown>>("/settings/public", { revalidate: 300 });
    const name = settings["store.name"];
    return typeof name === "string" && name.length > 0 ? name : "Limpiarte";
  } catch {
    return "Limpiarte";
  }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }): Promise<React.ReactNode> {
  const [categories, storeName] = await Promise.all([loadCategories(), loadStoreName()]);

  return (
    <CustomerAuthProvider>
      <CartProvider>
        <StoreHeader categories={categories} storeName={storeName} />
        <main className="min-h-[70vh]">{children}</main>
        <StoreFooter storeName={storeName} />
      </CartProvider>
    </CustomerAuthProvider>
  );
}
