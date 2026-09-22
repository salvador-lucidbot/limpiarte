import Link from "next/link";
import {
  IconArrowRight,
  IconBuilding,
  IconCalendar,
  IconCheckCircle,
  IconChevronRight,
  IconCreditCard,
  IconDroplets,
  IconExternalLink,
  IconGrid,
  IconHomeHeart,
  IconPackage,
  IconShieldCheck,
  IconSparkles,
  IconStore,
  IconTag,
  IconTruck
} from "../../components/icons";
import { BrandsMarquee } from "../../components/store/brands-marquee";
import { BuyAgainRow } from "../../components/store/buy-again-row";
import { HeroSearch } from "../../components/store/hero-search";
import { ProductCardView } from "../../components/store/product-card-view";
import { apiFetch } from "../../lib/api/client";
import { BannerView, CatalogListing, CategoryNode, ProductCard, StorefrontStats } from "../../lib/api/types";
import { formatCOP, formatNumber } from "../../lib/format";
import { LogoMark } from "../../components/logo";

interface BrandEntry {
  id: string;
  name: string;
}

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetch<T>(path, { revalidate: 120 });
  } catch {
    return fallback;
  }
}

const CATEGORY_ICONS: Record<string, (props: { size?: number; className?: string }) => React.ReactNode> = {
  desinfectantes: IconShieldCheck,
  "limpieza-general": IconSparkles,
  lavanderia: IconDroplets,
  ambientadores: IconHomeHeart,
  "cuidado-personal": IconHomeHeart,
  implementos: IconPackage,
  proteccion: IconShieldCheck
};

function CategoryIcon({ slug, size = 26 }: { slug: string; size?: number }): React.ReactNode {
  const Component = CATEGORY_ICONS[slug] ?? IconGrid;
  return <Component size={size} />;
}

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

const EMPTY_LISTING: CatalogListing = {
  data: [],
  meta: { page: 1, perPage: 1, total: 0, totalPages: 1 },
  facets: { categories: [], brands: [], priceRanges: [], promoCount: 0, inStockCount: 0 }
};

const EMPTY_STATS: StorefrontStats = {
  products: 0,
  categories: 0,
  brands: 0,
  unitsInStock: 0,
  ordersDelivered: 0,
  customers: 0,
  cities: 0
};

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }): React.ReactNode {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="text-xl font-semibold text-navy-900 sm:text-2xl">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:text-brand-700">
        {linkLabel}
        <IconChevronRight size={15} />
      </Link>
    </div>
  );
}

