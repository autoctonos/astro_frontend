import { Spinner } from "@heroui/react";
import ProductsList from "@/components/product-list";
import CategoryList from "@/components/category-list";
import { subtitle, title } from "@/components/primitives";
import { fetchProductosConImagenes } from "@/api/products";
import { fetchCategorias } from "@/api/categories";
import { useQuery } from "@/hooks/useQuery";

export default function HomeClient() {
  const prod = useQuery(fetchProductosConImagenes, []);
  const cats = useQuery(fetchCategorias, []);

  return (
    <>
      <section className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <h1 className={title()}>
          Compra y vende <span className="text-custom-dark-green">productos</span> artesanales locales
        </h1>
        <p className={subtitle({ class: "mt-4 max-w-2xl" })}>
          El marketplace donde la tradición y la calidad se encuentran
        </p>
      </section>

      <section className="container mx-auto px-4 py-6">
        <h2 className={subtitle({ class: "mb-4 text-xl font-semibold" })}>Productos Destacados</h2>
        {prod.loading ? (
          <div className="flex items-center gap-2 text-custom-black/60"><Spinner size="sm" /> Cargando productos…</div>
        ) : prod.error ? (
          <p className="text-custom-red">{prod.error}</p>
        ) : (
          <ProductsList products={prod.data ?? []} />
        )}
      </section>

      <section className="container mx-auto px-4 py-6">
        <h2 className={subtitle({ class: "mb-4 text-xl font-semibold" })}>Categorías</h2>
        {cats.loading ? (
          <div className="flex items-center gap-2 text-custom-black/60"><Spinner size="sm" /> Cargando categorías…</div>
        ) : cats.error ? (
          <p className="text-custom-red">{cats.error}</p>
        ) : (
          <CategoryList categories={cats.data ?? []} />
        )}
      </section>
    </>
  );
}
