import type React from "react";
import { useEffect, useState } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Torus, Donut, Milk, Leaf, Coffee, Cookie, type LucideIcon } from "lucide-react";
import { fetchCategorias } from "@/api/categories";
import type { Categoria } from "@/api/schemas/categories";
import clsx from "clsx";

const ICONS: LucideIcon[] = [Torus, Milk, Donut, Coffee, Leaf, Cookie];

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

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="light"
          className={clsx(
            "btn-primary",
            "flex items-center gap-1.5",
            "text-white",
            "hover:bg-custom-medium-green hover:text-white",
            "active:scale-[0.98] transition-all duration-200"
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
        onAction={(key: React.Key) => {
          if (key && !String(key).startsWith("_")) window.location.href = `/categories/${String(key)}`;
        }}
      >
        {loading ? (
          <DropdownItem key="_loading" isDisabled className="text-white/90">
            Cargando categorías…
          </DropdownItem>
        ) : err ? (
          <DropdownItem key="_error" isDisabled className="text-red-300">
            Error: {err}
          </DropdownItem>
        ) : !data.length ? (
          <DropdownItem key="_empty" isDisabled className="text-white/80">
            No hay categorías
          </DropdownItem>
        ) : (
          data.map((item, index) => {
            const key = String(item.id ?? item.nombre);
            const Icon = ICONS[index % ICONS.length];
            return (
              <DropdownItem
                key={key}
                id={key}
                startContent={
                  <span className="flex size-6 items-center justify-center rounded-lg bg-custom-light-green/20 text-custom-cream">
                    <Icon className="size-3" />
                  </span>
                }
                className="transition-colors duration-200 hover:bg-custom-medium-green/20 hover:text-custom-dark-green"
              >
                <span className="truncate">{item.nombre}</span>
              </DropdownItem>
            );
          })
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
