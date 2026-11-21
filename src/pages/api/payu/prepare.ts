import type { APIRoute } from "astro";
import { getSecret } from "astro:env/server";
import crypto from "node:crypto";
import { z } from "zod";
import { CotizacionSchema, parseCotizacionError } from "@/api/schemas/shipping";
import {
  BuyerSchema,
  NOTES_MAX,
  normalizeAddress,
  normalizeZip,
  validateAddress,
  validateZip,
} from "@/lib/validation/checkout";

// `PUBLIC_API_BASE` la inyecta Vite en build; el fallback a `process.env` cubre el caso
// de que sólo esté definida en el runtime server-side (sin depender de @types/node).
const runtimeEnv: Record<string, string | undefined> =
  (globalThis as any)?.process?.env ?? {};

const API_BASE =
  (import.meta.env.PUBLIC_API_BASE as string | undefined) ??
  runtimeEnv.PUBLIC_API_BASE ??
  "http://localhost:8000";

const COTIZAR_TIMEOUT_MS = 12000;

/**
 * Body aceptado. **`price` y `shippingCost` no existen en el schema**: Zod descarta las
 * claves desconocidas, así que aunque el navegador las mande nunca llegan al cálculo.
 * El monto lo decide exclusivamente la cotización server-to-server.
 */
const BodySchema = z.object({
  /** Mismas reglas que el formulario (`lib/validation/checkout.ts`); sale normalizado. */
  buyer: BuyerSchema,
  shipping: z
    .object({
      country: z.string().default("CO"),
      stateId: z.number().int().optional().nullable(),
      state: z.string().default(""),
      cityId: z.coerce.number().int().positive(),
      city: z.string().default(""),
      address: z.string().default(""),
      zip: z.string().optional().nullable(),
    })
    .superRefine((s, ctx) => {
      const address = validateAddress(s.address);
      if (address) ctx.addIssue({ code: "custom", path: ["address"], message: address });
      const zip = validateZip(s.zip);
      if (zip) ctx.addIssue({ code: "custom", path: ["zip"], message: zip });
    })
    .transform((s) => ({ ...s, address: normalizeAddress(s.address), zip: normalizeZip(s.zip) })),
  items: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1),
  notes: z.string().max(NOTES_MAX).optional().nullable(),
  /**
   * Total que el cliente creía que iba a pagar. **Sólo se usa para comparar** y avisarle
   * si cambió; jamás para calcular ni firmar el monto.
   */
  expectedTotal: z.string().optional().nullable(),
  referenceCode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  currency: z.string().default("COP"),
  tax: z.coerce.number().default(0),
  taxReturnBase: z.coerce.number().default(0),
  /**
   * true sólo cuando el cliente ya vio el aviso de reprecio y confirmó explícitamente.
   * Mientras sea false, esta llamada es de sólo lectura: NO debe crear un Pedido — si lo
   * hiciera, cada chequeo de reprecio dejaría un Pedido abandonado en la base, y al
   * confirmar se crearía un segundo.
   */
  confirmar: z.boolean().default(false),
});

