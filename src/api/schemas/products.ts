import { z } from "zod";

export const ImagenSchema = z.object({
  url_imagen: z.string().nullable(),
});

export const ProductoSchema = z.object({
  id_producto: z.number(),
  nombre: z.string(),
  descripcion: z.string(),
  precio: z.union([z.number(), z.string()]),
  precio_con_descuento: z.union([z.number(), z.string()]).nullable().optional(),
  stock: z.number(),
  imagenes: z.array(ImagenSchema).optional(),
  categoria: z
    .union([z.string(), z.object({ nombre: z.string() })])
    .optional()
    .transform((c) => (c == null ? undefined : typeof c === "string" ? c : c.nombre)),
  categoria_nombre: z.string().optional(),
});

export type Producto = z.infer<typeof ProductoSchema>;

export const ProductosArraySchema = z.union([
  z.array(ProductoSchema),
  z.object({ results: z.array(ProductoSchema) }),
]);
