import { http } from "@/lib/http";
import {
  CotizacionSchema,
  DestinosResponseSchema,
  type Cotizacion,
  type DestinosResponse,
} from "./schemas/shipping";

export const DESTINOS_PATH = "/api/envios/destinos/";
export const COTIZAR_PATH = "/api/envios/cotizar/";

/** Municipios con cobertura, ya agrupados por departamento (un solo GET, cacheable). */
export async function fetchDestinos(signal?: AbortSignal): Promise<DestinosResponse> {
  const data = await http<unknown>(DESTINOS_PATH, { signal });
  const parsed = DestinosResponseSchema.safeParse(data);
  if (!parsed.success) throw new Error("Respuesta inválida de destinos de envío");
  return parsed.data;
}

export type CotizarItem = { id: number | string; quantity: number };

export type CotizarParams = {
  idMunicipioDestino: number;
  items: CotizarItem[];
  signal?: AbortSignal;
};

/**
 * Cotiza el envío. Sólo se envían ids y cantidades: el backend resuelve precios, pesos
 * y municipio de origen desde la DB e ignora cualquier otra cosa que mande el cliente.
 */
export async function cotizarEnvio({
  idMunicipioDestino,
  items,
  signal,
}: CotizarParams): Promise<Cotizacion> {
  const payload = {
    id_municipio_destino: idMunicipioDestino,
    items: items
      .map((it) => ({ id_producto: Number(it.id), cantidad: Number(it.quantity) }))
      .filter((it) => Number.isInteger(it.id_producto) && it.id_producto > 0 && it.cantidad > 0),
  };

  const data = await http<unknown>(
    COTIZAR_PATH,
    { method: "POST", body: JSON.stringify(payload), signal },
    12000
  );

  const parsed = CotizacionSchema.safeParse(data);
  if (!parsed.success) throw new Error("Respuesta inválida de cotización de envío");
  return parsed.data;
}
