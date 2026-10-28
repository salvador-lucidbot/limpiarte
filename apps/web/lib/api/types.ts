export interface PaginatedMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  onPromo: boolean;
  imageUrl: string | null;
  secondImageUrl: string | null;
  brandName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  inStock: boolean;
  lowStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  rating: number | null;
  reviewCount: number;
  tags: string[];
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  bannerUrl: string | null;
  description: string | null;
  children: CategoryNode[];
}

export interface FacetOption {
  name: string;
  slug: string;
  count: number;
}

export interface PriceRangeFacet {
  label: string;
  min: number | null;
  max: number | null;
  count: number;
}

export interface CatalogFacets {
  categories: FacetOption[];
  brands: FacetOption[];
  priceRanges: PriceRangeFacet[];
  promoCount: number;
  inStockCount: number;
}

export interface CatalogListing extends Paginated<ProductCard> {
  facets: CatalogFacets;
}

export type ProductSpecGroup = "DETALLES" | "MEDIDAS" | "ESTILO" | "CARACTERISTICAS" | "MATERIALES_CUIDADO" | "GARANTIA";

export type ProductDocumentKind = "FICHA_TECNICA" | "HOJA_SEGURIDAD" | "MANUAL" | "CERTIFICADO" | "OTRO";

export type ContentBlockLayout =
  | "IMAGEN_COMPLETA"
  | "IMAGEN_IZQUIERDA"
  | "IMAGEN_DERECHA"
  | "GRILLA"
  | "TEXTO_SOBRE_IMAGEN"
  | "CARRUSEL";

export type ContentBlockSource = "PRODUCT" | "BRAND";

export type ProductRelationType = "RELATED" | "COMPLEMENTARY" | "CROSS_SELL";

export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export type UploadKind = "image" | "document" | "video";

export const PRODUCT_SPEC_GROUPS: ProductSpecGroup[] = [
  "DETALLES",
  "MEDIDAS",
  "ESTILO",
  "CARACTERISTICAS",
  "MATERIALES_CUIDADO",
  "GARANTIA"
];

export const PRODUCT_SPEC_GROUP_LABELS: Record<ProductSpecGroup, string> = {
  DETALLES: "Detalles del producto",
  MEDIDAS: "Medidas",
  ESTILO: "Estilo",
  CARACTERISTICAS: "Características y especificaciones",
  MATERIALES_CUIDADO: "Materiales y cuidado",
  GARANTIA: "Garantía y asistencia"
};

export const PRODUCT_DOCUMENT_KIND_LABELS: Record<ProductDocumentKind, string> = {
  FICHA_TECNICA: "Ficha técnica",
  HOJA_SEGURIDAD: "Hoja de seguridad (FDS)",
  MANUAL: "Manual",
  CERTIFICADO: "Certificado",
  OTRO: "Otro"
};

export const CONTENT_BLOCK_LAYOUT_LABELS: Record<ContentBlockLayout, string> = {
  IMAGEN_COMPLETA: "Imagen a todo el ancho",
  IMAGEN_IZQUIERDA: "Imagen a la izquierda y texto",
  IMAGEN_DERECHA: "Imagen a la derecha y texto",
  GRILLA: "Celda de grilla",
  TEXTO_SOBRE_IMAGEN: "Texto sobre la imagen",
  CARRUSEL: "Carrusel al desplazar"
};

export const PRODUCT_RELATION_TYPE_LABELS: Record<ProductRelationType, string> = {
  RELATED: "Relacionado",
  COMPLEMENTARY: "Complementario",
  CROSS_SELL: "Venta cruzada"
};

export const PRODUCT_CONTENT_LIMITS = {
  highlights: 10,
  highlightLength: 300,
  specs: 60,
  specLabelLength: 120,
  specValueLength: 2000,
  videos: 8,
  documents: 10,
  contentBlocks: 12,
  contentBlockBodyLength: 5000,
  relations: 40,
  images: 12,
  options: 3,
  variants: 100,
  warrantyLength: 5000,
  titleLength: 160,
  urlLength: 500
} as const;

export const UPLOAD_RULES: Record<UploadKind, { endpoint: string; maxBytes: number; accept: string }> = {
  image: { endpoint: "/admin/uploads", maxBytes: 5 * 1024 * 1024, accept: "image/jpeg,image/png,image/webp,image/avif" },
  document: { endpoint: "/admin/uploads/documents", maxBytes: 10 * 1024 * 1024, accept: "application/pdf,.pdf" },
  video: { endpoint: "/admin/uploads/videos", maxBytes: 50 * 1024 * 1024, accept: "video/mp4,.mp4" }
};

