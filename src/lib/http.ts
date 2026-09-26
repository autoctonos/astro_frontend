const API_BASE = import.meta.env.PUBLIC_API_BASE ?? "http://localhost:8000";

/**
 * Error de una respuesta HTTP no exitosa.
 *
 * Retrocompatible con el `new Error(\`HTTP ${status} ${statusText}\`)` que se lanzaba
 * antes: `.message` conserva el mismo formato y `instanceof Error` sigue siendo cierto
 * (`useQuery` lee `e?.message`). Lo nuevo es que conserva el `status` y el `body` ya
 * parseado, indispensable para leer los 422 de negocio `{code, detail, contexto}`.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: unknown;

  constructor(status: number, statusText: string, body: unknown) {
    super(`HTTP ${status} ${statusText}`);
    this.name = "HttpError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    // Necesario para que `instanceof HttpError` funcione al compilar a ES5/ES2015.
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/** Intenta parsear el cuerpo como JSON; si no lo es, devuelve el texto crudo (o null). */
async function readBody(res: Response): Promise<unknown> {
  let text: string;
  try {
    text = await res.text();
  } catch {
    return null;
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function http<T>(path: string, init: RequestInit = {}, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  // Un `signal` externo (cancelación del llamador) aborta también el controller interno.
  const external = init.signal ?? undefined;
  const onExternalAbort = () => controller.abort((external as AbortSignal | undefined)?.reason);
  if (external) {
    if (external.aborted) controller.abort(external.reason);
    else external.addEventListener("abort", onExternalAbort, { once: true });
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
      signal: controller.signal,
      credentials: init.credentials ?? "omit",
    });
    if (!res.ok) throw new HttpError(res.status, res.statusText, await readBody(res));
    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  } finally {
    clearTimeout(id);
    if (external) external.removeEventListener("abort", onExternalAbort);
  }
}
