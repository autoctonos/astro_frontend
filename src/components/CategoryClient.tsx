import { Spinner } from "@heroui/react";
import { PackageOpen } from "lucide-react";
import ProductList from "@/components/product-list";
import { useQuery } from "@/hooks/useQuery";
import { fetchProductosPorCategoria, type ProductForList } from "@/api/products";

/** `cat`: id o slug de la categoría (el backend acepta ambos). */
export default function CategoryClient({ cat }: { cat: string | number }) {
  const q = useQuery<ProductForList[]>(() => fetchProductosPorCategoria(cat), [cat]);

  if (q.loading)
    return (
      <div className="p-6 text-gray-600 flex items-center gap-2">
        <Spinner size="sm" /> Cargando productos…
      </div>
    );
  if (q.error) return <div className="p-6 text-red-600">{String(q.error)}</div>;
  if (!q.data) return null;
  if (q.data.length === 0)
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-custom-dark-green/20 bg-white/40 px-6 py-12 text-center">
        <PackageOpen className="size-8 text-custom-dark-green/40" aria-hidden="true" />
        <p className="font-semibold text-custom-dark-green">Aún no hay productos en esta categoría</p>
        <p className="text-sm text-custom-black/60">Nuestros productores están preparando novedades. Explora otra categoría mientras tanto.</p>
      </div>
    );


  return <ProductList products={q.data} />;
}
