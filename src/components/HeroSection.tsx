import { Button } from "@heroui/react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-custom-dark-green/90 text-custom-cream">
      {/* Imagen de fondo */}
      <div className="absolute inset-0">
        <img
          src="/images/Amasijos.png"
          alt="Amasijos artesanales"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-custom-dark-green/70 to-custom-dark-green/40" />
      </div>

      {/* Contenido */}
      <div className="relative container-ecommerce py-16 md:py-24 lg:py-28">
        <div className="max-w-2xl space-y-6">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-custom-cream/90 backdrop-blur-md ring-1 ring-white/20">
            <Sparkles className="size-4 text-custom-light-green" />
            <span>Del campo a tu mesa</span>
          </div>

          <h1 className="text-3xl font-semibold leading-tight text-custom-cream text-balance md:text-5xl lg:text-6xl">
            Productos artesanales de{" "}
            <span className="text-custom-light-green">productores locales</span>
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-custom-cream/85 md:text-base">
            Descubre sabores auténticos, orgánicos y frescos. Apoyamos a las comunidades rurales
            llevando lo mejor de su tierra a tu hogar.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 md:gap-4">
            <Button
              as="a"
              href="#productos-destacados"
              size="lg"
              className="btn-primary rounded-full px-8 text-base shadow-lg shadow-custom-dark-green/40"
            >
              Explorar productos
            <ArrowRight className="size-4 ml-1" />
            </Button>
            
          </div>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap items-center gap-8 text-custom-cream/85">
            {[
              { value: "15+", label: "Productores aliados" },
              { value: "50+", label: "Productos artesanales" },
            ].map((stat) => (
              <div key={stat.label} className="min-w-[90px]">
                <p className="text-2xl font-semibold md:text-3xl">{stat.value}</p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-custom-cream/70">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

