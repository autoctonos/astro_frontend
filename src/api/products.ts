import { http } from "@/lib/http";
import { ProductoSchema, ProductosArraySchema } from "@/api/schemas/products";
import { asset } from "@/lib/assets";
export type { Producto } from "@/api/schemas/products";

export async function fetchProductosConImagenes() {
  const all: unknown[] = [];

  let path: string | null = "/api/productos/productos-con-imagenes/";

  while (path) {
    const data = await http<unknown>(path);
    const parsed = ProductosArraySchema.safeParse(data);

    if (!parsed.success) {
      throw new Error("Respuesta inválida de productos");
    }

    if (Array.isArray(parsed.data)) {
      all.push(...parsed.data);
      break;
    }

    all.push(...parsed.data.results);

    const anyData = data as any;
    const next: string | null | undefined = anyData?.next;
    if (!next) {
      path = null;
    } else {
      try {
        const url = new URL(next);
        path = `${url.pathname}${url.search}`;
      } catch {
        path = next;
      }
    }
  }

  const finalParsed = ProductosArraySchema.safeParse(all);
  if (!finalParsed.success) {
    throw new Error("Respuesta inválida de productos (acumulada)");
  }

  return finalParsed.data as any;
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
  precio?: number | string;
  precio_con_descuento?: number | string | null;
  stock?: number;
  imagenes?: Array<{ url_imagen: string | null }>;
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
      precio_con_descuento: p.precio_con_descuento ?? null,
      stock: typeof p.stock === "number" ? p.stock : undefined,
    };
  });
}