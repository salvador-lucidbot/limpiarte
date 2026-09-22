import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { LucidBotEventType, PrismaClient } from "../src/generated/prisma/client";

function buildAdapter(): PrismaMariaDb {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not defined");

  const parsed = new URL(url);
  return new PrismaMariaDb(
    {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ""),
      connectionLimit: 5
    },
    // Mismo motivo que en prisma.service.ts: evita el error 1267 en los LIKE.
    { useTextProtocol: true }
  );
}

const prisma = new PrismaClient({ adapter: buildAdapter() });

const PERMISSIONS: { key: string; module: string; description: string }[] = [
  { key: "dashboard.view", module: "dashboard", description: "Ver tablero principal" },
  { key: "catalog.manage", module: "catalog", description: "Gestionar catálogo, precios e inventario" },
  { key: "orders.view", module: "orders", description: "Consultar pedidos" },
  { key: "orders.manage", module: "orders", description: "Gestionar estados y despachos de pedidos" },
  { key: "customers.view", module: "customers", description: "Consultar clientes" },
  { key: "customers.manage", module: "customers", description: "Gestionar clientes y exportar la base" },
  { key: "marketing.manage", module: "marketing", description: "Gestionar cupones y promociones" },
  { key: "content.manage", module: "content", description: "Gestionar banners, páginas y blog" },
  { key: "reports.view", module: "reports", description: "Ver reportes e indicadores" },
  { key: "reports.export", module: "reports", description: "Exportar reportes" },
  { key: "settings.manage", module: "settings", description: "Gestionar configuración general" },
  { key: "users.manage", module: "users", description: "Gestionar usuarios internos y roles" },
  { key: "integration.manage", module: "integration", description: "Gestionar la integración con LucidBot" },
  { key: "audit.view", module: "audit", description: "Consultar la bitácora de auditoría" }
];

const ROLES: { name: string; description: string; permissions: string[] }[] = [
  {
    name: "Administrador",
    description: "Dirección de la operación diaria del comercio electrónico",
    permissions: [
      "dashboard.view",
      "catalog.manage",
      "orders.view",
      "orders.manage",
      "customers.view",
      "customers.manage",
      "marketing.manage",
      "content.manage",
      "reports.view",
      "reports.export",
      "users.manage"
    ]
  },
  {
    name: "Gestor de catálogo",
    description: "Construcción y mantenimiento de la línea de producto",
    permissions: ["catalog.manage"]
  },
  {
    name: "Gestor de pedidos",
    description: "Procesamiento, alistamiento y despacho de pedidos",
    permissions: ["dashboard.view", "orders.view", "orders.manage"]
  },
  {
    name: "Agente de servicio al cliente",
    description: "Atención, soporte y seguimiento comercial",
    permissions: ["orders.view", "customers.view"]
  },
  {
    name: "Marketing y contenidos",
    description: "Contenido, campañas y posicionamiento",
    permissions: ["dashboard.view", "marketing.manage", "content.manage", "reports.view"]
  },
  {
    name: "Auditor / Consulta",
    description: "Supervisión y control sin capacidad de modificación",
    permissions: ["dashboard.view", "orders.view", "reports.view", "reports.export", "audit.view"]
  }
];

async function seedPermissionsAndRoles(): Promise<void> {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { module: permission.module, description: permission.description },
      create: permission
    });
  }

  for (const roleDefinition of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDefinition.name },
      update: { description: roleDefinition.description, isSystem: true },
      create: { name: roleDefinition.name, description: roleDefinition.description, isSystem: true }
    });

    const permissions = await prisma.permission.findMany({ where: { key: { in: roleDefinition.permissions } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id }))
    });
  }
}

async function seedSuperadmin(): Promise<void> {
  const email = process.env.SUPERADMIN_EMAIL ?? "superadmin@limpiarte.local";
  const password = process.env.SUPERADMIN_PASSWORD ?? "Limpiarte2026!";

  await prisma.user.upsert({
    where: { email },
    update: { isSuperadmin: true, isActive: true },
    create: {
      email,
      passwordHash: await hash(password, 10),
      firstName: "Super",
      lastName: "Admin",
      isSuperadmin: true
    }
  });

  process.stdout.write(`Superadmin listo: ${email}\n`);
}

async function seedLucidBotEvents(): Promise<void> {
  for (const eventType of Object.values(LucidBotEventType)) {
    await prisma.lucidBotEventSetting.upsert({
      where: { eventType },
      update: {},
      create: { eventType, isEnabled: false }
    });
  }
}

async function seedBaseSettings(): Promise<void> {
  const defaults: { key: string; value: unknown; group: string }[] = [
    { key: "store.name", value: "Limpiarte", group: "store" },
    { key: "store.contactEmail", value: "contacto@limpiarteenhoras.com", group: "store" },
    { key: "services.redirectUrl", value: "https://limpiarteenhoras.com", group: "store" },
    { key: "tracking.ga4Id", value: "", group: "tracking" },
    { key: "tracking.gtmId", value: "", group: "tracking" },
    { key: "tracking.metaPixelId", value: "", group: "tracking" },
    // Cifras de la portada: texto libre ("1071+"). Vacío = se usa el número real del catálogo.
    { key: "home.stats.products", value: "", group: "home" },
    { key: "home.stats.customers", value: "", group: "home" },
    { key: "home.stats.shipments", value: "", group: "home" },
    { key: "home.stats.cities", value: "", group: "home" },
    { key: "home.stats.units", value: "", group: "home" }
  ];

  for (const entry of defaults) {
    await prisma.setting.upsert({
      where: { key: entry.key },
      update: {},
      create: { key: entry.key, value: entry.value as object, group: entry.group }
    });
  }
}

async function main(): Promise<void> {
  await seedPermissionsAndRoles();
  await seedSuperadmin();
  await seedLucidBotEvents();
  await seedBaseSettings();
  process.stdout.write("Seed completado\n");
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
