import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { DiscountType, PrismaClient, ProductStatus } from "../src/generated/prisma/client";

function buildAdapter(): PrismaMariaDb {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not defined");

  const parsed = new URL(url);
  return new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    connectionLimit: 5
  });
}

const prisma = new PrismaClient({ adapter: buildAdapter() });

const CATEGORIES = [
  { name: "Desinfectantes", slug: "desinfectantes", description: "Desinfección de superficies para hogar y empresa" },
  { name: "Limpieza general", slug: "limpieza-general", description: "Multiusos, desengrasantes y limpiavidrios" },
  { name: "Lavandería", slug: "lavanderia", description: "Detergentes y cuidado de la ropa" },
  { name: "Ambientadores", slug: "ambientadores", description: "Aromas para tus espacios" },
  { name: "Cuidado personal", slug: "cuidado-personal", description: "Jabones y geles antibacteriales" },
  { name: "Implementos", slug: "implementos", description: "Escobas, traperos y accesorios" },
  { name: "Protección", slug: "proteccion", description: "Guantes y elementos de seguridad" }
];

const BRANDS = [
  { name: "Limpiarte Pro", slug: "limpiarte-pro" },
  { name: "Fresh Home", slug: "fresh-home" },
  { name: "CleanTools", slug: "cleantools" },
  { name: "SafeGrip", slug: "safegrip" }
];

interface SeedProduct {
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  brandSlug: string;
  basePrice: number;
  compareAtPrice: number | null;
  promoPrice: number | null;
  stock: number;
  featured: boolean;
  description: string;
  presentation: string;
  tags: string[];
  variants?: { option: string; values: { value: string; sku: string; price: number; stock: number }[] };
}

