import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ImageOff } from "lucide-react";

import { productImageSrcSet, productImageUrl } from "@/lib/product-image";

type Imagen = { url_imagen: string | null };

/**
 * Galería del detalle, con el patrón que el comprador ya conoce (Mercado Libre):
 *
 * - Escritorio: miniaturas en columna a la izquierda; pasar el mouse cambia la foto. Sobre
 *   la foto grande aparece una lente y, encima de la caja de compra (`[data-lupa-panel]`),
 *   un panel con esa zona ampliada.
 * - Celular: carrusel deslizable con scroll-snap y contador «1 / 3».
 *
 * La foto se muestra entera (`contain`). Si no es cuadrada, el espacio sobrante NO queda
 * en blanco: lo llena una copia difuminada de la misma foto (pedida a 64 px, pesa ~1 KB),
 * así cualquier foto —de estudio o ambientada— se ve integrada en el marco.
 */
export default function ProductImages({
  images,
  productName,
  outOfStock = false,
}: {
  images: Imagen[];
  productName: string;
  outOfStock?: boolean;
}) {
  const fotos = images.filter((i) => i.url_imagen).slice(0, 10);
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const total = fotos.length;

  const irA = useCallback(
    (i: number, desplazar = true) => {
      const destino = (i + total) % Math.max(total, 1);
      setCurrent(destino);
      const track = trackRef.current;
      if (desplazar && track) track.scrollTo({ left: destino * track.clientWidth, behavior: "smooth" });
    },
    [total],
  );

  // Celular: el índice sigue al dedo (scroll-snap), sin librerías de carrusel.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const alDesplazar = () => {
      const i = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
      setCurrent((prev) => (prev === i ? prev : i));
    };
    track.addEventListener("scroll", alDesplazar, { passive: true });
    return () => track.removeEventListener("scroll", alDesplazar);
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      irA(current + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      irA(current - 1);
    }
  };

  if (total === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl bg-custom-cream/60 text-custom-dark-green/40">
        <ImageOff className="size-10" aria-hidden="true" />
        <span className="text-sm">Este producto aún no tiene fotos</span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 lg:flex-row-reverse lg:items-start lg:gap-4"
      role="region"
      aria-roledescription="galería"
      aria-label={`Fotos de ${productName}`}
      onKeyDown={onKeyDown}
    >
      {/* Escenario */}
      <div className="relative min-w-0 flex-1">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl [scrollbar-width:none] lg:overflow-hidden [&::-webkit-scrollbar]:hidden"
        >
          {fotos.map((img, i) => (
            <Escenario
              key={i}
              src={img.url_imagen}
              alt={i === 0 ? productName : `${productName}, foto ${i + 1}`}
              priority={i === 0}
              dimmed={outOfStock}
              visible={i === current}
            />
          ))}
        </div>

        {total > 1 && (
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-custom-black/60 px-2.5 py-1 text-xs font-medium tabular-nums text-white backdrop-blur-sm lg:hidden">
            {current + 1} / {total}
          </span>
        )}
        {outOfStock && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-custom-black/75 px-3 py-1 text-xs font-semibold text-white">
            Agotado
          </span>
        )}
      </div>

      {/* Miniaturas */}
      {total > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:w-16 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {fotos.map((img, i) => {
            const activa = i === current;
            return (
              <li key={i} className="shrink-0">
                <button
                  type="button"
                  onClick={() => irA(i)}
                  onMouseEnter={() => irA(i)}
                  aria-label={`Ver foto ${i + 1} de ${total}`}
                  aria-current={activa ? "true" : undefined}
                  className={`block size-14 overflow-hidden rounded-xl bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green focus-visible:ring-offset-2 lg:size-16 ${
                    activa
                      ? "ring-2 ring-custom-dark-green"
                      : "ring-1 ring-custom-black/10 hover:ring-custom-medium-green"
                  }`}
                >
                  <img
                    src={productImageUrl(img.url_imagen, 160, { fit: "cover" }) ?? undefined}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                    className={`size-full object-cover ${outOfStock ? "opacity-60 grayscale" : ""}`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Aumento del panel de la lupa respecto a la foto como se ve en pantalla. */
const AUMENTO = 2.5;

type Caja = { x: number; y: number; w: number; h: number };
type Lupa = {
  /** Rectángulo de la foto real dentro del escenario (object-contain deja márgenes). */
  foto: Caja;
  /** Rectángulo de la lente, relativo al escenario. */
  lente: Caja;
  /** Dónde se pinta el panel ampliado (coordenadas de ventana). */
  panel: Caja;
};

/**
 * Una foto del carrusel. En escritorio con mouse, al pasar por encima aparece una lente
 * sobre la foto y un panel con la zona ampliada encima de la caja de compra (patrón de
 * Mercado Libre): se lee la etiqueta sin perder de vista la foto completa.
 */
function Escenario({
  src,
  alt,
  priority,
  dimmed,
  visible,
}: {
  src: string | null;
  alt: string;
  priority: boolean;
  dimmed: boolean;
  visible: boolean;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [lupa, setLupa] = useState<Lupa | null>(null);
  // Proporciones reales: el detalle no rellena a cuadrado, pone su propio fondo.
  const principal = productImageUrl(src, 1280, { fit: "original" });
  const ampliada = productImageUrl(src, 2000, { fit: "original" });
  const fondo = productImageUrl(src, 64, { fit: "cover" });

  // Al desplazar la página el panel quedaría desalineado: se cierra.
  useEffect(() => {
    if (!lupa) return;
    const cerrar = () => setLupa(null);
    window.addEventListener("scroll", cerrar, { passive: true });
    return () => window.removeEventListener("scroll", cerrar);
  }, [lupa]);

  const mover = (e: MouseEvent<HTMLDivElement>) => {
    const img = imgRef.current;
    // Sólo con mouse real y pantalla ancha (en táctil el gesto es deslizar el carrusel).
    if (!img?.naturalWidth || !window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches) {
      return;
    }
    const ancla = document.querySelector<HTMLElement>("[data-lupa-panel]");
    if (!ancla) return;

    const escenario = e.currentTarget.getBoundingClientRect();
    // Rectángulo de la foto dentro del escenario con object-contain.
    const escala = Math.min(escenario.width / img.naturalWidth, escenario.height / img.naturalHeight);
    const foto: Caja = {
      w: img.naturalWidth * escala,
      h: img.naturalHeight * escala,
      x: (escenario.width - img.naturalWidth * escala) / 2,
      y: (escenario.height - img.naturalHeight * escala) / 2,
    };

    const zona = ancla.getBoundingClientRect();
    const panel: Caja = { x: zona.left, y: escenario.top, w: zona.width, h: escenario.height };

    // La lente tiene la proporción del panel: lo que encierra es exactamente lo que se ve.
    const lw = Math.min(panel.w / AUMENTO, foto.w);
    const lh = Math.min(panel.h / AUMENTO, foto.h);
    const cx = e.clientX - escenario.left;
    const cy = e.clientY - escenario.top;
    if (cx < foto.x || cx > foto.x + foto.w || cy < foto.y || cy > foto.y + foto.h) {
      setLupa(null); // Sobre el fondo difuminado no hay nada que ampliar.
      return;
    }
    const lente: Caja = {
      w: lw,
      h: lh,
      x: Math.min(Math.max(cx - lw / 2, foto.x), foto.x + foto.w - lw),
      y: Math.min(Math.max(cy - lh / 2, foto.y), foto.y + foto.h - lh),
    };
    setLupa({ foto, lente, panel });
  };

  return (
    <div
      data-escenario={visible ? "activo" : undefined}
      className={`relative aspect-square w-full shrink-0 snap-center overflow-hidden bg-custom-cream/50 lg:cursor-crosshair ${
        visible ? "" : "lg:hidden"
      }`}
      onMouseMove={mover}
      onMouseLeave={() => setLupa(null)}
    >
      {fondo && (
        <img
          src={fondo}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-2xl"
        />
      )}
      <div className="absolute inset-0 bg-white/25" aria-hidden="true" />
      {principal && (
        <img
          ref={imgRef}
          src={principal}
          srcSet={productImageSrcSet(src, 1280, { fit: "original" })}
          sizes="(min-width: 1024px) 640px, 100vw"
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          draggable={false}
          className={`relative size-full object-contain ${dimmed ? "opacity-60 grayscale" : ""}`}
        />
      )}

      {lupa && ampliada && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute border border-white/80 bg-custom-black/20 shadow-[0_0_0_1px_rgba(17,17,17,0.15)]"
            style={{ left: lupa.lente.x, top: lupa.lente.y, width: lupa.lente.w, height: lupa.lente.h }}
          />
          {createPortal(
            <div
              aria-hidden="true"
              className="pointer-events-none fixed z-40 overflow-hidden rounded-2xl bg-white bg-no-repeat shadow-2xl ring-1 ring-custom-black/10"
              style={{
                left: lupa.panel.x,
                top: lupa.panel.y,
                width: lupa.panel.w,
                height: lupa.panel.h,
                backgroundImage: `url("${ampliada}")`,
                backgroundSize: `${lupa.foto.w * AUMENTO}px ${lupa.foto.h * AUMENTO}px`,
                backgroundPosition: `${-(lupa.lente.x - lupa.foto.x) * AUMENTO}px ${-(lupa.lente.y - lupa.foto.y) * AUMENTO}px`,
              }}
            />,
            document.body,
          )}
        </>
      )}
    </div>
  );
}