export default async function HomePage(): Promise<React.ReactNode> {
  const [banners, categories, featured, promos, brands, catalog, storeStats, publicSettings] = await Promise.all([
    safeFetch<BannerView[]>("/content/banners", []),
    safeFetch<CategoryNode[]>("/catalog/categories", []),
    safeFetch<ProductCard[]>("/catalog/products/featured", []),
    safeFetch<ProductCard[]>("/catalog/products/promos", []),
    safeFetch<BrandEntry[]>("/catalog/brands", []),
    safeFetch<CatalogListing>("/catalog/products?perPage=1", EMPTY_LISTING),
    safeFetch<StorefrontStats>("/catalog/stats", EMPTY_STATS),
    safeFetch<Record<string, unknown>>("/settings/public", {})
  ]);

  const heroBanner = banners.find((banner) => banner.section === "HOME_HERO");
  const promoBanners = banners.filter((banner) => banner.section === "HOME_PROMO");

  // Solo se navegan las categorías que hoy tienen productos; el resto llevaría a un listado vacío.
  const stocked = new Set(catalog.facets.categories.map((option) => option.slug));
  const visibleCategories = categories.filter((category) => stocked.has(category.slug));

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

      <div className="mx-auto max-w-7xl px-4 pb-16">
      <section className="relative z-10 mt-8 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: IconTruck, title: "Envío a domicilio", text: "Y gratis desde el monto mínimo de tu zona" },
          { icon: IconCreditCard, title: "Pago seguro en línea", text: "Tarjetas débito y crédito" },
          { icon: IconShieldCheck, title: "Calidad profesional", text: "La línea que usamos en nuestros servicios" },
          { icon: IconPackage, title: "Compra fácil", text: "Sigue tu pedido desde tu cuenta" }
        ].map((item) => (
          <div key={item.title} className="flex items-center gap-3.5 bg-white px-5 py-4">
            <span className="shrink-0 text-brand-500">
              <item.icon size={26} />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.text}</p>
            </div>
          </div>
        ))}
      </section>

      <BuyAgainRow />

      {visibleCategories.length > 0 && (
        <section className="mt-12">
          <SectionHeader title="Compra por categoría" href="/tienda" linkLabel="Ver todas" />
          <div className="group/cats relative">
            <span className="pointer-events-none fixed inset-0 z-30 bg-navy-900/45 opacity-0 transition-opacity duration-300 group-hover/cats:opacity-100" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {visibleCategories.slice(0, 7).map((category) => (
                <Link
                  key={category.id}
                  href={`/tienda?category=${category.slug}`}
                  className="group/tile relative z-0 flex flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center transition-all duration-300 ease-out hover:z-[35] hover:-translate-y-1.5"
                >
                  <span className="relative block aspect-square w-full">
                    <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(41,171,226,0.55),transparent_68%)] opacity-0 blur-2xl transition-opacity duration-300 group-hover/tile:opacity-100" />
                    {category.bannerUrl ? (
                      <img
                        src={category.bannerUrl}
                        alt=""
                        loading="lazy"
                        className="relative h-full w-full object-contain drop-shadow-none transition-transform duration-500 ease-out group-hover/tile:scale-110 group-hover/tile:drop-shadow-[0_12px_24px_rgba(14,47,70,0.35)]"
                      />
                    ) : (
                      <span className="relative flex h-full w-full items-center justify-center text-brand-300 transition-transform duration-500 ease-out group-hover/tile:scale-110">
                        <CategoryIcon slug={category.slug} />
                      </span>
                    )}
                  </span>
                  <span className="rounded-full px-3 py-1 text-sm font-semibold leading-tight tracking-tight text-navy-900 transition-all duration-300 group-hover/tile:bg-brand-500 group-hover/tile:text-white group-hover/tile:shadow-lg group-hover/tile:shadow-brand-500/40">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mt-12">
          <SectionHeader title="Destacados" href="/tienda" linkLabel="Ver todos" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {featured.slice(0, 4).map((product) => (
              <ProductCardView key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {promos.length > 0 && (
        <section className="mt-12">
          <SectionHeader title="Ofertas de la semana" href="/tienda?onPromo=true" linkLabel="Ver todas" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {promos.slice(0, 4).map((product) => (
              <ProductCardView key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {promoBanners.length > 0 && promoBanners[0]?.imageUrl && (
        <section className="mt-12 grid gap-4 md:grid-cols-2">
          {promoBanners.slice(0, 2).map((banner) => (
            <Link key={banner.id} href={banner.linkUrl ?? "/tienda"} className="group relative block overflow-hidden rounded-xl">
              <img src={banner.imageUrl} alt={banner.title} className="h-52 w-full object-cover transition duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-navy-900/80 to-transparent p-6">
                <p className="text-lg font-bold text-white">{banner.title}</p>
                {banner.subtitle && <p className="text-sm text-white/80">{banner.subtitle}</p>}
              </div>
            </Link>
          ))}
        </section>
      )}

      <BrandsMarquee brands={brands} />

      <section className="relative mt-14 overflow-hidden rounded-2xl bg-navy-900">
        <img
          src="/casa-limpiarte.webp"
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[58%] object-cover lg:block"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0e2f46 0%, #0e2f46 46%, rgba(14,47,70,0.86) 66%, rgba(14,47,70,0.62) 100%)"
          }}
        />
        <div className="relative grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-400">Más que productos</p>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">¿Prefieres que limpiemos por ti?</h2>
            <p className="mt-3 max-w-lg text-slate-300">
              Nuestro equipo de profesionales atiende hogares y empresas con servicios de aseo por horas y planes mensuales en todo el
              país.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/servicios"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition hover:bg-brand-600"
              >
                Conocer los servicios
                <IconArrowRight size={16} />
              </Link>
              <a
                href="https://limpiarteenhoras.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Agendar ahora
                <IconExternalLink size={15} />
              </a>
            </div>
          </div>
          <div className="relative hidden self-end justify-center lg:-mb-10 lg:flex">
            <span className="pointer-events-none absolute inset-x-0 top-2 flex -translate-x-[290px] -translate-y-5 justify-center opacity-[0.12]">
              <LogoMark variant="white" height={300} />
            </span>
            <span className="pointer-events-none absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-brand-500/25 blur-3xl" />
            <span className="relative block w-full max-w-sm">
              <img
                src="/equipo-limpiarte.webp"
                alt="Equipo de profesionales de Limpiarte"
                loading="lazy"
                className="w-full object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,0.45)]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-brand-400/35 mix-blend-color"
                style={{
                  maskImage: "url(/equipo-limpiarte.webp)",
                  WebkitMaskImage: "url(/equipo-limpiarte.webp)",
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center"
                }}
              />
            </span>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
