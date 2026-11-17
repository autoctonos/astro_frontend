import type { Categoria } from "@/api/schemas/categories";
import { categoryPath } from "@/lib/category-url";

export default function CategoryList({ categories }: { categories: Categoria[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map((c, i) => (
        <li key={c.slug ?? c.nombre ?? i}>
          <a
            href={categoryPath(c)}
            className="rounded-full border border-custom-medium-green/40 bg-custom-light-green/10 px-3 py-1 text-sm text-custom-dark-green transition hover:bg-custom-light-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
          >
            {c.nombre}
          </a>
        </li>
      ))}
    </ul>
  );
}
