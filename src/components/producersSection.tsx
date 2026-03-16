import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { fetchProductoresConImagenes, fetchDepartamentos, fetchMunicipios } from "@/api/producers";

export default function ProducersSection() {
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);

  const [depSeleccionado, setDepSeleccionado] = useState("");
  const [muniSeleccionado, setMuniSeleccionado] = useState("");

  const [productores, setProductores] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar Departamentos
  useEffect(() => {
    fetchDepartamentos().then(data => setDepartamentos(data.results || data));
  }, []);

  // 2. Cargar Municipios según el Departamento
  useEffect(() => {
    if (depSeleccionado) {
      fetchMunicipios(depSeleccionado).then(data => setMunicipios(data.results || data));
    } else {
      setMunicipios([]);
    }
  }, [depSeleccionado]);

  // Manejador del select de Departamentos
  const handleDepartamentoChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setDepSeleccionado(e.target.value);
    setMuniSeleccionado("");
  };

  // 3. Consultar productores
  useEffect(() => {
    setLoading(true);
    fetchProductoresConImagenes(depSeleccionado, muniSeleccionado)
      .then((data) => {
        const datosReales = data.results || data;
        setProductores(datosReales);
      })
      .catch((err) => console.error("Error al cargar:", err))
      .finally(() => setLoading(false));
  }, [depSeleccionado, muniSeleccionado]);

  return (
    <section className="py-24 px-4 md:px-8 w-full font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Títulos */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-[#D48D66] text-xs font-bold tracking-[0.2em] uppercase block">
            Quienes nos respaldan
          </span>
          <h2 className="text-5xl md:text-6xl text-gray-900 font-serif font-bold tracking-tight mt-2">
            Nuestros Productores
          </h2>
          <div className="w-12 h-1 bg-[#E8C4A8] mx-auto rounded-full my-8"></div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-16 max-w-2xl mx-auto">
          <div className="relative w-full md:w-1/2">
            <select
              value={depSeleccionado}
              onChange={handleDepartamentoChange}
              className="block w-full appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-full leading-tight focus:outline-none focus:ring-2 focus:ring-[#D48D66] focus:border-transparent shadow-sm transition-all cursor-pointer font-light"
            >
              <option value="">Todos los Departamentos</option>
              {departamentos.map((dep: any) => (
                <option key={dep.id_departamento} value={dep.id_departamento}>
                  {dep.nombre}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>

          <div className="relative w-full md:w-1/2">
            <select
              value={muniSeleccionado}
              onChange={(e) => setMuniSeleccionado(e.target.value)}
              disabled={!depSeleccionado}
              className={`block w-full appearance-none border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-full leading-tight focus:outline-none focus:ring-2 focus:ring-[#D48D66] shadow-sm transition-all cursor-pointer font-light ${!depSeleccionado ? 'bg-gray-100 opacity-50 cursor-not-allowed' : 'bg-white'}`}
            >
              <option value="">Todas las Ciudades</option>
              {municipios.map((muni: any) => (
                <option key={muni.id_municipio} value={muni.id_municipio}>
                  {muni.nombre}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
        </div>

        {/* 👇 ESTA ES LA PARTE QUE FALTABA: EL RENDERIZADO DE LOS PRODUCTORES 👇 */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando productores...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {productores.length > 0 ? (
              productores.map((item: any) => (
                <article
                  key={item.id_productor}
                  className="group bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 ease-in-out cursor-default"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-[#FFFCF8] transition-colors relative overflow-hidden">
                    {item.imagen ? (
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 font-serif font-bold text-xl uppercase">
                        {item.nombre.charAt(0)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">
                    {item.nombre}
                  </h3>

                  {item.ubicacion && (
                    <p className="text-[#D48D66] text-xs font-semibold uppercase tracking-wider mb-3">
                      📍 {item.ubicacion}
                    </p>
                  )}

                  <p className="text-gray-500 text-sm leading-relaxed font-light">
                    {item.descripcion}
                  </p>
                </article>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 font-light">
                No hay productores registrados en esta ubicación.
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}