import type React from "react";
import { useEffect, useState } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { fetchCategorias } from "@/api/categories";
import type { Categoria } from "@/api/schemas/categories";
import clsx from "clsx";

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
          className={clsx(
            "btn-primary", 
            "flex items-center gap-1.5",
            "text-white" 
          )}
        >
          {title}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Selecciona una categoría"
        className={clsx(
          "min-w-[240px] p-1",
          "border border-custom-medium-green/30",
          "shadow-xl rounded-lg",
          "bg-custom-dark-green",
          "text-white"
        )}
        itemClasses={{
          base: "rounded-lg px-4 py-2 data-[hover=true]:bg-custom-cream/80",
          title: "text-sm font-medium",
        }}
        onAction={(key: React.Key) => { if (key) window.location.href = `/categories/${String(key)}`; }}
      >
        {data.map((item) => {
         const key = String(item.id ?? item.nombre);
          return (
            <DropdownItem key={key} id={key} className="transition-colors duration-200 hover:bg-custom-medium-green/20 hover:text-custom-dark-green" >
              <span className="truncate">{item.nombre}</span>
            </DropdownItem>
          );
        })}
      </DropdownMenu>
    </Dropdown>
  );
}