const PRODUCTS: SeedProduct[] = [
  {
    name: "Desinfectante multiusos concentrado",
    slug: "desinfectante-multiusos-concentrado",
    sku: "LP-DES-001",
    categorySlug: "desinfectantes",
    brandSlug: "limpiarte-pro",
    basePrice: 38900,
    compareAtPrice: 46000,
    promoPrice: null,
    stock: 42,
    featured: true,
    description:
      "Desinfectante de amplio espectro para pisos, baños y superficies duras. Fórmula concentrada de alto rendimiento: 1 galón equivale hasta 40 litros de producto listo para usar.",
    presentation: "Galón 3.785 ml",
    tags: ["desinfectante", "concentrado", "multiusos"],
    variants: {
      option: "Presentación",
      values: [
        { value: "500 ml", sku: "LP-DES-001-05", price: 17900, stock: 30 },
        { value: "1 L", sku: "LP-DES-001-1L", price: 26900, stock: 18 },
        { value: "Galón", sku: "LP-DES-001-GL", price: 38900, stock: 42 }
      ]
    }
  },
  {
    name: "Jabón líquido antibacterial para manos",
    slug: "jabon-liquido-antibacterial-manos",
    sku: "LP-CPE-002",
    categorySlug: "cuidado-personal",
    brandSlug: "limpiarte-pro",
    basePrice: 18500,
    compareAtPrice: null,
    promoPrice: null,
    stock: 87,
    featured: true,
    description: "Jabón antibacterial con glicerina que protege sin resecar. Ideal para baños de alto tráfico en oficinas, restaurantes y hogares.",
    presentation: "1 L con válvula dosificadora",
    tags: ["jabón", "antibacterial", "manos"]
  },
  {
    name: "Limpiavidrios profesional sin marcas",
    slug: "limpiavidrios-profesional",
    sku: "LP-LGE-003",
    categorySlug: "limpieza-general",
    brandSlug: "limpiarte-pro",
    basePrice: 17500,
    compareAtPrice: null,
    promoPrice: 14900,
    stock: 63,
    featured: true,
    description: "Fórmula de secado rápido que no deja aureolas ni residuos en vidrios, espejos y superficies cromadas. Rinde hasta 120 aplicaciones.",
    presentation: "500 ml con atomizador",
    tags: ["vidrios", "espejos", "sin marcas"]
  },
  {
    name: "Ambientador textil aroma lavanda",
    slug: "ambientador-textil-lavanda",
    sku: "FH-AMB-004",
    categorySlug: "ambientadores",
    brandSlug: "fresh-home",
    basePrice: 22400,
    compareAtPrice: null,
    promoPrice: null,
    stock: 35,
    featured: true,
    description: "Neutralizador de olores para cortinas, tapetes, sofás y colchones. Deja una fragancia de lavanda que permanece hasta 12 horas.",
    presentation: "750 ml",
    tags: ["ambientador", "lavanda", "textil"]
  },
  {
    name: "Detergente líquido para ropa 3 L",
    slug: "detergente-liquido-ropa-3l",
    sku: "FH-LAV-005",
    categorySlug: "lavanderia",
    brandSlug: "fresh-home",
    basePrice: 52000,
    compareAtPrice: null,
    promoPrice: 44900,
    stock: 28,
    featured: false,
    description: "Detergente concentrado apto para lavadora de carga frontal y superior. Remueve manchas difíciles en agua fría y cuida los colores.",
    presentation: "Garrafa 3 L",
    tags: ["detergente", "ropa", "concentrado"]
  },
  {
    name: "Removedor de grasa para cocina industrial",
    slug: "removedor-grasa-cocina",
    sku: "LP-LGE-006",
    categorySlug: "limpieza-general",
    brandSlug: "limpiarte-pro",
    basePrice: 32900,
    compareAtPrice: null,
    promoPrice: null,
    stock: 19,
    featured: false,
    description: "Desengrasante alcalino de acción inmediata para campanas, freidoras, hornos y parrillas. Uso profesional en cocinas de alto volumen.",
    presentation: "1 L",
    tags: ["desengrasante", "cocina", "industrial"]
  },
  {
    name: "Escoba profesional de cerda suave",
    slug: "escoba-profesional-cerda-suave",
    sku: "CT-IMP-007",
    categorySlug: "implementos",
    brandSlug: "cleantools",
    basePrice: 24500,
    compareAtPrice: null,
    promoPrice: null,
    stock: 51,
    featured: false,
    description: "Escoba de cerda suave con mango ergonómico de aluminio. Diseñada para pisos delicados como madera, laminado y porcelanato pulido.",
    presentation: "Unidad · mango 1.3 m",
    tags: ["escoba", "implementos"]
  },
  {
    name: "Trapeador de microfibra con balde escurridor",
    slug: "trapeador-microfibra-balde",
    sku: "CT-IMP-008",
    categorySlug: "implementos",
    brandSlug: "cleantools",
    basePrice: 79900,
    compareAtPrice: null,
    promoPrice: 68900,
    stock: 12,
    featured: true,
    description: "Sistema completo de trapeado con cabezal giratorio 360°, dos repuestos de microfibra y balde con escurridor por centrifugado.",
    presentation: "Kit completo",
    tags: ["trapeador", "microfibra", "kit"]
  },
  {
    name: "Guantes de nitrilo desechables x100",
    slug: "guantes-nitrilo-x100",
    sku: "SG-PRO-009",
    categorySlug: "proteccion",
    brandSlug: "safegrip",
    basePrice: 39900,
    compareAtPrice: null,
    promoPrice: null,
    stock: 4,
    featured: false,
    description: "Guantes de nitrilo sin polvo, resistentes a químicos y de alta sensibilidad táctil. Caja por 100 unidades, talla M.",
    presentation: "Caja x 100 unidades",
    tags: ["guantes", "nitrilo", "protección"],
    variants: {
      option: "Talla",
      values: [
        { value: "S", sku: "SG-PRO-009-S", price: 39900, stock: 10 },
        { value: "M", sku: "SG-PRO-009-M", price: 39900, stock: 4 },
        { value: "L", sku: "SG-PRO-009-L", price: 39900, stock: 8 }
      ]
    }
  },
  {
    name: "Blanqueador sin cloro para ropa de color",
    slug: "blanqueador-sin-cloro",
    sku: "FH-LAV-010",
    categorySlug: "lavanderia",
    brandSlug: "fresh-home",
    basePrice: 19900,
    compareAtPrice: null,
    promoPrice: 16900,
    stock: 0,
    featured: false,
    description: "Blanqueador a base de oxígeno activo que recupera la luminosidad de las prendas de color sin decolorarlas ni dañar las fibras.",
    presentation: "1.8 L",
    tags: ["blanqueador", "ropa", "sin cloro"]
  },
  {
    name: "Gel antibacterial 70% alcohol",
    slug: "gel-antibacterial-70",
    sku: "LP-CPE-011",
    categorySlug: "cuidado-personal",
    brandSlug: "limpiarte-pro",
    basePrice: 21900,
    compareAtPrice: null,
    promoPrice: null,
    stock: 74,
    featured: false,
    description: "Gel antibacterial con 70% de alcohol y agentes humectantes que evitan la resequedad. Cumple con la normativa sanitaria vigente.",
    presentation: "1 L",
    tags: ["gel", "antibacterial", "alcohol"]
  },
  {
    name: "Aromatizante ambiental cítrico concentrado",
    slug: "aromatizante-citrico-concentrado",
    sku: "FH-AMB-012",
    categorySlug: "ambientadores",
    brandSlug: "fresh-home",
    basePrice: 33000,
    compareAtPrice: null,
    promoPrice: 28900,
    stock: 23,
    featured: false,
    description: "Aromatizante concentrado para dilución en agua. Una sola aplicación perfuma espacios de hasta 80 m² por más de 8 horas.",
    presentation: "1 L concentrado",
    tags: ["aromatizante", "cítrico", "concentrado"]
  }
];

