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
      <section className="flex flex-col items-center justify-center gap-5 py-8 md:py-10">
        <img src="/logo.svg" alt="logo" height={300} width={300} />
        <div className="inline-block max-w-xl justify-center text-center">
          <span className={title()}>Compra y vende&nbsp;</span>
          <span className={title({ color: "red" })}>productos&nbsp;</span>
          <br />
          <span className={title()}>artesanales locales</span>
          <div className={subtitle({ class: "mt-4" })}>
            El marketplace donde la tradición y la calidad se encuentran
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        <h2 className={subtitle({ class: "mb-4 text-xl font-semibold" })}>Productos Destacados</h2>
        {prod.loading ? (
          <div className="flex items-center gap-2 text-gray-600"><Spinner size="sm" /> Cargando productos…</div>
        ) : prod.error ? (
          <p className="text-red-600">{prod.error}</p>
        ) : (
          <ProductsList products={prod.data ?? []} />
        )}
      </section>

      <section className="container mx-auto px-4 py-6">
        <h2 className={subtitle({ class: "mb-4 text-xl font-semibold" })}>Categorías</h2>
        {cats.loading ? (
          <div className="flex items-center gap-2 text-gray-600"><Spinner size="sm" /> Cargando categorías…</div>
        ) : cats.error ? (
          <p className="text-red-600">{cats.error}</p>
        ) : (
          <CategoryList categories={cats.data ?? []} />
        )}
      </section>
    </>
  );
}
