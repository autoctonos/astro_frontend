import { z } from "zod";


export const ProducerSchema = z.object({
  id_productor: z.number(),
  nombre: z.string(),
  descripcion: z.string(),
  imagen: z.string().nullable().optional(), 
  created_at: z.string().optional(),
});


export const ProducersArraySchema = z.array(ProducerSchema);

export type Producer = z.infer<typeof ProducerSchema>;