import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  User,
  MapPin,
  CreditCard,
  ChevronRight,
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
  Snowflake,
  AlertCircle,
  RefreshCw,
  Info,
  Clock,
} from "lucide-react";
import { useCartStore, formatCOP, syncCartPricing } from "@/stores/cart";
import { asset } from "@/lib/assets";
import { useShippingDestinos, useShippingQuote } from "@/hooks/useShippingQuote";
import type { ShippingQuoteError } from "@/hooks/useShippingQuote";
import {
  CotizacionSchema,
  entregaLabel,
  esPositivo,
  trayectoLabel,
  type Cotizacion,
} from "@/api/schemas/shipping";

type Buyer = {
  fullName: string;
  email: string;
  phone: string;
  docType: string;
  docNumber: string;
};

type Shipping = {
  country: string;
  stateId: number | null;
  state: string;
  cityId: number | null;
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
  cityId: z.number().int().positive("Selecciona un municipio"),
  address: z.string().min(1, "La dirección es requerida"),
});

const DOC_TYPES = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "Passport", label: "Pasaporte" },
];

const CODIGOS_CON_PRODUCTO = new Set([
  "producto_sin_peso",
  "producto_sin_productor",
  "producto_sin_origen",
  "producto_no_disponible",
]);

export default function CheckoutShipping() {
  const items = useCartStore((s) => s.items);

  const [buyer, setBuyer] = useState<Buyer>({
    fullName: "",
    email: "",
    phone: "",
    docType: "",
    docNumber: "",
  });
  const [shipping, setShipping] = useState<Shipping>({
    country: "CO",
    stateId: null,
    state: "",
    cityId: null,
    city: "",
    address: "",
    zip: "",
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ------------------------------ destinos ------------------------------ */

  const { destinos, loading: destinosLoading, error: destinosError } = useShippingDestinos();
  const departamentos = destinos?.departamentos ?? [];
  const municipios = useMemo(
    () => departamentos.find((d) => d.id_departamento === shipping.stateId)?.municipios ?? [],
    [departamentos, shipping.stateId]
  );

  const quoteItems = useMemo(
    () =>
      items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        name: it.name,
        price: it.price,
        weightKg: it.weightKg,
        requiresCooling: it.requiresCooling,
      })),
    [items]
  );

  const {
    quote,
    loading: quoteLoading,
    error: quoteError,
    refetch,
  } = useShippingQuote({ cityId: shipping.cityId, items: quoteItems });

  const [serverQuote, setServerQuote] = useState<Cotizacion | null>(null);
  const [repricedNotice, setRepricedNotice] = useState<string | null>(null);
  useEffect(() => {
    setServerQuote(null);
    setRepricedNotice(null);
  }, [quote]);

  const activeQuote = serverQuote ?? quote;

  const [priceNotice, setPriceNotice] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    if (!activeQuote) {
      setPriceNotice(false);
      return;
    }
    const backendSubtotal = Number(activeQuote.totales.subtotal_productos);
    if (!Number.isFinite(backendSubtotal)) return;
    const cartSubtotal = itemsRef.current.reduce((s, i) => s + i.price * i.quantity, 0);
    if (Math.abs(backendSubtotal - cartSubtotal) < 0.5) {
      setPriceNotice(false);
      return;
    }
    const patches = activeQuote.grupos
      .flatMap((g) => g.items)
      .map((li) => ({
        id: li.id_producto,
        price: Number(li.precio_unitario),
        weightKg: Number(li.peso_unitario_kg),
        requiresCooling: li.requiere_frio,
      }))
      .filter((p) => Number.isFinite(p.price));
    syncCartPricing(patches);
    setPriceNotice(true);
  }, [activeQuote]);

  const listSubtotal = items.reduce(
    (s, i) =>
      s +
      (i.originalPrice && i.originalPrice > i.price
        ? i.originalPrice * i.quantity
        : i.price * i.quantity),
    0
  );
  const savings = items.reduce(
    (s, i) =>
      s + (i.originalPrice && i.originalPrice > i.price ? (i.originalPrice - i.price) * i.quantity : 0),
    0
  );
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const disabled =
    items.length === 0 || submitting || !activeQuote || quoteLoading || !!quoteError;

  function validate() {
    const result = checkoutSchema.safeParse({
      ...buyer,
      ...shipping,
      cityId: shipping.cityId ?? 0,
    });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] ?? ""]))
      );
      return false;
    }
    setErrors({});
    return true;
  }

  function describeQuoteError(err: ShippingQuoteError) {
    const idProducto = err.contexto?.id_producto;
    let producto: string | undefined;
    if (err.code && CODIGOS_CON_PRODUCTO.has(err.code) && idProducto != null) {
      const item = items.find((i) => String(i.id) === String(idProducto));
      producto = item?.name ?? (err.contexto?.nombre as string | undefined);
    }
    return { detail: err.detail, producto };
  }

  const quoteErrorInfo = quoteError ? describeQuoteError(quoteError) : null;

  async function goToPayU(confirmar = false) {
    if (!validate()) return;
    if (!activeQuote) return;
    setSubmitting(true);
    try {
      const payload = {
        buyer,
        shipping,
        items: items.map((it) => ({ id: it.id, quantity: it.quantity })),
        notes,
        expectedTotal: activeQuote.totales.total,
        description: `Compra Autóctonos (${items.length} ítems)`,
        currency: "COP",
        confirmar,
      };


      const res = await fetch("/api/payu/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo preparar el pago.");

      if (data?.repriced && !confirmar) {
        const parsed = CotizacionSchema.safeParse(data.quote);
        if (parsed.success) {
          setServerQuote(parsed.data);
          setRepricedNotice(
            `El total de tu pedido cambió a ${formatCOP(parsed.data.totales.total)}. Revisa el resumen y confirma para continuar.`
          );
        } else {
          setRepricedNotice(
            "El total de tu pedido cambió. Revisa el resumen y confirma para continuar."
          );
        }
        setSubmitting(false);
        return;
      }

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
  const handleShipping = (field: "address" | "zip" | "country", value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };
  const handleDepartamento = (value: string) => {
    const id = Number(value);
    const dep = departamentos.find((d) => d.id_departamento === id);
    setShipping((prev) => ({
      ...prev,
      stateId: dep ? dep.id_departamento : null,
      state: dep ? dep.nombre : "",
      cityId: null,
      city: "",
    }));
    setErrors((prev) => ({ ...prev, state: "", cityId: "" }));
  };
  const handleMunicipio = (value: string) => {
    const id = Number(value);
    const muni = municipios.find((m) => m.id_municipio === id);
    setShipping((prev) => ({
      ...prev,
      cityId: muni ? muni.id_municipio : null,
      city: muni ? muni.nombre : "",
    }));
    setErrors((prev) => ({ ...prev, cityId: "" }));
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
          <div className="flex flex-col gap-6 lg:col-span-3">
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

                {destinosError && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{destinosError}</span>
                  </div>
                )}

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
                    value={shipping.stateId ? String(shipping.stateId) : ""}
                    onChange={handleDepartamento}
                    options={departamentos.map((d) => ({
                      value: String(d.id_departamento),
                      label: d.nombre,
                    }))}
                    placeholder={destinosLoading ? "Cargando destinos..." : "Seleccionar"}
                    disabled={destinosLoading || departamentos.length === 0}
                    error={errors.state}
                  />
                  <SelectField
                    icon={<MapPin className="size-4" />}
                    label="Municipio"
                    value={shipping.cityId ? String(shipping.cityId) : ""}
                    onChange={handleMunicipio}
                    options={municipios.map((m) => ({
                      value: String(m.id_municipio),
                      label: m.nombre,
                    }))}
                    placeholder={shipping.stateId ? "Seleccionar" : "Elige un departamento"}
                    disabled={!shipping.stateId}
                    error={errors.cityId}
                    hint="Sólo mostramos los municipios con cobertura de envío."
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
                      maxLength={100}
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

                {priceNotice && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-800">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Actualizamos los precios de tu carrito con los valores vigentes de la tienda.
                    </span>
                  </div>
                )}

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

                  {/* ---------------------- Bloque de envío ---------------------- */}

                  {!shipping.cityId && !quoteLoading && (
                    <div className="flex items-start gap-2 rounded-lg border border-custom-dark-green/10 bg-custom-dark-green/5 px-3 py-2.5 text-xs text-custom-black/70">
                      <Truck className="mt-0.5 size-3.5 shrink-0 text-custom-dark-green/70" />
                      <span>Elige departamento y municipio para calcular el costo de envío.</span>
                    </div>
                  )}

                  {quoteLoading && (
                    <div className="flex flex-col gap-2 py-1" aria-busy="true" aria-live="polite">
                      <div className="h-3.5 w-full animate-pulse rounded bg-custom-dark-green/10" />
                      <div className="h-3.5 w-2/3 animate-pulse rounded bg-custom-dark-green/10" />
                      <div className="h-3.5 w-1/2 animate-pulse rounded bg-custom-dark-green/10" />
                      <span className="text-[11px] text-custom-black/50">Calculando el envío...</span>
                    </div>
                  )}

                  {!quoteLoading && quoteError && (
                    <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50/70 px-3 py-2.5 text-xs text-red-700">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                        <div>
                          <p>{quoteErrorInfo?.detail}</p>
                          {quoteErrorInfo?.producto && (
                            <p className="mt-1">
                              Producto afectado: <strong>{quoteErrorInfo.producto}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={refetch}
                        className="flex items-center gap-1 self-start rounded-md border border-red-200 bg-white/70 px-2 py-1 font-semibold text-red-700 transition-colors hover:bg-white"
                      >
                        <RefreshCw className="size-3" />
                        Reintentar
                      </button>
                    </div>
                  )}

                  {!quoteLoading && !quoteError && activeQuote && (
                    <>
                      {activeQuote.grupos.length > 1 && (
                        <p className="text-xs text-custom-black/60">
                          Tu pedido viaja en {activeQuote.grupos.length} envíos, uno por cada
                          productor.
                        </p>
                      )}

                      {activeQuote.grupos.map((g) => (
                        <div
                          key={`${g.id_productor}-${g.id_municipio_origen}`}
                          className="space-y-1"
                        >
                          <div className="flex items-start justify-between gap-3 text-sm">
                            <span className="flex items-start gap-1 text-custom-black/70">
                              <Truck className="mt-0.5 size-3 shrink-0" />
                              <span>
                                Envío de {g.productor}
                                <span className="block text-xs text-custom-black/50">
                                  desde {g.municipio_origen} · {g.peso_facturable_kg} kg ·{" "}
                                  {trayectoLabel(g.trayecto_aplicado)}
                                </span>
                                <span className="block text-xs text-custom-black/50">
                                  Entrega estimada: {entregaLabel(g.entrega)}
                                </span>
                              </span>
                            </span>
                            <span className="shrink-0 font-medium text-custom-dark-green">
                              {formatCOP(g.flete)}
                            </span>
                          </div>

                          {activeQuote.grupos.length > 1 && (
                            <div className="flex items-center justify-between pl-4 text-xs text-custom-black/60">
                              <span>Garantía del producto</span>
                              <span>{formatCOP(g.sobreflete)}</span>
                            </div>
                          )}

                          {esPositivo(g.empaque) && (
                            <div className="pl-4 text-xs text-custom-black/60">
                              <span className="flex items-center gap-1">
                                <Snowflake className="size-3" />
                                Empaque refrigerado ({g.neveras}{" "}
                                {g.neveras === 1 ? "nevera" : "neveras"})
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="flex items-start justify-between gap-3 text-sm">
                        <span className="text-custom-black/70">
                          Garantía del producto
                          <span className="block text-xs text-custom-black/50">
                            Cubre el valor de tu compra durante el transporte.
                          </span>
                        </span>
                        <span className="shrink-0 font-medium text-custom-dark-green">
                          {formatCOP(activeQuote.totales.sobreflete)}
                        </span>
                      </div>

                      {esPositivo(activeQuote.totales.descuento_envio) && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-custom-medium-green">
                            <Tag className="size-3" />
                            Descuento de envío
                          </span>
                          <span className="font-medium text-custom-medium-green">
                            -{formatCOP(activeQuote.totales.descuento_envio)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-custom-medium-green/15 pt-2.5 text-sm">
                        <span className="font-semibold text-custom-black/80">Envío total</span>
                        <span className="font-bold text-custom-dark-green">
                          {formatCOP(activeQuote.totales.envio)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-custom-black/70">
                          <Clock className="size-3" />
                          Entrega estimada del pedido
                        </span>
                        <span className="font-medium text-custom-dark-green">
                          {entregaLabel(activeQuote.entrega)}
                        </span>
                      </div>
                      {activeQuote.grupos.length > 1 && (
                        <p className="text-xs text-custom-black/50">
                          Tu pedido está completo cuando llega el último envío.
                        </p>
                      )}

                      {activeQuote.promocion.aplicada && (
                        <div className="relative overflow-hidden rounded-lg">
                          <div className="absolute inset-0 rounded-lg border border-custom-dark-green/10 bg-custom-dark-green/5 backdrop-blur-sm" />
                          <p className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-custom-dark-green">
                            <Leaf className="size-3" />
                            Envío gratis aplicado: cubrimos el flete de tu pedido. La garantía
                            del producto se cobra aparte.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="mb-6 h-px bg-custom-medium-green/20" />

                <div className="mb-6 flex items-center justify-between">
                  <span className="text-base font-bold text-custom-dark-green">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-custom-dark-green">
                      {activeQuote ? formatCOP(activeQuote.totales.total) : "—"}
                    </span>
                  </div>
                </div>

                {repricedNotice && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-800">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    <span>{repricedNotice}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => goToPayU(!!repricedNotice)}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-custom-dark-green py-3.5 text-base font-bold text-white shadow-lg shadow-custom-dark-green/20 transition-all duration-300 hover:bg-custom-medium-green hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard className="size-4" />
                  {repricedNotice ? "Confirmar y pagar" : "Pagar con PayU"}
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                {items.length === 0 && (
                  <p className="mt-3 text-center text-sm text-custom-black/60">
                    Tu carrito está vacío.
                  </p>
                )}

                {items.length > 0 && !activeQuote && !quoteLoading && !quoteError && (
                  <p className="mt-3 text-center text-sm text-custom-black/60">
                    Necesitamos tu destino para poder cobrarte el envío.
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
  disabled = false,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-custom-black/80">
        <span className="text-custom-dark-green/70">{icon}</span>
        {label}
      </label>
      <div className="group relative overflow-hidden rounded-xl">
        <div className={`absolute inset-0 rounded-xl border bg-white/45 transition-all duration-200 backdrop-blur-xl group-focus-within:shadow-[0_0_0_3px_rgba(56,102,65,0.08)] ${error ? "border-red-400 group-focus-within:border-red-400" : "border-white/50 group-focus-within:border-custom-dark-green/30"} ${disabled ? "opacity-60" : ""}`} />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="relative h-11 w-full cursor-pointer appearance-none bg-transparent pr-10 pl-4 text-sm text-custom-black focus:outline-none disabled:cursor-not-allowed"
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
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[10px] text-custom-black/50">{hint}</p>
      ) : null}
    </div>
  );
}