const SHIPPING_ZONES = [
  {
    name: "Bogotá y alrededores",
    rate: 12000,
    freeShippingThreshold: 150000,
    cities: [
      { city: "Bogotá", state: "Cundinamarca" },
      { city: "Chía", state: "Cundinamarca" },
      { city: "Soacha", state: "Cundinamarca" },
      { city: "Mosquera", state: "Cundinamarca" }
    ]
  },
  {
    name: "Ciudades principales",
    rate: 15000,
    freeShippingThreshold: 200000,
    cities: [
      { city: "Medellín", state: "Antioquia" },
      { city: "Cali", state: "Valle del Cauca" },
      { city: "Barranquilla", state: "Atlántico" },
      { city: "Cartagena", state: "Bolívar" }
    ]
  },
  {
    name: "Resto del país",
    rate: 22000,
    freeShippingThreshold: null,
    cities: [
      { city: "Bucaramanga", state: "Santander" },
      { city: "Pereira", state: "Risaralda" },
      { city: "Manizales", state: "Caldas" },
      { city: "Ibagué", state: "Tolima" }
    ]
  }
];

async function seedCatalog(): Promise<void> {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { description: category.description },
      create: category
    });
  }

  for (const brand of BRANDS) {
    await prisma.brand.upsert({ where: { slug: brand.slug }, update: {}, create: brand });
  }

  for (const seed of PRODUCTS) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: seed.categorySlug } });
    const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: seed.brandSlug } });

    const product = await prisma.product.upsert({
      where: { slug: seed.slug },
      update: {
        basePrice: seed.basePrice,
        compareAtPrice: seed.compareAtPrice,
        promoPrice: seed.promoPrice,
        stock: seed.stock
      },
      create: {
        name: seed.name,
        slug: seed.slug,
        sku: seed.sku,
        description: seed.description,
        presentation: seed.presentation,
        usageInstructions: "Diluir según la ficha técnica y aplicar sobre la superficie limpia.",
        precautions: "Mantener fuera del alcance de los niños. No ingerir.",
        status: ProductStatus.ACTIVE,
        categoryId: category.id,
        brandId: brand.id,
        basePrice: seed.basePrice,
        compareAtPrice: seed.compareAtPrice,
        promoPrice: seed.promoPrice,
        stock: seed.stock,
        lowStockThreshold: 10,
        isFeatured: seed.featured,
        tags: {
          create: seed.tags.map((tagName) => ({
            tag: { connectOrCreate: { where: { name: tagName }, create: { name: tagName } } }
          }))
        },
        faqs: {
          create: [
            { question: "¿Cuánto tarda el envío?", answer: "Entre 1 y 3 días hábiles según la ciudad de destino.", position: 0 },
            { question: "¿Es apto para superficies delicadas?", answer: "Sí, respetando la dilución indicada en la ficha técnica.", position: 1 }
          ]
        }
      }
    });

    if (seed.variants) {
      const existingOptions = await prisma.productOption.count({ where: { productId: product.id } });
      if (existingOptions === 0) {
        const option = await prisma.productOption.create({
          data: { productId: product.id, name: seed.variants.option, position: 0 }
        });

        for (const [index, variantSeed] of seed.variants.values.entries()) {
          const optionValue = await prisma.productOptionValue.create({
            data: { optionId: option.id, value: variantSeed.value, position: index }
          });
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: variantSeed.sku,
              price: variantSeed.price,
              stock: variantSeed.stock,
              optionValues: { create: [{ optionValueId: optionValue.id }] }
            }
          });
        }
      }
    }
  }

  for (const zoneSeed of SHIPPING_ZONES) {
    const existing = await prisma.shippingZone.findUnique({ where: { name: zoneSeed.name } });
    if (existing) continue;

    await prisma.shippingZone.create({
      data: {
        name: zoneSeed.name,
        rate: zoneSeed.rate,
        freeShippingThreshold: zoneSeed.freeShippingThreshold,
        cities: { create: zoneSeed.cities }
      }
    });
  }

  await prisma.coupon.upsert({
    where: { code: "BIENVENIDA10" },
    update: {},
    create: {
      code: "BIENVENIDA10",
      description: "10% de descuento en la primera compra",
      discountType: DiscountType.PERCENT,
      value: 10,
      minSubtotal: 50000,
      maxUses: 500,
      maxUsesPerCustomer: 1
    }
  });

  process.stdout.write(`Catálogo de prueba listo: ${PRODUCTS.length} productos, ${SHIPPING_ZONES.length} zonas de envío, 1 cupón\n`);
}

seedCatalog()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
