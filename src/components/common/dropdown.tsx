import type React from "react";
import { useEffect, useState } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { fetchCategorias } from "@/api/category";
import type { Categoria } from "@/api/schemas/categories";

export default function Drop({ title }: { title: string }) {
  const [data, setData] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const cats = await fetchCategorias();
        if (alive) setData(cats);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Cargando categorías…</p>;
  if (err) return <p className="text-sm text-red-600">Error: {err}</p>;
  if (!data.length) return <p className="text-sm text-gray-500">No hay categorías</p>;

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="light"
          className="rounded-xl px-3 py-2 text-custom-dark-green transition hover:bg-custom-light-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green"
        >
          {title}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Selecciona una categoría"
        itemClasses={{
          base: "rounded-lg data-[hover=true]:bg-custom-light-green/10",
        }}
        onAction={(key: React.Key) => { if (key) window.location.href = `/categories/${String(key)}`; }}
      >
        {data.map((item) => {
          const key = String(item.id_categoria ?? (item as any).id ?? item.nombre);
          return (
            <DropdownItem key={key} id={key} className="text-sm">
              {item.nombre}
            </DropdownItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}
