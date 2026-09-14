# Limpiarte E-commerce — Documentación técnica interna

## Stack real (no migrar)

- Monorepo **pnpm 11** (`node-linker=hoisted` en `.npmrc` por Windows/OneDrive). Node ≥ 22.
- `apps/api`: **NestJS 11**, TypeScript 5.9, CommonJS, sin passport (JWT manual con `@nestjs/jwt`).
- `apps/web`: **Next.js 16** App Router (params/searchParams son `Promise`, se hace `await`), React 19, **Tailwind CSS 4** (tokens en `@theme` de `app/globals.css`, sin tailwind.config).
- **Prisma 7**: requiere `prisma.config.ts` (datasource url ahí, NO en el schema) y driver adapter `@prisma/adapter-mariadb`. Generator `prisma-client` emite TypeScript en `apps/api/src/generated/prisma/` (gitignored — ejecutar `pnpm db:generate` tras clonar). Todo se importa desde `src/generated/prisma/client`.
- `DATABASE_URL` se parsea con `new URL()` en `prisma.service.ts` y `prisma/seed.ts` para construir el adapter.
- **CRÍTICO (colaciones)**: el MariaDB 11.8 de Hostinger rechaza los parámetros de prepared statements en `LIKE` ("Illegal mix of collations ... utf8mb4_bin"). Todo constructor del adapter DEBE llevar `initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"` o todas las búsquedas `contains` fallan con 500.

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
- **Rendimiento del carrito**: `addItem`/`updateItem`/`removeItem` construyen la vista **desde memoria** y NO recargan (`reload` cuesta ~8 consultas por los include anidados; con la DB remota son ~170 ms cada una). No agregar `reload()` tras mutar ni includes que la vista no use (`category` se quitó por eso). `minFreeShippingThreshold` y `buildSuggestions` tienen caché en memoria (60 s / 5 min por conjunto de productos).
- Carritos: token de sesión aleatorio (`sessionToken`), unicidad de ítem manejada en código (MySQL permite múltiples NULL en unique con `variantId`). `CartView` incluye `freeShippingThreshold` (mínimo entre zonas activas) y `suggestions` (relaciones de los productos del carrito).
- Pasarela: `PAYMENT_GATEWAY` env (default `wompi`). `WompiGateway` opera **solo simulado**: `simulationEnabled()` exige que NO haya `WOMPI_PRIVATE_KEY` y que `NODE_ENV !== "production"` (en producción hay que optar explícitamente con `WOMPI_SIMULATION=true`). Checkout devuelve `redirectUrl` a `/checkout/pago?ref=...` y `/payments/wompi/simulation` (GET resumen / POST APPROVED|DECLINED) confirma o rechaza vía `OrdersService`. **`isUsable()` es la única puerta de `PaymentsService`**: si la simulación no está habilitada, Wompi se salta y cae a Stripe o al flujo manual — nunca hay una pasarela sin cobro real activa en producción por defecto. Al integrar Wompi real hay que implementar `createIntent` contra su API y el webhook oficial. Stripe sigue disponible con `PAYMENT_GATEWAY=stripe`.
- `confirmPaymentByExternalId` valida la transición contra `ALLOWED_TRANSITIONS` **antes** de tocar el `Payment`: un pedido CANCELLED/REFUNDED devuelve 400 y el pago queda PENDING (sin estado inconsistente pago-aprobado/pedido-cancelado).
- Engagement: `ProductReview` (verificada por compra del cliente, única por producto+cliente) y `ProductQuestion` con `ModerationStatus`; moderación en `/admin/moderation/*` (permiso `content.manage`). `NewsletterSubscriber` vía `POST /content/newsletter`.
- `StockAlert`: `MailService.sendTemplate` devuelve `boolean` (false si no hay SMTP o falla el envío) y `notifyStockAlerts` marca `notifiedAt` **solo** en las alertas realmente enviadas, así que sin SMTP no se consumen suscripciones. El hook en `ProductsAdminService.update` solo corre si el stock previo era 0 (no en cualquier edición).
- Imágenes propias (`UploadsModule`): `POST /admin/uploads` (multipart, campo `file`) y `DELETE /admin/uploads/:fileName`, protegidos con `@RequireAnyPermission("catalog.manage", "content.manage")` — decorador nuevo en `permissions.decorator.ts` para el caso "cualquiera de estos permisos" (`@RequirePermissions` exige todos). Usa `FileInterceptor` de platform-express (multer viene incluido, **no** hay que instalarlo) con almacenamiento en memoria y límite de 5 MB. `UploadStorageService` valida MIME contra allowlist (jpg/png/webp/avif, **SVG excluido a propósito** por XSS), verifica los **magic bytes** para que un `.php` renombrado no pase, y nombra el archivo con `randomUUID()`. El borrado exige que el nombre calce con el patrón UUID+extensión (bloquea path traversal). Los archivos se sirven con `app.useStaticAssets(dir, { prefix: "/uploads" })` en `main.ts` — **fuera** del prefijo `api/v1`, con `Cross-Origin-Resource-Policy: cross-origin` (helmet pone `same-origin` y bloquearía el storefront de otro puerto/dominio) y caché de 30 días. La URL devuelta es absoluta: `PUBLIC_BASE_URL` si está definida, si no el host de la petición. Carpeta: `apps/api/uploads/` — ignorada en git salvo su `.gitkeep`, y `onModuleInit` la crea si falta.
- Catálogo: `minPrice`/`maxPrice` filtran por **precio efectivo** (promo vigente si es menor que `basePrice`), igual que las facetas — se arma con referencias de campo de Prisma (`prisma.product.fields.basePrice`) en `effectivePriceCondition`. `buildPriceRanges` cuenta cada rango con el mismo predicado inclusivo que usa el filtro, así que el número de la faceta siempre coincide con los resultados al hacer clic (verificado contra la DB real). Si los terciles colapsan (`highCut <= lowCut`) no se emiten rangos.
- Tarjetas: `StorefrontCatalogService.enrichCards` calcula rating (reseñas APPROVED), `isBestSeller` (top 8 por ventas 30 días), `isNew` (30 días), `lowStock` y `secondImageUrl`. `cardsByIds` para favoritos/"comprar de nuevo"; `suggest` para el autocompletado; `feed.xml` para Merchant Center.

