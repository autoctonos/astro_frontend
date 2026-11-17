import { z } from "zod";

/**
 * Reglas de los datos del comprador y de la dirección del checkout.
 *
 * Un solo módulo para el navegador (`CheckoutShipping.tsx`, validación campo a campo) y
 * para el servidor (`pages/api/payu/prepare.ts`, que no confía en lo que validó el
 * navegador). Django repite las reglas críticas en `commerce/serializers.py`.
 *
 * Cada validador recibe el valor crudo y devuelve el mensaje de error o `null`.
 * `normalize*` deja el valor en la forma que se guarda y se envía a PayU.
 */

/* --------------------------------------------------------------------- tipos */

/** Códigos de PayU (`payerDocumentType`): pasaporte es `PP`, no "Passport". */
export const DOC_TYPES = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "PP", label: "Pasaporte" },
] as const;

export type DocType = (typeof DOC_TYPES)[number]["value"];

const DOC_TYPE_VALUES = DOC_TYPES.map((d) => d.value) as readonly string[];
const isDocType = (v: string): v is DocType => DOC_TYPE_VALUES.includes(v);

export type BuyerInput = {
  fullName: string;
  email: string;
  phone: string;
  docType: string;
  docNumber: string;
};

export type AddressInput = {
  address: string;
  zip?: string | null;
};

/* ------------------------------------------------------------------- helpers */

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
const digits = (s: string) => s.replace(/\D/g, "");
const allSameDigit = (s: string) => /^(\d)\1+$/.test(s);

/* --------------------------------------------------------------------- nombre */

const NAME_MAX = 80;
// Letras de cualquier alfabeto (tildes, ñ, ü), espacios, apóstrofo, guion y punto
// (iniciales: "Ana M. Pérez").
const NAME_RE = /^[\p{L}][\p{L}\p{M}'’. -]*$/u;

export function normalizeFullName(v: string) {
  return collapse(v);
}

export function validateFullName(raw: string): string | null {
  const v = normalizeFullName(raw);
  if (!v) return "Escribe tu nombre completo";
  if (/\d/.test(v)) return "El nombre no puede tener números";
  if (!NAME_RE.test(v)) return "Usa solo letras, sin símbolos";
  const palabras = v.split(" ").filter((p) => /\p{L}{2,}/u.test(p));
  if (palabras.length < 2) return "Escribe tu nombre y al menos un apellido";
  if (v.length > NAME_MAX) return `Máximo ${NAME_MAX} caracteres`;
  return null;
}

/* ---------------------------------------------------------------------- email */

const EMAIL_MAX = 254;

export function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

export function validateEmail(raw: string): string | null {
  const v = normalizeEmail(raw);
  if (!v) return "Escribe tu correo electrónico";
  if (!v.includes("@")) return "Al correo le falta la @ (ej. nombre@gmail.com)";
  if (/\s/.test(v)) return "El correo no puede tener espacios";
  if (v.length > EMAIL_MAX || !z.email().safeParse(v).success)
    return "Revisa el correo, parece incompleto (ej. nombre@gmail.com)";
  return null;
}

const COMMON_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "yahoo.es",
  "icloud.com",
  "live.com",
  "hotmail.es",
  "outlook.es",
  "msn.com",
];

function distance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[a.length][b.length];
}

/**
 * "ana@gmial.com" → "ana@gmail.com". Sólo sugiere, nunca corrige solo: un dominio
 * corporativo parecido a uno popular es legítimo.
 */
export function suggestEmail(raw: string): string | null {
  const v = normalizeEmail(raw);
  const at = v.lastIndexOf("@");
  if (at < 1) return null;
  const domain = v.slice(at + 1);
  if (!domain || COMMON_DOMAINS.includes(domain)) return null;
  let best: string | null = null;
  let bestD = Infinity;
  for (const d of COMMON_DOMAINS) {
    const dist = distance(domain, d);
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  }
  return best && bestD > 0 && bestD <= 2 ? `${v.slice(0, at)}@${best}` : null;
}

/* -------------------------------------------------------------------- celular */

/**
 * Celular colombiano: 10 dígitos, empieza por 3 y el segundo dígito es de un bloque
 * asignado por la CRC a móviles (30x, 31x, 32x, 33x, 35x).
 */
const CELULAR_RE = /^3[0-35]\d{8}$/;

/** Sólo dígitos; acepta que peguen "+57 300…" o "57300…" y quita el indicativo. */
export function normalizePhone(v: string) {
  let d = digits(v);
  if (d.length > 10 && d.startsWith("57")) d = d.slice(2);
  return d.slice(0, 10);
}

/** "3001234567" → "300 123 4567" (parcial mientras escribe). */
export function formatPhone(v: string) {
  const d = normalizePhone(v);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(" ");
}

export function validatePhone(raw: string): string | null {
  const d = normalizePhone(raw);
  if (!d) return "Escribe tu número de celular";
  if (d[0] !== "3") return "El celular debe empezar por 3";
  if (d.length < 10) return `Faltan ${10 - d.length} dígito${10 - d.length === 1 ? "" : "s"}`;
  if (!CELULAR_RE.test(d) || allSameDigit(d.slice(3))) return "Este número no parece un celular válido";
  return null;
}

/* ------------------------------------------------------------------ documento */

type DocRule = {
  inputMode: "numeric" | "text";
  /** Informativo: el recorte real lo hace `normalizeDocNumber` (un maxLength en el input cortaría un pegado con puntos). */
  maxLength: number;
  placeholder: string;
  hint: string;
};

