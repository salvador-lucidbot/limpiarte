interface BrandEntry {
  id: string;
  name: string;
}

export function BrandsMarquee({ brands }: { brands: BrandEntry[] }): React.ReactNode {
  if (brands.length < 3) return null;

  const doubled = [...brands, ...brands];

  return (
    <section className="mt-12 overflow-hidden rounded-xl border border-slate-200 bg-white py-5" aria-label="Marcas disponibles">
      <div className="marquee-track items-center gap-14 px-7">
        {doubled.map((brand, index) => (
          <span key={`${brand.id}-${index}`} className="whitespace-nowrap font-sans text-lg font-extrabold uppercase tracking-widest text-slate-300">
            {brand.name}
          </span>
        ))}
      </div>
    </section>
  );
}
