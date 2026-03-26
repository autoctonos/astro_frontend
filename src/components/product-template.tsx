import ProductImages from "@/components/product-images";
import ProductDescription from "@/components/product-description";
import ProductActions from "@/components/product-actions";
import type { Producto } from "@/api/schemas/products";

export default function ProductTemplate({ product }: { product: Producto }) {
  return (
    <section className="mx-auto my-6 max-w-7xl rounded-2xl border border-white/50 bg-transparent px-4 py-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-custom-dark-green">{product.nombre}</h1>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="w-full sm:w-2/3">
          {product.imagenes?.length ? (
            <ProductImages
              images={product.imagenes}
              productName={product.nombre}
              outOfStock={product.stock === 0}
            />
          ) : null}
        </div>

        <div className="w-full sm:w-1/3">
          <ProductActions
            price={product.precio}
            precioConDescuento={product.precio_con_descuento}
            stock={product.stock}
            productId={product.id_producto}
            productName={product.nombre}
            image={product.imagenes?.[0]?.url_imagen ?? undefined}
            category={product.categoria ?? product.categoria_nombre}
          />
          <div className="mt-4 rounded-2xl border border-white/50 bg-white/60 p-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-300 ease-in-out hover:shadow-xl hover:bg-white/80 hover:-translate-y-2 cursor-default">
            <ProductDescription description={(product as any).descripcion} />
          </div>
        </div>
      </div>
    </section>
  );
}
