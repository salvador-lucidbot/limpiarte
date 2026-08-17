import { StaffSession } from "../api/types";

export const DEMO_STAFF_USER: StaffSession["user"] = {
  id: "demo-user",
  email: "demo@limpiarte.local",
  firstName: "Usuario",
  lastName: "Demo",
  isSuperadmin: true,
  roleName: "Superadministrador (demo)",
  permissions: []
};

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
}

function salesSeries(): { date: string; total: number; previousTotal: number }[] {
  const base = [
    420, 610, 380, 720, 890, 540, 310, 660, 940, 1180, 760, 520, 830, 1020, 690, 450, 880, 1240, 970, 610, 740, 1360, 1090,
    820, 560, 930, 1420, 1180, 860, 1310
  ];

  return base.map((value, index) => ({
    date: daysAgoIso(29 - index).slice(0, 10),
    total: value * 1000,
    previousTotal: Math.round(value * 1000 * 0.78)
  }));
}

export interface DemoOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  customerPhone: string | null;
  status: string;
  shippingMethod: string;
  shippingCity: string | null;
  shippingState: string | null;
  shippingRecipient: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  shippingTotal: string;
  grandTotal: string;
  couponCode: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  customerNote: string | null;
  createdAt: string;
  _count: { items: number };
  payments: { gateway: string; status: string; amount: string; createdAt: string }[];
  items: {
    id: string;
    name: string;
    sku: string | null;
    variantLabel: string | null;
    unitPrice: string;
    quantity: number;
    totalPrice: string;
  }[];
  statusHistory: { fromStatus: string | null; toStatus: string; note: string | null; createdAt: string }[];
  notes: { note: string; createdAt: string; user: { firstName: string; lastName: string } | null }[];
}

