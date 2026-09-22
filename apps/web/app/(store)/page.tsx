import Link from "next/link";
import {
  IconArrowRight,
  IconBoxes,
  IconBuilding,
  IconCalendar,
  IconCar,
  IconCart,
  IconCheckCircle,
  IconDroplets,
  IconExternalLink,
  IconGlove,
  IconGrid,
  IconHomeHeart,
  IconMapPin,
  IconPackage,
  IconPaperRoll,
  IconRefresh,
  IconSearch,
  IconSparkles,
  IconSprayBottle,
  IconStore,
  IconTag,
  IconTruck
} from "../../components/icons";
import { HeroSearch } from "../../components/store/hero-search";
import { ProductCardView } from "../../components/store/product-card-view";
import { apiFetch } from "../../lib/api/client";
import { BannerView, CatalogListing, CategoryNode, ProductCard, StorefrontStats } from "../../lib/api/types";
import { formatNumber } from "../../lib/format";

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetch<T>(path, { revalidate: 120 });
  } catch {
    return fallback;
  }
}

const EMPTY_LISTING: CatalogListing = {
  data: [],
  meta: { page: 1, perPage: 1, total: 0, totalPages: 1 },
  facets: { categories: [], brands: [], priceRanges: [], promoCount: 0, inStockCount: 0 }
};

const CATEGORY_ICONS: Record<string, (props: { size?: number; className?: string }) => React.ReactNode> = {
  ambientadores: IconSparkles,
  banos: IconDroplets,
  cocina: IconHomeHeart,
  "cuidado-personal": IconHomeHeart,
  desinfectantes: IconSprayBottle,
  implementos: IconPackage,
  lavanderia: IconRefresh,
  "limpieza-general": IconSparkles,
  "linea-automotriz": IconCar,
  "linea-institucional": IconBuilding,
  "papel-desechables": IconPaperRoll,
  pisos: IconBoxes,
  proteccion: IconGlove,
  "proteccion-personal": IconGlove,
  "ropa-lavanderia": IconRefresh
};

function CategoryIcon({ slug, size = 26 }: { slug: string; size?: number }): React.ReactNode {
  const Component = CATEGORY_ICONS[slug] ?? IconGrid;
  return <Component size={size} />;
}

const EMPTY_STATS: StorefrontStats = {
  products: 0,
  categories: 0,
  brands: 0,
  unitsInStock: 0,
  ordersDelivered: 0,
  customers: 0,
  cities: 0
};

/**
 * Cifras de la portada, en orden de importancia comercial.
 * `setting` fija el texto desde el Superadmin (Configuración › Cifras de la portada), admite
 * cualquier formato: "1071+". Si el ajuste está vacío se usa el número real del catálogo, y
 * si ese número es cero la baldosa no se pinta.
 */
const STAT_TILES: { id: string; setting: string; real: keyof StorefrontStats; label: string; short: string }[] = [
  { id: "products", setting: "home.stats.products", real: "products", label: "Productos en catálogo", short: "Productos" },
  { id: "customers", setting: "home.stats.customers", real: "customers", label: "Usuarios registrados", short: "Usuarios" },
  { id: "shipments", setting: "home.stats.shipments", real: "ordersDelivered", label: "Envíos realizados", short: "Envíos" },
  { id: "cities", setting: "home.stats.cities", real: "cities", label: "Ciudades con cobertura", short: "Ciudades" },
  { id: "units", setting: "home.stats.units", real: "unitsInStock", label: "Unidades disponibles", short: "Unidades" }
];

const HERO_PROMISES = ["Pago 100% en línea", "Envío a domicilio", "Calidad profesional"];

const SUGGESTIONS = ["Desinfectante", "Detergente", "Ambientador", "Guantes"];

const STEPS = [
  {
    icon: IconSearch,
    title: "Explora el catálogo",
    text: "Filtra por categoría, marca o precio y compara la línea profesional que usamos en nuestros servicios."
  },
  {
    icon: IconCart,
    title: "Arma tu carrito y paga",
    text: "Agrega lo que necesites, aplica tu cupón y paga en línea con tarjeta débito o crédito de forma segura."
  },
  {
    icon: IconTruck,
    title: "Recíbelo en tu puerta",
    text: "Despachamos a tu ciudad y sigues el estado de tu pedido desde tu cuenta hasta que llega."
  }
];

