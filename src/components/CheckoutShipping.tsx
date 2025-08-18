import { useState } from "react";
import { Input, Button, Select, SelectItem, Textarea } from "@heroui/react";
import { useCartStore, useCartTotal } from "@/stores/cart";

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

const DOC_TYPES = ["CC", "CE", "NIT", "Passport"];
const CO_DEPARTMENTS = [
  "Amazonas","Antioquia","Arauca","Atlántico","Bogotá D.C.","Bolívar","Boyacá","Caldas","Caquetá","Casanare",
  "Cauca","Cesar","Chocó","Córdoba","Cundinamarca","Guainía","Guaviare","Huila","La Guajira","Magdalena",
  "Meta","Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés y Providencia",
  "Santander","Sucre","Tolima","Valle del Cauca","Vaupés","Vichada"
];

export default function CheckoutShipping() {
  const items = useCartStore((s) => s.items);
  const total = useCartTotal();

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
  const disabled = items.length === 0 || submitting;

  async function goToPayU() {
    setSubmitting(true);
    try {
      const payload = {
        buyer,
        shipping,
        items: items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
        })),
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
      Object.entries(data.fields as Record<string, string>).forEach(([k, v]) => {
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
    } catch (e: any) {
      alert(e.message || "Error inesperado.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
      {/* Formulario */}
      <div className="space-y-6 rounded-2xl border border-custom-medium-green/30 bg-custom-cream p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-custom-dark-green mb-6">Información del comprador</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Nombre completo"
            value={buyer.fullName}
            onValueChange={(v) => setBuyer({ ...buyer, fullName: v })}
            isRequired
            classNames={{
              base: "group",
              label: [
                "absolute",
                "text-gray-700",
                "text-sm",
                "top-2",
                "left-3",
                "z-10",
                "origin-top-left",
                "transition-all",
                "duration-200",
                "group-data-[filled=true]:-translate-y-2",
                "group-data-[filled=true]:scale-75",
                "group-data-[filled=true]:text-gray-800",
                "group-data-[focus=true]:text-custom-dark-green"
              ],
              inputWrapper: [
                "relative",
                "rounded-lg",
                "bg-custom-cream",
                "border",
                "border-custom-medium-green",
                "shadow-sm",
                "hover:bg-custom-cream/90",
                "focus-within:ring-2",
                "focus-within:ring-custom-medium-green",
                "focus-within:border-custom-medium-green",
                "h-12",
                "px-3",
                "pt-4",
                "pb-1"
              ],
              input: "text-gray-800 pt-1 font-medium" 
            }}
          />

          <Select
            label="Tipo de documento"
            selectedKeys={[buyer.docType]}
            onSelectionChange={(k) => setBuyer({ ...buyer, docType: Array.from(k)[0] as string })}
            className="w-full"
            classNames={{
              base: "group",
              label: [
                "absolute",
                "text-gray-700", 
                "text-sm",
                "top-2",
                "left-3",
                "z-10",
                "origin-top-left",
                "transition-all",
                "duration-200",
                "group-data-[filled=true]:-translate-y-2",
                "group-data-[filled=true]:scale-75",
                "group-data-[filled=true]:text-gray-800",
                "group-data-[focus=true]:text-custom-dark-green"
              ],
              trigger: [
                "relative",
                "rounded-lg",
                "bg-custom-cream",
                "border",
                "border-custom-medium-green",
                "shadow-sm",
                "hover:bg-custom-cream/90",
                "focus:ring-2",
                "focus:ring-custom-medium-green",
                "focus:border-custom-medium-green",
                "h-12",
                "px-3",
                "pt-4",
                "pb-1",
                "text-left",
                "pr-8"
              ],
              value: "text-gray-800 text-base pt-1 font-medium",
              popoverContent: [
                "rounded-lg",
                "shadow-lg",
                "border",
                "border-custom-medium-green",
                "bg-custom-dark-green"
              ],
              selectorIcon: [
                "text-gray-700",
                "right-3",
                "left-auto",
                "absolute",
                "top-1/2",
                "-translate-y-1/2"
              ]
            }}
          >
            {DOC_TYPES.map((d) => (
              <SelectItem 
                key={d}
                classNames={{
                  base: "hover:bg-custom-medium-green", 
                  title: "text-white"
                }}
              >
                {d}
              </SelectItem>
            ))}
          </Select>

          <Input
            type="Ndocument"
            label="N° documento"
            value={buyer.docNumber}
            onValueChange={(v) => setBuyer({ ...buyer, docNumber: v })}
            isRequired
            classNames={{
              base: "group",
              label: [
                "absolute",
                "text-gray-700",
                "text-sm",
                "top-2",
                "left-3",
                "z-10",
                "origin-top-left",
                "transition-all",
                "duration-200",
                "group-data-[filled=true]:-translate-y-2",
                "group-data-[filled=true]:scale-75",
                "group-data-[filled=true]:text-gray-800",
                "group-data-[focus=true]:text-custom-dark-green"
              ],
              inputWrapper: [
                "relative",
                "rounded-lg",
                "bg-custom-cream",
                "border",
                "border-custom-medium-green",
                "shadow-sm",
                "hover:bg-custom-cream/90",
                "focus-within:ring-2",
                "focus-within:ring-custom-medium-green",
                "focus-within:border-custom-medium-green",
                "h-12",
                "px-3",
                "pt-4",
                "pb-1"
              ],
              input: "text-gray-800 pt-1 font-medium"
            }}
          />
          <Input
            type="email"
            label="Email"
            value={buyer.email}
            onValueChange={(v) => setBuyer({ ...buyer, email: v })}
            isRequired
            classNames={{
              base: "group",
              label: [ "absolute", "text-gray-700", "text-sm", "top-2", "left-3",
                "z-10",
                "origin-top-left",
                "transition-all",
                "duration-200",
                "group-data-[filled=true]:-translate-y-2",
                "group-data-[filled=true]:scale-75",
                "group-data-[filled=true]:text-gray-800",
                "group-data-[focus=true]:text-custom-dark-green"
              ],
              inputWrapper: [
                "relative",
                "rounded-lg",
                "bg-custom-cream",
                "border",
                "border-custom-medium-green",
                "shadow-sm",
                "hover:bg-custom-cream/90",
                "focus-within:ring-2",
                "focus-within:ring-custom-medium-green",
                "focus-within:border-custom-medium-green",
                "h-12",
                "px-3",
                "pt-4",
                "pb-1"
              ],
              input: "text-gray-800 pt-1 font-medium"
            }}
          />

          <Input
            label="Teléfono"
            value={buyer.phone}
            onValueChange={(v) => setBuyer({ ...buyer, phone: v })}
            isRequired
            classNames={{
              base: "group",
              label: [
                "absolute",
                "text-gray-700",
                "text-sm",
                "top-2",
                "left-3",
                "z-10",
                "origin-top-left",
                "transition-all",
                "duration-200",
                "group-data-[filled=true]:-translate-y-2",
                "group-data-[filled=true]:scale-75",
                "group-data-[filled=true]:text-gray-800",
                "group-data-[focus=true]:text-custom-dark-green"
              ],
              inputWrapper: [
                "relative",
                "rounded-lg",
                "bg-custom-cream",
                "border",
                "border-custom-medium-green",
                "shadow-sm",
                "hover:bg-custom-cream/90",
                "focus-within:ring-2",
                "focus-within:ring-custom-medium-green",
                "focus-within:border-custom-medium-green",
                "h-12",
                "px-3",
                "pt-4",
                "pb-1"
              ],
              input: "text-gray-800 pt-1 font-medium"
            }}
          />
        </div>

        <h2 className="mt-6 text-xl font-bold text-custom-dark-green">Dirección de envío</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="País"
            selectedKeys={new Set([shipping.country])}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string || "CO";
              setShipping({ ...shipping, country: selected });
            }}
            className="w-full"
            isRequired
            disallowEmptySelection
            classNames={{
              base: "group",
              label: [
                "absolute",
                "text-gray-700",
                "text-sm",
                "top-2",
                "left-3",
                "z-10",
                "origin-top-left",
                "transition-all",
                "duration-200",
                "group-data-[filled=true]:-translate-y-2",
                "group-data-[filled=true]:scale-75",
                "group-data-[filled=true]:text-gray-800",
                "group-data-[focus=true]:text-custom-dark-green"
              ],
              trigger: [
                "relative",
                "rounded-lg",
                "bg-custom-cream",
                "border",
                "border-custom-medium-green",
                "shadow-sm",
                "hover:bg-custom-cream/90",
                "focus:ring-2",
                "focus:ring-custom-medium-green",
                "focus:border-custom-medium-green",
                "h-12",
                "px-3",
                "pt-4",
                "pb-1",
                "text-left",
                "pr-8"
              ],
              value: "text-gray-800 text-base pt-1 font-medium",
              popoverContent: [
                "rounded-lg",
                "shadow-lg",
                "border",
                "border-custom-medium-green",
                "bg-custom-dark-green"
              ],
              selectorIcon: [
                "text-gray-700",
                "right-3",
                "left-auto",
                "absolute",
                "top-1/2",
                "-translate-y-1/2"
              ]
            }}
          >
            <SelectItem 
              key="CO"
              classNames={{
                base: "hover:bg-custom-medium-green",
                title: "text-white"
              }}
            >
              Colombia
            </SelectItem>
          </Select>

          <Select
            label="Departamento"
            selectedKeys={new Set([shipping.state])}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string || "Cundinamarca";
              setShipping({ ...shipping, state: selected });
            }}
            className="w-full"
            isRequired
            disallowEmptySelection
            classNames={{
              base: "group",
              label: [
                "absolute",
                "text-gray-700",
                "text-sm",
                "top-2",
                "left-3",
                "z-10",
                "origin-top-left",
                "transition-all",
                "duration-200",
                "group-data-[filled=true]:-translate-y-2",
                "group-data-[filled=true]:scale-75",
                "group-data-[filled=true]:text-gray-800",
                "group-data-[focus=true]:text-custom-dark-green"
              ],
              trigger: [
                "relative",
                "rounded-lg",
                "bg-custom-cream",
                "border",
                "border-custom-medium-green",
                "shadow-sm",
                "hover:bg-custom-cream/90",
                "focus:ring-2",
                "focus:ring-custom-medium-green",
                "focus:border-custom-medium-green",
                "h-12",
                "px-3",
                "pt-4",
                "pb-1",
                "text-left",
                "pr-8"
              ],
              value: "text-gray-800 text-base pt-1 font-medium",
              popoverContent: [
                "rounded-lg",
                "shadow-lg",
                "border",
                "border-custom-medium-green",
                "bg-custom-dark-green"
              ],
              selectorIcon: [
                "text-gray-700",
                "right-3",
                "left-auto",
                "absolute",
                "top-1/2",
                "-translate-y-1/2"
              ]
            }}
          >
            {CO_DEPARTMENTS.map((d) => (
              <SelectItem 
                key={d}
                classNames={{
                  base: "hover:bg-custom-medium-green",
                  title: "text-white"
                }}
              >
                {d}
              </SelectItem>
            ))}
          </Select>

          <Input
            label="Ciudad"
            value={shipping.city}
            onValueChange={(v) => setShipping({ ...shipping, city: v })}
            isRequired
            classNames={{
              base: "group",
              label: [
                "absolute",
                "text-gray-700",
                "text-sm",
                "top-2",
                "left-3",
                "z-10",
                "origin-top-left",
                "transition-all",
                "duration-200",
                "group-data-[filled=true]:-translate-y-2",
                "group-data-[filled=true]:scale-75",
                "group-data-[filled=true]:text-gray-800",
                "group-data-[focus=true]:text-custom-dark-green"
              ],
              inputWrapper: [
                "relative",
                "rounded-lg",
                "bg-custom-cream",
                "border",
                "border-custom-medium-green",
                "shadow-sm",
                "hover:bg-custom-cream/90",
                "focus-within:ring-2",
                "focus-within:ring-custom-medium-green",
                "focus-within:border-custom-medium-green",
                "h-12",
                "px-3",
                "pt-4",
                "pb-1"
              ],
              input: "text-gray-800 pt-1 font-medium"
            }}
          />

          <Input
            label="Dirección"
            value={shipping.address}
            onValueChange={(v) => setShipping({ ...shipping, address: v })}
            isRequired
            classNames={{
              base: "group",
              label: [
                "absolute",
                "text-gray-700",
                "text-sm",
                "top-2",
                "left-3",
                "z-10",
                "origin-top-left",
                "transition-all",
                "duration-200",
                "group-data-[filled=true]:-translate-y-2",
                "group-data-[filled=true]:scale-75",
                "group-data-[filled=true]:text-gray-800",
                "group-data-[focus=true]:text-custom-dark-green"
              ],
              inputWrapper: [
                "relative",
                "rounded-lg",
                "bg-custom-cream",
                "border",
                "border-custom-medium-green",
                "shadow-sm",
                "hover:bg-custom-cream/90",
                "focus-within:ring-2",
                "focus-within:ring-custom-medium-green",
                "focus-within:border-custom-medium-green",
                "h-12",
                "px-3",
                "pt-4",
                "pb-1"
              ],
              input: "text-gray-800 pt-1 font-medium"
            }}
          />

          <Input
            label="Código postal"
            value={shipping.zip}
            onValueChange={(v) => setShipping({ ...shipping, zip: v })}
            classNames={{
              base: "group",
              label: [
                "absolute",
                "text-gray-700",
                "text-sm",
                "top-2",
                "left-3",
                "z-10",
                "origin-top-left",
                "transition-all",
                "duration-200",
                "group-data-[filled=true]:-translate-y-2",
                "group-data-[filled=true]:scale-75",
                "group-data-[filled=true]:text-gray-800",
                "group-data-[focus=true]:text-custom-dark-green"
              ],
              inputWrapper: [
                "relative",
                "rounded-lg",
                "bg-custom-cream",
                "border",
                "border-custom-medium-green",
                "shadow-sm",
                "hover:bg-custom-cream/90",
                "focus-within:ring-2",
                "focus-within:ring-custom-medium-green",
                "focus-within:border-custom-medium-green",
                "h-12",
                "px-3",
                "pt-4",
                "pb-1"
              ],
              input: "text-gray-800 pt-1 font-medium"
            }}
          />
        </div>

        <Textarea
          label="Notas para el vendedor (opcional)"
          value={notes}
          onValueChange={setNotes}
          classNames={{
            base: "group",
            label: [
              "text-gray-700",
              "text-sm",
              "mb-1",
              "block",
              "transition-all",
              "duration-200",
              "group-data-[focus=true]:text-custom-dark-green"
            ],
            inputWrapper: [
              "relative",
              "rounded-lg",
              "bg-custom-cream",
              "border",
              "border-custom-medium-green",
              "shadow-sm",
              "hover:bg-custom-cream/90",
              "focus-within:ring-2",
              "focus-within:ring-custom-medium-green",
              "focus-within:border-custom-medium-green",
              "px-3",
              "py-2"
            ],
            input: "text-gray-800 font-medium min-h-[100px]"
          }}
        />
      </div>
      <aside className="space-y-5 rounded-2xl border border-custom-medium-green/30 bg-custom-cream/50 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-custom-dark-green">Resumen</h3>
        <ul className="divide-y divide-custom-medium-green/20">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-2">
              <div className="max-w-[70%] truncate">{it.name} × {it.quantity}</div>
              <div className="font-semibold">
                {new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0
                }).format(it.price * it.quantity)}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-custom-medium-green/20 pt-3">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-2xl font-bold text-custom-dark-green">
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0
            }).format(total)}
          </span>
        </div>
        <Button
          className="w-full rounded-xl bg-custom-dark-green text-custom-cream font-semibold shadow-sm hover:bg-custom-medium-green"
          isDisabled={disabled}
          onPress={goToPayU}
        >
          Pagar con PayU
        </Button>
        {items.length === 0 && (
          <p className="text-sm text-gray-500 text-center">
            Tu carrito está vacío.
          </p>
        )}
      </aside>
    </div>
  );
}