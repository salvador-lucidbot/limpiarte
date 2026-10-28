import type { SectionNavItem } from "../section-nav";

export const PRODUCT_SECTION_ID = {
  general: "producto-general",
  prices: "producto-precios",
  inventory: "producto-inventario",
  measures: "producto-medidas",
  images: "producto-imagenes",
  videos: "producto-videos",
  documents: "producto-documentos",
  variants: "producto-variantes",
  offerPacks: "producto-packs",
  sectionTitles: "producto-titulos",
  highlights: "producto-sobre",
  specs: "producto-especificaciones",
  warranty: "producto-garantia",
  usage: "producto-modo-uso",
  banners: "producto-banners",
  visualContent: "producto-contenido-visual",
  technicalSheet: "producto-ficha",
  relations: "producto-relacionados",
  faqs: "producto-preguntas",
  seo: "producto-seo"
} as const;

export const PRODUCT_SECTION_NAV: SectionNavItem[] = [
  { id: PRODUCT_SECTION_ID.general, label: "Información básica" },
  { id: PRODUCT_SECTION_ID.prices, label: "Precios" },
  { id: PRODUCT_SECTION_ID.inventory, label: "Inventario" },
  { id: PRODUCT_SECTION_ID.measures, label: "Medidas" },
  { id: PRODUCT_SECTION_ID.images, label: "Imágenes" },
  { id: PRODUCT_SECTION_ID.videos, label: "Videos" },
  { id: PRODUCT_SECTION_ID.documents, label: "Documentos" },
  { id: PRODUCT_SECTION_ID.variants, label: "Variantes" },
  { id: PRODUCT_SECTION_ID.offerPacks, label: "Packs de oferta" },
  { id: PRODUCT_SECTION_ID.banners, label: "Banners" },
  { id: PRODUCT_SECTION_ID.sectionTitles, label: "Títulos de sección" },
  { id: PRODUCT_SECTION_ID.highlights, label: "Sobre este artículo" },
  { id: PRODUCT_SECTION_ID.specs, label: "Especificaciones" },
  { id: PRODUCT_SECTION_ID.warranty, label: "Garantía" },
  { id: PRODUCT_SECTION_ID.usage, label: "Modo de uso" },
  { id: PRODUCT_SECTION_ID.visualContent, label: "Contenido visual" },
  { id: PRODUCT_SECTION_ID.technicalSheet, label: "Ficha técnica" },
  { id: PRODUCT_SECTION_ID.relations, label: "Relacionados" },
  { id: PRODUCT_SECTION_ID.faqs, label: "Preguntas" },
  { id: PRODUCT_SECTION_ID.seo, label: "SEO" }
];