export interface UploadedFileResult {
  fileName: string;
  url: string;
  size: number;
  mimeType: string;
  kind: UploadKind;
}

export interface ProductOptionValueView {
  id: string;
  value: string;
  swatchImageUrl: string | null;
  swatchHex: string | null;
}

export interface ProductOptionView {
  id: string;
  name: string;
  values: ProductOptionValueView[];
}

export interface ProductVariantView {
  id: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  imageUrl: string | null;
  weightKg: number | null;
  optionValueIds: string[];
  label: string;
}

export interface ProductBrandView {
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  tagline: string | null;
}

export interface CategoryCrumb {
  name: string;
  slug: string;
}

export interface ProductDimensions {
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
}

export interface ProductSpecView {
  group: ProductSpecGroup;
  label: string;
  value: string;
  isKey: boolean;
}

export interface ProductVideoView {
  id: string;
  url: string;
  posterUrl: string | null;
  title: string | null;
  durationSeconds: number | null;
  createdAt: string | null;
}

export interface ProductDocumentView {
  id: string;
  title: string;
  url: string;
  kind: ProductDocumentKind;
  sizeBytes: number | null;
}

export interface ContentBlockView {
  id: string;
  source: ContentBlockSource;
  layout: ContentBlockLayout;
  title: string | null;
  body: string | null;
  imageUrl: string;
  imageAlt: string | null;
}

export type UsageMediaKind = "IMAGEN" | "VIDEO" | "PDF";

export const BANNER_FOCUS_VALUES = [
  "ARRIBA_IZQUIERDA", "ARRIBA_CENTRO", "ARRIBA_DERECHA",
  "CENTRO_IZQUIERDA", "CENTRO", "CENTRO_DERECHA",
  "ABAJO_IZQUIERDA", "ABAJO_CENTRO", "ABAJO_DERECHA"
] as const;

export type BannerFocus = (typeof BANNER_FOCUS_VALUES)[number];

export type BannerTextPlacement = "IZQUIERDA" | "CENTRO" | "DERECHA";

export const BANNER_HEIGHT_RANGE = { min: 80, max: 600 } as const;
export const BANNER_OVERLAY_RANGE = { min: 0, max: 80 } as const;

export interface ProductBannerView {
  url: string;
  linkUrl: string | null;
  alt: string | null;
  height: number | null;
  focus: BannerFocus | null;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  textPlacement: BannerTextPlacement | null;
  textOnDark: boolean;
  overlay: number | null;
}

export interface ProductSectionTitles {
  highlights: string | null;
  highlightsSubtitle: string | null;
  description: string | null;
  descriptionSubtitle: string | null;
  usage: string | null;
  videos: string | null;
  documents: string | null;
  content: string | null;
}

export interface ProductOfferPackView {
  id: string;
  eyebrow: string | null;
  title: string;
  badgeLabel: string;
  quantity: number;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  isHighlighted: boolean;
}

export interface BundlePromoView {
  buyQuantity: number;
  getQuantity: number;
  label: string;
}

export interface ProductUsageMediaView {
  url: string;
  kind: UsageMediaKind;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  description: string | null;
  technicalSheet: {
    content: string | null;
    presentation: string | null;
    performance: string | null;
    usageInstructions: string | null;
    precautions: string | null;
  };
  brandName: string | null;
  brand: ProductBrandView | null;
  category: CategoryCrumb | null;
  categoryPath: CategoryCrumb[];
  price: number;
  compareAtPrice: number | null;
  onPromo: boolean;
  promoEndsAt: string | null;
  taxRatePercent: number | null;
  stock: number;
  inStock: boolean;
  lowStock: boolean;
  allowBackorder: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  rating: number | null;
  reviewCount: number;
  dimensions: ProductDimensions | null;
  highlights: string[];
  warrantyText: string | null;
  bundlePromo: BundlePromoView | null;
  usageMedia: ProductUsageMediaView | null;
  topBanner: ProductBannerView | null;
  bottomBanner: ProductBannerView | null;
  sectionTitles: ProductSectionTitles;
  offerPacks: ProductOfferPackView[];
  images: { url: string; alt: string | null }[];
  videos: ProductVideoView[];
  documents: ProductDocumentView[];
  specs: ProductSpecView[];
  contentBlocks: ContentBlockView[];
  options: ProductOptionView[];
  variants: ProductVariantView[];
  faqs: { question: string; answer: string }[];
  tags: string[];
  related: { type: ProductRelationType; product: ProductCard }[];
  seo: { title: string; description: string | null };
}