const DEMO_ORDERS: DemoOrder[] = [
  {
    id: "demo-order-1",
    orderNumber: "LP-20260817-A3F2C1",
    customerName: "María Fernanda Ríos",
    email: "mariafernanda@example.com",
    customerPhone: "3105558842",
    status: "PAYMENT_CONFIRMED",
    shippingMethod: "DELIVERY",
    shippingCity: "Bogotá",
    shippingState: "Cundinamarca",
    shippingRecipient: "María Fernanda Ríos",
    shippingLine1: "Calle 127 #15-40",
    shippingLine2: "Apto 802, Torre B",
    subtotal: "96700",
    discountTotal: "9670",
    taxTotal: "0",
    shippingTotal: "0",
    grandTotal: "87030",
    couponCode: "BIENVENIDA10",
    carrier: null,
    trackingNumber: null,
    customerNote: "Entregar preferiblemente en la tarde.",
    createdAt: daysAgoIso(0),
    _count: { items: 3 },
    payments: [{ gateway: "stripe", status: "APPROVED", amount: "87030", createdAt: daysAgoIso(0) }],
    items: [
      { id: "demo-item-1", name: "Desinfectante multiusos concentrado", sku: "DEMO-001", variantLabel: "Galón", unitPrice: "38900", quantity: 1, totalPrice: "38900" },
      { id: "demo-item-2", name: "Limpiavidrios profesional sin marcas", sku: "DEMO-003", variantLabel: null, unitPrice: "14900", quantity: 2, totalPrice: "29800" },
      { id: "demo-item-3", name: "Ambientador textil aroma lavanda", sku: "DEMO-004", variantLabel: null, unitPrice: "22400", quantity: 1, totalPrice: "22400" }
    ],
    statusHistory: [
      { fromStatus: null, toStatus: "NEW", note: null, createdAt: daysAgoIso(0) },
      { fromStatus: "NEW", toStatus: "PAYMENT_CONFIRMED", note: "Pago aprobado por la pasarela", createdAt: daysAgoIso(0) }
    ],
    notes: [{ note: "Cliente frecuente, priorizar despacho.", createdAt: daysAgoIso(0), user: { firstName: "Usuario", lastName: "Demo" } }]
  },
  {
    id: "demo-order-2",
    orderNumber: "LP-20260816-B71E4D",
    customerName: "Comercializadora Andina SAS",
    email: "compras@andina.com.co",
    customerPhone: "6014448899",
    status: "SHIPPED",
    shippingMethod: "DELIVERY",
    shippingCity: "Medellín",
    shippingState: "Antioquia",
    shippingRecipient: "Área de compras",
    shippingLine1: "Carrera 43A #18-95",
    shippingLine2: "Oficina 504",
    subtotal: "412600",
    discountTotal: "0",
    taxTotal: "0",
    shippingTotal: "15000",
    grandTotal: "427600",
    couponCode: null,
    carrier: "Servientrega",
    trackingNumber: "SE998877665",
    customerNote: null,
    createdAt: daysAgoIso(1),
    _count: { items: 4 },
    payments: [{ gateway: "stripe", status: "APPROVED", amount: "427600", createdAt: daysAgoIso(1) }],
    items: [
      { id: "demo-item-4", name: "Desinfectante multiusos concentrado", sku: "DEMO-001", variantLabel: "Galón", unitPrice: "38900", quantity: 6, totalPrice: "233400" },
      { id: "demo-item-5", name: "Gel antibacterial 70% alcohol", sku: "DEMO-011", variantLabel: null, unitPrice: "21900", quantity: 4, totalPrice: "87600" },
      { id: "demo-item-6", name: "Guantes de nitrilo desechables x100", sku: "DEMO-009", variantLabel: null, unitPrice: "39900", quantity: 2, totalPrice: "79800" },
      { id: "demo-item-7", name: "Trapeador de microfibra con balde escurridor", sku: "DEMO-008", variantLabel: null, unitPrice: "11800", quantity: 1, totalPrice: "11800" }
    ],
    statusHistory: [
      { fromStatus: null, toStatus: "NEW", note: null, createdAt: daysAgoIso(1) },
      { fromStatus: "NEW", toStatus: "PAYMENT_CONFIRMED", note: null, createdAt: daysAgoIso(1) },
      { fromStatus: "PAYMENT_CONFIRMED", toStatus: "PREPARING", note: "Alistamiento en bodega", createdAt: daysAgoIso(1) },
      { fromStatus: "PREPARING", toStatus: "SHIPPED", note: "Despachado con Servientrega", createdAt: daysAgoIso(0) }
    ],
    notes: []
  },
  {
    id: "demo-order-3",
    orderNumber: "LP-20260815-C29A8B",
    customerName: "Julián Estrada",
    email: "julian.estrada@example.com",
    customerPhone: "3018887744",
    status: "DELIVERED",
    shippingMethod: "PICKUP",
    shippingCity: null,
    shippingState: null,
    shippingRecipient: null,
    shippingLine1: null,
    shippingLine2: null,
    subtotal: "68900",
    discountTotal: "0",
    taxTotal: "0",
    shippingTotal: "0",
    grandTotal: "68900",
    couponCode: null,
    carrier: null,
    trackingNumber: null,
    customerNote: null,
    createdAt: daysAgoIso(3),
    _count: { items: 1 },
    payments: [{ gateway: "stripe", status: "APPROVED", amount: "68900", createdAt: daysAgoIso(3) }],
    items: [
      { id: "demo-item-8", name: "Trapeador de microfibra con balde escurridor", sku: "DEMO-008", variantLabel: null, unitPrice: "68900", quantity: 1, totalPrice: "68900" }
    ],
    statusHistory: [
      { fromStatus: null, toStatus: "NEW", note: null, createdAt: daysAgoIso(3) },
      { fromStatus: "NEW", toStatus: "PAYMENT_CONFIRMED", note: null, createdAt: daysAgoIso(3) },
      { fromStatus: "PAYMENT_CONFIRMED", toStatus: "PREPARING", note: null, createdAt: daysAgoIso(2) },
      { fromStatus: "PREPARING", toStatus: "DELIVERED", note: "Recogido en sede", createdAt: daysAgoIso(2) }
    ],
    notes: []
  },
  {
    id: "demo-order-4",
    orderNumber: "LP-20260814-D55F30",
    customerName: "Sandra Milena Ochoa",
    email: "sandra.ochoa@example.com",
    customerPhone: "3159994411",
    status: "NEW",
    shippingMethod: "DELIVERY",
    shippingCity: "Cali",
    shippingState: "Valle del Cauca",
    shippingRecipient: "Sandra Ochoa",
    shippingLine1: "Avenida 6N #23-18",
    shippingLine2: null,
    subtotal: "55800",
    discountTotal: "0",
    taxTotal: "0",
    shippingTotal: "12000",
    grandTotal: "67800",
    couponCode: null,
    carrier: null,
    trackingNumber: null,
    customerNote: null,
    createdAt: daysAgoIso(4),
    _count: { items: 2 },
    payments: [{ gateway: "stripe", status: "REJECTED", amount: "67800", createdAt: daysAgoIso(4) }],
    items: [
      { id: "demo-item-9", name: "Detergente líquido para ropa 3 L", sku: "DEMO-005", variantLabel: "3 L", unitPrice: "44900", quantity: 1, totalPrice: "44900" },
      { id: "demo-item-10", name: "Limpiavidrios profesional sin marcas", sku: "DEMO-003", variantLabel: null, unitPrice: "10900", quantity: 1, totalPrice: "10900" }
    ],
    statusHistory: [{ fromStatus: null, toStatus: "NEW", note: null, createdAt: daysAgoIso(4) }],
    notes: [{ note: "Pago rechazado por el banco emisor. Contactar al cliente.", createdAt: daysAgoIso(4), user: { firstName: "Usuario", lastName: "Demo" } }]
  },
  {
    id: "demo-order-5",
    orderNumber: "LP-20260812-E10B77",
    customerName: "Hotel Casa Verde",
    email: "administracion@casaverde.co",
    customerPhone: "6072223344",
    status: "CANCELLED",
    shippingMethod: "DELIVERY",
    shippingCity: "Bucaramanga",
    shippingState: "Santander",
    shippingRecipient: "Recepción",
    shippingLine1: "Calle 36 #22-10",
    shippingLine2: null,
    subtotal: "189400",
    discountTotal: "0",
    taxTotal: "0",
    shippingTotal: "18000",
    grandTotal: "207400",
    couponCode: null,
    carrier: null,
    trackingNumber: null,
    customerNote: null,
    createdAt: daysAgoIso(6),
    _count: { items: 2 },
    payments: [{ gateway: "manual", status: "PENDING", amount: "207400", createdAt: daysAgoIso(6) }],
    items: [
      { id: "demo-item-11", name: "Ambientador textil aroma lavanda", sku: "DEMO-004", variantLabel: null, unitPrice: "22400", quantity: 5, totalPrice: "112000" },
      { id: "demo-item-12", name: "Removedor de grasa para cocina industrial", sku: "DEMO-006", variantLabel: null, unitPrice: "32900", quantity: 2, totalPrice: "65800" }
    ],
    statusHistory: [
      { fromStatus: null, toStatus: "NEW", note: null, createdAt: daysAgoIso(6) },
      { fromStatus: "NEW", toStatus: "CANCELLED", note: "Solicitud del cliente", createdAt: daysAgoIso(5) }
    ],
    notes: []
  }
];

