// src/api/products.ts
import { http } from "@/lib/http";
import { ProductoSchema, ProductosArraySchema } from "@/api/schemas/products";
export type { Producto } from "@/api/schemas/products";

export async function fetchProductosConImagenes() {
  const data = await http<unknown>("/api/productos/productos-con-imagenes/");
  const parsed = ProductosArraySchema.safeParse(data);
  if (!parsed.success) throw new Error("Respuesta inválida de productos");
  return Array.isArray(parsed.data) ? parsed.data : parsed.data.results;
}

export async function fetchProductoById(id: string | number) {
  const data = await http<unknown>(`/api/productos/${id}/`);
  const parsed = ProductoSchema.safeParse(data);
  if (!parsed.success) throw new Error("Producto no encontrado");
  return parsed.data;
}
