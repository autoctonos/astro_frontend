import { useState } from "react";

type Imagen = { url_imagen: string | null };

function normalizeImage(url?: string | null) {
  if (!url) return "/placeholder.png";
  if (url.startsWith("http")) return url;
  const base = import.meta.env.PUBLIC_API_BASE ?? "";
  return `${base}${url}`;
}

export default function ProductImages({
  images,
  productName,
  outOfStock = false,
}: {
  images: Imagen[];
  productName: string;
  outOfStock?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const src = normalizeImage(images[current]?.url_imagen);

  return (
    <div className="mx-auto w-full">
      <div className="relative group w-full overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out hover:shadow-xl hover:bg-white/80 hover:-translate-y-2 cursor-default flex items-center justify-center p-4">
        <img
          src={src}
          alt={productName}
          className={`max-h-[700px] w-full object-contain ${outOfStock ? "grayscale opacity-60" : ""}`}
          loading="lazy"
        />
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
              Agotado
            </span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.slice(0, 10).map((img, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                className={`group aspect-square w-full overflow-hidden rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green ${
                  i === current
                    ? "ring-2 ring-custom-medium-green border-custom-medium-green"
                    : "border-gray-200 hover:ring-2 hover:ring-custom-medium-green"
                }`}
              >
                <img
                  src={normalizeImage(img.url_imagen)}
                  alt={`${productName} ${i + 1}`}
                className={`h-full w-full object-contain transition group-hover:scale-[1.02] ${outOfStock ? "grayscale opacity-60" : ""}`}
                  loading="lazy"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
