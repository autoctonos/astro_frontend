import { http } from "@/lib/http";
import { ProductoSchema, ProductosArraySchema } from "@/api/schemas/products";
import { asset } from "@/lib/assets";
export type { Producto } from "@/api/schemas/products";

export async function fetchProductosConImagenes() {
  const data = await http<unknown>("/api/productos/productos-con-imagenes/");
  const parsed = ProductosArraySchema.safeParse(data);
  if (!parsed.success) throw new Error("Respuesta inválida de productos");
  return Array.isArray(parsed.data) ? parsed.data : parsed.data.results;
}

export async function fetchProductoById(id: string | number) {
  const data = await http<unknown>(`/api/productos/producto-detalle/${id}/`);
  const parsed = ProductoSchema.safeParse(data);
  if (!parsed.success) throw new Error("Producto no encontrado");
  return parsed.data;
}

export type ProductForList = {
  id_producto: number;
  nombre: string;
  imageUrl?: [];
  precio?: number | string;
};

export async function fetchProductosPorCategoria(cat: string | number): Promise<ProductForList[]> {
  const data = await http<unknown>(
    `/api/productos/productos_categoria/?id_categoria=${encodeURIComponent(String(cat))}`
  );

  const list = Array.isArray(data) ? (data as any[]) : (data as any)?.results ?? [];
  console.log(list)

  return list.map((p: any) => {
    const id = Number(p.id_producto ?? p.id);
    return {
      id_producto: id,
      nombre: p.nombre ?? `Producto ${id}`,
      imagenes: p.imagenes,             
      precio: p.precio,
    };
  });
}