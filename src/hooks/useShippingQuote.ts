import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cotizarEnvio, fetchDestinos } from "@/api/shipping";
import {
  parseCotizacionError,
  type Cotizacion,
  type DestinosResponse,
} from "@/api/schemas/shipping";
import {
  MOCK_DESTINOS,
  isShippingMockEnabled,
  mockCotizar,
  type MockCartItem,
} from "@/api/shipping.mock";

/** Debounce sobre los cambios del carrito. El cambio de municipio dispara inmediato. */
const DEBOUNCE_MS = 400;
/** Tope del memo `(cityId, cartSignature)` para que ir y volver entre municipios no re-cotice. */
const CACHE_MAX = 20;

export type ShippingQuoteItem = MockCartItem;

export type ShippingQuoteError = {
  /** Código de negocio del 422 (`producto_sin_peso`, `destino_no_soportado`, …) o null. */
  code: string | null;
  /** Mensaje listo para mostrar: el `detail` del backend cuando existe. */
  detail: string;
  contexto?: Record<string, unknown> | null;
};

const MENSAJE_GENERICO = "No pudimos calcular el costo de envío. Intenta de nuevo.";

const signatureOf = (items: ShippingQuoteItem[]) =>
  items.map((i) => `${i.id}x${i.quantity}`).join("|");

function esAborto(e: unknown): boolean {
  const name = (e as { name?: string } | null)?.name;
  return name === "AbortError";
}

/** Traduce cualquier error a la forma tipada, priorizando el 422 `{code, detail, contexto}`. */
function toQuoteError(e: unknown): ShippingQuoteError {
  const body = (e as { body?: unknown } | null)?.body;
  const negocio = parseCotizacionError(body);
  if (negocio) {
    return {
      code: negocio.code,
      detail: negocio.detail,
      contexto: (negocio.contexto ?? null) as Record<string, unknown> | null,
    };
  }
  const status = (e as { status?: number } | null)?.status;
  if (typeof status === "number" && status >= 500) {
    return { code: "servidor", detail: "El servicio de envíos no está disponible por ahora." };
  }
  const message = (e as Error | null)?.message;
  return { code: null, detail: message && !message.startsWith("HTTP ") ? message : MENSAJE_GENERICO };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Destinos (cascada departamento → municipio)                         */
/* ------------------------------------------------------------------ */

export function useShippingDestinos() {
  const [destinos, setDestinos] = useState<DestinosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    (async () => {
      try {
        const data = isShippingMockEnabled()
          ? MOCK_DESTINOS
          : await fetchDestinos(controller.signal);
        if (!alive) return;
        setDestinos(data);
        setError(null);
      } catch (e) {
        if (!alive || esAborto(e)) return;
        setError("No pudimos cargar los destinos de envío. Recarga la página.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return { destinos, loading, error };
}

/* ------------------------------------------------------------------ */
/* Cotización                                                          */
/* ------------------------------------------------------------------ */

export type UseShippingQuoteParams = {
  /** Municipio de destino elegido; null/0 mientras el usuario no elige. */
  cityId: number | null;
  items: ShippingQuoteItem[];
};

export function useShippingQuote({ cityId, items }: UseShippingQuoteParams) {
  const [quote, setQuote] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ShippingQuoteError | null>(null);
  const [nonce, setNonce] = useState(0);

  const cartSignature = useMemo(() => signatureOf(items), [items]);

  // Debounce: sólo la firma del carrito espera; `cityId` está en las deps sin retardo.
  const [debouncedSignature, setDebouncedSignature] = useState(cartSignature);
  useEffect(() => {
    if (debouncedSignature === cartSignature) return;
    const id = window.setTimeout(() => setDebouncedSignature(cartSignature), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [cartSignature, debouncedSignature]);

  // Los items se leen del ref al momento de disparar: siempre se cotiza el carrito más reciente.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, Cotizacion>>(new Map());

  useEffect(() => {
    // Un AbortController por request: el anterior se cancela, así no hay respuestas fuera de orden.
    abortRef.current?.abort();

    const vigentes = itemsRef.current.filter((i) => i.quantity > 0);

    if (!cityId || vigentes.length === 0) {
      abortRef.current = null;
      setQuote(null);
      setError(null);
      setLoading(false);
      return;
    }

    const key = `${cityId}::${signatureOf(vigentes)}`;
    const cached = cacheRef.current.get(key);
    if (cached) {
      abortRef.current = null;
      setQuote(cached);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        let result: Cotizacion;
        if (isShippingMockEnabled()) {
          await sleep(300); // deja ver el skeleton
          result = mockCotizar(cityId, vigentes);
        } else {
          result = await cotizarEnvio({
            idMunicipioDestino: cityId,
            items: vigentes,
            signal: controller.signal,
          });
        }
        if (controller.signal.aborted) return;
        cacheRef.current.set(key, result);
        if (cacheRef.current.size > CACHE_MAX) {
          const oldest = cacheRef.current.keys().next().value;
          if (oldest !== undefined) cacheRef.current.delete(oldest);
        }
        setQuote(result);
        setError(null);
      } catch (e) {
        if (controller.signal.aborted || esAborto(e)) return;
        setQuote(null);
        setError(toQuoteError(e));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
    // `debouncedSignature` es el disparador diferido; los items reales salen de `itemsRef`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId, debouncedSignature, nonce]);

  const refetch = useCallback(() => {
    cacheRef.current.clear();
    setNonce((n) => n + 1);
  }, []);

  return { quote, loading, error, refetch };
}
