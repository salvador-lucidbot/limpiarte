import { BannerView, BlogPostView, CategoryNode, Paginated, ProductCard, ProductDetail, StaticPageView } from "../api/types";

interface DemoSeedProduct {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  categorySlug: string;
  categoryName: string;
  brandName: string;
  featured: boolean;
  stock: number;
  tags: string[];
  description: string;
  presentation: string;
}

const SEED: DemoSeedProduct[] = [
  {
    slug: "desinfectante-multiusos-galon",
    name: "Desinfectante multiusos concentrado",
    price: 38900,
    compareAtPrice: 46000,
    categorySlug: "desinfectantes",
    categoryName: "Desinfectantes",
    brandName: "Limpiarte Pro",
    featured: true,
    stock: 42,
    tags: ["desinfectante", "concentrado", "multiusos"],
    description:
      "Desinfectante de amplio espectro para pisos, baños y superficies duras. Fórmula concentrada de alto rendimiento: 1 galón equivale hasta 40 litros de producto listo para usar.",
    presentation: "Galón 3.785 ml"
  },
  {
    slug: "jabon-liquido-manos-antibacterial",
    name: "Jabón líquido antibacterial para manos",
    price: 18500,
    compareAtPrice: null,
    categorySlug: "cuidado-personal",
    categoryName: "Cuidado personal",
    brandName: "Limpiarte Pro",
    featured: true,
    stock: 87,
    tags: ["jabón", "antibacterial", "manos"],
    description:
      "Jabón antibacterial con glicerina que protege sin resecar. Ideal para baños de alto tráfico en oficinas, restaurantes y hogares.",
    presentation: "1 L con válvula dosificadora"
  },
  {
    slug: "limpiavidrios-profesional",
    name: "Limpiavidrios profesional sin marcas",
    price: 14900,
    compareAtPrice: 17500,
    categorySlug: "limpieza-general",
    categoryName: "Limpieza general",
    brandName: "Limpiarte Pro",
    featured: true,
    stock: 63,
    tags: ["vidrios", "espejos", "sin marcas"],
    description:
      "Fórmula de secado rápido que no deja aureolas ni residuos en vidrios, espejos y superficies cromadas. Rinde hasta 120 aplicaciones.",
    presentation: "500 ml con atomizador"
  },
  {
    slug: "ambientador-lavanda-textil",
    name: "Ambientador textil aroma lavanda",
    price: 22400,
    compareAtPrice: null,
    categorySlug: "ambientadores",
    categoryName: "Ambientadores",
    brandName: "Fresh Home",
    featured: true,
    stock: 35,
    tags: ["ambientador", "lavanda", "textil"],
    description:
      "Neutralizador de olores para cortinas, tapetes, sofás y colchones. Deja una fragancia de lavanda que permanece hasta 12 horas.",
    presentation: "750 ml"
  },
  {
    slug: "detergente-liquido-ropa",
    name: "Detergente líquido para ropa 3 L",
    price: 44900,
    compareAtPrice: 52000,
    categorySlug: "lavanderia",
    categoryName: "Lavandería",
    brandName: "Fresh Home",
    featured: false,
    stock: 28,
    tags: ["detergente", "ropa", "concentrado"],
    description:
      "Detergente concentrado apto para lavadora de carga frontal y superior. Remueve manchas difíciles en agua fría y cuida los colores.",
    presentation: "Garrafa 3 L"
  },
  {
    slug: "removedor-grasa-cocina",
    name: "Removedor de grasa para cocina industrial",
    price: 32900,
    compareAtPrice: null,
    categorySlug: "limpieza-general",
    categoryName: "Limpieza general",
    brandName: "Limpiarte Pro",
    featured: false,
    stock: 19,
    tags: ["desengrasante", "cocina", "industrial"],
    description:
      "Desengrasante alcalino de acción inmediata para campanas, freidoras, hornos y parrillas. Uso profesional en cocinas de alto volumen.",
    presentation: "1 L"
  },
  {
    slug: "escoba-cerda-suave",
    name: "Escoba profesional de cerda suave",
    price: 24500,
    compareAtPrice: null,
    categorySlug: "implementos",
    categoryName: "Implementos",
    brandName: "CleanTools",
    featured: false,
    stock: 51,
    tags: ["escoba", "implementos"],
    description:
      "Escoba de cerda suave con mango ergonómico de aluminio. Diseñada para pisos delicados como madera, laminado y porcelanato pulido.",
    presentation: "Unidad · mango 1.3 m"
  },
  {
    slug: "trapeador-microfibra",
    name: "Trapeador de microfibra con balde escurridor",
    price: 68900,
    compareAtPrice: 79900,
    categorySlug: "implementos",
    categoryName: "Implementos",
    brandName: "CleanTools",
    featured: true,
    stock: 12,
    tags: ["trapeador", "microfibra", "kit"],
    description:
      "Sistema completo de trapeado con cabezal giratorio 360°, dos repuestos de microfibra y balde con escurridor por centrifugado.",
    presentation: "Kit completo"
  },
  {
    slug: "guantes-nitrilo-caja",
    name: "Guantes de nitrilo desechables x100",
    price: 39900,
    compareAtPrice: null,
    categorySlug: "proteccion",
    categoryName: "Protección",
    brandName: "SafeGrip",
    featured: false,
    stock: 4,
    tags: ["guantes", "nitrilo", "protección"],
    description:
      "Guantes de nitrilo sin polvo, resistentes a químicos y de alta sensibilidad táctil. Caja por 100 unidades, talla M.",
    presentation: "Caja x 100 unidades"
  },
  {
    slug: "blanqueador-ropa-color",
    name: "Blanqueador sin cloro para ropa de color",
    price: 16900,
    compareAtPrice: 19900,
    categorySlug: "lavanderia",
    categoryName: "Lavandería",
    brandName: "Fresh Home",
    featured: false,
    stock: 0,
    tags: ["blanqueador", "ropa", "sin cloro"],
    description:
      "Blanqueador a base de oxígeno activo que recupera la luminosidad de las prendas de color sin decolorarlas ni dañar las fibras.",
    presentation: "1.8 L"
  },
  {
    slug: "gel-antibacterial-litro",
    name: "Gel antibacterial 70% alcohol",
    price: 21900,
    compareAtPrice: null,
    categorySlug: "cuidado-personal",
    categoryName: "Cuidado personal",
    brandName: "Limpiarte Pro",
    featured: false,
    stock: 74,
    tags: ["gel", "antibacterial", "alcohol"],
    description:
      "Gel antibacterial con 70% de alcohol y agentes humectantes que evitan la resequedad. Cumple con la normativa sanitaria vigente.",
    presentation: "1 L"
  },
  {
    slug: "aromatizante-ambiental-citrico",
    name: "Aromatizante ambiental cítrico concentrado",
    price: 28900,
    compareAtPrice: 33000,
    categorySlug: "ambientadores",
    categoryName: "Ambientadores",
    brandName: "Fresh Home",
    featured: false,
    stock: 23,
    tags: ["aromatizante", "cítrico", "concentrado"],
    description:
      "Aromatizante concentrado para dilución en agua. Una sola aplicación perfuma espacios de hasta 80 m² por más de 8 horas.",
    presentation: "1 L concentrado"
  }
];