export const DOC_RULES: Record<DocType, DocRule> = {
  CC: { inputMode: "numeric", maxLength: 10, placeholder: "1012345678", hint: "Solo números, sin puntos" },
  CE: { inputMode: "numeric", maxLength: 10, placeholder: "123456", hint: "Solo números, sin puntos" },
  NIT: { inputMode: "numeric", maxLength: 12, placeholder: "900123456-7", hint: "Con o sin dígito de verificación" },
  PP: { inputMode: "text", maxLength: 20, placeholder: "AB123456", hint: "Letras y números, como aparece en el pasaporte" },
};

/** Dígito de verificación de la DIAN (módulo 11 con los pesos oficiales). */
export function nitCheckDigit(base: string) {
  const pesos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const suma = base
    .split("")
    .reverse()
    .reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  const r = suma % 11;
  return r > 1 ? 11 - r : r;
}

/** Limpia mientras escribe: dígitos para CC/CE, dígitos + un guion para NIT, alfanumérico para PP. */
export function normalizeDocNumber(docType: string, v: string) {
  switch (docType) {
    case "NIT": {
      const limpio = v.replace(/[^\d-]/g, "");
      const [base, ...resto] = limpio.split("-");
      const b = base.slice(0, 10);
      return resto.length ? `${b}-${resto.join("").slice(0, 1)}` : b;
    }
    case "PP":
      return v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 20);
    case "CC":
    case "CE":
      return digits(v).slice(0, 10);
    default:
      return v.trim();
  }
}

export function validateDocType(v: string): string | null {
  if (!v) return "Selecciona el tipo de documento";
  if (!isDocType(v)) return "Tipo de documento no válido";
  return null;
}

export function validateDocNumber(raw: string, docType: string): string | null {
  const v = normalizeDocNumber(docType, raw);
  if (!v) return "Escribe tu número de documento";
  if (!isDocType(docType)) return "Primero elige el tipo de documento";

  switch (docType) {
    case "CC":
    case "CE": {
      const nombre = docType === "CC" ? "La cédula" : "La cédula de extranjería";
      if (v.startsWith("0")) return `${nombre} no empieza por 0`;
      if (v.length < 5 || v.length > 10) return `${nombre} tiene entre 5 y 10 dígitos`;
      if (allSameDigit(v)) return "Este número de documento no parece válido";
      return null;
    }
    case "NIT": {
      const [base, dv] = v.split("-");
      if (!/^\d+$/.test(base) || base.length < 5 || base.length > 10)
        return "El NIT tiene entre 5 y 10 dígitos antes del guion";
      if (allSameDigit(base)) return "Este NIT no parece válido";
      if (dv !== undefined) {
        if (!/^\d$/.test(dv)) return "Falta el dígito de verificación después del guion";
        if (Number(dv) !== nitCheckDigit(base))
          return `El dígito de verificación no coincide (debería ser ${nitCheckDigit(base)})`;
      }
      return null;
    }
    case "PP":
      if (v.length < 5 || v.length > 20) return "El pasaporte tiene entre 5 y 20 caracteres";
      if (!/\d/.test(v)) return "El número de pasaporte debe incluir números";
      return null;
  }
}

/* ------------------------------------------------------------------ dirección */

const ADDRESS_MAX = 120;

export function normalizeAddress(v: string) {
  return collapse(v);
}

export function validateAddress(raw: string): string | null {
  const v = normalizeAddress(raw);
  if (!v) return "Escribe la dirección de entrega";
  if (v.length < 6) return "Dirección incompleta (ej. Calle 10 # 5-23)";
  if (!/\d/.test(v)) return "Incluye la numeración (ej. Calle 10 # 5-23)";
  if (!/\p{L}/u.test(v)) return "Incluye el tipo de vía (Calle, Carrera, Avenida…)";
  if (!/^[\p{L}\p{M}\d\s#.,°º/()'-]+$/u.test(v)) return "Quita los símbolos especiales de la dirección";
  if (v.length > ADDRESS_MAX) return `Máximo ${ADDRESS_MAX} caracteres`;
  return null;
}

export function normalizeZip(v: string | null | undefined) {
  return digits(v ?? "").slice(0, 6);
}

/** Opcional; si se escribe, son los 6 dígitos de 4-72. */
export function validateZip(raw: string | null | undefined): string | null {
  const v = normalizeZip(raw);
  if (!v) return null;
  if (v.length !== 6) return "El código postal tiene 6 dígitos";
  return null;
}

export const NOTES_MAX = 300;

/* -------------------------------------------------------------- agregadores */

export type BuyerField = keyof BuyerInput;

export function validateBuyerField(field: BuyerField, buyer: BuyerInput): string | null {
  switch (field) {
    case "fullName":
      return validateFullName(buyer.fullName);
    case "email":
      return validateEmail(buyer.email);
    case "phone":
      return validatePhone(buyer.phone);
    case "docType":
      return validateDocType(buyer.docType);
    case "docNumber":
      return validateDocNumber(buyer.docNumber, buyer.docType);
  }
}

export const BUYER_FIELDS: BuyerField[] = ["fullName", "docType", "docNumber", "email", "phone"];

export function normalizeBuyer(b: BuyerInput): BuyerInput {
  return {
    fullName: normalizeFullName(b.fullName),
    email: normalizeEmail(b.email),
    phone: normalizePhone(b.phone),
    docType: b.docType,
    docNumber: normalizeDocNumber(b.docType, b.docNumber),
  };
}

/* ------------------------------------------------------------------ servidor */

/** Para el endpoint: valida con las mismas reglas y devuelve el comprador normalizado. */
export const BuyerSchema = z
  .object({
    fullName: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    docType: z.string().default(""),
    docNumber: z.string().default(""),
  })
  .superRefine((b, ctx) => {
    for (const field of BUYER_FIELDS) {
      const msg = validateBuyerField(field, b);
      if (msg) ctx.addIssue({ code: "custom", path: [field], message: msg });
    }
  })
  .transform(normalizeBuyer);