export interface StoreBrandView {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  tagline: string | null;
}

export interface CategoryBrandView {
  name: string;
  slug: string;
  logoUrl: string | null;
  tagline: string | null;
  productCount: number;
}

export interface ProductRecommendations {
  relatedOffers: ProductCard[];
  related: ProductCard[];
  categoryBrands: CategoryBrandView[];
}

export interface ProductImageInput {
  url: string;
  alt?: string;
  position?: number;
  isCover?: boolean;
}

export interface ProductOfferPackInput {
  eyebrow?: string | null;
  title: string;
  badgeLabel: string;
  quantity: number;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  isHighlighted?: boolean;
}

export interface ProductOptionValueInput {
  id?: string;
  value: string;
  swatchImageUrl?: string | null;
  swatchHex?: string | null;
}

export interface ProductOptionInput {
  id?: string;
  name: string;
  values: ProductOptionValueInput[];
}

export interface ProductVariantInput {
  id?: string;
  optionValues: string[];
  sku?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  stock?: number | null;
  stockBaseline?: number | null;
  imageUrl?: string | null;
  weightKg?: number | null;
  isActive?: boolean | null;
}

export interface ProductSpecInput {
  group: ProductSpecGroup;
  label: string;
  value: string;
  isKey?: boolean;
}

export interface ProductVideoInput {
  url: string;
  posterUrl?: string | null;
  title?: string | null;
  durationSeconds?: number | null;
}

export interface ProductDocumentInput {
  title: string;
  url: string;
  kind: ProductDocumentKind;
  sizeBytes?: number | null;
}

export interface ContentBlockInput {
  layout: ContentBlockLayout;
  title?: string | null;
  body?: string | null;
  imageUrl: string;
  imageAlt?: string | null;
}

export interface ProductRelationInput {
  relatedProductId: string;
  type: ProductRelationType;
}

export interface ProductFaqInput {
  question: string;
  answer: string;
}

export interface AdminProductPayload {
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  technicalContent?: string | null;
  presentation?: string | null;
  performance?: string | null;
  usageInstructions?: string | null;
  precautions?: string | null;
  status?: ProductStatus;
  brandId?: string;
  categoryId?: string;
  basePrice: number;
  compareAtPrice?: number;
  promoPrice?: number;
  promoStartsAt?: string;
  promoEndsAt?: string;
  taxRatePercent?: number;
  costPrice?: number | null;
  promoBuyQuantity?: number | null;
  usageMediaUrl?: string | null;
  usageMediaKind?: UsageMediaKind | null;
  topBannerUrl?: string | null;
  topBannerLinkUrl?: string | null;
  topBannerAlt?: string | null;
  bottomBannerUrl?: string | null;
  bottomBannerLinkUrl?: string | null;
  bottomBannerAlt?: string | null;
  topBannerHeight?: number | null;
  topBannerFocus?: BannerFocus | null;
  topBannerTitle?: string | null;
  topBannerSubtitle?: string | null;
  topBannerCtaLabel?: string | null;
  topBannerTextPlacement?: BannerTextPlacement | null;
  topBannerTextOnDark?: boolean;
  topBannerOverlay?: number | null;
  bottomBannerHeight?: number | null;
  bottomBannerFocus?: BannerFocus | null;
  bottomBannerTitle?: string | null;
  bottomBannerSubtitle?: string | null;
  bottomBannerCtaLabel?: string | null;
  bottomBannerTextPlacement?: BannerTextPlacement | null;
  bottomBannerTextOnDark?: boolean;
  bottomBannerOverlay?: number | null;
  highlightsTitle?: string | null;
  highlightsSubtitle?: string | null;
  descriptionTitle?: string | null;
  descriptionSubtitle?: string | null;
  usageTitle?: string | null;
  videosTitle?: string | null;
  documentsTitle?: string | null;
  contentTitle?: string | null;
  offerPacks?: ProductOfferPackInput[];
  stock?: number;
  stockBaseline?: number;
  expectedVersion?: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  isFeatured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  highlights?: string[];
  warrantyText?: string | null;
  tags?: string[];
  images?: ProductImageInput[];
  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];
  faqs?: ProductFaqInput[];
  relations?: ProductRelationInput[];
  specs?: ProductSpecInput[];
  videos?: ProductVideoInput[];
  documents?: ProductDocumentInput[];
  contentBlocks?: ContentBlockInput[];
}

