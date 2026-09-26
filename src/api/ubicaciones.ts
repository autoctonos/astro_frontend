import { http } from "@/lib/http";

export const fetchDepartamentos = async () => {
    return http<unknown>("/api/locations/departamentos/");
};

export const fetchMunicipios = async (departamentoId: string | number) => {
    if (!departamentoId) return [];
    return http<unknown>(`/api/locations/municipios/?departamento_id=${departamentoId}`);
};
