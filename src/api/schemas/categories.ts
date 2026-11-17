import { z } from "zod";
export const CategoriaSchema = z.object({
  id: z.number().optional(),
  id_categoria: z.number().optional(),
  nombre: z.string(),
  /** Dirección pública: /categories/<slug>. La genera el backend. */
  slug: z.string().optional(),
  /** Slug de Lucide elegido en el admin; vacío = ícono por defecto. */
  icono: z.string().nullish(),
  /** SVG saneado por el backend al guardar; es lo que se pinta. */
  icono_svg: z.string().nullish(),
});
export type Categoria = z.infer<typeof CategoriaSchema>;
export const CategoriasArraySchema = z.union([
  z.array(CategoriaSchema),
  z.object({ results: z.array(CategoriaSchema) }),
]);
