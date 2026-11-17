import { useEffect, useMemo, useRef, useState } from "react";
import ProductPhoto from "@/components/ProductPhoto";
import {
  User,
  MapPin,
  CreditCard,
  ChevronRight,
  Mail,
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
  Check,
  Smartphone,
} from "lucide-react";
import {
  DOC_RULES,
  DOC_TYPES,
  formatPhone,
  normalizeDocNumber,
  normalizePhone,
  suggestEmail,
  validateAddress,
  validateBuyerField,
  validateZip,
  type BuyerField,
  type DocType,
} from "@/lib/validation/checkout";
import { useCartStore, formatCOP, syncCartPricing } from "@/stores/cart";
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

type FieldKey = BuyerField | "state" | "cityId" | "address" | "zip";

/** Orden visual: el primero inválido de esta lista es el que recibe el foco al enviar. */
const FIELD_ORDER: FieldKey[] = [
  "fullName",
  "docType",
  "docNumber",
  "email",
  "phone",
  "state",
  "cityId",
  "address",
  "zip",
];

const fieldId = (field: FieldKey) => `checkout-${field}`;

function fieldError(field: FieldKey, buyer: Buyer, shipping: Shipping): string | null {
  switch (field) {
    case "state":
      return shipping.stateId ? null : "Selecciona un departamento";
    case "cityId":
      return shipping.cityId ? null : "Selecciona un municipio";
    case "address":
      return validateAddress(shipping.address);
    case "zip":
      return validateZip(shipping.zip);
    default:
      return validateBuyerField(field, buyer);
  }
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [formAlert, setFormAlert] = useState<string | null>(null);

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
  // El sobreflete nunca se muestra aparte: cada guía es un solo «Valor envío»
  // (flete + sobreflete, ya sumado en el backend). Con una sola guía y sin descuento,
  // esa fila ES el total del envío y no se repite.
  const variosEnvios = (activeQuote?.grupos.length ?? 0) > 1;
  const hayDescuentoEnvio = !!activeQuote && esPositivo(activeQuote.totales.descuento_envio);
  const desgloseEnvio = variosEnvios || hayDescuentoEnvio;

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

  /** Lleva al comprador al primer campo con error, en el orden en que se ve el formulario. */
  function focusFirstInvalid(found: Partial<Record<FieldKey, string>>) {
    const first = FIELD_ORDER.find((f) => found[f]);
    if (!first) return;
    const el = document.getElementById(fieldId(first));
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
  }

  function showFieldErrors(found: Partial<Record<FieldKey, string>>) {
    const count = Object.values(found).filter(Boolean).length;
    setErrors(found);
    setTouched(Object.fromEntries(FIELD_ORDER.map((f) => [f, true])));
    setFormAlert(
      count === 1
        ? "Revisa el campo marcado para continuar."
        : `Revisa los ${count} campos marcados para continuar.`
    );
    focusFirstInvalid(found);
  }

  function validate() {
    const found: Partial<Record<FieldKey, string>> = {};
    for (const f of FIELD_ORDER) {
      const msg = fieldError(f, buyer, shipping);
      if (msg) found[f] = msg;
    }
    if (Object.keys(found).length) {
      showFieldErrors(found);
      return false;
    }
    setErrors({});
    setFormAlert(null);
    return true;
  }

  /** Se valida al salir del campo; mientras haya error visible, se revalida al escribir. */
  function touch(field: FieldKey) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: fieldError(field, buyer, shipping) ?? "" }));
  }

  function revalidate(field: FieldKey, nextBuyer: Buyer, nextShipping: Shipping) {
    if (!touched[field] && !errors[field]) return;
    const msg = fieldError(field, nextBuyer, nextShipping) ?? "";
    setErrors((e) => ({ ...e, [field]: msg }));
  }

  // Si todo quedó corregido, el aviso general sobra.
  useEffect(() => {
    if (formAlert && !Object.values(errors).some(Boolean)) setFormAlert(null);
  }, [errors, formAlert]);

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
      const data = await res.json().catch(() => null);
      if (res.status === 400 && data?.fields && typeof data.fields === "object") {
        const found: Partial<Record<FieldKey, string>> = {};
        for (const f of FIELD_ORDER) if (data.fields[f]) found[f] = String(data.fields[f]);
        if (Object.keys(found).length) {
          showFieldErrors(found);
          setSubmitting(false);
          return;
        }
      }
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
      setFormAlert(
        (e as Error)?.message ||
          "No pudimos conectar con la pasarela de pago. Revisa tu conexión e intenta de nuevo."
      );
      setSubmitting(false);
    }
  }

  const handleBuyer = (field: BuyerField, raw: string) => {
    let value = raw;
    if (field === "phone") value = normalizePhone(raw);
    if (field === "docNumber") value = normalizeDocNumber(buyer.docType, raw);
    const next = { ...buyer, [field]: value };
    // Al cambiar el tipo, el número se limpia con las reglas del nuevo tipo
    // (p. ej. de pasaporte alfanumérico a cédula sólo dígitos).
    if (field === "docType") next.docNumber = normalizeDocNumber(value, buyer.docNumber);
    setBuyer(next);
    revalidate(field, next, shipping);
    if (field === "docType") revalidate("docNumber", next, shipping);
  };
  const handleShipping = (field: "address" | "zip" | "country", raw: string) => {
    const value = field === "zip" ? raw.replace(/\D/g, "").slice(0, 6) : raw;
    const next = { ...shipping, [field]: value };
    setShipping(next);
    if (field !== "country") revalidate(field, buyer, next);
  };

  const docRule = DOC_RULES[buyer.docType as DocType] ?? DOC_RULES.CC;
  const emailSuggestion = touched.email && !errors.email ? suggestEmail(buyer.email) : null;
  const isValid = (field: FieldKey) =>
    !!touched[field] && !errors[field] && !fieldError(field, buyer, shipping);
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
    setTouched((t) => ({ ...t, state: true }));
    setErrors((prev) => ({ ...prev, state: dep ? "" : "Selecciona un departamento", cityId: "" }));
  };
  const handleMunicipio = (value: string) => {
    const id = Number(value);
    const muni = municipios.find((m) => m.id_municipio === id);
    setShipping((prev) => ({
      ...prev,
      cityId: muni ? muni.id_municipio : null,
      city: muni ? muni.nombre : "",
    }));
    setTouched((t) => ({ ...t, cityId: true }));
    setErrors((prev) => ({ ...prev, cityId: muni ? "" : "Selecciona un municipio" }));
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
                <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                  <InputField
                    id={fieldId("fullName")}
                    icon={<User className="size-4" />}
                    label="Nombre completo"
                    value={buyer.fullName}
                    onChange={(v) => handleBuyer("fullName", v)}
                    onBlur={() => touch("fullName")}
                    placeholder="Nombre y apellido"
                    autoComplete="name"
                    autoCapitalize="words"
                    maxLength={80}
                    error={errors.fullName}
                    valid={isValid("fullName")}
                    className="sm:col-span-2"
                  />
                  <SelectField
                    id={fieldId("docType")}
                    icon={<FileText className="size-4" />}
                    label="Tipo de documento"
                    value={buyer.docType}
                    onChange={(v) => handleBuyer("docType", v)}
                    onBlur={() => touch("docType")}
                    options={[...DOC_TYPES]}
                    placeholder="Seleccionar"
                    error={errors.docType}
                  />
                  <InputField
                    id={fieldId("docNumber")}
                    icon={<FileText className="size-4" />}
                    label="Número de documento"
                    value={buyer.docNumber}
                    onChange={(v) => handleBuyer("docNumber", v)}
                    onBlur={() => touch("docNumber")}
                    placeholder={docRule.placeholder}
                    inputMode={docRule.inputMode}
                    autoCapitalize={buyer.docType === "PP" ? "characters" : "off"}
                    autoComplete="off"
                    hint={buyer.docType ? docRule.hint : "Elige primero el tipo de documento"}
                    error={errors.docNumber}
                    valid={isValid("docNumber")}
                  />
                  <InputField
                    id={fieldId("email")}
                    icon={<Mail className="size-4" />}
                    label="Correo electrónico"
                    type="email"
                    value={buyer.email}
                    onChange={(v) => handleBuyer("email", v)}
                    onBlur={() => touch("email")}
                    placeholder="nombre@gmail.com"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={254}
                    hint="Aquí te enviamos la confirmación del pedido"
                    error={errors.email}
                    valid={isValid("email") && !emailSuggestion}
                  >
                    {emailSuggestion && (
                      <p className="mt-1.5 text-xs text-custom-black/75">
                        ¿Quisiste decir{" "}
                        <button
                          type="button"
                          onClick={() => {
                            handleBuyer("email", emailSuggestion);
                            document.getElementById(fieldId("email"))?.focus();
                          }}
                          className="rounded font-semibold text-custom-dark-green underline decoration-custom-dark-green/40 underline-offset-2 hover:decoration-custom-dark-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-medium-green"
                        >
                          {emailSuggestion}
                        </button>
                        ?
                      </p>
                    )}
                  </InputField>
                  <InputField
                    id={fieldId("phone")}
                    icon={<Smartphone className="size-4" />}
                    label="Número de celular"
                    type="tel"
                    value={formatPhone(buyer.phone)}
                    onChange={(v) => handleBuyer("phone", v)}
                    onBlur={() => touch("phone")}
                    placeholder="300 123 4567"
                    prefix="+57"
                    autoComplete="tel-national"
                    inputMode="numeric"
                    error={errors.phone}
                    valid={isValid("phone")}
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

                <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                  <SelectField
                    id="checkout-country"
                    icon={<MapPin className="size-4" />}
                    label="País"
                    value={shipping.country}
                    onChange={(v) => handleShipping("country", v)}
                    options={[{ value: "CO", label: "Colombia" }]}
                  />
                  <SelectField
                    id={fieldId("state")}
                    onBlur={() => touch("state")}
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
                    id={fieldId("cityId")}
                    onBlur={() => shipping.stateId && touch("cityId")}
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
                    id={fieldId("address")}
                    icon={<MapPin className="size-4" />}
                    label="Dirección"
                    value={shipping.address}
                    onChange={(v) => handleShipping("address", v)}
                    onBlur={() => touch("address")}
                    placeholder="Calle 10 # 5-23, apto 301"
                    autoComplete="street-address"
                    maxLength={120}
                    error={errors.address}
                    valid={isValid("address")}
                  />
                  <InputField
                    id={fieldId("zip")}
                    icon={<MapPin className="size-4" />}
                    label="Código postal (opcional)"
                    value={shipping.zip ?? ""}
                    onChange={(v) => handleShipping("zip", v)}
                    onBlur={() => touch("zip")}
                    placeholder="110111"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={6}
                    error={errors.zip}
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
                        <ProductPhoto
                          fit="cover"
                          src={it.image}
                          alt=""
                          sizes="56px"
                          maxWidth={160}
                          className="size-14 shrink-0 rounded-lg"
                        />
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
                      {variosEnvios && (
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
                              <Truck className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                              <span>
                                {desgloseEnvio ? `Envío de ${g.productor}` : "Valor envío"}
                                <span className="block text-xs text-custom-black/50">
                                  {!desgloseEnvio && `${g.productor} · `}desde{" "}
                                  {g.municipio_origen} · {g.peso_facturable_kg} kg ·{" "}
                                  {trayectoLabel(g.trayecto_aplicado)}
                                </span>
                                <span className="block text-xs text-custom-black/50">
                                  Entrega estimada: {entregaLabel(g.entrega)}
                                </span>
                              </span>
                            </span>
                            <span
                              className={`shrink-0 text-custom-dark-green ${
                                desgloseEnvio ? "font-medium" : "font-bold"
                              }`}
                            >
                              {formatCOP(g.valor_envio)}
                            </span>
                          </div>

                          {g.neveras > 0 && (
                            <div className="pl-4 text-xs text-custom-black/60">
                              <span className="flex items-center gap-1">
                                <Snowflake className="size-3" aria-hidden="true" />
                                Empaque refrigerado incluido ({g.neveras}{" "}
                                {g.neveras === 1 ? "nevera" : "neveras"})
                              </span>
                            </div>
                          )}
                        </div>
                      ))}

                      {hayDescuentoEnvio && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-custom-medium-green">
                            <Tag className="size-3" aria-hidden="true" />
                            Descuento de envío
                          </span>
                          <span className="font-medium text-custom-medium-green">
                            -{formatCOP(activeQuote.totales.descuento_envio)}
                          </span>
                        </div>
                      )}

                      {desgloseEnvio && (
                        <div className="flex items-center justify-between border-t border-custom-medium-green/15 pt-2.5 text-sm">
                          <span className="font-semibold text-custom-black/80">Valor envío</span>
                          <span className="font-bold text-custom-dark-green">
                            {formatCOP(activeQuote.totales.envio)}
                          </span>
                        </div>
                      )}

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
                            Tu compra tiene descuento en el envío.
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

                <div role="alert" aria-live="assertive">
                  {formAlert && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2.5 text-xs text-red-700">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      <span>{formAlert}</span>
                    </div>
                  )}
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

