import { useState } from "react";
import { z } from "zod";
import {
  User,
  MapPin,
  CreditCard,
  ChevronRight,
  Check,
  Mail,
  Phone,
  FileText,
  StickyNote,
  Truck,
  ShieldCheck,
  Lock,
  Tag,
  Package,
  Leaf,
} from "lucide-react";
import { useCartStore, formatCOP } from "@/stores/cart";
import { asset } from "@/lib/assets";

type Buyer = {
  fullName: string;
  email: string;
  phone: string;
  docType: string;
  docNumber: string;
};

type Shipping = {
  country: string;
  state: string;
  city: string;
  address: string;
  zip?: string;
};

const checkoutSchema = z.object({
  fullName: z.string().min(1, "El nombre es requerido"),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  phone: z.string().min(5, "El teléfono es requerido"),
  docType: z.string().min(1, "Selecciona un tipo de documento"),
  docNumber: z.string().min(1, "El número de documento es requerido"),
  state: z.string().min(1, "Selecciona un departamento"),
  city: z.string().min(1, "La ciudad es requerida"),
  address: z.string().min(1, "La dirección es requerida"),
});

const DOC_TYPES = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "Passport", label: "Pasaporte" },
];

const CO_DEPARTMENTS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas",
  "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía",
  "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander",
  "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre",
  "Tolima", "Valle del Cauca", "Vaupés", "Vichada",
];

const STEPS = [
  { id: 1, label: "Datos", icon: User },
  { id: 2, label: "Envío", icon: MapPin },
  { id: 3, label: "Pago", icon: CreditCard },
];

const FREE_SHIPPING_MIN = 200000;
const SHIPPING_COST = 15000;

