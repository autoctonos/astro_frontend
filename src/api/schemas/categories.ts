import { z } from "zod";
export const CategoriaSchema = z.object({
  id: z.number().optional(),
  nombre: z.string(),
  slug: z.string().optional(),
});
export type Categoria = z.infer<typeof CategoriaSchema>;
export const CategoriasArraySchema = z.union([
  z.array(CategoriaSchema),
  z.object({ results: z.array(CategoriaSchema) }),
]);
