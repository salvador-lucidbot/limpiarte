# Prompts de imágenes — Limpiarte

Guía para generar las imágenes que faltan en la tienda. Cada bloque indica **dónde se ve la imagen en el código**, **qué medida necesita** y el **prompt listo para pegar** en Midjourney / DALL·E / Ideogram / Flux.

Los prompts están en inglés a propósito: los generadores responden mejor y con menos artefactos. Las notas y las medidas están en español.

## Cómo se cargan las imágenes

Hay dos caminos y ambos funcionan en el mismo campo:

**a) Subir el archivo al backend (recomendado).** En el Superadmin cada campo de imagen tiene un botón **Subir**: el archivo se guarda en el servidor (`apps/api/uploads/`) y el campo queda con la URL ya lista. Formatos permitidos JPG, PNG, WebP y AVIF, máximo 5 MB por archivo.

**b) Pegar una URL externa.** Si la imagen ya vive en un CDN (Cloudinary, imgix, Bunny), se pega la URL directamente en el mismo campo.

Dónde está cada campo en el Superadmin:

- Banners → `/admin/contenido` → pestaña **Banners** → campo *Imagen*
- Productos → `/admin/productos` → editar producto → tarjeta *Imágenes* (permite **subir varias a la vez**)
- Blog → `/admin/contenido` → pestaña **Blog** → campo *Imagen de portada*

Flujo completo: generar con el prompt → exportar en **WebP** (o JPG) con la medida indicada → subir con el botón.

**Peso máximo recomendado:** 250 KB para banners, 180 KB para fotos de producto, 150 KB para portadas de blog. El límite duro del servidor es 5 MB, pero una imagen de 3 MB en la portada arruina el tiempo de carga: comprimir siempre antes de subir. Todas las imágenes se sirven con `loading="lazy"` salvo el hero.

## Estilo de marca (prefijo para todos los prompts)

Pegar este bloque al inicio de cualquier prompt propio para mantener coherencia visual:

```
Brand palette: primary cyan-blue #29ABE2, deep navy #0E2F46, cool off-white #F2F5F7.
Clean, professional, bright commercial photography. Soft diffused daylight, no harsh shadows.
Modern Colombian domestic and commercial context. Realistic, uncluttered, generous negative space.
```

**Negativos globales** (añadir al final o en el campo de negative prompt):

```
--no text, letters, words, logos, watermarks, brand names, labels with readable text,
distorted hands, extra fingers, cluttered background, dirty surfaces, cartoon, 3d render,
harsh flash, oversaturated colors, lens flare
```

Ojo con el texto: los generadores escriben letras deformes. **Ninguna imagen debe llevar texto quemado** — los títulos y botones los pone el sitio encima.

## 1. Hero de la portada (`HOME_HERO`)

