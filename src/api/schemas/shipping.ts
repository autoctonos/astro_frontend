import { z } from "zod";

/**
 * Contrato congelado de la app `shipping` del backend.
 *
 * REGLA DURA: **todo el dinero viaja como string** (`"25100.00"`) porque DRF serializa
 * `DecimalField` así. Nunca se convierte a `number` para mostrar el total ni —sobre todo—
 * para firmar el monto de PayU: un solo dígito de diferencia invalida la firma SHA256.
 * `Number(...)` sólo se usa para comparaciones (¿es > 0?, ¿difiere del carrito?).
 */
const Money = z.string();
/** Pesos en kg, también string decimal ("4.000"). */
const Kilos = z.string();

/* ------------------------------------------------------------------ */
/* GET /api/envios/destinos/                                           */
/* ------------------------------------------------------------------ */

export const MunicipioDestinoSchema = z.object({
  id_municipio: z.number().int(),
  nombre: z.string(),
  trayecto: z.string(),
  jerarquia: z.number().int(),
});

export const DepartamentoDestinoSchema = z.object({
  id_departamento: z.number().int(),
  nombre: z.string(),
  municipios: z.array(MunicipioDestinoSchema),
});

export const DestinosResponseSchema = z.object({
  version: z.string(),
  departamentos: z.array(DepartamentoDestinoSchema),
});

export type MunicipioDestino = z.infer<typeof MunicipioDestinoSchema>;
export type DepartamentoDestino = z.infer<typeof DepartamentoDestinoSchema>;
export type DestinosResponse = z.infer<typeof DestinosResponseSchema>;

/* ------------------------------------------------------------------ */
/* POST /api/envios/cotizar/                                           */
/* ------------------------------------------------------------------ */

/** El request acepta SÓLO ids y cantidades: precios, pesos y orígenes los resuelve el backend. */
export const CotizarRequestSchema = z.object({
  id_municipio_destino: z.number().int().positive(),
  items: z
    .array(
      z.object({
        id_producto: z.number().int().positive(),
        cantidad: z.number().int().positive(),
      })
    )
    .min(1),
});

export type CotizarRequest = z.infer<typeof CotizarRequestSchema>;

export const LineaCotizadaSchema = z.object({
  id_producto: z.number().int(),
  nombre: z.string(),
  cantidad: z.number().int(),
  precio_unitario: Money,
  peso_unitario_kg: Kilos,
  subtotal: Money,
  requiere_frio: z.boolean(),
});

export const EntregaSchema = z.object({
  dias_min: z.number().int(),
  dias_max: z.number().int(),
});

export const GrupoEnvioSchema = z.object({
  id_productor: z.number().int(),
  productor: z.string(),
  id_municipio_origen: z.number().int(),
  municipio_origen: z.string(),
  departamento_origen: z.string(),
  trayecto_aplicado: z.string(),
  jerarquia: z.number().int(),
  entrega: EntregaSchema,
  items: z.array(LineaCotizadaSchema),
  peso_bruto_kg: Kilos,
  peso_facturable_kg: z.number().int(),
  kilos_adicionales: z.number().int(),
  subtotal: Money,
  valor_kilo_inicial: Money,
  valor_kilo_adicional: Money,
  flete: Money,
  sobreflete: Money,
  peso_frio_kg: Kilos,
  neveras: z.number().int(),
  /** Obsoleto: el empaque va incluido en el flete y el backend siempre envía "0.00". */
  empaque: Money.optional(),
  total_grupo: Money,
});

export const DestinoCotizadoSchema = z.object({
  id_municipio: z.number().int(),
  nombre: z.string(),
  departamento: z.string(),
  trayecto: z.string(),
  jerarquia: z.number().int(),
});

export const PromocionCotizadaSchema = z.object({
  aplicada: z.boolean(),
  /** `null` cuando no hay promoción activa: el backend lo serializa con `allow_null`. */
  umbral: Money.nullable(),
  descuento: Money,
});

export const TotalesCotizacionSchema = z.object({
  subtotal_productos: Money,
  flete: Money,
  sobreflete: Money,
  /** Obsoleto: siempre "0.00", ver `GrupoEnvioSchema.empaque`. */
  empaque: Money.optional(),
  descuento_envio: Money,
  envio: Money,
  total: Money,
});

export const CotizacionSchema = z.object({
  destino: DestinoCotizadoSchema,
  grupos: z.array(GrupoEnvioSchema),
  entrega: EntregaSchema,
  promocion: PromocionCotizadaSchema,
  totales: TotalesCotizacionSchema,
  moneda: z.string(),
  generado_en: z.string(),
});

export type LineaCotizada = z.infer<typeof LineaCotizadaSchema>;
export type Entrega = z.infer<typeof EntregaSchema>;
export type GrupoEnvio = z.infer<typeof GrupoEnvioSchema>;
export type Cotizacion = z.infer<typeof CotizacionSchema>;

/* ------------------------------------------------------------------ */
/* Errores de negocio (HTTP 422)                                       */
/* ------------------------------------------------------------------ */

/** Códigos que el backend puede devolver con status 422. */
export const CODIGOS_COTIZACION = [
  "carrito_vacio",
  "destino_no_soportado",
  "producto_no_disponible",
  "producto_sin_peso",
  "producto_sin_productor",
  "producto_sin_origen",
  "origen_no_soportado",
  "empaque_no_configurado",
] as const;

export type CodigoCotizacion = (typeof CODIGOS_COTIZACION)[number];

/** El `code` se valida como string libre: un código nuevo del backend no debe romper el parseo. */
export const CotizacionErrorSchema = z.object({
  code: z.string(),
  detail: z.string(),
  contexto: z
    .looseObject({
      id_producto: z.number().int().optional(),
      nombre: z.string().optional(),
      id_municipio: z.number().int().optional(),
      municipio: z.string().optional(),
      departamento: z.string().optional(),
    })
    .nullish(),
});

export type CotizacionError = z.infer<typeof CotizacionErrorSchema>;

/** Extrae el error tipado del body de un 422; devuelve null si no tiene esa forma. */
export function parseCotizacionError(body: unknown): CotizacionError | null {
  const parsed = CotizacionErrorSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

/* ------------------------------------------------------------------ */
/* Utilidades de presentación                                          */
/* ------------------------------------------------------------------ */

const TRAYECTO_LABELS: Record<string, string> = {
  urbano: "Urbano",
  zonal: "Zonal",
  nacional: "Nacional",
  territorial: "Territorial",
  especial: "Especial",
};

export function trayectoLabel(codigo: string): string {
  return TRAYECTO_LABELS[codigo] ?? (codigo ? codigo.charAt(0).toUpperCase() + codigo.slice(1) : "");
}

/** «1 día hábil», «1 a 3 días hábiles». */
export function entregaLabel(entrega: { dias_min: number; dias_max: number }): string {
  const { dias_min, dias_max } = entrega;
  if (dias_min === dias_max) {
    return `${dias_min} ${dias_min === 1 ? "día hábil" : "días hábiles"}`;
  }
  return `${dias_min} a ${dias_max} días hábiles`;
}

/** `true` si un monto string del backend es mayor a cero. */
export function esPositivo(monto: string): boolean {
  const n = Number(monto);
  return Number.isFinite(n) && n > 0;
}
