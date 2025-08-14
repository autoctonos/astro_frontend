// src/services/server/category.ts
import { fetchCategorias } from "@/api/category";
export async function getCategory() {
  try {
    const data = await fetchCategorias();
    return { success: true as const, data, message: "" };
  } catch (e: any) {
    return { success: false as const, data: [], message: e?.message ?? "Error" };
  }
}
