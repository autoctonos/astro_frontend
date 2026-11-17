import type { Categoria } from "@/api/schemas/categories";
import { slugify } from "@/lib/slug";

/**
 * Dirección pública de una categoría: `/categories/<slug>` (minúsculas y guiones, ej.
 * `/categories/lacteos-quesos`). El slug lo define el backend (`Categoria.slug`, único y
 * estable al renombrar); `slugify(nombre)` sólo cubre un backend que todavía no lo manda.
 */
export function categorySlug(categoria: Pick<Categoria, "slug" | "nombre">): string {
  return categoria.slug || slugify(categoria.nombre);
}

export function categoryPath(categoria: Pick<Categoria, "slug" | "nombre">): string {
  return `/categories/${categorySlug(categoria)}`;
}

/**
 * Resuelve el segmento de la URL. `canonical` = ya es el slug; si no, es una dirección
 * vieja (`/categories/BEBIDAS`, `/categories/CAF%C3%89`, `/categories/3`) que se redirige.
 */
export function resolveCategory(
  categorias: Categoria[],
  segmento: string,
): { categoria: Categoria; canonical: boolean } | null {
  let crudo = segmento.trim();
  try {
    crudo = decodeURIComponent(crudo);
  } catch {
    // `%` suelto: se compara tal cual.
  }
  const exacta = categorias.find((c) => categorySlug(c) === crudo);
  if (exacta) return { categoria: exacta, canonical: true };
  const plano = slugify(crudo);
  const vieja =
    categorias.find((c) => String(c.id_categoria) === crudo) ??
    categorias.find((c) => categorySlug(c) === plano || slugify(c.nombre) === plano);
  return vieja ? { categoria: vieja, canonical: false } : null;
}
