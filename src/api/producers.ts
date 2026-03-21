import { http } from "@/lib/http";
export type { Producer } from "@/api/schemas/producers";

export const fetchDepartamentos = async () => {
  return http<unknown>("/api/productores/departamentos/");
};

export const fetchMunicipios = async (departamentoId: string | number) => {
  if (!departamentoId) return [];
  return http<unknown>(`/api/productores/municipios/?departamento_id=${departamentoId}`);
};

export const fetchProductoresConImagenes = async (depId = "", muniId = "") => {
  let path = "/api/productores/";
  if (muniId) {
    path += `?id_municipio=${muniId}`;
  } else if (depId) {
    path += `?departamento_id=${depId}`;
  }
  return http<unknown>(path);
};