export interface BrandPayload {
  name: string;
  slug: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  tagline?: string | null;
  isActive?: boolean;
  position?: number;
  contentBlocks?: ContentBlockInput[];
}

export interface AdminContentBlock {
  id: string;
  productId: string | null;
  brandId: string | null;
  layout: ContentBlockLayout;
  title: string | null;
  body: string | null;
  imageUrl: string;
  imageAlt: string | null;
  position: number;
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  tagline: string | null;
  isActive: boolean;
  position: number;
  _count: { products: number };
}

export interface AdminBrandDetail extends AdminBrand {
  contentBlocks: AdminContentBlock[];
}

export interface AdminProductSpec {
  id: string;
  productId: string;
  group: ProductSpecGroup;
  label: string;
  value: string;
  isKey: boolean;
  position: number;
}

export interface AdminProductVideo {
  id: string;
  productId: string;
  url: string;
  posterUrl: string | null;
  title: string | null;
  durationSeconds: number | null;
  position: number;
}

export interface AdminProductDocument {
  id: string;
  productId: string;
  title: string;
  url: string;
  kind: ProductDocumentKind;
  sizeBytes: number | null;
  position: number;
}

export interface AdminProductRelation {
  id: string;
  productId: string;
  relatedProductId: string;
  type: ProductRelationType;
  relatedProduct: {
    id: string;
    name: string;
    slug: string;
    sku: string | null;
    status: ProductStatus;
    deletedAt: string | null;
    images: { url: string }[];
  };
}

export interface AdminOptionValue {
  id: string;
  optionId: string;
  value: string;
  position: number;
  swatchImageUrl: string | null;
  swatchHex: string | null;
}

export interface AdminProductOption {
  id: string;
  productId: string;
  name: string;
  position: number;
  values: AdminOptionValue[];
}

export interface AdminProductVariant {
  id: string;
  productId: string;
  sku: string | null;
  price: string | null;
  compareAtPrice: string | null;
  stock: number;
  imageUrl: string | null;
  weightKg: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  optionValues: {
    variantId: string;
    optionValueId: string;
    optionValue: AdminOptionValue & { option: { id: string; productId: string; name: string; position: number } };
  }[];
  _count?: { cartItems: number; priceListEntries: number };
}

export interface AdminOfferPack {
  id: string;
  eyebrow: string | null;
  title: string;
  badgeLabel: string;
  quantity: number;
  price: string;
  compareAtPrice: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  isHighlighted: boolean;
  position: number;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  technicalContent: string | null;
  presentation: string | null;
  performance: string | null;
  usageInstructions: string | null;
  precautions: string | null;
  status: ProductStatus;
  brandId: string | null;
  categoryId: string | null;
  basePrice: string;
  compareAtPrice: string | null;
  promoPrice: string | null;
  promoStartsAt: string | null;
  promoEndsAt: string | null;
  taxRatePercent: string | null;
  stock: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  weightKg: string | null;
  lengthCm: string | null;
  widthCm: string | null;
  heightCm: string | null;
  position: number;
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  highlights: string[] | null;
  warrantyText: string | null;
  costPrice: string | null;
  promoBuyQuantity: number | null;
  usageMediaUrl: string | null;
  usageMediaKind: UsageMediaKind | null;
  topBannerUrl: string | null;
  topBannerLinkUrl: string | null;
  topBannerAlt: string | null;
  bottomBannerUrl: string | null;
  bottomBannerLinkUrl: string | null;
  bottomBannerAlt: string | null;
  topBannerHeight: number | null;
  topBannerFocus: BannerFocus | null;
  topBannerTitle: string | null;
  topBannerSubtitle: string | null;
  topBannerCtaLabel: string | null;
  topBannerTextPlacement: BannerTextPlacement | null;
  topBannerTextOnDark: boolean;
  topBannerOverlay: number | null;
  bottomBannerHeight: number | null;
  bottomBannerFocus: BannerFocus | null;
  bottomBannerTitle: string | null;
  bottomBannerSubtitle: string | null;
  bottomBannerCtaLabel: string | null;
  bottomBannerTextPlacement: BannerTextPlacement | null;
  bottomBannerTextOnDark: boolean;
  bottomBannerOverlay: number | null;
  highlightsTitle: string | null;
  highlightsSubtitle: string | null;
  descriptionTitle: string | null;
  descriptionSubtitle: string | null;
  usageTitle: string | null;
  videosTitle: string | null;
  documentsTitle: string | null;
  contentTitle: string | null;
  offerPacks: AdminOfferPack[];
  version?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  images: { id: string; url: string; alt: string | null; position: number; isCover: boolean }[];
  options: AdminProductOption[];
  variants: AdminProductVariant[];
  faqs: { id: string; question: string; answer: string; position: number }[];
  tags: { productId: string; tagId: string; tag: { id: string; name: string } }[];
  relationsFrom: AdminProductRelation[];
  specs: AdminProductSpec[];
  videos: AdminProductVideo[];
  documents: AdminProductDocument[];
  contentBlocks: AdminContentBlock[];
}

