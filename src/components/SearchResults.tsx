import type { Producto } from "@/api/schemas/products";

function formatPrice(value: number | string) {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num)
    ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(num as number)
    : String(value);
}

function normalizeImage(url?: string) {
  if (!url) return "/placeholder.png";
  if (url.startsWith("http")) return url;
  const base = import.meta.env.PUBLIC_API_BASE ?? "";
  return `${base}${url}`;
}

export default function SearchResults({
  items,
  onItemClick,
}: {
  items: Producto[];
  onItemClick?: () => void;
}) {
  if (items.length === 0) {
    return <li className="p-3 text-sm text-white/80">Sin resultados</li>;
  }

  return (
    <>
      {items.map((p) => {
        const img = normalizeImage(p.imagenes?.[0]?.url_imagen);
        return (
          <li key={p.id_producto} role="option">
            <a
              href={`/producto/${p.id_producto}`}
              className="flex w-full items-center gap-3 p-2 text-sm transition hover:bg-custom-light-green/10 focus:bg-custom-light-green/10 focus:outline-none"
              onClick={onItemClick}
            >
              <img
                src={img}
                alt={p.nombre}
                width={44}
                height={44}
                className="h-11 w-11 flex-shrink-0 rounded-lg object-cover ring-1 ring-custom-medium-green/20"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white">{p.nombre}</span>
                <span className="text-xs text-white/90">{formatPrice(p.precio)}</span>
              </div>
            </a>
          </li>
        );
      })}
    </>
  );
}
