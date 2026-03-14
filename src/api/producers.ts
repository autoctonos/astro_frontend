import { http } from "@/lib/http";
import { ProducersArraySchema } from "@/api/schemas/producers";
export type { Producer } from "@/api/schemas/producers";

export async function fetchProductoresConImagenes() {
  const data = await http<unknown>("/api/productores/");
  const parsed = ProducersArraySchema.safeParse(data);
  if (!parsed.success) throw new Error("Respuesta inválida de productores");
  return Array.isArray(parsed.data) ? parsed.data : parsed.data;
}