export interface CartBundlePromo {
  buyQuantity: number;
  getQuantity: number;
  freeUnits: number;
  chargedUnits: number;
  unitsForNextFree: number;
  label: string;
}

export interface CartItemView {
  id: string;
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantLabel: string | null;
  imageUrl: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  bundle: CartBundlePromo | null;
  availableStock: number;
  allowBackorder: boolean;
  unavailable?: boolean;
}

export interface CartSuggestion {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
}

export interface CartView {
  id: string;
  sessionToken: string;
  items: CartItemView[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxIncluded: number;
  total: number;
  coupon: { code: string; discount: number } | null;
  couponError: string | null;
  shipping: { available: boolean; rate: number; freeShipping: boolean } | null;
  freeShippingThreshold: number | null;
  suggestions: CartSuggestion[];
}

export interface BannerView {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  buttonText: string | null;
  section: "HOME_HERO" | "HOME_PROMO" | "CATEGORY";
  position: number;
}

export interface MenuItemView {
  id: string;
  location: "HEADER" | "FOOTER";
  label: string;
  url: string;
  position: number;
  parentId: string | null;
}

export interface StaticPageView {
  slug: string;
  title: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface BlogPostView {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
}

export interface CheckoutResponse {
  orderId: string;
  orderNumber: string;
  grandTotal: number;
  payment: {
    gateway: string;
    externalId: string | null;
    clientSecret: string | null;
    publicKey: string | null;
    redirectUrl: string | null;
    requiresOnlinePayment: boolean;
  };
}

export interface ReviewView {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ReviewsResponse extends Paginated<ReviewView> {
  summary: {
    average: number | null;
    count: number;
    distribution: { rating: number; count: number }[];
  };
}

export interface QuestionView {
  id: string;
  authorName: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
}

export interface SuggestProduct {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  categoryName: string | null;
  brandName: string | null;
}

export interface SearchSuggestions {
  query: string;
  products: SuggestProduct[];
  categories: { name: string; slug: string }[];
  brands: { name: string; slug: string }[];
}

export interface StorefrontStats {
  products: number;
  categories: number;
  brands: number;
  unitsInStock: number;
  ordersDelivered: number;
  customers: number;
  cities: number;
}

export interface WelcomePopupSettings {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  couponCode?: string;
}

export interface CustomerSession {
  accessToken: string;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
}

export interface StaffSession {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isSuperadmin: boolean;
    roleName: string | null;
    permissions: string[];
  };
}

export interface OrderItemView {
  id: string;
  name: string;
  sku: string | null;
  variantLabel: string | null;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
}

export interface OrderView {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  customerName: string;
  customerPhone: string | null;
  shippingMethod: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  shippingTotal: string;
  grandTotal: string;
  couponCode: string | null;
  shippingRecipient: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  customerNote: string | null;
  createdAt: string;
  items: OrderItemView[];
  payments?: { gateway: string; status: string; amount: string; createdAt: string }[];
  statusHistory?: { fromStatus: string | null; toStatus: string; note: string | null; createdAt: string }[];
  notes?: { note: string; createdAt: string; user: { firstName: string; lastName: string } | null }[];
}

export interface AddressView {
  id: string;
  type: "SHIPPING" | "BILLING";
  label: string | null;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  isDefault: boolean;
  documentType: string | null;
  documentNumber: string | null;
  companyName: string | null;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  PAYMENT_CONFIRMED: "Pago confirmado",
  PREPARING: "En preparación",
  SHIPPED: "Despachado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado"
};
