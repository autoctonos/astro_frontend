import type { APIRoute } from "astro";
import crypto from "node:crypto";

type CartItem = { id: string|number; name: string; price: number; quantity: number; };

function toMoneyString(n: number) {
  // PayU acepta enteros o dos decimales; usamos string con 2 decimales para estabilidad.
  return (Math.round(n * 100) / 100).toFixed(2);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const {
      buyer,       // { fullName, email, phone, docType, docNumber }
      shipping,    // { country, state, city, address, zip? }
      items,       // CartItem[]
      referenceCode, // opcional: string
      description,   // opcional: string
      currency = "COP",
      tax = 0,
      taxReturnBase = 0,
    } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Carrito vacío." }), { status: 400 });
    }

    const amountNum = items.reduce((acc: number, it: CartItem) => acc + it.price * it.quantity, 0);
    const amount = toMoneyString(amountNum);

    const MERCHANT_ID = import.meta.env.PAYU_MERCHANT_ID as string;
    const ACCOUNT_ID  = import.meta.env.PAYU_ACCOUNT_ID as string;
    const API_KEY     = import.meta.env.PAYU_API_KEY as string;
    const MODE        = (import.meta.env.PAYU_MODE as string) || "sandbox";
    const RESPONSE_URL = import.meta.env.PAYU_RESPONSE_URL as string;
    const CONFIRMATION_URL = import.meta.env.PAYU_CONFIRMATION_URL as string;

    if (!MERCHANT_ID || !ACCOUNT_ID || !API_KEY) {
      return new Response(JSON.stringify({ error: "Faltan credenciales PayU." }), { status: 500 });
    }

    const ref =
      referenceCode ||
      `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Firma: apiKey~merchantId~referenceCode~amount~currency  (algoritmo: SHA256)
    // https://developers.payulatam.com/.../payment-form.html
    const base = `${API_KEY}~${MERCHANT_ID}~${ref}~${amount}~${currency}`;
    const signature = crypto.createHash("sha256").update(base, "utf8").digest("hex");

    const action =
      MODE === "prod"
        ? "https://checkout.payulatam.com/ppp-web-gateway-payu/"
        : "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/";

    const fields = {
      // Obligatorios
      merchantId: MERCHANT_ID,
      accountId: ACCOUNT_ID,
      description: description || `Compra (${items.length} ítems)`,
      referenceCode: ref,
      amount,
      tax: toMoneyString(Number(tax)),
      taxReturnBase: toMoneyString(Number(taxReturnBase)),
      currency,
      signature,
      algorithmSignature: "SHA256",
      test: MODE === "prod" ? "0" : "1",
      responseUrl: RESPONSE_URL,
      confirmationUrl: CONFIRMATION_URL,

      // Payer / Buyer
      payerFullName: buyer?.fullName || "",
      payerEmail: buyer?.email || "",
      payerPhone: buyer?.phone || "",
      payerDocumentType: buyer?.docType || "",
      payerDocument: buyer?.docNumber || "",
      buyerFullName: buyer?.fullName || "",
      buyerEmail: buyer?.email || "",
      buyerDocumentType: buyer?.docType || "",
      buyerDocument: buyer?.docNumber || "",
      telephone: buyer?.phone || "",

      // Shipping (si aplicas envíos físicos)
      shippingCountry: shipping?.country || "CO",
      shippingState: shipping?.state || "",
      shippingCity: shipping?.city || "",
      shippingAddress: shipping?.address || "",
      zipCode: shipping?.zip || "",
      // Puedes agregar extra1..extra4 si quieres meter metadatos (id de orden, etc.)
    };

    return new Response(JSON.stringify({ action, fields }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Error" }), { status: 500 });
  }
};
