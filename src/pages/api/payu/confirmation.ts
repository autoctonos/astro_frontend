import type { APIRoute } from "astro";

// `PUBLIC_API_BASE` la inyecta Vite en build; el fallback a `process.env` cubre el caso
// de que sólo esté definida en el runtime server-side (sin depender de @types/node).
const runtimeEnv: Record<string, string | undefined> =
  (globalThis as any)?.process?.env ?? {};

const API_BASE =
  (import.meta.env.PUBLIC_API_BASE as string | undefined) ??
  runtimeEnv.PUBLIC_API_BASE ??
  "http://localhost:8000";

/**
 * Webhook de confirmación de PayU. Proxy delgado a propósito: la verificación de firma
 * (MD5, distinta de la SHA256 de `prepare.ts`) y el secreto `PAYU_API_KEY` viven sólo en
 * Django (`commerce/services/payu_confirmation.py`) — no se duplica el secreto en dos
 * runtimes. Este endpoint sólo reenvía el payload crudo tal cual llega.
 *
 * Siempre responde 200: PayU reintenta el webhook si no recibe 200, así que devolver un
 * error acá sólo generaría reintentos infinitos por algo que ya quedó registrado (o
 * descartado) del lado del backend.
 */
export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, string>;
  try {
    const form = await request.formData();
    payload = Object.fromEntries(form.entries()) as Record<string, string>;
  } catch {
    return new Response("OK", { status: 200 });
  }

  try {
    await fetch(`${API_BASE}/api/commerce/pagos/confirmar/`, {
      method: "POST",
      headers: { "content-type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // No se puede alcanzar el backend: se loguea para investigar, pero igual se
    // responde 200 — PayU reintentará y el próximo intento puede tener mejor suerte.
    console.error("[PayU confirmation] no se pudo reenviar al backend", error);
  }

  return new Response("OK", { status: 200 });
};