function toCard(seed: DemoSeedProduct, index: number): ProductCard {
  return {
    id: `demo-product-${index + 1}`,
    slug: seed.slug,
    name: seed.name,
    price: seed.price,
    compareAtPrice: seed.compareAtPrice,
    onPromo: seed.compareAtPrice !== null,
    imageUrl: null,
    brandName: seed.brandName,
    categoryName: seed.categoryName,
    categorySlug: seed.categorySlug,
    inStock: seed.stock > 0,
    isFeatured: seed.featured,
    tags: seed.tags
  };
}

export function demoProductCards(): ProductCard[] {
  return SEED.map(toCard);
}

export function demoFeaturedProducts(): ProductCard[] {
  return demoProductCards().filter((product) => product.isFeatured);
}

export function demoPromoProducts(): ProductCard[] {
  return demoProductCards().filter((product) => product.onPromo);
}

export function demoCategories(): CategoryNode[] {
  return [
    {
      id: "demo-cat-1",
      name: "Desinfectantes",
      slug: "desinfectantes",
      bannerUrl: null,
      description: "Desinfección de superficies para hogar y empresa",
      children: []
    },
    {
      id: "demo-cat-2",
      name: "Limpieza general",
      slug: "limpieza-general",
      bannerUrl: null,
      description: "Multiusos, desengrasantes y limpiavidrios",
      children: [
        { id: "demo-cat-2-1", name: "Cocina", slug: "cocina", bannerUrl: null, description: null, children: [] },
        { id: "demo-cat-2-2", name: "Baños", slug: "banos", bannerUrl: null, description: null, children: [] }
      ]
    },
    { id: "demo-cat-3", name: "Lavandería", slug: "lavanderia", bannerUrl: null, description: "Detergentes y suavizantes", children: [] },
    { id: "demo-cat-4", name: "Ambientadores", slug: "ambientadores", bannerUrl: null, description: "Aromas para tus espacios", children: [] },
    { id: "demo-cat-5", name: "Cuidado personal", slug: "cuidado-personal", bannerUrl: null, description: "Jabones y geles", children: [] },
    { id: "demo-cat-6", name: "Implementos", slug: "implementos", bannerUrl: null, description: "Escobas, traperos y accesorios", children: [] },
    { id: "demo-cat-7", name: "Protección", slug: "proteccion", bannerUrl: null, description: "Guantes y elementos de seguridad", children: [] }
  ];
}