type InputFieldProps = {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  type?: string;
  className?: string;
  error?: string;
  hint?: string;
  /** Texto fijo a la izquierda (p. ej. el indicativo "+57"). */
  prefix?: string;
  valid?: boolean;
  children?: React.ReactNode;
} & Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  "autoComplete" | "inputMode" | "maxLength" | "autoCapitalize" | "spellCheck"
>;

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error)
    return (
      <p id={`${id}-msg`} className="mt-1.5 flex items-start gap-1 text-xs font-medium text-red-700">
        <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {error}
      </p>
    );
  if (hint)
    return (
      <p id={`${id}-msg`} className="mt-1.5 text-xs text-custom-black/60">
        {hint}
      </p>
    );
  return null;
}

const fieldFrame = (error?: string, disabled?: boolean) =>
  `absolute inset-0 rounded-xl border bg-white/45 transition-[border-color,box-shadow] duration-200 backdrop-blur-xl ${
    error
      ? "border-red-400 group-focus-within:border-red-500 group-focus-within:shadow-[0_0_0_3px_rgba(188,71,73,0.14)]"
      : "border-white/50 group-focus-within:border-custom-dark-green/40 group-focus-within:shadow-[0_0_0_3px_rgba(56,102,65,0.12)]"
  } ${disabled ? "opacity-60" : ""}`;

