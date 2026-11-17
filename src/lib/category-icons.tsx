import { Tag } from "lucide-react";
import type { Categoria } from "@/api/schemas/categories";

/**
 * Ícono de una categoría. `icono_svg` es el SVG que Django descargó de Iconify al guardar
 * en el admin y ya saneó (whitelist de elementos y atributos en `products/iconos.py`), por
 * eso se inyecta tal cual: no hay request a Iconify en runtime ni depende de la versión
 * de lucide-react instalada.
 *
 * Sin ícono elegido se muestra uno neutro (etiqueta) para todas: una rotación arbitraria
 * hacía que «Bebidas» saliera con una dona. Para asignar íconos con sentido a categorías
 * existentes: `python manage.py asignar_iconos_categorias --apply`.
 */
export function CategoryIcon({
  category,
  className = "size-5",
}: {
  category: Pick<Categoria, "icono_svg">;
  className?: string;
}) {
  if (category.icono_svg) {
    return (
      <span
        aria-hidden="true"
        className={`inline-block [&>svg]:size-full ${className}`}
        dangerouslySetInnerHTML={{ __html: category.icono_svg }}
      />
    );
  }
  return <Tag className={className} aria-hidden="true" />;
}
