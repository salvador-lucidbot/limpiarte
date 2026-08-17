import Link from "next/link";
import { ProductCardView } from "../../components/store/product-card-view";
import { apiFetch } from "../../lib/api/client";
import { BannerView, CategoryNode, ProductCard } from "../../lib/api/types";

async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetch<T>(path, { revalidate: 120 });
  } catch {
    return fallback;
  }
}

export default async function HomePage(): Promise<React.ReactNode> {
  const [banners, categories, featured, promos] = await Promise.all([
    safeFetch<BannerView[]>("/content/banners", []),
    safeFetch<CategoryNode[]>("/catalog/categories", []),
    safeFetch<ProductCard[]>("/catalog/products/featured", []),
    safeFetch<ProductCard[]>("/catalog/products/promos", [])
  ]);

  const heroBanner = banners.find((banner) => banner.section === "HOME_HERO");
  const promoBanners = banners.filter((banner) => banner.section === "HOME_PROMO");

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-navy-900 text-white">
        {heroBanner?.imageUrl && (
          <img src={heroBanner.imageUrl} alt={heroBanner.title} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="relative grid gap-6 px-8 py-16 md:px-16 md:py-24">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            {heroBanner?.title ?? "Todo lo que tu limpieza necesita, en un solo lugar"}
          </h1>
          <p className="max-w-xl text-lg text-white/80">
            {heroBanner?.subtitle ?? "Productos de aseo profesional con entrega a domicilio y pago 100% en línea."}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={heroBanner?.linkUrl ?? "/tienda"}
              className="rounded-xl bg-white px-8 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              {heroBanner?.buttonText ?? "Ver catálogo"}
            </Link>
            <Link href="/tienda?onPromo=true" className="rounded-xl border border-white/40 px-8 py-3 font-semibold text-white hover:bg-white/10">
              Promociones
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: "🚚", title: "Envío a domicilio", text: "Cobertura por zonas y envío gratis desde el monto mínimo." },
          { icon: "🔒", title: "Pago seguro en línea", text: "Tarjetas y medios locales a través de pasarela certificada." },
          { icon: "🧼", title: "Calidad profesional", text: "La misma línea de productos que usamos en nuestros servicios." }
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-stone-200 bg-white p-6">
            <span className="text-3xl">{item.icon}</span>
            <p className="mt-3 font-semibold text-navy-900">{item.title}</p>
            <p className="mt-1 text-sm text-stone-600">{item.text}</p>
          </div>
        ))}
      </section>

      {categories.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-bold text-navy-900">Categorías destacadas</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                href={`/tienda?category=${category.slug}`}
                className="group rounded-2xl border border-stone-200 bg-white p-6 text-center transition hover:border-brand-400 hover:shadow-md"
              >
                <span className="text-3xl">🧴</span>
                <p className="mt-2 font-medium text-stone-800 group-hover:text-brand-700">{category.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-navy-900">Productos destacados</h2>
            <Link href="/tienda" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((product) => (
              <ProductCardView key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {promos.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-navy-900">En promoción</h2>
            <Link href="/tienda?onPromo=true" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {promos.map((product) => (
              <ProductCardView key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {promoBanners.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          {promoBanners.slice(0, 2).map((banner) => (
            <Link key={banner.id} href={banner.linkUrl ?? "/tienda"} className="group relative block overflow-hidden rounded-2xl">
              <img src={banner.imageUrl} alt={banner.title} className="h-56 w-full object-cover transition group-hover:scale-105" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-6">
                <p className="text-xl font-bold text-white">{banner.title}</p>
                {banner.subtitle && <p className="text-sm text-white/80">{banner.subtitle}</p>}
              </div>
            </Link>
          ))}
        </section>
      )}

      <section className="rounded-3xl bg-brand-50 px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-navy-900">¿Necesitas servicio de aseo por horas?</h2>
        <p className="mx-auto mt-2 max-w-xl text-stone-600">
          Además de nuestra línea de productos, en Limpiarte ofrecemos servicios de aseo por horas y planes mensuales para hogares y
          empresas.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/servicios" className="rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-700">
            Conocer servicios
          </Link>
          <a
            href="https://limpiarteenhoras.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-brand-600 px-8 py-3 font-semibold text-brand-700 hover:bg-brand-100"
          >
            Agendar en limpiarteenhoras.com ↗
          </a>
        </div>
      </section>
    </div>
  );
}
