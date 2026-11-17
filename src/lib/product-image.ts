/**
 * Fotos de producto: una sola forma de resolver y pedir la imagen en toda la tienda.
 *
 * Estándar (lo aplica el backend al subir, `products/imagenes.py`): maestro JPEG cuadrado
 * 1:1 de hasta 1600 px, producto centrado ocupando ~88 % del lado, fondo blanco puro.
 *
 * En la entrega, si la foto vive en Cloudinary se pide ya transformada al tamaño y la
 * proporción que se van a pintar (`cover` → `c_fill,g_auto`; `contain` → `c_pad` sobre
 * blanco), con `f_auto` (AVIF/WebP según el navegador) y `q_auto`. Una miniatura del
 * carrito pesa ~5 KB en vez del maestro entero.
 */

const API_BASE = (import.meta.env.PUBLIC_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const CLOUDINARY_UPLOAD = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/** Anchos servidos. Cubren desde la miniatura del buscador (44 px @2x) hasta el detalle. */
export const PRODUCT_IMAGE_WIDTHS = [96, 160, 320, 480, 640, 960, 1280] as const;

/** URL absoluta del archivo maestro, o `null` si el producto no tiene foto. */
export function productImageSrc(url?: string | null): string | null {
  const limpia = url?.trim();
  if (!limpia) return null;
  if (/^(https?:|data:|blob:)/i.test(limpia)) return limpia;
  // Rutas relativas que manda Django (`/media/...`) en desarrollo.
  return `${API_BASE}${limpia.startsWith("/") ? "" : "/"}${limpia}`;
}

export type ProductImageFit = "cover" | "contain" | "original";
export type ProductImageRatio = "1:1" | "4:3";

type ProductImageOptions = { fit?: ProductImageFit; ratio?: ProductImageRatio };

/**
 * Transformación Cloudinary según cómo se pinta la foto:
 * - `cover`: llena el marco (recorta bordes, `g_auto` elige la zona importante).
 * - `contain`: producto completo, completado a la proporción sobre blanco.
 * - `original`: sin recorte ni relleno (sólo limita el ancho). Lo usa el detalle, que
 *   pone su propio fondo y necesita las proporciones reales para la lupa.
 */
function cloudinaryTransform(width: number, { fit = "contain", ratio = "1:1" }: ProductImageOptions) {
  const w = Math.round(width);
  const base =
    fit === "cover" ? `c_fill,g_auto,ar_${ratio}` : fit === "original" ? "c_limit" : `c_pad,ar_${ratio},b_white`;
  return `${base},w_${w},f_auto,q_auto`;
}

/** URL de la foto a `width` px de ancho, recortada o completada según `fit`. */
export function productImageUrl(
  url: string | null | undefined,
  width: number,
  options: ProductImageOptions = {},
): string | null {
  const src = productImageSrc(url);
  if (!src) return null;
  const match = src.match(CLOUDINARY_UPLOAD);
  if (!match) return src;
  return `${match[1]}${cloudinaryTransform(width, options)}/${match[2]}`;
}

/** `srcset` con los anchos estándar hasta `maxWidth`; `undefined` fuera de Cloudinary. */
export function productImageSrcSet(
  url: string | null | undefined,
  maxWidth = 1280,
  options: ProductImageOptions = {},
): string | undefined {
  const src = productImageSrc(url);
  if (!src || !CLOUDINARY_UPLOAD.test(src)) return undefined;
  return PRODUCT_IMAGE_WIDTHS.filter((w) => w <= maxWidth)
    .map((w) => `${productImageUrl(src, w, options)} ${w}w`)
    .join(", ");
}
