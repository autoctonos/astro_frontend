/**
 * Mock local de la API de envíos, para construir y ver toda la UI sin backend.
 *
 * Se activa con `PUBLIC_SHIPPING_MOCK=1` (fiel al golden fixture del plan) o con
 * `PUBLIC_SHIPPING_MOCK=2` (variante de demo: fuerza cadena de frío y dos orígenes,
 * para poder ver las filas de neveras y de multi-origen). Cualquier otro valor lo apaga.
 *
 * Replica el tarifario y el algoritmo del plan, así que el caso Queso Paipa
 * (0,8 kg · $30.000 · ×5 · origen Paipa → Tunja) devuelve exactamente el golden:
 * flete 25.100 · sobreflete 3.000 · **total "178100.00"**.
 *
 * NO es la fuente de verdad: la única fuente de verdad es el backend.
 */
import type {
  Cotizacion,
  DestinosResponse,
  GrupoEnvio,
  LineaCotizada,
} from "./schemas/shipping";
import type { CotizarItem } from "./shipping";

export type ShippingMockMode = "off" | "golden" | "demo";

export function shippingMockMode(): ShippingMockMode {
  const flag = import.meta.env.PUBLIC_SHIPPING_MOCK;
  if (flag === "1") return "golden";
  if (flag === "2") return "demo";
  return "off";
}

export const isShippingMockEnabled = () => shippingMockMode() !== "off";

/* ---------------------------- tarifario ---------------------------- */

type Tarifa = {
  codigo: string;
  jerarquia: number;
  inicial: number;
  adicional: number;
  minimo: number;
  /** Días hábiles de la hoja «Convenciones» del tarifario. */
  diasMin: number;
  diasMax: number;
};

const TARIFARIO: Tarifa[] = [
  { codigo: "urbano", jerarquia: 1, inicial: 8150, adicional: 3850, minimo: 800, diasMin: 1, diasMax: 1 },
  { codigo: "zonal", jerarquia: 2, inicial: 11900, adicional: 4400, minimo: 800, diasMin: 1, diasMax: 3 },
  { codigo: "nacional", jerarquia: 3, inicial: 18200, adicional: 4800, minimo: 800, diasMin: 1, diasMax: 4 },
  { codigo: "territorial", jerarquia: 4, inicial: 19800, adicional: 4850, minimo: 800, diasMin: 1, diasMax: 4 },
  { codigo: "especial", jerarquia: 5, inicial: 38400, adicional: 12450, minimo: 800, diasMin: 8, diasMax: 10 },
];

const PORCENTAJE_SOBREFLETE = 0.02;
const CAPACIDAD_NEVERA_KG = 6;
const UMBRAL_PROMOCION = 200000;
const PESO_POR_DEFECTO_KG = 0.8;

const tarifaPorJerarquia = (j: number) =>
  TARIFARIO.find((t) => t.jerarquia === j) ?? TARIFARIO[TARIFARIO.length - 1]!;

/* ---------------------------- cobertura ---------------------------- */

export const MOCK_DESTINOS: DestinosResponse = {
  version: "2026-09-03T12:00:00Z",
  departamentos: [
    {
      id_departamento: 7,
      nombre: "Boyacá",
      municipios: [
        { id_municipio: 1104, nombre: "Tunja", trayecto: "urbano", jerarquia: 1 },
        { id_municipio: 1042, nombre: "Duitama", trayecto: "zonal", jerarquia: 2 },
        { id_municipio: 1069, nombre: "Paipa", trayecto: "zonal", jerarquia: 2 },
        { id_municipio: 1098, nombre: "Sogamoso", trayecto: "zonal", jerarquia: 2 },
        { id_municipio: 1030, nombre: "Chiquinquirá", trayecto: "territorial", jerarquia: 4 },
      ],
    },
    {
      id_departamento: 11,
      nombre: "Bogotá D.C.",
      municipios: [{ id_municipio: 149, nombre: "Bogotá D.C.", trayecto: "zonal", jerarquia: 2 }],
    },
    {
      id_departamento: 2,
      nombre: "Antioquia",
      municipios: [{ id_municipio: 21, nombre: "Medellín", trayecto: "nacional", jerarquia: 3 }],
    },
    {
      id_departamento: 32,
      nombre: "Valle del Cauca",
      municipios: [{ id_municipio: 900, nombre: "Cali", trayecto: "nacional", jerarquia: 3 }],
    },
    {
      // Sólo en el mock: sirve para ver el estado de error 422 sin backend.
      id_departamento: 1,
      nombre: "Amazonas",
      municipios: [{ id_municipio: 3, nombre: "Leticia", trayecto: "especial", jerarquia: 5 }],
    },
  ],
};

