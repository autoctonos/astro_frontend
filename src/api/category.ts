// src/api/categories.ts
import { http } from "@/lib/http";
import { CategoriasArraySchema, type Categoria } from "./schemas/categories";

export async function fetchCategorias(): Promise<Categoria[]> {
  const data = await http<unknown>("/api/productos/categorias/");
  const parsed = CategoriasArraySchema.safeParse(data);
  if (!parsed.success) throw new Error("Respuesta inválida de categorías");
  return Array.isArray(parsed.data) ? parsed.data : parsed.data.results;
}