export function demoBanners(): BannerView[] {
  return [];
}

export function demoCatalogPage(searchParams: URLSearchParams): Paginated<ProductCard> {
  const category = searchParams.get("category");
  const search = searchParams.get("q")?.toLowerCase();
  const onPromo = searchParams.get("onPromo") === "true";
  const inStock = searchParams.get("inStock") === "true";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort");

  let products = demoProductCards();

  if (category) products = products.filter((product) => product.categorySlug === category);
  if (search) {
    products = products.filter(
      (product) => product.name.toLowerCase().includes(search) || product.tags.some((tag) => tag.includes(search))
    );
  }
  if (onPromo) products = products.filter((product) => product.onPromo);
  if (inStock) products = products.filter((product) => product.inStock);
  if (minPrice) products = products.filter((product) => product.price >= Number(minPrice));
  if (maxPrice) products = products.filter((product) => product.price <= Number(maxPrice));

  if (sort === "price_asc") products = [...products].sort((left, right) => left.price - right.price);
  if (sort === "price_desc") products = [...products].sort((left, right) => right.price - left.price);
  if (sort === "newest") products = [...products].reverse();

  return {
    data: products,
    meta: { page: 1, perPage: 24, total: products.length, totalPages: 1 }
  };
}

export function demoProductDetail(slug: string): ProductDetail | null {
  const index = SEED.findIndex((product) => product.slug === slug);
  const seed = SEED[index];
  if (!seed) return null;

  const card = toCard(seed, index);
  const hasVariants = seed.categorySlug === "desinfectantes" || seed.categorySlug === "lavanderia";

  return {
    id: card.id,
    slug: seed.slug,
    name: seed.name,
    sku: `DEMO-${String(index + 1).padStart(3, "0")}`,
    description: seed.description,
    technicalSheet: {
      content: seed.presentation,
      presentation: seed.presentation,
      performance: "Rendimiento aproximado de 40 aplicaciones por litro diluido.",
      usageInstructions: "Diluir 30 ml por litro de agua. Aplicar sobre la superficie y retirar con paño limpio.",
      precautions: "Mantener fuera del alcance de los niños. No ingerir. En caso de contacto con los ojos, enjuagar con abundante agua."
    },
    brandName: seed.brandName,
    category: { name: seed.categoryName, slug: seed.categorySlug },
    price: seed.price,
    compareAtPrice: seed.compareAtPrice,
    onPromo: seed.compareAtPrice !== null,
    stock: seed.stock,
    inStock: seed.stock > 0,
    allowBackorder: false,
    images: [],
    options: hasVariants
      ? [
          {
            id: "demo-option-1",
            name: "Presentación",
            values: [
              { id: "demo-value-1", value: "500 ml" },
              { id: "demo-value-2", value: "1 L" },
              { id: "demo-value-3", value: "Galón" }
            ]
          }
        ]
      : [],
    variants: hasVariants
      ? [
          { id: "demo-variant-1", sku: "DEMO-500", price: Math.round(seed.price * 0.45), compareAtPrice: null, stock: 30, imageUrl: null, optionValueIds: ["demo-value-1"], label: "500 ml" },
          { id: "demo-variant-2", sku: "DEMO-1L", price: Math.round(seed.price * 0.7), compareAtPrice: null, stock: 18, imageUrl: null, optionValueIds: ["demo-value-2"], label: "1 L" },
          { id: "demo-variant-3", sku: "DEMO-GL", price: seed.price, compareAtPrice: seed.compareAtPrice, stock: seed.stock, imageUrl: null, optionValueIds: ["demo-value-3"], label: "Galón" }
        ]
      : [],
    faqs: [
      { question: "¿Es apto para superficies delicadas?", answer: "Sí, siempre que se respete la dilución recomendada en la ficha técnica." },
      { question: "¿Cuánto tarda el envío?", answer: "Entre 1 y 3 días hábiles según la ciudad de destino." }
    ],
    tags: seed.tags,
    related: demoProductCards()
      .filter((product) => product.categorySlug === seed.categorySlug && product.slug !== seed.slug)
      .slice(0, 4)
      .map((product) => ({ type: "RELATED", product })),
    seo: { title: seed.name, description: seed.description.slice(0, 155) }
  };
}

