import { Spinner } from "@heroui/react";
import ProductList from "@/components/product-list";
import { useQuery } from "@/hooks/useQuery";
import { fetchProductosPorCategoria, type ProductForList } from "@/api/products";

export default function CategoryClient({ cat }: { cat: string }) {
  const q = useQuery<ProductForList[]>(() => fetchProductosPorCategoria(cat), [cat]);

  if (q.loading)
    return (
      <div className="p-6 text-gray-600 flex items-center gap-2">
        <Spinner size="sm" /> Cargando productos…
      </div>
    );
  if (q.error) return <div className="p-6 text-red-600">{String(q.error)}</div>;
  if (!q.data) return null;


  return <ProductList products={q.data} />;
}