export function demoAdminData(path: string): unknown | undefined {
  const [rawPath] = path.split("?");
  const cleanPath = rawPath ?? path;

  if (cleanPath === "/admin/reports/dashboard") {
    return {
      sales: { today: 87030, week: 582430, month: 24680000, averageTicket: 142900 },
      ordersByStatus: [
        { status: "NEW", count: 4 },
        { status: "PAYMENT_CONFIRMED", count: 7 },
        { status: "PREPARING", count: 3 },
        { status: "SHIPPED", count: 12 },
        { status: "DELIVERED", count: 141 },
        { status: "CANCELLED", count: 6 }
      ],
      conversionRate: 3.42,
      salesSeries: salesSeries(),
      topProducts: [
        { name: "Desinfectante multiusos concentrado", quantity: 148, total: 5757200 },
        { name: "Gel antibacterial 70% alcohol", quantity: 96, total: 2102400 },
        { name: "Jabón líquido antibacterial para manos", quantity: 84, total: 1554000 },
        { name: "Limpiavidrios profesional sin marcas", quantity: 71, total: 1057900 },
        { name: "Trapeador de microfibra con balde escurridor", quantity: 38, total: 2618200 }
      ],
      salesByCategory: [
        { category: "Desinfectantes", total: 8420000 },
        { category: "Limpieza general", total: 5310000 },
        { category: "Cuidado personal", total: 4180000 },
        { category: "Implementos", total: 3560000 },
        { category: "Lavandería", total: 2110000 },
        { category: "Ambientadores", total: 1100000 }
      ],
      salesByCity: [
        { city: "Bogotá", total: 11240000, orders: 78 },
        { city: "Medellín", total: 5860000, orders: 34 },
        { city: "Cali", total: 3420000, orders: 21 },
        { city: "Barranquilla", total: 2180000, orders: 14 },
        { city: "Bucaramanga", total: 1980000, orders: 11 }
      ],
      abandonedCarts: { count: 23, potentialValue: 1847500 },
      alerts: { pendingDispatch: 10, rejectedPayments: 2, lowStockProducts: 3 }
    };
  }

  if (cleanPath.startsWith("/admin/orders/") && cleanPath.split("/").length === 4) {
    const id = cleanPath.split("/")[3];
    return DEMO_ORDERS.find((order) => order.id === id) ?? DEMO_ORDERS[0];
  }

  if (cleanPath === "/admin/orders") {
    return { data: DEMO_ORDERS, meta: { page: 1, perPage: 25, total: DEMO_ORDERS.length, totalPages: 1 } };
  }

  if (cleanPath === "/admin/catalog/products") {
    return {
      data: [
        { id: "demo-product-1", name: "Desinfectante multiusos concentrado", slug: "desinfectante-multiusos-galon", sku: "DEMO-001", status: "ACTIVE", basePrice: "38900", stock: 42, isFeatured: true, category: { name: "Desinfectantes" }, images: [] },
        { id: "demo-product-2", name: "Jabón líquido antibacterial para manos", slug: "jabon-liquido-manos-antibacterial", sku: "DEMO-002", status: "ACTIVE", basePrice: "18500", stock: 87, isFeatured: true, category: { name: "Cuidado personal" }, images: [] },
        { id: "demo-product-3", name: "Limpiavidrios profesional sin marcas", slug: "limpiavidrios-profesional", sku: "DEMO-003", status: "ACTIVE", basePrice: "14900", stock: 63, isFeatured: true, category: { name: "Limpieza general" }, images: [] },
        { id: "demo-product-4", name: "Ambientador textil aroma lavanda", slug: "ambientador-lavanda-textil", sku: "DEMO-004", status: "ACTIVE", basePrice: "22400", stock: 35, isFeatured: true, category: { name: "Ambientadores" }, images: [] },
        { id: "demo-product-5", name: "Detergente líquido para ropa 3 L", slug: "detergente-liquido-ropa", sku: "DEMO-005", status: "ACTIVE", basePrice: "44900", stock: 28, isFeatured: false, category: { name: "Lavandería" }, images: [] },
        { id: "demo-product-9", name: "Guantes de nitrilo desechables x100", slug: "guantes-nitrilo-caja", sku: "DEMO-009", status: "ACTIVE", basePrice: "39900", stock: 4, isFeatured: false, category: { name: "Protección" }, images: [] },
        { id: "demo-product-10", name: "Blanqueador sin cloro para ropa de color", slug: "blanqueador-ropa-color", sku: "DEMO-010", status: "DRAFT", basePrice: "16900", stock: 0, isFeatured: false, category: { name: "Lavandería" }, images: [] }
      ],
      meta: { page: 1, perPage: 20, total: 7, totalPages: 1 }
    };
  }

  if (cleanPath === "/admin/catalog/categories") {
    return [
      { id: "demo-cat-1", name: "Desinfectantes", slug: "desinfectantes", parentId: null, position: 0, isActive: true, bannerUrl: null, _count: { products: 3 }, children: [] },
      { id: "demo-cat-2", name: "Limpieza general", slug: "limpieza-general", parentId: null, position: 1, isActive: true, bannerUrl: null, _count: { products: 4 }, children: [] },
      { id: "demo-cat-2-1", name: "Cocina", slug: "cocina", parentId: "demo-cat-2", position: 0, isActive: true, bannerUrl: null, _count: { products: 1 }, children: [] },
      { id: "demo-cat-3", name: "Lavandería", slug: "lavanderia", parentId: null, position: 2, isActive: true, bannerUrl: null, _count: { products: 2 }, children: [] },
      { id: "demo-cat-4", name: "Ambientadores", slug: "ambientadores", parentId: null, position: 3, isActive: true, bannerUrl: null, _count: { products: 2 }, children: [] },
      { id: "demo-cat-5", name: "Cuidado personal", slug: "cuidado-personal", parentId: null, position: 4, isActive: true, bannerUrl: null, _count: { products: 2 }, children: [] },
      { id: "demo-cat-6", name: "Implementos", slug: "implementos", parentId: null, position: 5, isActive: true, bannerUrl: null, _count: { products: 2 }, children: [] },
      { id: "demo-cat-7", name: "Protección", slug: "proteccion", parentId: null, position: 6, isActive: false, bannerUrl: null, _count: { products: 1 }, children: [] }
    ];
  }

  if (cleanPath === "/admin/catalog/brands") {
    return [
      { id: "demo-brand-1", name: "Limpiarte Pro", slug: "limpiarte-pro" },
      { id: "demo-brand-2", name: "Fresh Home", slug: "fresh-home" },
      { id: "demo-brand-3", name: "CleanTools", slug: "cleantools" },
      { id: "demo-brand-4", name: "SafeGrip", slug: "safegrip" }
    ];
  }

  if (cleanPath === "/admin/inventory/low-stock") {
    return [
      { id: "demo-product-9", name: "Guantes de nitrilo desechables x100", sku: "DEMO-009", stock: 4, lowStockThreshold: 10 },
      { id: "demo-product-10", name: "Blanqueador sin cloro para ropa de color", sku: "DEMO-010", stock: 0, lowStockThreshold: 5 },
      { id: "demo-product-8", name: "Trapeador de microfibra con balde escurridor", sku: "DEMO-008", stock: 12, lowStockThreshold: 15 }
    ];
  }

  if (cleanPath === "/admin/inventory/movements") {
    return {
      data: [
        { id: "demo-mov-1", quantityDelta: -1, reason: "SALE", reference: "LP-20260817-A3F2C1", note: null, createdAt: daysAgoIso(0), product: { name: "Desinfectante multiusos concentrado", sku: "DEMO-001" }, variant: null, user: null },
        { id: "demo-mov-2", quantityDelta: -6, reason: "SALE", reference: "LP-20260816-B71E4D", note: null, createdAt: daysAgoIso(1), product: { name: "Desinfectante multiusos concentrado", sku: "DEMO-001" }, variant: null, user: null },
        { id: "demo-mov-3", quantityDelta: 60, reason: "RESTOCK", reference: "OC-4412", note: "Ingreso de proveedor", createdAt: daysAgoIso(2), product: { name: "Gel antibacterial 70% alcohol", sku: "DEMO-011" }, variant: null, user: { firstName: "Usuario", lastName: "Demo" } },
        { id: "demo-mov-4", quantityDelta: 5, reason: "CANCELLATION", reference: "LP-20260812-E10B77", note: null, createdAt: daysAgoIso(5), product: { name: "Ambientador textil aroma lavanda", sku: "DEMO-004" }, variant: null, user: null },
        { id: "demo-mov-5", quantityDelta: -2, reason: "ADJUSTMENT", reference: null, note: "Producto averiado en bodega", createdAt: daysAgoIso(7), product: { name: "Guantes de nitrilo desechables x100", sku: "DEMO-009" }, variant: null, user: { firstName: "Usuario", lastName: "Demo" } }
      ],
      meta: { page: 1, perPage: 30, total: 5, totalPages: 1 }
    };
  }

  if (cleanPath === "/admin/customers") {
    return {
      data: [
        { id: "demo-cus-1", email: "mariafernanda@example.com", firstName: "María Fernanda", lastName: "Ríos", phone: "3105558842", isActive: true, createdAt: daysAgoIso(120), tags: ["Cliente frecuente"], ordersCount: 9, totalSpent: 812400, lastOrderAt: daysAgoIso(0) },
        { id: "demo-cus-2", email: "compras@andina.com.co", firstName: "Comercializadora", lastName: "Andina SAS", phone: "6014448899", isActive: true, createdAt: daysAgoIso(210), tags: ["Corporativo", "Mayorista"], ordersCount: 24, totalSpent: 9840600, lastOrderAt: daysAgoIso(1) },
        { id: "demo-cus-3", email: "julian.estrada@example.com", firstName: "Julián", lastName: "Estrada", phone: "3018887744", isActive: true, createdAt: daysAgoIso(45), tags: [], ordersCount: 3, totalSpent: 184700, lastOrderAt: daysAgoIso(3) },
        { id: "demo-cus-4", email: "sandra.ochoa@example.com", firstName: "Sandra Milena", lastName: "Ochoa", phone: "3159994411", isActive: true, createdAt: daysAgoIso(30), tags: [], ordersCount: 1, totalSpent: 0, lastOrderAt: daysAgoIso(4) },
        { id: "demo-cus-5", email: "administracion@casaverde.co", firstName: "Hotel", lastName: "Casa Verde", phone: "6072223344", isActive: true, createdAt: daysAgoIso(300), tags: ["Corporativo"], ordersCount: 15, totalSpent: 4210800, lastOrderAt: daysAgoIso(6) },
        { id: "demo-cus-6", email: "carlos.mejia@example.com", firstName: "Carlos", lastName: "Mejía", phone: null, isActive: false, createdAt: daysAgoIso(400), tags: ["Inactivo"], ordersCount: 2, totalSpent: 96300, lastOrderAt: daysAgoIso(280) }
      ],
      meta: { page: 1, perPage: 25, total: 6, totalPages: 1 }
    };
  }

  if (cleanPath === "/admin/coupons") {
    return {
      data: [
        { id: "demo-coup-1", code: "BIENVENIDA10", description: "10% en la primera compra", discountType: "PERCENT", value: "10", minSubtotal: "50000", maxUses: 500, usedCount: 187, startsAt: daysAgoIso(60), endsAt: null, isActive: true },
        { id: "demo-coup-2", code: "ENVIOGRATIS", description: "Envío gratis desde $120.000", discountType: "FIXED", value: "15000", minSubtotal: "120000", maxUses: null, usedCount: 64, startsAt: daysAgoIso(30), endsAt: daysAgoIso(-30), isActive: true },
        { id: "demo-coup-3", code: "MAYORISTA15", description: "15% para clientes corporativos", discountType: "PERCENT", value: "15", minSubtotal: "500000", maxUses: 100, usedCount: 12, startsAt: null, endsAt: null, isActive: true },
        { id: "demo-coup-4", code: "NAVIDAD2025", description: "Campaña navideña", discountType: "PERCENT", value: "20", minSubtotal: null, maxUses: 300, usedCount: 300, startsAt: daysAgoIso(240), endsAt: daysAgoIso(200), isActive: false }
      ],
      meta: { page: 1, perPage: 50, total: 4, totalPages: 1 }
    };
  }

  if (cleanPath === "/admin/shipping/zones") {
    return [
      { id: "demo-zone-1", name: "Bogotá y alrededores", rate: "12000", freeShippingThreshold: "150000", isActive: true, cities: [{ id: "c1", city: "Bogotá", state: "Cundinamarca" }, { id: "c2", city: "Chía", state: "Cundinamarca" }, { id: "c3", city: "Soacha", state: "Cundinamarca" }] },
      { id: "demo-zone-2", name: "Ciudades principales", rate: "15000", freeShippingThreshold: "200000", isActive: true, cities: [{ id: "c4", city: "Medellín", state: "Antioquia" }, { id: "c5", city: "Cali", state: "Valle del Cauca" }, { id: "c6", city: "Barranquilla", state: "Atlántico" }] },
      { id: "demo-zone-3", name: "Resto del país", rate: "22000", freeShippingThreshold: null, isActive: true, cities: [{ id: "c7", city: "Bucaramanga", state: "Santander" }, { id: "c8", city: "Pereira", state: "Risaralda" }] }
    ];
  }

  if (cleanPath === "/admin/users") {
    return {
      data: [
        { id: "demo-user", email: "demo@limpiarte.local", firstName: "Usuario", lastName: "Demo", isActive: true, isSuperadmin: true, lastLoginAt: daysAgoIso(0), role: null },
        { id: "demo-u2", email: "catalogo@limpiarte.co", firstName: "Laura", lastName: "Gómez", isActive: true, isSuperadmin: false, lastLoginAt: daysAgoIso(1), role: { id: "r2", name: "Gestor de catálogo" } },
        { id: "demo-u3", email: "despachos@limpiarte.co", firstName: "Andrés", lastName: "Pineda", isActive: true, isSuperadmin: false, lastLoginAt: daysAgoIso(0), role: { id: "r3", name: "Gestor de pedidos" } },
        { id: "demo-u4", email: "servicio@limpiarte.co", firstName: "Paola", lastName: "Restrepo", isActive: true, isSuperadmin: false, lastLoginAt: daysAgoIso(2), role: { id: "r4", name: "Agente de servicio al cliente" } },
        { id: "demo-u5", email: "marketing@limpiarte.co", firstName: "Diego", lastName: "Salas", isActive: false, isSuperadmin: false, lastLoginAt: daysAgoIso(45), role: { id: "r5", name: "Marketing y contenidos" } }
      ],
      meta: { page: 1, perPage: 50, total: 5, totalPages: 1 }
    };
  }

  if (cleanPath === "/admin/roles/permissions") {
    return [
      { id: "p1", key: "dashboard.view", module: "dashboard", description: "Ver tablero principal" },
      { id: "p2", key: "catalog.manage", module: "catalog", description: "Gestionar catálogo, precios e inventario" },
      { id: "p3", key: "orders.view", module: "orders", description: "Consultar pedidos" },
      { id: "p4", key: "orders.manage", module: "orders", description: "Gestionar estados y despachos de pedidos" },
      { id: "p5", key: "customers.view", module: "customers", description: "Consultar clientes" },
      { id: "p6", key: "customers.manage", module: "customers", description: "Gestionar clientes y exportar la base" },
      { id: "p7", key: "marketing.manage", module: "marketing", description: "Gestionar cupones y promociones" },
      { id: "p8", key: "content.manage", module: "content", description: "Gestionar banners, páginas y blog" },
      { id: "p9", key: "reports.view", module: "reports", description: "Ver reportes e indicadores" },
      { id: "p10", key: "reports.export", module: "reports", description: "Exportar reportes" },
      { id: "p11", key: "settings.manage", module: "settings", description: "Gestionar configuración general" },
      { id: "p12", key: "users.manage", module: "users", description: "Gestionar usuarios internos y roles" },
      { id: "p13", key: "integration.manage", module: "integration", description: "Gestionar la integración con LucidBot" },
      { id: "p14", key: "audit.view", module: "audit", description: "Consultar la bitácora de auditoría" }
    ];
  }

  if (cleanPath === "/admin/roles") {
    const permission = (key: string, description: string): { permission: { key: string; description: string } } => ({ permission: { key, description } });
    return [
      { id: "r1", name: "Administrador", description: "Dirección de la operación diaria del comercio electrónico", isSystem: true, _count: { users: 0 }, permissions: [permission("dashboard.view", ""), permission("catalog.manage", ""), permission("orders.view", ""), permission("orders.manage", ""), permission("customers.view", ""), permission("customers.manage", ""), permission("marketing.manage", ""), permission("content.manage", ""), permission("reports.view", ""), permission("reports.export", ""), permission("users.manage", "")] },
      { id: "r2", name: "Gestor de catálogo", description: "Construcción y mantenimiento de la línea de producto", isSystem: true, _count: { users: 1 }, permissions: [permission("catalog.manage", "")] },
      { id: "r3", name: "Gestor de pedidos", description: "Procesamiento, alistamiento y despacho de pedidos", isSystem: true, _count: { users: 1 }, permissions: [permission("dashboard.view", ""), permission("orders.view", ""), permission("orders.manage", "")] },
      { id: "r4", name: "Agente de servicio al cliente", description: "Atención, soporte y seguimiento comercial", isSystem: true, _count: { users: 1 }, permissions: [permission("orders.view", ""), permission("customers.view", "")] },
      { id: "r5", name: "Marketing y contenidos", description: "Contenido, campañas y posicionamiento", isSystem: true, _count: { users: 1 }, permissions: [permission("dashboard.view", ""), permission("marketing.manage", ""), permission("content.manage", ""), permission("reports.view", "")] },
      { id: "r6", name: "Auditor / Consulta", description: "Supervisión y control sin capacidad de modificación", isSystem: true, _count: { users: 0 }, permissions: [permission("dashboard.view", ""), permission("orders.view", ""), permission("reports.view", ""), permission("reports.export", ""), permission("audit.view", "")] }
    ];
  }

  if (cleanPath === "/admin/lucidbot/connection") {
    return {
      isConfigured: true,
      isActive: true,
      status: "ACTIVE",
      webhookUrl: "https://app.lucidbot.co/webhooks/limpiarte-demo",
      hasConnectionKey: true,
      lastVerifiedAt: daysAgoIso(0),
      lastErrorMessage: null
    };
  }

  if (cleanPath === "/admin/lucidbot/events") {
    const events = [
      ["CART_ABANDONED", true, 60],
      ["ORDER_CREATED", true, null],
      ["PAYMENT_APPROVED", true, null],
      ["PAYMENT_REJECTED", true, null],
      ["ORDER_STATUS_CHANGED", false, null],
      ["ORDER_SHIPPED", true, null],
      ["ORDER_DELIVERED", true, null],
      ["CUSTOMER_REGISTERED", true, null],
      ["CONTACT_REQUEST", false, null]
    ] as const;

    return events.map(([eventType, isEnabled, delayMinutes], index) => ({
      id: `demo-evt-${index + 1}`,
      eventType,
      isEnabled,
      automationRef: null,
      delayMinutes
    }));
  }

  if (cleanPath === "/admin/lucidbot/logs") {
    return {
      data: [
        { id: "demo-log-1", eventType: "PAYMENT_APPROVED", status: "SENT", attempts: 1, responseCode: 200, createdAt: daysAgoIso(0) },
        { id: "demo-log-2", eventType: "ORDER_CREATED", status: "SENT", attempts: 1, responseCode: 200, createdAt: daysAgoIso(0) },
        { id: "demo-log-3", eventType: "CART_ABANDONED", status: "SENT", attempts: 1, responseCode: 200, createdAt: daysAgoIso(1) },
        { id: "demo-log-4", eventType: "ORDER_SHIPPED", status: "FAILED", attempts: 3, responseCode: 502, createdAt: daysAgoIso(1) },
        { id: "demo-log-5", eventType: "CUSTOMER_REGISTERED", status: "SENT", attempts: 1, responseCode: 200, createdAt: daysAgoIso(2) }
      ],
      meta: { page: 1, perPage: 20, total: 5, totalPages: 1 }
    };
  }

  if (cleanPath === "/admin/settings") {
    return [
      { key: "store.name", value: "Limpiarte", group: "store" },
      { key: "store.contactEmail", value: "contacto@limpiarteenhoras.com", group: "store" },
      { key: "store.contactPhone", value: "+57 310 555 8842", group: "store" },
      { key: "store.address", value: "Calle 100 #15-20, Bogotá", group: "store" },
      { key: "services.redirectUrl", value: "https://limpiarteenhoras.com", group: "store" },
      { key: "tracking.ga4Id", value: "G-DEMO12345", group: "tracking" },
      { key: "tracking.gtmId", value: "GTM-DEMO99", group: "tracking" },
      { key: "tracking.metaPixelId", value: "", group: "tracking" }
    ];
  }

  if (cleanPath === "/admin/settings/email-templates") {
    return [
      { id: "t1", key: "order_confirmation", subject: "Pedido {{orderNumber}} confirmado — {{storeName}}", htmlBody: "<p>Hola {{name}},</p><p>Recibimos tu pedido <strong>{{orderNumber}}</strong> por un total de <strong>{{total}}</strong>.</p>{{itemsHtml}}", isActive: true },
      { id: "t2", key: "order_shipped", subject: "Pedido {{orderNumber}} despachado — {{storeName}}", htmlBody: "<p>Hola {{name}},</p><p>Tu pedido fue despachado con {{carrier}}. Guía: <strong>{{trackingNumber}}</strong></p>", isActive: true }
    ];
  }

  if (cleanPath === "/admin/marketing/banners") {
    return [
      { id: "demo-ban-1", title: "Todo para tu limpieza, en un solo lugar", subtitle: "Envío gratis desde $150.000", imageUrl: "", linkUrl: "/tienda", buttonText: "Ver catálogo", section: "HOME_HERO", position: 0, isActive: true },
      { id: "demo-ban-2", title: "Línea profesional para empresas", subtitle: "Precios por volumen", imageUrl: "", linkUrl: "/tienda?category=desinfectantes", buttonText: "Cotizar", section: "HOME_PROMO", position: 1, isActive: true }
    ];
  }

  if (cleanPath === "/admin/marketing/pages") {
    return [
      { id: "demo-pg-1", slug: "quienes-somos", title: "Quiénes somos", content: "<p>Limpiarte SAS…</p>", isActive: true },
      { id: "demo-pg-2", slug: "terminos-y-condiciones", title: "Términos y condiciones", content: "<p>Contenido…</p>", isActive: true },
      { id: "demo-pg-3", slug: "politica-de-privacidad", title: "Política de privacidad", content: "<p>Contenido…</p>", isActive: true },
      { id: "demo-pg-4", slug: "politica-pqrs", title: "Política de PQRS", content: "<p>Contenido…</p>", isActive: true }
    ];
  }

  if (cleanPath === "/admin/marketing/blog") {
    return [
      { id: "demo-post-1", slug: "como-desinfectar-tu-cocina", title: "Cómo desinfectar tu cocina en 5 pasos", excerpt: "La cocina concentra la mayor carga bacteriana del hogar.", content: "<p>…</p>", coverImageUrl: null, status: "PUBLISHED" },
      { id: "demo-post-2", slug: "guia-productos-aseo-empresas", title: "Guía de productos de aseo para empresas", excerpt: "El kit básico de una oficina de 20 personas.", content: "<p>…</p>", coverImageUrl: null, status: "PUBLISHED" },
      { id: "demo-post-3", slug: "errores-comunes-al-trapear", title: "5 errores comunes al trapear", excerpt: "Corrige estos hábitos y gana tiempo.", content: "<p>…</p>", coverImageUrl: null, status: "DRAFT" }
    ];
  }

  if (cleanPath === "/admin/marketing/menu") {
    return [
      { id: "demo-menu-1", location: "HEADER", label: "Tienda", url: "/tienda", position: 0, isActive: true },
      { id: "demo-menu-2", location: "HEADER", label: "Servicios de aseo", url: "/servicios", position: 1, isActive: true },
      { id: "demo-menu-3", location: "FOOTER", label: "Términos y condiciones", url: "/paginas/terminos-y-condiciones", position: 0, isActive: true },
      { id: "demo-menu-4", location: "FOOTER", label: "Política de privacidad", url: "/paginas/politica-de-privacidad", position: 1, isActive: true }
    ];
  }

  if (cleanPath === "/admin/audit") {
    return {
      data: [
        { id: "demo-aud-1", action: "order.status_changed", entity: "Order", entityId: "demo-order-2", ipAddress: "190.85.12.44", createdAt: daysAgoIso(0), user: { email: "despachos@limpiarte.co", firstName: "Andrés", lastName: "Pineda" } },
        { id: "demo-aud-2", action: "product.updated", entity: "Product", entityId: "demo-product-1", ipAddress: "190.85.12.51", createdAt: daysAgoIso(0), user: { email: "catalogo@limpiarte.co", firstName: "Laura", lastName: "Gómez" } },
        { id: "demo-aud-3", action: "login.success", entity: "User", entityId: "demo-user", ipAddress: "190.85.12.10", createdAt: daysAgoIso(1), user: { email: "demo@limpiarte.local", firstName: "Usuario", lastName: "Demo" } },
        { id: "demo-aud-4", action: "coupon.created", entity: "Coupon", entityId: "demo-coup-3", ipAddress: "190.85.12.77", createdAt: daysAgoIso(2), user: { email: "marketing@limpiarte.co", firstName: "Diego", lastName: "Salas" } },
        { id: "demo-aud-5", action: "lucidbot.event_updated", entity: "LucidBotEventSetting", entityId: "demo-evt-1", ipAddress: "190.85.12.10", createdAt: daysAgoIso(3), user: { email: "demo@limpiarte.local", firstName: "Usuario", lastName: "Demo" } },
        { id: "demo-aud-6", action: "inventory.adjusted", entity: "Product", entityId: "demo-product-9", ipAddress: "190.85.12.51", createdAt: daysAgoIso(7), user: { email: "catalogo@limpiarte.co", firstName: "Laura", lastName: "Gómez" } }
      ],
      meta: { page: 1, perPage: 40, total: 6, totalPages: 1 }
    };
  }

  return undefined;
}