/** El envío se agrupa por productor: cada uno despacha desde su propio municipio. */
const PRODUCTORES = [
  { idProductor: 7, nombre: "Lácteos El Roble", idMunicipio: 1069, municipio: "Paipa", departamento: "Boyacá", jerarquia: 2 },
  { idProductor: 9, nombre: "Sabajón del Llano", idMunicipio: 1098, municipio: "Sogamoso", departamento: "Boyacá", jerarquia: 2 },
];

/** Error con la misma forma que el 422 del backend, para ejercitar la UI de error. */
export class MockCotizacionError extends Error {
  readonly status = 422;
  readonly body: { code: string; detail: string; contexto: Record<string, unknown> };
  constructor(code: string, detail: string, contexto: Record<string, unknown> = {}) {
    super(`HTTP 422 Unprocessable Entity`);
    this.name = "HttpError";
    this.body = { code, detail, contexto };
    Object.setPrototypeOf(this, MockCotizacionError.prototype);
  }
}

/* ---------------------------- helpers ---------------------------- */

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const kilos = (n: number) => n.toFixed(3);

export type MockCartItem = CotizarItem & {
  name?: string;
  price?: number;
  weightKg?: number;
  requiresCooling?: boolean;
};

/* ---------------------------- cotización ---------------------------- */

