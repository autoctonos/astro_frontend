import { Truck, Shield, Clock, Leaf } from "lucide-react";

const features = [
  { icon: Truck, title: "Envío gratis", desc: "En pedidos superiores a $200.000" },
  { icon: Shield, title: "Pago seguro", desc: "Transacciones protegidas" },
  { icon: Clock, title: "Entrega rápida", desc: "Despacho en 24-48 horas" },
  { icon: Leaf, title: "100% orgánico", desc: "Productores certificados" },
] as const;

export default function PromoBanner() {
  return (
    <section className="border-y border-custom-medium-green/30 bg-custom-cream/70 backdrop-blur-sm">
      <div className="container-ecommerce py-5 md:py-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-center gap-3 rounded-2xl bg-white/40 px-3 py-3 shadow-sm ring-1 ring-custom-medium-green/10 md:px-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-custom-light-green/20 text-custom-dark-green">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-custom-dark-green md:text-sm">
                    {feature.title}
                  </p>
                  <p className="text-[11px] text-gray-700/80 md:text-xs">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

