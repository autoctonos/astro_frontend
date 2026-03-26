import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { fetchProductoresConImagenes, fetchDepartamentos, fetchMunicipios } from "@/api/producers";

const PRODUCTOS_POR_PAGINA = 10;

export default function ProducersSection() {
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);

  const [depSeleccionado, setDepSeleccionado] = useState("");
  const [muniSeleccionado, setMuniSeleccionado] = useState("");

  const [productores, setProductores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const [paginaActual, setPaginaActual] = useState(1);


  useEffect(() => {
    fetchDepartamentos().then((data: any) => setDepartamentos(data?.results || data));
  }, []);

  useEffect(() => {
    if (depSeleccionado) {
      fetchMunicipios(depSeleccionado).then((data: any) => setMunicipios(data?.results || data));
    } else {
      setMunicipios([]);
    }
  }, [depSeleccionado]);

  const handleDepartamentoChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setDepSeleccionado(e.target.value);
    setMuniSeleccionado("");
  };
  useEffect(() => {
    setPaginaActual(1);
  }, [depSeleccionado, muniSeleccionado]);

  useEffect(() => {
    setLoading(true);
    fetchProductoresConImagenes(depSeleccionado, muniSeleccionado)
      .then((data: any) => {
        const datosReales = data?.results || data;
        setProductores(datosReales);
      })
      .catch((err) => console.error("Error al cargar:", err))
      .finally(() => setLoading(false));
  }, [depSeleccionado, muniSeleccionado]);

  const indiceUltimoProductor = paginaActual * PRODUCTOS_POR_PAGINA;
  const indicePrimerProductor = indiceUltimoProductor - PRODUCTOS_POR_PAGINA;
  const productoresPaginados = productores.slice(indicePrimerProductor, indiceUltimoProductor);
  const totalPaginas = Math.ceil(productores.length / PRODUCTOS_POR_PAGINA);

  return (
    <section className="py-24 px-4 md:px-8 w-full font-sans">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16 space-y-4">
          <span className="text-[#D48D66] text-xs font-bold tracking-[0.2em] uppercase block">
            Quienes nos respaldan
          </span>
          <h2 className="text-5xl md:text-6xl text-gray-900 font-serif font-bold tracking-tight mt-2">
            Nuestros Productores
          </h2>
          <div className="w-12 h-1 bg-[#E8C4A8] mx-auto rounded-full my-8"></div>
        </div>

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

        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando productores...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {productoresPaginados.length > 0 ? (
                productoresPaginados.map((item: any) => (
                  <article
                    key={item.id_productor}
                    className="group bg-white/60 backdrop-blur-md rounded-2xl p-8 text-center border border-white/50 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] hover:shadow-xl hover:bg-white/80 hover:-translate-y-2 transition-all duration-300 ease-in-out cursor-default"
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

            {/* 👇 Controles de Paginación */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center mt-16 space-x-4">
                <button
                  onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                  className="px-6 py-2 border border-gray-200 rounded-full text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition-all font-light text-sm"
                >
                  Anterior
                </button>

                <span className="text-gray-500 font-light text-sm px-4">
                  Página <span className="font-semibold text-gray-700">{paginaActual}</span> de {totalPaginas}
                </span>

                <button
                  onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-6 py-2 border border-[#E8C4A8] bg-[#FFFCF8] rounded-full text-[#D48D66] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#E8C4A8] hover:text-white transition-all font-medium text-sm shadow-sm"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
}