export function mockCotizar(idMunicipioDestino: number, items: MockCartItem[]): Cotizacion {
  const modo = shippingMockMode();

  const destinoEntry = MOCK_DESTINOS.departamentos
    .flatMap((d) => d.municipios.map((m) => ({ ...m, departamento: d.nombre })))
    .find((m) => m.id_municipio === idMunicipioDestino);

  if (!destinoEntry) {
    throw new MockCotizacionError(
      "destino_no_soportado",
      "Aún no realizamos envíos a ese municipio.",
      { id_municipio: idMunicipioDestino }
    );
  }
  if (destinoEntry.nombre === "Leticia") {
    throw new MockCotizacionError(
      "destino_no_soportado",
      `Aún no realizamos envíos a ${destinoEntry.nombre} (${destinoEntry.departamento}).`,
      { id_municipio: destinoEntry.id_municipio, municipio: destinoEntry.nombre }
    );
  }
  if (items.length === 0) {
    throw new MockCotizacionError("carrito_vacio", "Tu carrito está vacío.");
  }

  // Agrupa por (productor, municipio de origen), igual que el backend. En modo "demo"
  // alterna productores para ver el multi-grupo.
  const grupos: GrupoEnvio[] = [];
  const porGrupo = new Map<string, MockCartItem[]>();
  items.forEach((it, idx) => {
    const productor = PRODUCTORES[modo === "demo" ? idx % PRODUCTORES.length : 0]!;
    const clave = `${productor.idProductor}::${productor.idMunicipio}`;
    const lista = porGrupo.get(clave) ?? [];
    lista.push(it);
    porGrupo.set(clave, lista);
  });

  let totalFlete = 0;
  let totalSobreflete = 0;
  let subtotalProductos = 0;

  for (const [clave, itemsOrigen] of porGrupo) {
    const idProductor = Number(clave.split("::")[0]);
    const origen = PRODUCTORES.find((p) => p.idProductor === idProductor)!;
    const jerarquia = Math.max(origen.jerarquia, destinoEntry.jerarquia);
    const tarifa = tarifaPorJerarquia(jerarquia);

    let pesoBruto = 0;
    let pesoFrio = 0;
    let subtotalGrupo = 0;

    const lineas: LineaCotizada[] = itemsOrigen.map((it) => {
      const peso = it.weightKg ?? PESO_POR_DEFECTO_KG;
      const precio = it.price ?? 0;
      const frio = modo === "demo" ? true : it.requiresCooling === true;
      const subtotal = precio * it.quantity;
      pesoBruto += peso * it.quantity;
      if (frio) pesoFrio += peso * it.quantity;
      subtotalGrupo += subtotal;
      return {
        id_producto: Number(it.id),
        nombre: it.name ?? `Producto ${it.id}`,
        cantidad: it.quantity,
        precio_unitario: money(precio),
        peso_unitario_kg: kilos(peso),
        subtotal: money(subtotal),
        requiere_frio: frio,
      };
    });

    const pesoFacturable = Math.ceil(pesoBruto);
    const kilosAdicionales = Math.max(0, pesoFacturable - 1);
    const flete = tarifa.inicial + kilosAdicionales * tarifa.adicional;
    const sobreflete = Math.max(tarifa.minimo, subtotalGrupo * PORCENTAJE_SOBREFLETE);
    const neveras = Math.ceil(pesoFrio / CAPACIDAD_NEVERA_KG);

    totalFlete += flete;
    totalSobreflete += sobreflete;
    subtotalProductos += subtotalGrupo;

    grupos.push({
      id_productor: origen.idProductor,
      productor: origen.nombre,
      id_municipio_origen: origen.idMunicipio,
      municipio_origen: origen.municipio,
      departamento_origen: origen.departamento,
      trayecto_aplicado: tarifa.codigo,
      jerarquia,
      // Los días salen de la tarifa aplicada, igual que el flete.
      entrega: { dias_min: tarifa.diasMin, dias_max: tarifa.diasMax },
      items: lineas,
      peso_bruto_kg: kilos(pesoBruto),
      peso_facturable_kg: pesoFacturable,
      kilos_adicionales: kilosAdicionales,
      subtotal: money(subtotalGrupo),
      valor_kilo_inicial: money(tarifa.inicial),
      valor_kilo_adicional: money(tarifa.adicional),
      flete: money(flete),
      sobreflete: money(sobreflete),
      peso_frio_kg: kilos(pesoFrio),
      neveras,
      total_grupo: money(subtotalGrupo + flete + sobreflete),
    });
  }

  // La promoción cubre el flete y nada más: el sobreflete es la garantía del producto y
  // siempre se cobra. El empaque refrigerado no se cobra: va incluido en el flete.
  const aplicada = subtotalProductos >= UMBRAL_PROMOCION;
  const descuento = aplicada ? totalFlete : 0;
  const envio = totalFlete + totalSobreflete - descuento;

  // El pedido está completo cuando llega el último paquete: los dos extremos son máximos.
  const entregaGlobal = {
    dias_min: Math.max(...grupos.map((g) => g.entrega.dias_min)),
    dias_max: Math.max(...grupos.map((g) => g.entrega.dias_max)),
  };

  return {
    destino: {
      id_municipio: destinoEntry.id_municipio,
      nombre: destinoEntry.nombre,
      departamento: destinoEntry.departamento,
      trayecto: destinoEntry.trayecto,
      jerarquia: destinoEntry.jerarquia,
    },
    grupos,
    entrega: entregaGlobal,
    promocion: { aplicada, umbral: money(UMBRAL_PROMOCION), descuento: money(descuento) },
    totales: {
      subtotal_productos: money(subtotalProductos),
      flete: money(totalFlete),
      sobreflete: money(totalSobreflete),
      descuento_envio: money(descuento),
      envio: money(envio),
      total: money(subtotalProductos + envio),
    },
    moneda: "COP",
    generado_en: new Date().toISOString(),
  };
}
