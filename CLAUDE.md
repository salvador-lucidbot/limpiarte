# Limpiarte E-commerce — Documentación técnica interna

## Stack real (no migrar)

- Monorepo **pnpm 11** (`node-linker=hoisted` en `.npmrc` por Windows/OneDrive). Node ≥ 22.
- `apps/api`: **NestJS 11**, TypeScript 5.9, CommonJS, sin passport (JWT manual con `@nestjs/jwt`).
- `apps/web`: **Next.js 16** App Router (params/searchParams son `Promise`, se hace `await`), React 19, **Tailwind CSS 4** (tokens en `@theme` de `app/globals.css`, sin tailwind.config).
- **Prisma 7**: requiere `prisma.config.ts` (datasource url ahí, NO en el schema) y driver adapter `@prisma/adapter-mariadb`. Generator `prisma-client` emite TypeScript en `apps/api/src/generated/prisma/` (gitignored — ejecutar `pnpm db:generate` tras clonar). Todo se importa desde `src/generated/prisma/client`.
- `DATABASE_URL` se parsea con `new URL()` en `prisma.service.ts` y `prisma/seed.ts` para construir el adapter.

## Arquitectura API

- Prefijo global `api/v1`. Swagger en `/docs` (solo fuera de producción). `rawBody: true` en bootstrap para el webhook de Stripe.
- Guards globales (en orden): Throttler → `AuthGuard` → `PermissionsGuard`.
  - `@Public()` abre el endpoint (igual adjunta el principal si llega token — usado por carrito/checkout para clientes logueados).
  - `@CustomerOnly()` exige JWT `kind: "customer"`.
  - Sin decorador = staff. `@RequirePermissions("x.y")` valida contra rol + overrides; Superadmin (flag en User) omite todo.
- JWT único con payload `{ sub, kind: "staff" | "customer" | "two_factor" }`. Login staff = 2 pasos (password → código 6 dígitos por correo, ticket JWT de 10 min). Lockout: 5 intentos → 15 min.
- Módulos `@Global()`: Prisma, Security (AES-256-GCM con `ENCRYPTION_KEY`), Mail, Audit, LucidBot, Auth.
- Dinero: `Decimal(12,2)` en DB; en lógica se convierte con `Number()` y se redondea a 2 decimales (COP). Los Decimal serializan como string en JSON — el front usa `formatCOP(number | string)`.
- Precios: SIEMPRE vía `PricingService` (promo con ventana, precio de variante, `PriceListEntry` por volumen). No leer `basePrice` directo para vender.
- Inventario: se descuenta al pasar a `PAYMENT_CONFIRMED` (idempotente por `InventoryMovement` con `reference = orderNumber`); se restaura en CANCELLED/REFUNDED.
- Transiciones de pedido en `ALLOWED_TRANSITIONS` (orders.service.ts). SHIPPED exige guía; CANCELLED/REFUNDED exigen motivo.
- LucidBot: `LucidBotService.dispatch(eventType, payload, orderId?)` — no lanza si la conexión está inactiva o el evento deshabilitado. Crons: reintentos de fallidos y detección de carritos abandonados cada 10 min (`@nestjs/schedule`).
- Carritos: token de sesión aleatorio (`sessionToken`), unicidad de ítem manejada en código (MySQL permite múltiples NULL en unique con `variantId`).

## Frontend

- `(store)` = storefront con `StoreLayout` (server) que carga categorías/settings y monta `CustomerAuthProvider` + `CartProvider` (tokens en `localStorage`: `limpiarte_cart_token`, `limpiarte_customer_token`).
- `/admin` fuera del route group: login propio y `(panel)` con sidebar filtrado por permisos (`useAdminAuth.hasPermission`). Datos vía `useAdminGet`/`useAdminRequest`.
- Checkout: crea pedido → si Stripe configurado renderiza `PaymentElement` con `clientSecret`; si no, flujo manual. Resultado en `/checkout/resultado` (lee `redirect_status`).
- `apiFetch` (lib/api/client.ts): `revalidate: false` = no-store (todo lo autenticado); default 60 s para catálogo público.

## Modo demostración (solo desarrollo)

- `lib/demo/demo-mode.ts` → `isDemoMode()` es `true` salvo que `NODE_ENV === "production"` o `NEXT_PUBLIC_DEMO_MODE === "false"`. Verificado con `next start`: el botón demo no se renderiza en el build de producción.
- Sirve para recorrer la plataforma sin base de datos. Datos en `lib/demo/demo-catalog.ts` (storefront), `demo-admin.ts` (panel) y `demo-cart.ts` (carrito en localStorage).
- Storefront: cada página cae a datos demo si la API falla **o** responde vacío. Panel: botón "Entrar en modo demostración" en `/admin/login` → `loginDemo()` guarda un token sentinel (`DEMO_TOKEN`) que la API real rechazaría; `useAdminGet` sirve mocks y `useAdminRequest` rechaza las mutaciones.
- Al conectar la base de datos real, los datos reales tienen prioridad automáticamente (el demo solo actúa cuando no hay contenido).

## Credenciales de desarrollo

- Seed: superadmin `superadmin@limpiarte.local` / `Limpiarte2026!` (sobrescribible con `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD`). Cambiar en producción.
- El 2FA llega por correo: sin SMTP configurado el código solo queda en el hash — configura SMTP antes de probar login admin, o toma el código del log si agregas trazas temporales.

## Base de datos (Hostinger)

- El schema está sincronizado en el MySQL de Hostinger con `prisma db push` (el hosting compartido no permite la shadow database que exige `migrate dev`; para cambios de schema usar `db push`, o generar SQL con `migrate diff` y aplicarlo con `db execute`).
- `.env` de `apps/api` existe SOLO en local (gitignored); en Hostinger las variables van en el panel.
- Seeds ejecutados contra la DB real: `prisma/seed.ts` (roles/permisos/superadmin/eventos/settings) y `prisma/seed-test-catalog.ts` (12 productos de prueba con variantes, 3 zonas de envío con 12 ciudades y cupón BIENVENIDA10; idempotente por slug/código — borrar desde el admin cuando llegue el catálogo definitivo).
- Sin SMTP configurado, el código 2FA del login staff se imprime en el log del API (`AuthService`, solo si `NODE_ENV !== "production"`).

## Pendientes conocidos

- Sección "clientes/[id]" del admin y detalle de contacto: API lista (`GET /admin/customers/:id`, `/contact/admin`), UI pendiente.
- Subida de imágenes es por URL; no hay almacenamiento de archivos propio (decisión: usar CDN/hosting de imágenes del cliente).
- Copias de seguridad programadas de DB: responsabilidad del hosting (Hostinger) — documentado en cotización B.6.
