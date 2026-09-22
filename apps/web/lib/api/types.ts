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

export interface ProductOptionView {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

export interface ProductVariantView {
  id: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  imageUrl: string | null;
  optionValueIds: string[];
  label: string;
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
  category: { name: string; slug: string } | null;
  price: number;
  compareAtPrice: number | null;
  onPromo: boolean;
  stock: number;
  inStock: boolean;
  lowStock: boolean;
  allowBackorder: boolean;
  rating: number | null;
  reviewCount: number;
  images: { url: string; alt: string | null }[];
  options: ProductOptionView[];
  variants: ProductVariantView[];
  faqs: { question: string; answer: string }[];
  tags: string[];
  related: { type: string; product: ProductCard }[];
  seo: { title: string; description: string | null };
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
  availableStock: number;
  allowBackorder: boolean;
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