## Principio: nada de diálogos nativos del navegador

**Prohibido `window.confirm`, `window.alert` y `window.prompt`.** Toda confirmación o notificación se resuelve con el modal propio del panel (`AdminDialogProvider`, montado en `app/admin/(panel)/layout.tsx`):

- `const { confirm, notify } = useAdminDialog();`
- `notify({ title, description, tone })` para avisos y errores.
- `confirm({ title, description, confirmLabel, tone, hold, successMessage, action })` para acciones que modifican datos. El modal ejecuta la `action` y él mismo pasa a estado **éxito** o **error** (con botón de reintentar), así que la pantalla que lo invoca no maneja spinners ni mensajes.
- **Acciones destructivas o irreversibles** (eliminar, duplicar, cambios masivos de estado) usan `tone: "danger"` y confirmación por **pulsación sostenida de 3 segundos** (`HoldButton`, en `components/admin/hold-button.tsx`): el botón se llena progresivamente y solo dispara al completar. `hold` se activa solo por defecto cuando `tone` es `danger`.
- El título debe nombrar el objeto concreto (`¿Eliminar «Jabón multiusos»?`), no un genérico.

## Principio: el tablero es la central de métricas

**Toda métrica nueva va al tablero (`/admin/dashboard`), no a una sección aparte.** El tablero es el único lugar donde se consultan indicadores del negocio; las demás secciones son operativas (gestionar pedidos, editar productos), no analíticas. Antes de agregar un contador o una gráfica en cualquier otra pantalla, se agrega como métrica filtrable del tablero.

Consecuencias prácticas:

- Los filtros del tablero (rango de fechas con comparación contra el período anterior + segmentos por ciudad, categoría, producto, marca y canal) aplican a **todas** las métricas a la vez. Una métrica nueva debe respetar `DashboardQueryDto` y el rango activo, no traer su propia ventana fija.
- `ReportsService.dashboard()` es el único punto de entrada: recibe el filtro, arma `buildOrderWhere`/`buildVisitWhere` y devuelve cada bloque ya comparado. No crear endpoints de métricas paralelos.
- Cada KPI viaja como `{ current, previous, delta }` para que la UI pinte la variación sin recalcular.
- La analítica de tráfico es propia (`VisitEvent`), sin terceros: se alimenta del beacon del storefront y se consulta con el mismo filtro que las ventas.

## Frontend

