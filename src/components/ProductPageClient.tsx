import { Spinner } from "@heroui/react";
import ProductTemplate from "@/components/product-template";
import { fetchProductoById } from "@/api/products";
import { useQuery } from "@/hooks/useQuery";

export default function ProductPageClient({ id }: { id: string }) {
  const q = useQuery(() => fetchProductoById(id), [id]);

  if (q.loading) return <div className="p-6 text-gray-600 flex items-center gap-2"><Spinner size="sm" /> Cargando…</div>;
  if (q.error) return <div className="p-6 text-red-600">{q.error}</div>;
  if (!q.data) return null;


  return <ProductTemplate product={q.data} />;
}