/** Sólo para `tax` / `taxReturnBase`. El `amount` NUNCA pasa por aquí. */
function toMoneyString(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Payload inválido." }, 400);
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    // `fields` usa las mismas claves que el formulario (fullName, phone, address…) para
    // que el navegador pueda marcar cada campo si su validación quedó desactualizada.
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[issue.path.length - 1] ?? "payload");
      fields[key] ??= issue.message;
    }
    return json({ error: "Revisa los datos marcados en el formulario.", fields }, 400);
  }

  const {
    buyer,
    shipping,
    items,
    notes,
    expectedTotal,
    description,
    currency,
    tax,
    taxReturnBase,
    confirmar,
  } = parsed.data;

  // getSecret lee en runtime (adapter Vercel o Node). `import.meta.env.PAYU_*` se
  // incrustaba en el bundle en build time: sin las variables en el build quedaba
  // `undefined`, y con ellas el secreto terminaba dentro del artefacto.
  const MERCHANT_ID = getSecret("PAYU_MERCHANT_ID");
  const ACCOUNT_ID = getSecret("PAYU_ACCOUNT_ID");
  const API_KEY = getSecret("PAYU_API_KEY");
  const MODE = getSecret("PAYU_MODE") || "sandbox";
  const RESPONSE_URL = getSecret("PAYU_RESPONSE_URL") ?? "";
  const CONFIRMATION_URL = getSecret("PAYU_CONFIRMATION_URL") ?? "";

  if (!MERCHANT_ID || !ACCOUNT_ID || !API_KEY) {
    return json({ error: "Faltan credenciales PayU." }, 500);
  }

  /* --------- Re-cotización server-to-server: la única fuente del monto --------- */

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COTIZAR_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/envios/cotizar/`, {
      method: "POST",
      headers: { "content-type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        id_municipio_destino: shipping.cityId,
        items: items.map((it) => ({ id_producto: it.id, cantidad: it.quantity })),
      }),
      signal: controller.signal,
    });
  } catch {
    // Timeout o red caída. JAMÁS se cae de vuelta al monto del cliente.
    return json({ error: "No pudimos confirmar el costo de envío. Intenta de nuevo." }, 502);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (res.status === 422) {
      const negocio = parseCotizacionError(body);
      return json(
        {
          error: negocio?.detail ?? "No podemos despachar este pedido al destino elegido.",
          code: negocio?.code ?? "cotizacion_invalida",
        },
        409
      );
    }
    return json({ error: "No pudimos confirmar el costo de envío. Intenta de nuevo." }, 502);
  }

  const quoteParsed = CotizacionSchema.safeParse(await res.json().catch(() => null));
  if (!quoteParsed.success) {
    return json({ error: "No pudimos confirmar el costo de envío. Intenta de nuevo." }, 502);
  }
  const quote = quoteParsed.data;

  /**
   * VERBATIM. El mismo string entra a la firma y al campo del formulario: pasarlo por
   * Number()/toFixed() cambiaría un dígito y PayU rechazaría la firma.
   */
  const amount = quote.totales.total;

  const ofrecido = expectedTotal != null ? Number(expectedTotal) : null;
  const repriced =
    ofrecido != null && Number.isFinite(ofrecido)
      ? Math.abs(ofrecido - Number(amount)) > 0.005
      : false;

  // El precio cambió y el cliente todavía no confirmó ese nuevo precio: se corta ACÁ,
  // antes de crear nada. Si se creara el Pedido en este punto, cada reprecio dejaría un
  // Pedido abandonado y la confirmación posterior crearía un segundo.
  if (repriced && !confirmar) {
    return json({ quote, repriced });
  }

  /* --------- Crear el Pedido pendiente: la única fuente del referenceCode --------- */
  // Nunca se confía en `referenceCode` que mande el cliente (podría casar con el pedido
  // de otra persona): siempre se usa la referencia real del pedido recién creado.
  let orderRes: Response;
  try {
    orderRes = await fetch(`${API_BASE}/api/commerce/pedidos/crear/`, {
      method: "POST",
      headers: { "content-type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        comprador: {
          nombre: buyer.fullName,
          email: buyer.email,
          telefono: buyer.phone,
          tipo_documento: buyer.docType,
          documento: buyer.docNumber,
        },
        id_municipio_destino: shipping.cityId,
        items: items.map((it) => ({ id_producto: it.id, cantidad: it.quantity })),
        notas: notes ?? "",
      }),
      signal: controller.signal,
    });
  } catch {
    return json({ error: "No pudimos registrar el pedido. Intenta de nuevo." }, 502);
  }

  if (!orderRes.ok) {
    const text = await orderRes.text().catch(() => "");
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (orderRes.status === 422) {
      const negocio = parseCotizacionError(body);
      return json(
        {
          error: negocio?.detail ?? "No podemos despachar este pedido al destino elegido.",
          code: negocio?.code ?? "cotizacion_invalida",
        },
        409
      );
    }
    return json({ error: "No pudimos registrar el pedido. Intenta de nuevo." }, 502);
  }

  const orderData = (await orderRes.json().catch(() => null)) as {
    id_pedido?: number;
    referencia_payu?: string;
  } | null;
  if (!orderData?.referencia_payu) {
    return json({ error: "No pudimos registrar el pedido. Intenta de nuevo." }, 502);
  }

  const ref = orderData.referencia_payu;

  // Firma: apiKey~merchantId~referenceCode~amount~currency (SHA256)
  // https://developers.payulatam.com/.../payment-form.html
  const base = `${API_KEY}~${MERCHANT_ID}~${ref}~${amount}~${currency}`;
  const signature = crypto.createHash("sha256").update(base, "utf8").digest("hex");

  const action =
    MODE === "prod"
      ? "https://checkout.payulatam.com/ppp-web-gateway-payu/"
      : "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/";

  const fields: Record<string, string> = {
    // Obligatorios
    merchantId: MERCHANT_ID,
    accountId: ACCOUNT_ID,
    description: description || `Compra Autóctonos (${items.length} ítems)`,
    referenceCode: ref,
    amount,
    tax: toMoneyString(tax),
    taxReturnBase: toMoneyString(taxReturnBase),
    currency,
    signature,
    algorithmSignature: "SHA256",
    test: MODE === "prod" ? "0" : "1",
    responseUrl: RESPONSE_URL,
    confirmationUrl: CONFIRMATION_URL,

    // Payer / Buyer
    payerFullName: buyer.fullName,
    payerEmail: buyer.email,
    payerPhone: buyer.phone,
    payerDocumentType: buyer.docType,
    payerDocument: buyer.docNumber,
    buyerFullName: buyer.fullName,
    buyerEmail: buyer.email,
    buyerDocumentType: buyer.docType,
    buyerDocument: buyer.docNumber,
    telephone: buyer.phone,

    // Envío
    shippingCountry: shipping.country || "CO",
    shippingState: shipping.state,
    shippingCity: shipping.city,
    shippingAddress: shipping.address,
    zipCode: shipping.zip || "",
  };

  if (notes) fields.extra1 = notes.slice(0, 250);

  return json({ action, fields, quote, repriced });
};