export default async function HomePage(): Promise<React.ReactNode> {
  const [banners, categories, featured, promos, catalog, newest, storeStats, publicSettings] = await Promise.all([
    safeFetch<BannerView[]>("/content/banners", []),
    safeFetch<CategoryNode[]>("/catalog/categories", []),
    safeFetch<ProductCard[]>("/catalog/products/featured", []),
    safeFetch<ProductCard[]>("/catalog/products/promos", []),
    safeFetch<CatalogListing>("/catalog/products?perPage=1", EMPTY_LISTING),
    safeFetch<CatalogListing>("/catalog/products?sort=newest&perPage=8", EMPTY_LISTING),
    safeFetch<StorefrontStats>("/catalog/stats", EMPTY_STATS),
    safeFetch<Record<string, unknown>>("/settings/public", {})
  ]);

  // Solo se navegan las categorías que hoy tienen productos; el resto llevaría a un listado vacío.
  const stocked = new Set(catalog.facets.categories.map((option) => option.slug));
  const visibleCategories = categories.filter((category) => stocked.has(category.slug));

  // Si aún no hay productos marcados como destacados, la vitrina muestra las novedades.
  const showcase = featured.length > 0 ? featured : newest.data;
  const showcaseTitle = featured.length > 0 ? "Destacados de la semana" : "Novedades del catálogo";
  const showcaseSubtitle =
    featured.length > 0 ? "Los productos que más piden nuestros clientes" : "Lo último que entró a la tienda";

  const heroBanner = banners.find((banner) => banner.section === "HOME_HERO");
  const promoBanners = banners.filter((banner) => banner.section === "HOME_PROMO");

  const stats = STAT_TILES.map((tile) => {
    const configured = publicSettings[tile.setting];
    const override = typeof configured === "string" ? configured.trim() : "";
    const real = storeStats[tile.real];
    return { ...tile, display: override !== "" ? override : real > 0 ? formatNumber(real) : "" };
  }).filter((stat) => stat.display !== "");

  const heroSubtitle =
    heroBanner?.subtitle ??
    "Desinfectantes, detergentes e implementos de grado profesional, con entrega a domicilio y pago 100% en línea.";

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden md:flex md:min-h-[640px] md:items-center md:py-20">
        <div className="absolute inset-0 z-0">
          {heroBanner?.imageUrl ? (
            <img src={heroBanner.imageUrl} alt="" className="h-full w-full object-cover object-center" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-600 via-brand-700 to-navy-900" />
          )}
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              background:
                "linear-gradient(to right, rgba(14,47,70,0.30) 0%, rgba(14,47,70,0.78) 30%, rgba(14,47,70,0.80) 70%, rgba(14,47,70,0.30) 100%)"
            }}
          />
          <div className="absolute inset-0 bg-navy-900/90 md:hidden" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-white/5" />
        </div>

        {/* Móvil */}
        <div className="relative z-10 flex min-h-[85vh] flex-col px-5 pb-10 pt-10 md:hidden">
          <span className="mb-5 inline-flex items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-accent backdrop-blur-[2px]">
            <IconSparkles size={14} />
            Tienda oficial Limpiarte
          </span>

          <h1 className="mb-3 text-[2.4rem] font-bold leading-[1.15] text-white">
            <span className="mr-2 inline-block rounded-lg bg-primary px-2.5 py-0.5">Limpia</span>
            como los <span className="text-accent">profesionales</span>
          </h1>
          <p className="mb-4 text-sm leading-relaxed text-white/70">{heroSubtitle}</p>

          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {HERO_PROMISES.map((promise) => (
              <span key={promise} className="flex items-center gap-1.5 text-xs font-semibold text-white/85">
                <IconCheckCircle size={14} className="text-accent" />
                {promise}
              </span>
            ))}
          </div>

          {stats.length > 0 && (
            <div className="mb-6 flex overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-[2px]">
              {stats.slice(0, 3).map((stat, index, shown) => (
                <div key={stat.id} className={`flex-1 py-3.5 text-center ${index < shown.length - 1 ? "border-r border-white/15" : ""}`}>
                  <p className="text-2xl font-extrabold leading-none tracking-tight text-accent">{stat.display}</p>
                  <p className="mt-1 text-[10px] font-medium text-white/60">{stat.short}</p>
                </div>
              ))}
            </div>
          )}

          {visibleCategories.length > 0 && (
            <>
              <p className="mb-3 text-sm font-bold text-white/75">¿Qué necesitas hoy?</p>
              <div className="mb-6 grid grid-cols-3 gap-2">
                {visibleCategories.slice(0, 5).map((category) => (
                  <Link
                    key={category.id}
                    href={`/tienda?category=${category.slug}`}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/80 bg-white px-1 py-3.5 transition-all active:scale-95"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CategoryIcon slug={category.slug} size={19} />
                    </span>
                    <span className="mt-0.5 text-center text-[11px] font-bold leading-tight text-primary">{category.name}</span>
                  </Link>
                ))}
                <Link
                  href="/tienda"
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-primary/40 bg-primary/30 px-1 py-3.5 backdrop-blur-[2px] transition-all active:scale-95"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/60 text-white">
                    <IconStore size={19} />
                  </span>
                  <span className="mt-0.5 text-center text-[11px] font-bold leading-tight text-white">Ver todo</span>
                </Link>
              </div>
            </>
          )}

          <div className="mt-auto flex flex-col gap-3">
            <Link
              href={heroBanner?.linkUrl ?? "/tienda"}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-white shadow-xl transition-transform active:scale-[0.98]"
            >
              <IconStore size={20} />
              {heroBanner?.buttonText ?? "Ver el catálogo"}
            </Link>
            <div className="flex gap-3">
              <Link
                href="/tienda?onPromo=true"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-accent px-4 py-3.5 text-sm font-bold text-navy-900"
                style={{ boxShadow: "0 0 18px 4px rgba(127, 216, 247, 0.45)" }}
              >
                <IconTag size={16} />
                Ver ofertas
              </Link>
              <Link
                href="/servicios"
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm font-bold text-white backdrop-blur-[2px] transition-transform active:scale-[0.98]"
              >
                <IconHomeHeart size={16} />
                Servicios
              </Link>
            </div>
          </div>
        </div>

        {/* Escritorio */}
        <div className="relative z-10 mx-auto hidden w-full max-w-7xl px-4 sm:px-6 md:block lg:px-8">
          <div className="mb-12 text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-accent backdrop-blur">
              <IconSparkles size={16} />
              Tienda oficial Limpiarte
            </span>
            <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl md:text-[3.4rem]">
              {heroBanner?.title ? (
                heroBanner.title
              ) : (
                <>
                  <span className="text-accent">Limpiarte</span>, la tienda del
                  <br className="hidden sm:block" /> aseo profesional
                </>
              )}
            </h1>
            <p className="mx-auto max-w-2xl text-base font-medium text-white/85 drop-shadow-md sm:text-xl">{heroSubtitle}</p>
          </div>

          <HeroSearch suggestions={SUGGESTIONS} />

          <div className="mt-5 flex justify-center">
            <span
              className="inline-flex items-center gap-3 rounded-full border border-accent/50 bg-accent/20 px-6 py-3 font-bold backdrop-blur"
              style={{ boxShadow: "0 0 24px rgba(127, 216, 247, 0.35)" }}
            >
              <IconTruck size={22} className="text-accent drop-shadow" />
              <span className="text-sm tracking-wide text-white">Envío gratis desde el monto mínimo de tu zona</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Cifras ────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <section className="hidden bg-navy-900 py-14 md:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
              {stats.slice(0, 4).map((stat, index, shown) => (
                <div
                  key={stat.id}
                  className={`px-4 text-center ${index < shown.length - 1 ? "lg:border-r lg:border-white/10" : ""}`}
                >
                  <p className="text-5xl font-extrabold leading-none tracking-tight text-accent lg:text-6xl">{stat.display}</p>
                  <p className="mt-3 text-sm font-medium text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Categorías ────────────────────────────────────────── */}
      {visibleCategories.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <h2 className="section-title">Explora por categoría</h2>
              <p className="section-subtitle">Todo el aseo de tu hogar y tu empresa en un solo lugar</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {visibleCategories.slice(0, 10).map((category) => (
                <Link key={category.id} href={`/tienda?category=${category.slug}`} className="category-card group">
                  <span className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-500 transition-colors duration-200 group-hover:bg-brand-500 group-hover:text-white">
                    {category.bannerUrl ? (
                      <img src={category.bannerUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CategoryIcon slug={category.slug} size={30} />
                    )}
                  </span>
                  <span className="font-bold text-ink transition-colors group-hover:text-brand-700">{category.name}</span>
                  {category.description && <span className="mt-1 line-clamp-2 text-xs text-slate-500">{category.description}</span>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Destacados ────────────────────────────────────────── */}
      {showcase.length > 0 && (
        <section className="bg-surface py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="section-title">{showcaseTitle}</h2>
                <p className="section-subtitle">{showcaseSubtitle}</p>
              </div>
              <Link href="/tienda" className="btn-ghost shrink-0 text-sm">
                Ver todo el catálogo
                <IconArrowRight size={17} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {showcase.slice(0, 8).map((product) => (
                <ProductCardView key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Ofertas ───────────────────────────────────────────── */}
      {promos.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <span className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-emerald-600">
                  <IconTag size={15} />
                  Precios rebajados
                </span>
                <h2 className="section-title">Ofertas vigentes</h2>
                <p className="section-subtitle">Promociones con fecha de vencimiento, mientras haya inventario</p>
              </div>
              <Link href="/tienda?onPromo=true" className="btn-ghost shrink-0 text-sm">
                Ver todas las ofertas
                <IconArrowRight size={17} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {promos.slice(0, 4).map((product) => (
                <ProductCardView key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Cómo funciona ─────────────────────────────────────── */}
      <section className="bg-surface py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="section-title">¿Cómo funciona?</h2>
            <p className="section-subtitle mx-auto max-w-xl">En tres pasos recibes en casa la misma línea que usan nuestros equipos</p>
          </div>
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="absolute left-[16.6%] right-[16.6%] top-16 hidden h-0.5 bg-primary/20 md:block" />
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative z-10 flex flex-col items-center text-center">
                <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white shadow-primary">
                  {index + 1}
                </span>
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon size={26} />
                </span>
                <h3 className="mb-3 text-lg font-bold text-ink">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Banners de campaña ────────────────────────────────── */}
      {promoBanners.length > 0 && promoBanners[0]?.imageUrl && (
        <section className="bg-white py-12">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            {promoBanners.slice(0, 2).map((banner) => (
              <Link key={banner.id} href={banner.linkUrl ?? "/tienda"} className="group relative block overflow-hidden rounded-2xl shadow-card">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-navy-900/85 to-transparent p-6">
                  <p className="text-lg font-bold text-white">{banner.title}</p>
                  {banner.subtitle && <p className="text-sm text-white/80">{banner.subtitle}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Servicios de aseo ─────────────────────────────────── */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex flex-col overflow-hidden rounded-3xl bg-navy-900 shadow-2xl md:block">
            <div className="pointer-events-none absolute bottom-0 left-1/2 right-0 top-0 hidden md:block">
              <div className="h-full w-full bg-gradient-to-br from-brand-600 to-navy-800" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, #0e2f46 0%, rgba(14,47,70,0.75) 18%, rgba(14,47,70,0.25) 45%, transparent 65%)"
                }}
              />
            </div>

            <div className="pointer-events-none absolute right-10 top-1/2 hidden w-[38%] -translate-y-1/2 grid-cols-3 gap-3 lg:grid">
              {[
                { icon: IconHomeHeart, label: "Hogares" },
                { icon: IconBuilding, label: "Empresas" },
                { icon: IconCalendar, label: "Planes mensuales" }
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2.5 rounded-xl border border-white/10 bg-white/10 px-3 py-6 text-center backdrop-blur-sm"
                >
                  <span className="text-brand-300">
                    <item.icon size={30} />
                  </span>
                  <span className="text-sm font-medium text-slate-100">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="relative z-10 flex flex-col justify-center p-10 md:w-1/2 md:p-12">
              <span className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent">
                <IconMapPin size={15} />
                Más que productos
              </span>
              <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">¿Prefieres que limpiemos por ti?</h2>
              <p className="mb-8 text-slate-300">
                Nuestro equipo de profesionales atiende hogares y empresas con servicios de aseo por horas y planes mensuales en todo el
                país.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/servicios" className="btn-primary self-start">
                  Conocer los servicios
                  <IconArrowRight size={17} />
                </Link>
                <a
                  href="https://limpiarteenhoras.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-white/25 px-6 py-3 font-bold text-white transition hover:bg-white/10"
                >
                  Agendar ahora
                  <IconExternalLink size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
