import { ChevronRight, MapPin, Sprout } from "lucide-react";

import ProductImages from "@/components/product-images";
import ProductActions from "@/components/product-actions";
import type { Producto } from "@/api/schemas/products";
import { categoryPath } from "@/lib/category-url";
import { productImageSrc } from "@/lib/product-image";

/**
 * Detalle de producto. Estructura de marketplace (Mercado Libre):
 * migas de pan → [galería | caja de compra fija al hacer scroll] → descripción y
 * características → quién lo produce.
 */
export default function ProductTemplate({ product }: { product: Producto }) {
  const categoria = product.categoria_nombre ?? product.categoria;
  const categoriaHref = categoria
    ? categoryPath({ nombre: categoria, slug: product.categoria_slug })
    : undefined;
  const origen = [product.municipio_nombre, product.departamento_nombre].filter(Boolean).join(", ");
  const peso = Number(product.peso_kg);

  const caracteristicas: Array<[string, string]> = [
    ["Categoría", categoria ?? ""],
    ["Presentación", product.presentacion_completa ?? ""],
    ["Peso de envío", peso > 0 ? `${peso.toLocaleString("es-CO", { maximumFractionDigits: 3 })} kg` : ""],
    ["Productor", product.productor_nombre ?? ""],
    ["Origen", origen],
    ["Cadena de frío", product.requiere_frio === undefined ? "" : product.requiere_frio ? "Sí, viaja refrigerado" : "No requiere"],
  ].filter(([, valor]) => valor) as Array<[string, string]>;

  return (
    <div className="py-4 sm:py-6">
      <nav aria-label="Migas de pan" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-custom-black/55">
          <li>
            <a href="/" className="hover:text-custom-dark-green hover:underline">
              Inicio
            </a>
          </li>
          {categoria && categoriaHref && (
            <li className="flex items-center gap-1">
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <a href={categoriaHref} className="hover:text-custom-dark-green hover:underline">
                {categoria}
              </a>
            </li>
          )}
          <li className="flex min-w-0 items-center gap-1">
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span aria-current="page" className="truncate text-custom-black/80">
              {product.nombre}
            </span>
          </li>
        </ol>
      </nav>

      <section className="grid gap-6 rounded-3xl border border-custom-black/5 bg-white/75 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_-12px_rgba(56,102,65,0.12)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-10 lg:p-8">
        <ProductImages
          images={product.imagenes ?? []}
          productName={product.nombre}
          outOfStock={product.stock === 0}
        />
        <div data-lupa-panel className="lg:sticky lg:top-24 lg:self-start">
          <ProductActions
            productId={product.id_producto}
            productName={product.nombre}
            price={product.precio}
            precioConDescuento={product.precio_con_descuento}
            stock={product.stock}
            image={productImageSrc(product.imagenes?.[0]?.url_imagen) ?? undefined}
            category={categoria}
            categoryHref={categoriaHref}
            presentation={product.presentacion_completa}
            producer={product.productor_nombre}
            origin={origen || null}
            requiresCold={product.requiere_frio}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-10">
        <section
          aria-labelledby="descripcion-titulo"
          className="rounded-3xl border border-custom-black/5 bg-white/75 p-6 sm:p-8"
        >
          <h2 id="descripcion-titulo" className="text-xl font-semibold text-custom-black">
            Descripción
          </h2>
          {product.descripcion?.trim() ? (
            <p className="mt-3 max-w-[70ch] whitespace-pre-wrap text-base leading-relaxed text-custom-black/75">
              {product.descripcion}
            </p>
          ) : (
            <p className="mt-3 text-custom-black/55">El productor aún no agregó una descripción.</p>
          )}

          {caracteristicas.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-semibold text-custom-black">Características</h2>
              <dl className="mt-3 overflow-hidden rounded-xl border border-custom-black/10 text-sm">
                {caracteristicas.map(([nombre, valor], i) => (
                  <div
                    key={nombre}
                    className={`grid grid-cols-[minmax(0,10rem)_1fr] gap-4 px-4 py-3 ${
                      i % 2 === 0 ? "bg-custom-cream/50" : "bg-white"
                    }`}
                  >
                    <dt className="font-medium text-custom-black/70">{nombre}</dt>
                    <dd className="text-custom-black">{valor}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        {product.productor_nombre && (
          <aside
            aria-labelledby="productor-titulo"
            className="h-fit rounded-3xl border border-custom-black/5 bg-white/75 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-custom-medium-green">
              Quién lo produce
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-custom-dark-green text-lg font-semibold text-white"
              >
                {product.productor_nombre.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 id="productor-titulo" className="truncate text-lg font-semibold text-custom-black">
                  {product.productor_nombre}
                </h2>
                {origen && (
                  <p className="flex items-center gap-1 text-sm text-custom-black/60">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    {origen}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-4 flex gap-2 text-sm text-custom-black/65">
              <Sprout className="mt-0.5 size-4 shrink-0 text-custom-medium-green" aria-hidden="true" />
              Cada compra apoya a productores locales de Colombia.
            </p>
            <a
              href="/producers"
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl border border-custom-dark-green/20 text-sm font-semibold text-custom-dark-green transition-colors hover:bg-custom-light-green/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
            >
              Conoce a nuestros productores
            </a>
          </aside>
        )}
      </div>
    </div>
  );
}