- **Dónde:** [app/(store)/page.tsx:101-142](apps/web/app/(store)/page.tsx#L101-L142) — se renderiza como fondo absoluto **al 20 % de opacidad** sobre un degradado azul de marca, con el titular y el CTA encima.
- **Campos:** `imageUrl` (escritorio) y `mobileImageUrl` (móvil), en la sección `HOME_HERO`.
- **Medidas:** escritorio **2400 × 1000 px** (12:5). Móvil **1080 × 1350 px** (4:5).
- **Clave técnica:** al ir al 20 % de opacidad, una foto con mucho detalle se convierte en ruido. Buscar **composición amplia, pocos elementos y contraste medio**. Nada importante en el tercio izquierdo: ahí van el titular y el botón.

```
Wide cinematic shot of a bright modern Colombian kitchen and laundry corner, freshly cleaned
surfaces reflecting soft morning light, a few unbranded spray bottles and folded microfiber
cloths neatly arranged on the right side, large empty airy space on the left, subtle cyan-blue
tones in the light, shallow depth of field, professional commercial photography, 12:5 aspect ratio
```

Alternativa con producto en primer plano (más comercial):

```
Product hero composition: three unbranded cleaning spray bottles in matte white and cyan-blue
plastic, arranged at different heights on a clean light gray surface, soft gradient background
from pale cyan to white, water droplets and a hint of fresh foam, studio lighting, right-side
composition with empty space on the left, ultra clean commercial product photography, 12:5
```

Versión móvil (vertical, misma escena):

```
Vertical composition of a bright freshly cleaned modern bathroom corner, soft daylight from a
window, unbranded cleaning bottle and folded cloth on a marble counter, pale cyan and white
palette, large clean empty area at the top, professional commercial photography, 4:5 aspect ratio
```

## 2. Banners de promoción de la portada (`HOME_PROMO`)

- **Dónde:** [app/(store)/page.tsx:214-224](apps/web/app/(store)/page.tsx#L214-L224) — dos tarjetas lado a lado, `h-52` (208 px de alto), con `object-cover` y un **degradado oscuro desde abajo** donde se imprimen el título y el subtítulo.
- **Medidas:** **1600 × 640 px** (5:2).
- **Clave técnica:** la mitad inferior queda cubierta por el degradado negro. Poner el sujeto **arriba o al centro**, y dejar la franja inferior simple (superficie, fondo liso) para que el texto blanco se lea.

Banner de categoría de cocina:

```
Top-down flat lay of kitchen cleaning essentials on a pale cyan surface: unbranded dish soap
bottle, yellow sponge, microfiber cloth, scrub brush, arranged with generous spacing in the
upper half, clean seamless light background in the lower third, bright commercial product
photography, 5:2 aspect ratio
```

Banner de descuento / combo:

```
Group of five unbranded household cleaning products in white and cyan-blue packaging arranged
as a bundle on a clean white pedestal, soft studio lighting, pale gradient background, products
positioned in the upper two thirds, plain smooth surface in the lower third, commercial
e-commerce photography, 5:2 aspect ratio
```

Banner de aseo profesional / empresas:

```
Professional cleaning crew member in neat cyan-blue uniform polishing a large glass office
window, modern bright office interior blurred behind, seen from the side, subject in the upper
center, clean floor in the lower third, corporate commercial photography, 5:2 aspect ratio
```

## 3. Fotos de producto (imagen principal)

- **Dónde:** tarjetas del catálogo en [components/store/product-card-view.tsx:33-52](apps/web/components/store/product-card-view.tsx#L33-L52) (`aspect-square`, `object-cover`, fondo blanco) y galería de la ficha en [components/store/product-gallery.tsx](apps/web/components/store/product-gallery.tsx) (con zoom al pasar el mouse).
- **Medidas:** **1200 × 1200 px** cuadrada.
- **Clave técnica:** el zoom de la ficha amplía a 1.9×, así que la imagen debe estar nítida a 1200 px. Fondo blanco o gris muy claro, producto centrado con márgenes — si el producto toca los bordes, el `object-cover` de la tarjeta lo recorta.

Plantilla base (reemplazar el producto):

```
Studio product photograph of a [PRODUCTO: 1 liter bottle of blue multipurpose disinfectant],
unbranded plain packaging, centered on a pure white seamless background, soft even studio
lighting with a subtle natural shadow beneath, product fully visible with comfortable margins
on all sides, sharp focus, high resolution e-commerce catalog photography, square 1:1
```

Ejemplos por familia de producto:

```
Studio product photograph of a 5 liter white plastic jug of floor cleaner with a cyan-blue cap,
unbranded, centered on pure white seamless background, soft studio lighting, subtle contact
shadow, e-commerce catalog photography, square 1:1
```

```
Studio product photograph of a stack of three folded microfiber cleaning cloths in cyan-blue,
gray and white, neatly arranged, centered on pure white seamless background, soft studio
lighting, e-commerce catalog photography, square 1:1
```

```
Studio product photograph of a professional mop with a telescopic metal handle and a white
microfiber head, standing upright, centered on pure white seamless background, soft studio
lighting, e-commerce catalog photography, square 1:1
```

## 4. Segunda foto de producto (hover de la tarjeta)

- **Dónde:** [product-card-view.tsx:44-51](apps/web/components/store/product-card-view.tsx#L44-L51) — la **segunda imagen** cargada del producto se muestra al pasar el mouse, con transición de opacidad. `StorefrontCatalogService` la expone como `secondImageUrl`.
- **Medidas:** **1200 × 1200 px**, igual que la principal.
- **Clave técnica:** el efecto solo funciona si la segunda imagen es **claramente distinta**: otro ángulo, el producto en uso o el detalle de la etiqueta. Si es casi igual, el hover parece un glitch.

```
Lifestyle product photograph of the same [PRODUCTO] in use: a hand in a cyan-blue rubber glove
spraying the product onto a clean kitchen countertop, bright modern kitchen softly blurred in
the background, natural daylight, product clearly visible, square 1:1
```

```
Three-quarter angle detail photograph of the same [PRODUCTO] on a light gray surface, showing
the cap and trigger mechanism up close, soft studio lighting, pale neutral background,
square 1:1
```

## 5. Portadas del blog

- **Dónde:** [app/(store)/blog/page.tsx:34-35](apps/web/app/(store)/blog/page.tsx#L34-L35) — `coverImageUrl`, altura `h-44` (176 px) con `object-cover` y un leve zoom al hover.
- **Medidas:** **1200 × 675 px** (16:9).
- **Clave técnica:** el recorte es horizontal y bajito. Composición centrada y horizontal; nada crítico arriba o abajo.

Guías de limpieza:

```
Overhead horizontal composition of cleaning supplies arranged on a pale cyan background:
spray bottle, brush, sponge and folded cloth, evenly spaced in a row, generous negative space,
bright editorial flat lay photography, 16:9 aspect ratio
```

Consejos de hogar:

```
Bright modern living room being cleaned, sunlight through a window, a person's hands wiping a
wooden shelf with a microfiber cloth, warm inviting domestic scene, soft focus background,
horizontal editorial photography, 16:9 aspect ratio
```

Aseo empresarial:

```
Clean modern office corridor with polished floor reflecting overhead light, cleaning cart with
unbranded supplies parked to one side, wide horizontal composition, corporate editorial
photography, 16:9 aspect ratio
```

## 6. Tarjetas de categoría de la portada

- **Dónde:** sección "Compra por categoría" de la portada ([app/(store)/page.tsx](apps/web/app/(store)/page.tsx)). Se guarda en `Category.bannerUrl` y se edita en `/admin/categorias` → campo **Imagen de la categoría** (acepta subir archivo o pegar URL).
- **Medidas:** **800 × 800 px** cuadrada, **PNG con transparencia real** (canal alfa).
- **Clave técnica:** la tarjeta **no tiene recuadro** — la imagen se apoya directamente sobre el fondo de la página (`#f2f5f7`) y el nombre va debajo en texto oscuro. Por eso el fondo debe ser transparente de verdad: si el generador entrega el damero gris/blanco "aplanado" (PNG sin canal alfa), hay que recortarlo antes de subirlo.
- Al pasar el mouse la imagen hace zoom 1.10, así que conviene dejar un pequeño margen alrededor del motivo para que no se corte al ampliarse.

Plantilla de estilo (reemplazar solo la lista de objetos para mantener coherencia entre categorías):

```
3D rendered product composition for an e-commerce category tile, isolated on a fully
transparent background. A large flat circle of bright cyan-blue #29ABE2 sits behind the
products as a backdrop. Arranged in front: [OBJETOS]. Glossy CGI style with soft studio
lighting and gentle contact shadows. A few green leaves and small white sparkles float
around the composition. Palette limited to cyan-blue, white, black and one accent color.
Products centered with margin on all sides, square 1:1, transparent PNG with alpha channel
--no text, letters, words, logos, watermarks, checkerboard background, white background
```

Objetos por categoría (`[OBJETOS]`):

| Categoría | Objetos |
|---|---|
| Cocina | a bottle of dish soap, a yellow sponge, a scrub brush, a stack of clean plates, a dish rack, folded microfiber cloths, a spray degreaser |
| Baños | a toilet brush with base, a spray bottle of bathroom cleaner, folded towels, a shower head, a tiled surface, rubber gloves |
| Desinfectantes | a large jug of disinfectant, a spray bottle, a hand sanitizer pump bottle, a pack of wipes |
| Pisos | a mop with bucket, a floor cleaner bottle, a broom, a wet floor sign |
| Ropa y lavandería | a box of detergent powder, a bottle of fabric softener, stacked folded clothes, a laundry basket |
| Papel y desechables | stacked toilet paper rolls, a paper towel roll, a napkin pack, a roll of trash bags |
| Protección personal | rubber gloves, safety goggles, a face mask box, a plastic apron, rubber boots |
| Línea institucional | three large 5 liter jugs lined up, a wall-mounted soap dispenser, a floor-standing pedal sanitizer stand with stainless base, a stack of folded industrial cloths (acento gris acero; evitar balde con exprimidor, trapero y carro de aseo: chocan con Baños) |
| Línea automotriz | a car shampoo bottle with a red label, a dashboard silicone spray can, a tire shine bottle, a blue wash mitt, a rolled microfiber drying towel, a rim brush, foam and water splashes (acento rojo; evitar balde, trapero y escoba) |
| Implementos | a long-handled broom, an orange dustpan, a window squeegee, a microfiber duster, a hand scrub brush, a stack of scouring pads (evitar balde con exprimidor, trapero y guantes: ya están en la imagen de Baños) |
| Limpieza general | a large multipurpose concentrate bottle with a purple label, a trigger spray of all purpose cleaner, an aerosol air freshener can, a glass cleaner bottle, a fan of folded microfiber cloths (evitar esponja, trapero, escoba y platos) |

## 7. Favicon y vista previa social (opcional, requiere código)

- **Estado:** no existe carpeta `apps/web/public` ni assets estáticos; el logo es un **SVG inline** en [components/logo.tsx](apps/web/components/logo.tsx). No hay favicon propio ni imagen de Open Graph, así que al compartir un enlace en WhatsApp o Facebook no aparece miniatura.
- **Para activarlo** (convenciones de Next.js 16 App Router): agregar `apps/web/app/icon.png` (512 × 512) y `apps/web/app/opengraph-image.png` (1200 × 630). Next los detecta solo, sin configuración.

Icono (se puede exportar directo del SVG del logo, o generarlo):

```
Minimal flat icon of a simple house silhouette with a sparkle, solid cyan-blue #29ABE2 on a
white background, thick clean geometric strokes, centered, generous padding, no text,
square 1:1, app icon style
```

Imagen social:

```
Horizontal banner composition: neat arrangement of unbranded household cleaning products in
white and cyan-blue on a soft gradient background from pale cyan to white, products grouped in
the right half, large clean empty area in the left half, bright commercial product photography,
1200x630
```

## Orden de prioridad

| # | Imagen | Impacto | Cantidad |
|---|---|---|---|
| 1 | Hero de portada (escritorio + móvil) | Alto — es lo primero que se ve | 2 |
| 2 | Fotos principales de producto | Alto — sin foto la tarjeta muestra un icono genérico | 1 por producto |
| 3 | Banners de promoción | Medio-alto — la sección se oculta si no hay imagen | 2 |
| 4 | Segundas fotos de producto | Medio — activan el hover del catálogo | 1 por producto |
| 5 | Portadas de blog | Medio | 1 por entrada |
| 6 | Favicon + Open Graph | Medio — afecta cómo se ve al compartir | 2 |
| 7 | Cabeceras de categoría | Bajo — requiere código nuevo | 1 por categoría |

La sección de banners promocionales solo se pinta si existe al menos un banner `HOME_PROMO` **con imagen**; el hero funciona sin imagen (queda el degradado azul liso). Las tarjetas de producto sin foto muestran un icono de gotas sobre fondo degradado, así que la tienda es usable desde el día uno, pero cada foto real sube la conversión de forma directa.
