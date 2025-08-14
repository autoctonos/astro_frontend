// src/services/server/products-image.ts
import { fetchProductosConImagenes } from "@/api/products";
export async function getProductsImages() {
  try {
    const data = await fetchProductosConImagenes();
    return { success: true as const, data, message: "" };
  } catch (e: any) {
    return { success: false as const, data: [], message: e?.message ?? "Error" };
  }
}
