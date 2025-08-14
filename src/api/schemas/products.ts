import { z } from "zod";

export const ImagenSchema = z.object({
  url_imagen: z.string(),
});

export const ProductoSchema = z.object({
  id_producto: z.number(),
  nombre: z.string(),
  precio: z.union([z.number(), z.string()]),
  imagenes: z.array(ImagenSchema).optional(),
});

export type Producto = z.infer<typeof ProductoSchema>;

export const ProductosArraySchema = z.union([
  z.array(ProductoSchema),
  z.object({ results: z.array(ProductoSchema) }),
]);
