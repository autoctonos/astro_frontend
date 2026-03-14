import { useQuery } from "@/hooks/useQuery"; // Asumo que este hook devuelve { data, loading, error } o directamente la data
import { fetchProductoresConImagenes } from "@/api/producers";

export default function ProducersSection() {

  const { data: productores = [], loading } = useQuery(fetchProductoresConImagenes);
  


  if (loading) return <div className="text-center py-20">Cargando productores...</div>;

  return (
    <section className="py-24 px-4 md:px-8 w-full font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-20 space-y-4">
          <span className="text-[#D48D66] text-xs font-bold tracking-[0.2em] uppercase block">
            Quienes nos respaldan
          </span>
          
          <h2 className="text-5xl md:text-6xl text-gray-900 font-serif font-bold tracking-tight mt-2">
            Nuestros Productores
          </h2>
          
          <div className="w-12 h-1 bg-[#E8C4A8] mx-auto rounded-full my-8"></div>
          
          <p className="text-gray-500 max-w-2xl mx-auto text-lg font-light leading-relaxed">
            Trabajamos de la mano con productores artesanales que comparten nuestra pasión por la calidad, la tradición y el respeto por la tierra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {productores?.map((item: any) => (
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

              {/* 4. Usamos item.nombre en lugar de producer.name */}
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-3">
                {item.nombre}
              </h3>
              
              {/* 5. Usamos item.descripcion en lugar de producer.description */}
              <p className="text-gray-500 text-sm leading-relaxed font-light">
                {item.descripcion}
              </p>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};