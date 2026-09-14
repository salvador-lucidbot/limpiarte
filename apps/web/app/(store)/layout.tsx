import { Suspense } from "react";
import { apiFetch } from "../../lib/api/client";
import { CategoryNode, WelcomePopupSettings } from "../../lib/api/types";
import { CustomerAuthProvider } from "../../lib/auth/customer-auth-context";
import { CartProvider } from "../../lib/cart/cart-context";
import { ToastProvider } from "../../lib/ui/toast-context";
import { WishlistProvider } from "../../lib/wishlist/wishlist-context";
import { BottomNav } from "../../components/store/bottom-nav";
import { CartDrawer } from "../../components/store/cart-drawer";
import { FloatingWhatsApp } from "../../components/store/floating-whatsapp";
import { StoreFooter } from "../../components/store/store-footer";
import { StoreHeader } from "../../components/store/store-header";
import { VisitTracker } from "../../components/store/visit-tracker";
import { WelcomePopup } from "../../components/store/welcome-popup";

interface StoreSettings {
  storeName: string;
  whatsapp: string;
  announcements: string[];
  welcomePopup: WelcomePopupSettings;
}

async function loadCategories(): Promise<CategoryNode[]> {
  try {
    return await apiFetch<CategoryNode[]>("/catalog/categories", { revalidate: 300 });
  } catch {
    return [];
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function loadSettings(): Promise<StoreSettings> {
  const fallback: StoreSettings = { storeName: "Limpiarte", whatsapp: "", announcements: [], welcomePopup: {} };

  try {
    const settings = await apiFetch<Record<string, unknown>>("/settings/public", { revalidate: 300 });

    const announcementsRaw = settings["store.announcements"];
    const announcements = Array.isArray(announcementsRaw)
      ? announcementsRaw.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
      : [];

    const popupRaw = settings["marketing.welcomePopup"];
    const welcomePopup: WelcomePopupSettings =
      popupRaw !== null && typeof popupRaw === "object" ? (popupRaw as WelcomePopupSettings) : {};

    return {
      storeName: asString(settings["store.name"]) || "Limpiarte",
      whatsapp: asString(settings["store.whatsapp"]),
      announcements,
      welcomePopup
    };
  } catch {
    return fallback;
  }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }): Promise<React.ReactNode> {
  const [categories, settings] = await Promise.all([loadCategories(), loadSettings()]);

  return (
    <CustomerAuthProvider>
      <WishlistProvider>
        <ToastProvider>
          <CartProvider>
            <StoreHeader categories={categories} storeName={settings.storeName} announcements={settings.announcements} />
            <main className="min-h-[70vh]">{children}</main>
            <div className="pb-14 lg:pb-0">
              <StoreFooter storeName={settings.storeName} />
            </div>
            <CartDrawer />
            {settings.whatsapp && <FloatingWhatsApp phone={settings.whatsapp} />}
            <WelcomePopup settings={settings.welcomePopup} />
            <BottomNav />
            <Suspense fallback={null}>
              <VisitTracker />
            </Suspense>
          </CartProvider>
        </ToastProvider>
      </WishlistProvider>
    </CustomerAuthProvider>
  );
}
