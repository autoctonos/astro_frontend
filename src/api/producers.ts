import { http } from "@/lib/http";
import { ProducersArraySchema } from "@/api/schemas/producers";
export type { Producer } from "@/api/schemas/producers";

export const fetchDepartamentos = async () => {
  const response = await fetch(`http://localhost:8000/api/productores/departamentos/`);
  return response.json();
};

export const fetchMunicipios = async (departamentoId: string | number) => {
  if (!departamentoId) return [];
  const response = await fetch(`http://localhost:8000/api/productores/municipios/?departamento_id=${departamentoId}`);
  return response.json();
};

export const fetchProductoresConImagenes = async (depId = "", muniId = "") => {
  let url = `http://localhost:8000/api/productores/`;
  if (muniId) {
    url += `?id_municipio=${muniId}`;
  } else if (depId) {
    url += `?departamento_id=${depId}`;
  }
  const response = await fetch(url);
  return response.json();
};