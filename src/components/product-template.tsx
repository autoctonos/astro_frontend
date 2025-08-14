import ProductImages from "@/components/product-images";
import ProductDescription from "@/components/product-description";
import ProductActions from "@/components/product-actions";
import type { Producto } from "@/api/schemas/products";

export default function ProductTemplate({ product }: { product: Producto }) {
  return (
    <section className="mx-auto my-6 max-w-7xl rounded-3xl border border-gray-200 bg-white px-4 py-6 shadow-sm sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-custom-dark-green">{product.nombre}</h1>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="w-full sm:w-2/3">
          {product.imagenes?.length ? (
            <ProductImages images={product.imagenes} productName={product.nombre} />
          ) : null}
        </div>

        <div className="w-full sm:w-1/3">
          <ProductActions
            price={product.precio}
            stock={(product as any).stock}
            productId={product.id_producto}
            productName={product.nombre}
            image={product.imagenes?.[0]?.url_imagen}
          />
          <div className="mt-4 rounded-2xl border border-gray-200 p-4">
            <ProductDescription description={(product as any).descripcion} />
          </div>
        </div>
      </div>
    </section>
  );
}
