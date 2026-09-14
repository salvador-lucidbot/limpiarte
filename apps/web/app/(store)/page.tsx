import Link from "next/link";
import {
  IconArrowRight,
  IconBuilding,
  IconCalendar,
  IconChevronRight,
  IconCreditCard,
  IconDroplets,
  IconExternalLink,
  IconGrid,
  IconHomeHeart,
  IconPackage,
  IconShieldCheck,
  IconSparkles,
  IconTag,
  IconTruck
} from "../../components/icons";
import { BrandsMarquee } from "../../components/store/brands-marquee";
import { BuyAgainRow } from "../../components/store/buy-again-row";
import { ProductCardView } from "../../components/store/product-card-view";
import { apiFetch } from "../../lib/api/client";
import { BannerView, CategoryNode, ProductCard } from "../../lib/api/types";
import { formatCOP } from "../../lib/format";
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

function CategoryIcon({ slug }: { slug: string }): React.ReactNode {
  const Component = CATEGORY_ICONS[slug] ?? IconGrid;
  return <Component size={26} />;
}

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

function HeroProductCard({ product, className }: { product: ProductCard; className?: string }): React.ReactNode {
  return (
    <Link
      href={`/producto/${product.slug}`}
      className={`flex w-64 items-center gap-3 rounded-xl bg-white p-3 shadow-xl shadow-navy-900/20 transition hover:-translate-y-0.5 ${className ?? ""}`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-400">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="h-full w-full rounded-lg object-cover" />
        ) : (
          <IconDroplets size={28} strokeWidth={1.4} />
        )}
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-xs leading-snug text-slate-600">{product.name}</span>
        <span className="mt-1 block text-base font-semibold text-navy-900">{formatCOP(product.price)}</span>
      </span>
    </Link>
  );
}

export default async function HomePage(): Promise<React.ReactNode> {
  const [banners, categories, featured, promos, brands] = await Promise.all([
    safeFetch<BannerView[]>("/content/banners", []),
    safeFetch<CategoryNode[]>("/catalog/categories", []),
    safeFetch<ProductCard[]>("/catalog/products/featured", []),
    safeFetch<ProductCard[]>("/catalog/products/promos", []),
    safeFetch<BrandEntry[]>("/catalog/brands", [])
  ]);

  const heroBanner = banners.find((banner) => banner.section === "HOME_HERO");
  const promoBanners = banners.filter((banner) => banner.section === "HOME_PROMO");
  const heroShowcase = featured.slice(0, 2);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <section className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400">
        {heroBanner?.imageUrl && (
          <img src={heroBanner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        )}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-white/10" />

        <div className="relative grid items-center gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[1.2fr_1fr] lg:py-16">
          <div className="animate-rise">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              <IconSparkles size={14} />
              Tienda oficial Limpiarte
            </p>
            <h1 className="max-w-xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.6rem]">
              {heroBanner?.title ?? "Los productos de aseo que usan los profesionales, en tu casa"}
            </h1>
            <p className="mt-3 max-w-lg text-base text-white/85">
              {heroBanner?.subtitle ??
                "Desinfectantes, detergentes e implementos de grado profesional con entrega a domicilio y pago 100% en línea."}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={heroBanner?.linkUrl ?? "/tienda"}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 font-semibold text-brand-700 shadow-md transition hover:bg-brand-50"
              >
                {heroBanner?.buttonText ?? "Explorar el catálogo"}
                <IconArrowRight size={17} />
              </Link>
              <Link
                href="/tienda?onPromo=true"
                className="inline-flex items-center gap-2 rounded-lg border border-white/50 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                <IconTag size={17} />
                <span className="text-shine">Ver ofertas</span>
              </Link>
            </div>
          </div>

          {heroShowcase.length > 0 && (
            <div className="animate-rise-delay relative hidden h-64 lg:block">
              {heroShowcase[0] && <HeroProductCard product={heroShowcase[0]} className="absolute right-24 top-2 -rotate-2" />}
              {heroShowcase[1] && <HeroProductCard product={heroShowcase[1]} className="absolute -bottom-2 right-0 rotate-1" />}
              <span className="absolute left-4 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/70">
                <IconDroplets size={46} strokeWidth={1.2} />
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="relative z-10 -mt-7 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
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

      {categories.length > 0 && (
        <section className="mt-12">
          <SectionHeader title="Compra por categoría" href="/tienda" linkLabel="Ver todas" />
          <div className="group/cats relative">
            <span className="pointer-events-none fixed inset-0 z-30 bg-navy-900/45 opacity-0 transition-opacity duration-300 group-hover/cats:opacity-100" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {categories.slice(0, 7).map((category) => (
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
  );
}