function InputField({
  id,
  icon,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  className = "",
  error,
  hint,
  prefix,
  valid = false,
  children,
  ...inputProps
}: InputFieldProps) {
  const hasMsg = !!(error || hint);
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-custom-black/80">
        <span className="text-custom-dark-green/70" aria-hidden="true">{icon}</span>
        {label}
      </label>
      <div className="group relative flex items-center overflow-hidden rounded-xl">
        <div className={fieldFrame(error)} />
        {prefix && (
          <span
            className="relative flex h-6 items-center border-r border-custom-black/15 pr-3 pl-4 text-base font-medium tabular-nums text-custom-black/70 sm:text-sm"
            aria-hidden="true"
          >
            {prefix}
          </span>
        )}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMsg ? `${id}-msg` : undefined}
          aria-label={prefix ? `${label} (indicativo ${prefix})` : undefined}
          className={`relative h-11 w-full min-w-0 bg-transparent text-base text-custom-black placeholder:text-custom-black/45 focus:outline-none sm:text-sm ${
            prefix ? "pl-3" : "pl-4"
          } ${valid ? "pr-10" : "pr-4"} ${prefix || type === "tel" ? "tabular-nums" : ""}`}
          {...inputProps}
        />
        {valid && (
          <Check
            className="pointer-events-none absolute right-3.5 size-4 text-custom-medium-green motion-safe:animate-[field-ok_.25s_cubic-bezier(.16,1,.3,1)]"
            aria-hidden="true"
          />
        )}
      </div>
      <FieldMessage id={id} error={error} hint={hint} />
      {children}
    </div>
  );
}

function SelectField({
  id,
  icon,
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  error,
  disabled = false,
  hint,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  hint?: string;
}) {
  const hasMsg = !!(error || hint);
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-custom-black/80">
        <span className="text-custom-dark-green/70" aria-hidden="true">{icon}</span>
        {label}
      </label>
      <div className="group relative overflow-hidden rounded-xl">
        <div className={fieldFrame(error, disabled)} />
        <select
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMsg ? `${id}-msg` : undefined}
          className={`relative h-11 w-full cursor-pointer appearance-none bg-transparent pr-10 pl-4 text-base focus:outline-none disabled:cursor-not-allowed sm:text-sm ${
            value ? "text-custom-black" : "text-custom-black/55"
          }`}
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
        <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-custom-black/50" aria-hidden="true" />
      </div>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}
