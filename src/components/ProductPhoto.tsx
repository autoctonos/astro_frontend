import type { ReactNode } from "react";
import { ImageOff } from "lucide-react";

import {
  productImageSrcSet,
  productImageUrl,
  type ProductImageFit,
  type ProductImageRatio,
} from "@/lib/product-image";

const ASPECT: Record<ProductImageRatio, string> = {
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
};

type ProductPhotoProps = {
  src?: string | null;
  alt: string;
  /** `sizes` del `<img>`: cuánto mide la foto en pantalla, para elegir del srcset. */
  sizes: string;
  /** Ancho máximo que se pedirá (px CSS × densidad). */
  maxWidth?: number;
  /** `cover` llena el marco (tarjetas, miniaturas); `contain` muestra el producto entero. */
  fit?: ProductImageFit;
  ratio?: ProductImageRatio;
  /** Clases del marco (radio, borde, ancho). */
  className?: string;
  imgClassName?: string;
  /** Primera foto visible (detalle del producto): carga sin lazy y con prioridad alta. */
  priority?: boolean;
  /** Producto agotado: la foto se apaga. */
  dimmed?: boolean;
  /** Superposiciones (insignias, estado agotado) dentro del marco. */
  children?: ReactNode;
};

/**
 * Marco único de foto de producto. Las vistas de catálogo (tarjeta, buscador, carrito,
 * checkout) llenan el marco con `cover`; el detalle usa `contain` para mostrar el producto
 * entero sobre blanco. La URL de Cloudinary se pide con el mismo recorte que se pinta.
 */
export default function ProductPhoto({
  src,
  alt,
  sizes,
  maxWidth = 960,
  fit = "contain",
  ratio = "1:1",
  className = "",
  imgClassName = "",
  priority = false,
  dimmed = false,
  children,
}: ProductPhotoProps) {
  const url = productImageUrl(src, maxWidth, { fit, ratio });

  return (
    <div
      className={`relative ${ASPECT[ratio]} overflow-hidden bg-white ring-1 ring-inset ring-custom-black/5 ${className}`}
    >
      {url ? (
        <img
          src={url}
          srcSet={productImageSrcSet(src, maxWidth, { fit, ratio })}
          sizes={sizes}
          alt={alt}
          width={maxWidth}
          height={ratio === "4:3" ? Math.round((maxWidth * 3) / 4) : maxWidth}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={`size-full ${fit === "cover" ? "object-cover" : "object-contain"} ${dimmed ? "opacity-60 grayscale" : ""} ${imgClassName}`}
        />
      ) : (
        <div
          role="img"
          aria-label={`${alt} (sin foto)`}
          className="flex size-full flex-col items-center justify-center gap-1 text-custom-dark-green/35"
        >
          <ImageOff className="size-[28%] max-h-10 max-w-10" aria-hidden="true" />
        </div>
      )}
      {children}
    </div>
  );
}