- `(store)` = storefront con `StoreLayout` (server) que carga categorías/settings y monta `CustomerAuthProvider` + `WishlistProvider` + `ToastProvider` + `CartProvider`, más `CartDrawer`, `FloatingWhatsApp`, `WelcomePopup` y `BottomNav`. Tokens en `localStorage`: `limpiarte_cart_token`, `limpiarte_customer_token`, `limpiarte_wishlist` (favoritos por ids, sin DB).
- Settings de experiencia (claves públicas, editables en /admin/configuracion): `store.announcements` (array), `store.whatsapp`, `store.guaranteeText`, `shipping.leadTimeMinDays/MaxDays`, `marketing.welcomePopup` ({enabled,title,subtitle,couponCode}). Mantener sincronizadas entre `settings.controller.ts` (PUBLIC_SETTING_KEYS), `configuracion/page.tsx`, `(store)/layout.tsx` y `producto/[slug]/page.tsx`.
- **El carrito es optimista**: `addItem` no abre el drawer (el usuario sigue comprando) — dispara `flyToCart` (Web Animations API, `lib/cart/fly-to-cart.ts`, apunta al `[data-cart-target]` del header) y `bumpOptimisticCount`, que se revierte si el servidor falla. `updateItem`/`removeItem` parchean el carrito local con `patchLocalCart` antes de la petición. `runAction` lleva un contador de secuencia y descarta respuestas fuera de orden, así que los botones +/− no se bloquean mientras carga. Al cerrar una compra **hay que llamar `clearCart()`** del contexto (borra el token y el estado en memoria) — no `localStorage.removeItem` a mano, o el badge y el drawer siguen mostrando lo ya comprado tras el `router.push`.
- Barras fijas móviles: `BottomNav` (h-14) y la barra sticky de compra de la ficha viven en `bottom-14`. El botón flotante de WhatsApp se posiciona con la variable `--floating-action-offset` (definida en `globals.css`); `ProductPurchasePanel` marca `document.body[data-mobile-cta]` mientras su barra está montada para subirlo. Cualquier nueva barra fija móvil debe usar esa variable en vez de un `bottom-*` fijo. Fuente tipográfica: Manrope vía `next/font` (variable `--font-manrope`).
- `/admin` fuera del route group: login propio y `(panel)` con sidebar filtrado por permisos (`useAdminAuth.hasPermission`). Datos vía `useAdminGet`/`useAdminRequest`.
- Checkout: crea pedido → si Stripe configurado renderiza `PaymentElement` con `clientSecret`; si no, flujo manual. Resultado en `/checkout/resultado` (lee `redirect_status`).
- `apiFetch` (lib/api/client.ts): `revalidate: false` = no-store (todo lo autenticado); default 60 s para catálogo público.

## Credenciales de desarrollo

- Seed: superadmin `superadmin@limpiarte.local` / `Limpiarte2026!` (sobrescribible con `SUPERADMIN_EMAIL`/`SUPERADMIN_PASSWORD`). Cambiar en producción.
- El 2FA llega por correo: sin SMTP configurado el código solo queda en el hash — configura SMTP antes de probar login admin, o toma el código del log si agregas trazas temporales.

## Base de datos (Hostinger)

- El schema está sincronizado en el MySQL de Hostinger con `prisma db push` (el hosting compartido no permite la shadow database que exige `migrate dev`; para cambios de schema usar `db push`, o generar SQL con `migrate diff` y aplicarlo con `db execute`).
- `.env` de `apps/api` existe SOLO en local (gitignored); en Hostinger las variables van en el panel.
- Seed ejecutado contra la DB real: `prisma/seed.ts` (roles/permisos/superadmin/eventos/settings). La base está limpia de datos de prueba (2026-08-22): catálogo, pedidos, zonas, cupones y contenido se gestionan desde el Superadmin. El modo demostración fue eliminado del código.
- Sin SMTP configurado, el código 2FA del login staff se imprime en el log del API (`AuthService`, solo si `NODE_ENV !== "production"`).

## Pendientes conocidos

- Sección "clientes/[id]" del admin y detalle de contacto: API lista (`GET /admin/customers/:id`, `/contact/admin`), UI pendiente.
- Las imágenes se guardan en el disco del servidor (ver `UploadsModule`), no en un CDN ni en un bucket: si el hosting recicla el contenedor o se despliega en varias instancias, hay que montar `UPLOADS_DIR` en un volumen persistente compartido. Migrar a S3/Cloudinary implica solo reimplementar `UploadStorageService`.
- Copias de seguridad programadas de DB: responsabilidad del hosting (Hostinger) — documentado en cotización B.6.
