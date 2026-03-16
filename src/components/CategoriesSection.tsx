import type { Categoria } from "@/api/schemas/categories";
import {
  Torus,
  Donut,
  Milk,
  Leaf,
  Coffee,
  Cookie,
  type LucideIcon,
} from "lucide-react";

const ICONS: LucideIcon[] = [Torus, Milk, Donut, Coffee, Leaf, Cookie];

type Props = {
  categories: Categoria[];
};

export default function CategoriesSection({ categories }: Props) {
  const items = categories.slice(0, 6);

  return (
    <section className="py-10 md:py-12 lg:py-14">
      <div className="container-ecommerce">
        <div className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-custom-dark-green md:text-2xl">
              Explora por categoría
            </h2>
            <p className="text-sm text-gray-700/80">
              Encuentra productos artesanales filtrados por tus categorías favoritas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((category, index) => {
            const Icon = ICONS[index % ICONS.length];
            const href = `/categories/${category.slug ?? encodeURIComponent(category.nombre)}`;

            return (
              <a
                key={category.slug ?? category.nombre}
                href={href}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-custom-medium-green/25 bg-white/70 p-4 text-center shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-custom-medium-green/60 hover:shadow-md"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-custom-light-green/20 text-custom-dark-green transition-all duration-300 group-hover:bg-custom-light-green/30 group-hover:scale-110">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-custom-dark-green">
                    {category.nombre}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-700/80">
                    Ver productos
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