export function demoBlogPosts(): Paginated<BlogPostView> {
  const posts: BlogPostView[] = [
    {
      id: "demo-post-1",
      slug: "como-desinfectar-tu-cocina",
      title: "Cómo desinfectar tu cocina en 5 pasos",
      excerpt: "La cocina concentra la mayor carga bacteriana del hogar. Te contamos la rutina que usan nuestros profesionales.",
      content: "<p>La cocina concentra la mayor carga bacteriana del hogar…</p>",
      coverImageUrl: null,
      publishedAt: "2026-08-01T10:00:00.000Z"
    },
    {
      id: "demo-post-2",
      slug: "guia-productos-aseo-empresas",
      title: "Guía de productos de aseo para empresas",
      excerpt: "Qué debe incluir el kit básico de limpieza de una oficina de 20 personas y cuánto rinde cada producto.",
      content: "<p>Qué debe incluir el kit básico de limpieza…</p>",
      coverImageUrl: null,
      publishedAt: "2026-07-18T10:00:00.000Z"
    },
    {
      id: "demo-post-3",
      slug: "errores-comunes-al-trapear",
      title: "5 errores comunes al trapear (y cómo evitarlos)",
      excerpt: "Usar demasiado producto o el agua sucia arruina el acabado. Corrige estos hábitos y gana tiempo.",
      content: "<p>Usar demasiado producto arruina el acabado…</p>",
      coverImageUrl: null,
      publishedAt: "2026-07-02T10:00:00.000Z"
    }
  ];

  return { data: posts, meta: { page: 1, perPage: 20, total: posts.length, totalPages: 1 } };
}

export function demoBlogPost(slug: string): BlogPostView | null {
  return demoBlogPosts().data.find((post) => post.slug === slug) ?? null;
}

export function demoStaticPage(slug: string): StaticPageView | null {
  const pages: Record<string, StaticPageView> = {
    "quienes-somos": {
      slug: "quienes-somos",
      title: "Quiénes somos",
      content:
        "<p>Limpiarte SAS es una empresa colombiana dedicada al aseo profesional. Durante más de una década hemos atendido hogares y empresas con servicios de aseo por horas, y hoy ponemos a tu alcance la misma línea de productos que usan nuestros profesionales.</p><h2>Nuestra promesa</h2><p>Productos de rendimiento comprobado, precios justos y entrega a domicilio en todo el país.</p>",
      seoTitle: "Quiénes somos",
      seoDescription: "Conoce a Limpiarte SAS, empresa colombiana de aseo profesional."
    },
    "terminos-y-condiciones": {
      slug: "terminos-y-condiciones",
      title: "Términos y condiciones",
      content:
        "<p><em>Contenido de demostración.</em> Este texto será reemplazado por los términos y condiciones legales vigentes que suministre Limpiarte SAS.</p><h2>1. Objeto</h2><p>Las presentes condiciones regulan el uso de la tienda en línea y la compra de productos.</p><h2>2. Precios y pagos</h2><p>Todos los precios se expresan en pesos colombianos e incluyen los impuestos aplicables.</p>",
      seoTitle: "Términos y condiciones",
      seoDescription: "Términos y condiciones de uso de la tienda en línea."
    },
    "politica-de-privacidad": {
      slug: "politica-de-privacidad",
      title: "Política de privacidad y tratamiento de datos",
      content:
        "<p><em>Contenido de demostración.</em> En cumplimiento de la Ley 1581 de 2012, Limpiarte SAS informa el tratamiento que da a los datos personales de sus clientes.</p><h2>Finalidad</h2><p>Los datos se usan para gestionar pedidos, despachos y comunicaciones comerciales autorizadas.</p><h2>Derechos del titular</h2><p>Puedes consultar, actualizar o solicitar la supresión de tus datos escribiendo a nuestro canal de contacto.</p>",
      seoTitle: "Política de privacidad",
      seoDescription: "Política de tratamiento de datos personales de Limpiarte SAS."
    },
    "politica-pqrs": {
      slug: "politica-pqrs",
      title: "Política de PQRS",
      content:
        "<p><em>Contenido de demostración.</em> Peticiones, quejas, reclamos y sugerencias se atienden en un plazo máximo de 15 días hábiles.</p><h2>Cómo radicar</h2><p>A través del formulario de contacto del sitio o del correo de atención al cliente.</p>",
      seoTitle: "Política de PQRS",
      seoDescription: "Canal y tiempos de respuesta para PQRS."
    }
  };

  return pages[slug] ?? null;
}
