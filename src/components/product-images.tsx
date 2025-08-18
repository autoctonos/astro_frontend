import { useState } from "react";

type Imagen = { url_imagen: string };

function normalizeImage(url?: string) {
  if (!url) return "/placeholder.png";
  if (url.startsWith("http")) return url;
  const base = import.meta.env.PUBLIC_API_BASE ?? "";
  return `${base}${url}`;
}

export default function ProductImages({ images, productName }: { images: Imagen[]; productName: string }) {
  const [current, setCurrent] = useState(0);
  const src = normalizeImage(images[current]?.url_imagen);

  return (
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
      <div className="aspect-square w-full overflow-hidden rounded-2xl border border-custom-medium-green/80 shadow-sm">
        <img src={src} alt={productName} className="h-full w-full object-cover" loading="lazy" />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.slice(0, 10).map((img, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                className={`group aspect-square w-full overflow-hidden rounded-xl border border-gray-200 transition hover:ring-2 hover:ring-custom-medium-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-medium-green ${
                  i === current ? "ring-2 ring-custom-medium-green" : ""
                }`}
              >
                <img
                  src={normalizeImage(img.url_imagen)}
                  alt={`${productName} ${i + 1}`}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
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
