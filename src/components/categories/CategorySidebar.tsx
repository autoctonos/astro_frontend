import { useMemo } from "react";
import clsx from "clsx";
import { useQuery } from "@/hooks/useQuery";
import { fetchCategorias } from "@/api/categories";
import type { Categoria } from "@/api/schemas/categories";

export default function CategorySidebar({ currentCat }: { currentCat?: string }) {
  const q = useQuery<Categoria[]>(() => fetchCategorias(), []);

  const cats = q.data ?? [];

  const activeKey = useMemo(() => (currentCat ?? "").toLowerCase(), [currentCat]);

  return (
    <aside className="w-full max-w-64 shrink-0">
      <h2 className="mb-3 text-sm font-semibold text-custom-dark-green">Categorías</h2>

      {q.loading && (
        <ul className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-9 w-full animate-pulse rounded-xl bg-custom-medium-green/10" />
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
            const name = (c as any).nombre ?? String((c as any).id_categoria);
            const idStr = String((c as any).id_categoria);
            const isActive =
              activeKey === name.toLowerCase() || activeKey === idStr.toLowerCase();

            const href = `/categories/${encodeURIComponent(name || idStr)}`;

            return (
              <li key={idStr}>
                <a
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                    "block rounded-xl px-3 py-2 transition hover:bg-custom-light-green/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green",
                    isActive
                      ? "bg-custom-light-green/10 font-semibold text-custom-dark-green"
                      : "text-custom-black"
                  )}
                >
                  {name}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
