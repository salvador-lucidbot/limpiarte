export const DATE_PRESETS = ["today", "yesterday", "last_7d", "last_14d", "last_30d", "last_90d", "this_month", "last_month"] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

export const WRITE_TOOLS = ["cambiar_estado_campana"] as const;

export interface AssistantToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
  strict: true;
}

export const READ_TOOL_DEFINITIONS: AssistantToolDefinition[] = [
  {
    name: "listar_campanas",
    description:
      "Lista las campañas de la cuenta publicitaria de Meta con su estado, objetivo y presupuesto. Úsala para saber qué campañas existen antes de pedir rendimiento o de proponer un cambio.",
    input_schema: {
      type: "object",
      properties: {
        limite: { type: "integer", description: "Cuántas campañas traer, entre 1 y 50. Por defecto 25." }
      },
      required: ["limite"],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: "rendimiento_campana",
    description:
      "Devuelve inversión, impresiones, clics, CTR, CPC, compras y costo por compra de una campaña en un período. El costo por compra es la métrica que decide: compáralo siempre contra el margen real del producto, que obtienes con costear_producto.",
    input_schema: {
      type: "object",
      properties: {
        campana_id: { type: "string", description: "Identificador de la campaña, tal como lo devuelve listar_campanas." },
        periodo: {
          type: "string",
          enum: [...DATE_PRESETS],
          description: "Ventana de tiempo. Por defecto last_30d."
        }
      },
      required: ["campana_id", "periodo"],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: "costear_producto",
    description:
      "Busca productos de la tienda por nombre y devuelve precio de venta vigente, costo unitario, margen en pesos y en porcentaje, existencias y unidades vendidas en los últimos 30 días. El costo solo existe si alguien lo cargó en el editor del producto: si viene nulo, dilo en vez de suponerlo.",
    input_schema: {
      type: "object",
      properties: {
        busqueda: { type: "string", description: "Parte del nombre del producto. Cadena vacía para traer los más vendidos." }
      },
      required: ["busqueda"],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: "resumen_ventas",
    description:
      "Resumen de ventas reales de la tienda en un período: pedidos, ingresos, ticket promedio y los productos más vendidos. Sirve para contrastar lo que Meta reporta como compras contra lo que de verdad entró a la tienda.",
    input_schema: {
      type: "object",
      properties: {
        dias: { type: "integer", description: "Cuántos días hacia atrás, entre 1 y 365. Por defecto 30." }
      },
      required: ["dias"],
      additionalProperties: false
    },
    strict: true
  }
];

export const WRITE_TOOL_DEFINITIONS: AssistantToolDefinition[] = [
  {
    name: "cambiar_estado_campana",
    description:
      "Pausa o reactiva una campaña de Meta. Es un cambio real sobre dinero en circulación: explica antes qué vas a cambiar y por qué, y no lo hagas si no tienes el dato que lo sustenta.",
    input_schema: {
      type: "object",
      properties: {
        campana_id: { type: "string", description: "Identificador de la campaña." },
        estado: { type: "string", enum: ["ACTIVE", "PAUSED"], description: "Estado al que debe pasar." },
        motivo: { type: "string", description: "Razón del cambio, con el dato que lo sustenta. Queda guardada en la auditoría." }
      },
      required: ["campana_id", "estado", "motivo"],
      additionalProperties: false
    },
    strict: true
  }
];

export const ASSISTANT_SYSTEM_PROMPT = `Eres el asistente del panel administrativo de Limpiarte, una tienda en línea colombiana de productos de aseo. Hablas español de Colombia, en tono directo y sin rodeos.

Tu trabajo es ayudar al equipo a decidir sobre la pauta en Meta usando los datos reales de la tienda, no solo lo que reporta Meta.

Reglas que no negocias:

1. No inventes cifras. Si no llamaste a una herramienta, no tienes el dato. Dilo.
2. El costo por compra de Meta solo significa algo contra el margen real del producto. Antes de decir que una campaña "va bien", busca el margen con costear_producto.
3. Si un producto no tiene costo cargado, el margen no se puede calcular. Dilo explícitamente y sugiere cargarlo en el editor del producto; no estimes.
4. Las compras que reporta Meta y los pedidos reales de la tienda casi nunca coinciden. Cuando la diferencia importe, contrasta con resumen_ventas y menciona la brecha.
5. Los montos son pesos colombianos. Escríbelos como $ 1.234.567, sin decimales.
6. Antes de pausar o reactivar una campaña, di qué vas a hacer y con qué dato lo sustentas. Si el equipo no te dio permiso de escritura, propón el cambio en palabras en vez de intentarlo.
7. Cuando no tengas acceso a algo, explica el motivo concreto en vez de dar un error genérico.

Un límite que debes conocer y explicar cuando venga al caso: la API de la Biblioteca de Anuncios de Meta solo devuelve anuncios sobre temas sociales, elecciones y política. Los anuncios comerciales de la competencia no son consultables por API, así que no puedes espiarlos desde aquí.

Responde corto. Si una tabla comunica mejor que un párrafo, usa una tabla.`;
