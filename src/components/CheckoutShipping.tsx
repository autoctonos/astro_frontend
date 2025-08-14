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
    docType: "CC",
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
      <div className="space-y-4 rounded-2xl border border-custom-medium-green/30 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-custom-dark-green">Información del comprador</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Nombre completo" value={buyer.fullName} onValueChange={(v)=>setBuyer({...buyer, fullName:v})} isRequired />
          <Select label="Tipo de documento" selectedKeys={[buyer.docType]} onSelectionChange={(k)=>setBuyer({...buyer, docType: Array.from(k)[0] as string})}>
            {DOC_TYPES.map((d)=> <SelectItem key={d}>{d}</SelectItem>)}
          </Select>
          <Input label="N° documento" value={buyer.docNumber} onValueChange={(v)=>setBuyer({...buyer, docNumber:v})} isRequired />
          <Input type="email" label="Email" value={buyer.email} onValueChange={(v)=>setBuyer({...buyer, email:v})} isRequired />
          <Input label="Teléfono" value={buyer.phone} onValueChange={(v)=>setBuyer({...buyer, phone:v})} isRequired />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-custom-dark-green">Dirección de envío</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="País" selectedKeys={[shipping.country]} onSelectionChange={(k)=>setShipping({...shipping, country: Array.from(k)[0] as string})}>
            <SelectItem key="CO">Colombia</SelectItem>
          </Select>
          <Select label="Departamento" selectedKeys={[shipping.state]} onSelectionChange={(k)=>setShipping({...shipping, state: Array.from(k)[0] as string})}>
            {CO_DEPARTMENTS.map((d)=><SelectItem key={d}>{d}</SelectItem>)}
          </Select>
          <Input label="Ciudad" value={shipping.city} onValueChange={(v)=>setShipping({...shipping, city:v})} isRequired />
          <Input label="Dirección" value={shipping.address} onValueChange={(v)=>setShipping({...shipping, address:v})} isRequired />
          <Input label="Código postal" value={shipping.zip} onValueChange={(v)=>setShipping({...shipping, zip:v})} />
        </div>

        <Textarea label="Notas para el vendedor (opcional)" value={notes} onValueChange={setNotes} />
      </div>

      {/* Resumen */}
      <aside className="space-y-4 rounded-2xl border border-custom-medium-green/30 bg-custom-cream/40 p-4">
        <h3 className="text-lg font-semibold text-custom-dark-green">Resumen</h3>
        <ul className="divide-y divide-custom-medium-green/20">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-2">
              <div className="max-w-[70%] truncate">{it.name} × {it.quantity}</div>
              <div className="font-medium">
                {new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(it.price*it.quantity)}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-custom-medium-green/20 pt-3">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-xl font-semibold text-custom-dark-green">
            {new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(total)}
          </span>
        </div>
        <Button
          className="w-full bg-custom-dark-green text-custom-cream hover:bg-custom-medium-green"
          isDisabled={disabled}
          onPress={goToPayU}
        >
          Pagar con PayU
        </Button>
        {items.length === 0 && <p className="text-sm text-gray-500">Tu carrito está vacío.</p>}
      </aside>
    </div>
  );
}
