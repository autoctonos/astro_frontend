import clsx from "clsx";
import { useQuery } from "@/hooks/useQuery";
import { fetchCategorias } from "@/api/categories";
import type { Categoria } from "@/api/schemas/categories";
import { CategoryIcon } from "@/lib/category-icons";
import { categoryPath, categorySlug } from "@/lib/category-url";

export default function CategorySidebar({ currentSlug }: { currentSlug?: string }) {
  const q = useQuery<Categoria[]>(() => fetchCategorias(), []);

  const cats = q.data ?? [];


  return (
    <aside className="w-full max-w-64 shrink-0">
      <h2 className="mb-3 text-sm font-semibold text-custom-dark-green">Categorías</h2>

      {q.loading && (
        <ul className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-12 w-full animate-pulse rounded-xl bg-custom-medium-green/10" />
          ))}
        </ul>
      )}

      {!q.loading && q.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No se pudieron cargar las categorías.
        </div>
      )}

      {!q.loading && !q.error && (
        <ul className="space-y-1">
          {cats.map((c) => {
            const slug = categorySlug(c);
            const isActive = slug === currentSlug;
            const href = categoryPath(c);

            return (
              <li key={slug}>
                <a
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-custom-light-green/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green",
                    isActive
                      ? "bg-custom-light-green/10 font-semibold text-custom-dark-green"
                      : "text-custom-black"
                  )}
                >
                  <span
                    className={clsx(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-custom-dark-green text-white"
                        : "bg-custom-light-green/20 text-custom-dark-green group-hover:bg-custom-light-green/35"
                    )}
                  >
                    <CategoryIcon category={c} className="size-4" />
                  </span>
                  <span className="min-w-0 leading-snug">{c.nombre}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
