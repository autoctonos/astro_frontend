import { Spinner } from "@heroui/react";
import { fetchProductosConImagenes } from "@/api/products";
import { fetchCategorias } from "@/api/categories";
import { useQuery } from "@/hooks/useQuery";
import HeroSection from "@/components/HeroSection";
import PromoBanner from "@/components/PromoBanner";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedProductsSection from "@/components/FeaturedProductsSection";

export default function HomeClient() {
  const prod = useQuery(fetchProductosConImagenes, []);
  const cats = useQuery(fetchCategorias, []);

  return (
    <>
      <div className="py-6 md:py-10">
        <HeroSection />
      </div>

      <PromoBanner />

      {cats.loading ? (
        <section className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Spinner size="sm" /> Cargando categorías…
          </div>
        </section>
      ) : cats.error ? (
        <section className="container mx-auto px-4 py-6">
          <p className="text-red-600">{cats.error}</p>
        </section>
      ) : (
        <CategoriesSection categories={cats.data ?? []} />
      )}

      <FeaturedProductsSection
        products={(prod.data as any[]) ?? []}
        loading={prod.loading}
        error={prod.error as string | null}
      />
    </>
  );
}
