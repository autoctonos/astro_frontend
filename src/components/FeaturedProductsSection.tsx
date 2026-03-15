import { useMemo, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { Flame, Clock, Sparkles } from "lucide-react";
import ProductsList from "@/components/product-list";
import type { ProductForList } from "@/api/products";

const tabs = [
  { id: "destacados", label: "Destacados", icon: Flame },
  { id: "nuevos", label: "Nuevos", icon: Sparkles },
  { id: "ofertas", label: "Ofertas", icon: Clock },
] as const;

type TabId = (typeof tabs)[number]["id"];

type Props = {
  products: ProductForList[];
  loading: boolean;
  error?: string | null;
};

export default function FeaturedProductsSection({ products, loading, error }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("destacados");
  const [visibleCount, setVisibleCount] = useState(8);
  const [showNoMore, setShowNoMore] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!products?.length) return [];

    const withDiscount = products.filter(
      (p) => p.precio_con_descuento !== null && p.precio_con_descuento !== undefined
    );

    switch (activeTab) {
      case "ofertas":
        return withDiscount.length ? withDiscount : products;
      case "nuevos":
        return [...products].sort(
          (a, b) => (b.id_producto ?? 0) - (a.id_producto ?? 0)
        );
      case "destacados":
      default:
        return products;
    }
  }, [products, activeTab]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    setVisibleCount(8);
    setShowNoMore(false);
  };

  const handleLoadMore = () => {
    if (filteredProducts.length <= visibleCount) {
      setShowNoMore(true);
      window.setTimeout(() => setShowNoMore(false), 3000);
      return;
    }
    setVisibleCount((prev) => prev + 8);
  };

  return (
    <section id="productos-destacados" className="py-4 lg:py-8">
      <div className="container-ecommerce">
        {/* Cabecera */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-custom-medium-green">
            <span className="h-px w-8 bg-custom-medium-green/40" />
            Nuestra selección
            <span className="h-px w-8 bg-custom-medium-green/40" />
          </span>
          <h2 className="text-2xl font-semibold text-custom-dark-green md:text-3xl">
            Productos destacados
          </h2>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "solid" : "light"}
                size="sm"
                className={
                  isActive
                    ? "rounded-full bg-custom-dark-green text-white shadow-md shadow-custom-dark-green/25"
                    : "rounded-full bg-transparent text-custom-dark-green/80 hover:bg-custom-light-green/20"
                }
                onPress={() => handleTabChange(tab.id)}
              >
                <Icon className="mr-1 h-3.5 w-3.5" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-600">
            <Spinner size="sm" className="text-custom-medium-green" /> Cargando productos…
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-red-600">{error}</p>
        ) : !visibleProducts.length ? (
          <p className="py-4 text-center text-sm text-gray-600">
            No hay productos para mostrar en este momento.
          </p>
        ) : (
          <>
            <ProductsList products={visibleProducts} />

            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <Button
                variant="bordered"
                size="lg"
                className="rounded-full border-custom-medium-green/40 px-8 text-custom-dark-green hover:bg-custom-dark-green hover:text-white"
                onPress={handleLoadMore}
              >
                Ver más productos
              </Button>

              {showNoMore && (
                <div
                  role="status"
                  className="inline-flex items-center rounded-full bg-black/75 px-4 py-2 text-xs text-white shadow-lg"
                >
                  No hay más productos disponibles en este momento.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