export default function CheckoutShipping() {
  const items = useCartStore((s) => s.items);

  const [currentStep] = useState(1);
  const [buyer, setBuyer] = useState<Buyer>({
    fullName: "",
    email: "",
    phone: "",
    docType: "",
    docNumber: "",
  });
  const [shipping, setShipping] = useState<Shipping>({
    country: "CO",
    state: "Cundinamarca",
    city: "",
    address: "",
    zip: "",
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const disabled = items.length === 0 || submitting;

  function validate() {
    const result = checkoutSchema.safeParse({ ...buyer, ...shipping });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(
        Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""])
      ));
      return false;
    }
    setErrors({});
    return true;
  }

  const discountedSubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const listSubtotal = items.reduce(
    (s, i) =>
      s +
      (i.originalPrice && i.originalPrice > i.price
        ? i.originalPrice * i.quantity
        : i.price * i.quantity),
    0
  );
  const savings = items.reduce(
    (s, i) => s + (i.originalPrice && i.originalPrice > i.price ? (i.originalPrice - i.price) * i.quantity : 0),
    0
  );
  const shippingCost = discountedSubtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_COST;
  const total = discountedSubtotal + shippingCost;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  async function goToPayU() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        buyer,
        shipping,
        shippingCost,
        items: items.map((it) => ({ id: it.id, name: it.name, price: it.price, quantity: it.quantity })),
        description: `Compra Autóctonos (${items.length} ítems)`,
        currency: "COP",
        tax: 0,
        taxReturnBase: 0,
      };
      const res = await fetch("/api/payu/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo preparar el pago.");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.action;
      Object.entries((data.fields as Record<string, string>) || {}).forEach(([k, v]) => {
        if (v == null || v === "") return;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = String(v);
        form.appendChild(input);
      });
      if (notes) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "extra1";
        input.value = notes.slice(0, 250);
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e: unknown) {
      alert((e as Error)?.message || "Error inesperado.");
      setSubmitting(false);
    }
  }

  const handleBuyer = (field: keyof Buyer, value: string) => {
    setBuyer((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  const handleShipping = (field: keyof Shipping, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <section className="py-8 lg:py-14">
      <div className="container-ecommerce max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-custom-dark-green text-balance md:text-3xl">
            Datos de envío
          </h1>
          <p className="mt-1.5 text-sm text-custom-black/70">
            Completa tu información para finalizar la compra
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Form */}
          <div className="flex flex-col gap-6 lg:col-span-3">
            {/* Comprador */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 rounded-2xl border border-white/55 bg-white/50 shadow-sm backdrop-blur-2xl" />
              <div className="relative p-6 lg:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-custom-dark-green/10">
                    <User className="size-4 text-custom-dark-green" />
                  </div>
                  <h2 className="text-lg font-bold text-custom-dark-green">
                    Información del comprador
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField
                    icon={<User className="size-4" />}
                    label="Nombre completo"
                    value={buyer.fullName}
                    onChange={(v) => handleBuyer("fullName", v)}
                    placeholder="Tu nombre completo"
                    error={errors.fullName}
                  />
                  <SelectField
                    icon={<FileText className="size-4" />}
                    label="Tipo de documento"
                    value={buyer.docType}
                    onChange={(v) => handleBuyer("docType", v)}
                    options={DOC_TYPES}
                    placeholder="Seleccionar"
                    error={errors.docType}
                  />
                  <InputField
                    icon={<FileText className="size-4" />}
                    label="N. documento"
                    value={buyer.docNumber}
                    onChange={(v) => handleBuyer("docNumber", v)}
                    placeholder="123456789"
                    error={errors.docNumber}
                  />
                  <InputField
                    icon={<Mail className="size-4" />}
                    label="Email"
                    type="email"
                    value={buyer.email}
                    onChange={(v) => handleBuyer("email", v)}
                    placeholder="tu.email@ejemplo.com"
                    error={errors.email}
                  />
                  <InputField
                    icon={<Phone className="size-4" />}
                    label="Teléfono"
                    value={buyer.phone}
                    onChange={(v) => handleBuyer("phone", v)}
                    placeholder="+57 300 000 0000"
                    className="sm:col-span-1"
                    error={errors.phone}
                  />
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 rounded-2xl border border-white/55 bg-white/50 shadow-sm backdrop-blur-2xl" />
              <div className="relative p-6 lg:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-custom-dark-green/10">
                    <MapPin className="size-4 text-custom-dark-green" />
                  </div>
                  <h2 className="text-lg font-bold text-custom-dark-green">
                    Dirección de envío
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    icon={<MapPin className="size-4" />}
                    label="País"
                    value={shipping.country}
                    onChange={(v) => handleShipping("country", v)}
                    options={[{ value: "CO", label: "Colombia" }]}
                  />
                  <SelectField
                    icon={<MapPin className="size-4" />}
                    label="Departamento"
                    value={shipping.state}
                    onChange={(v) => handleShipping("state", v)}
                    options={CO_DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                    placeholder="Seleccionar"
                    error={errors.state}
                  />
                  <InputField
                    icon={<MapPin className="size-4" />}
                    label="Ciudad"
                    value={shipping.city}
                    onChange={(v) => handleShipping("city", v)}
                    placeholder="Tu ciudad"
                    error={errors.city}
                  />
                  <InputField
                    icon={<MapPin className="size-4" />}
                    label="Dirección"
                    value={shipping.address}
                    onChange={(v) => handleShipping("address", v)}
                    placeholder="Calle, carrera, número"
                    error={errors.address}
                  />
                  <InputField
                    icon={<MapPin className="size-4" />}
                    label="Código postal"
                    value={shipping.zip ?? ""}
                    onChange={(v) => handleShipping("zip", v)}
                    placeholder="110111"
                    className="sm:col-span-1"
                  />
                </div>
                <div className="mt-5">
                  <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-custom-black/80">
                    <StickyNote className="size-3.5 text-custom-dark-green/70" />
                    Notas para el vendedor (opcional)
                  </label>
                  <div className="group relative overflow-hidden rounded-xl">
                    <div className="absolute inset-0 rounded-xl border border-white/50 bg-white/45 transition-all duration-200 backdrop-blur-xl group-focus-within:border-custom-dark-green/30 group-focus-within:shadow-[0_0_0_3px_rgba(56,102,65,0.08)]" />
                    <textarea
                      rows={3}
                      placeholder="Instrucciones especiales para la entrega..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="relative w-full resize-none bg-transparent px-4 py-3 text-sm text-custom-black placeholder:text-custom-black/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: "Envío seguro", sub: "Rastreo incluido" },
                { icon: ShieldCheck, label: "Pago seguro", sub: "Datos encriptados" },
                { icon: Lock, label: "Privacidad", sub: "Datos protegidos" },
              ].map((badge) => (
                <div key={badge.label} className="relative overflow-hidden rounded-xl">
                  <div className="absolute inset-0 rounded-xl border border-white/40 bg-white/35 backdrop-blur-xl" />
                  <div className="relative flex flex-col items-center gap-1.5 px-3 py-4 text-center">
                    <badge.icon className="size-5 text-custom-dark-green/70" />
                    <span className="text-xs font-semibold text-custom-dark-green">{badge.label}</span>
                    <span className="hidden text-[10px] text-custom-black/60 sm:block">{badge.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:sticky lg:top-24 lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 rounded-2xl border border-white/55 bg-white/50 shadow-sm backdrop-blur-2xl" />
              <div className="relative p-6 lg:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-custom-dark-green/10">
                    <Package className="size-4 text-custom-dark-green" />
                  </div>
                  <h2 className="text-lg font-bold text-custom-dark-green">Resumen</h2>
                  <span className="ml-auto rounded-full bg-custom-dark-green/10 px-2.5 py-0.5 text-xs font-bold text-custom-dark-green">
                    {totalItems} productos
                  </span>
                </div>

                <div className="mb-5 flex flex-col gap-3">
                  {items.map((it) => (
                    <div key={it.id} className="group relative overflow-hidden rounded-xl">
                      <div className="absolute inset-0 rounded-xl border border-white/45 bg-white/40 backdrop-blur-xl" />
                      <div className="relative flex items-center gap-3 p-3">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg shadow-sm">
                          {it.image ? (
                            <img
                              src={asset(it.image)}
                              alt={it.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-custom-cream/80 text-xs text-custom-dark-green/50">
                              —
                            </div>
                          )}
                          <div className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-custom-dark-green text-[10px] font-bold text-white shadow-sm">
                            {it.quantity}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-semibold text-custom-dark-green">
                            {it.name}
                          </h4>
                          <p className="mt-0.5 text-xs text-custom-black/60">
                            ×{it.quantity} unidades
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-sm font-bold text-custom-dark-green">
                            {formatCOP(it.price * it.quantity)}
                          </span>
                          {it.originalPrice != null && it.originalPrice > it.price && (
                            <p className="text-[10px] text-custom-black/50 line-through">
                              {formatCOP(it.originalPrice * it.quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4 h-px bg-custom-medium-green/20" />

                <div className="mb-5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-custom-black/70">Subtotal</span>
                    <span className="font-medium text-custom-dark-green">{formatCOP(listSubtotal)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-custom-medium-green">
                        <Tag className="size-3" />
                        Ahorro
                      </span>
                      <span className="font-medium text-custom-medium-green">
                        -{formatCOP(savings)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-custom-black/70">
                      <Truck className="size-3" />
                      Envío
                    </span>
                    <span className="font-medium text-custom-dark-green">
                      {shippingCost === 0 ? "Gratis" : formatCOP(shippingCost)}
                    </span>
                  </div>
                  {shippingCost === 0 && (
                    <div className="relative overflow-hidden rounded-lg">
                      <div className="absolute inset-0 rounded-lg border border-custom-dark-green/10 bg-custom-dark-green/5 backdrop-blur-sm" />
                      <p className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-custom-dark-green">
                        <Leaf className="size-3" />
                        Envío gratis aplicado a tu orden
                      </p>
                    </div>
                  )}
                </div>

                <div className="mb-6 h-px bg-custom-medium-green/20" />

                <div className="mb-6 flex items-center justify-between">
                  <span className="text-base font-bold text-custom-dark-green">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-custom-dark-green">
                      {formatCOP(total)}
                    </span>
                    <p className="mt-0.5 text-[10px] text-custom-black/60">Impuestos incluidos</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={goToPayU}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-custom-dark-green py-3.5 text-base font-bold text-white shadow-lg shadow-custom-dark-green/20 transition-all duration-300 hover:bg-custom-medium-green hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard className="size-4" />
                  Pagar con PayU
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                {items.length === 0 && (
                  <p className="mt-3 text-center text-sm text-custom-black/60">
                    Tu carrito está vacío.
                  </p>
                )}

                <p className="mt-3 text-center text-[10px] leading-relaxed text-custom-black/50">
                  Al iniciar el pago, aceptas nuestros{" "}
                  <a href="#" className="underline transition-colors hover:text-custom-dark-green">
                    Términos y Condiciones
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InputField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  error,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  className?: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-custom-black/80">
        <span className="text-custom-dark-green/70">{icon}</span>
        {label}
      </label>
      <div className="group relative overflow-hidden rounded-xl">
        <div className={`absolute inset-0 rounded-xl border bg-white/45 transition-all duration-200 backdrop-blur-xl group-focus-within:shadow-[0_0_0_3px_rgba(56,102,65,0.08)] ${error ? "border-red-400 group-focus-within:border-red-400" : "border-white/50 group-focus-within:border-custom-dark-green/30"}`} />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="relative h-11 w-full bg-transparent px-4 text-sm text-custom-black placeholder:text-custom-black/50 focus:outline-none"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({
  icon,
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-custom-black/80">
        <span className="text-custom-dark-green/70">{icon}</span>
        {label}
      </label>
      <div className="group relative overflow-hidden rounded-xl">
        <div className={`absolute inset-0 rounded-xl border bg-white/45 transition-all duration-200 backdrop-blur-xl group-focus-within:shadow-[0_0_0_3px_rgba(56,102,65,0.08)] ${error ? "border-red-400 group-focus-within:border-red-400" : "border-white/50 group-focus-within:border-custom-dark-green/30"}`} />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="relative h-11 w-full cursor-pointer appearance-none bg-transparent pr-10 pl-4 text-sm text-custom-black focus:outline-none"
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-custom-black/50" />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
