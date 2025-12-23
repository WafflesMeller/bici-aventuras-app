import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { DollarSign, Bike, ArrowRight, CheckCircle, Clock } from "lucide-react";
import { supabase } from '../supabase/client.js';
import { CircularLoading } from "respinner";

export default function Dashboard() {
  const [ventas, setVentas] = useState([]);
  const [stats, setStats] = useState({ totalBs: 0, totalUsd: 0, bicisHoy: 0 });
  const [loading, setLoading] = useState(true);

  // 1. Lógica Operativa: Cargar datos reales de Supabase
  const fetchDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('ventas-biciaventuras')
      .select('*')
      .gte('created_at', today)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVentas(data);
      
    // 1. Creamos un filtro intermedio
      const ventasConfirmadas = data.filter(v => v.pagado);

      // 2. Sumamos usando solo ese filtro
      const totalBs = ventasConfirmadas.reduce((acc, v) => acc + Number(v.monto_exacto_bs), 0);
      const totalUsd = ventasConfirmadas.reduce((acc, v) => acc + (Number(v.monto_exacto_bs) / Number(v.tasa_bcv || 1)), 0);
      const bicisHoy = ventasConfirmadas.reduce((acc, v) => acc + Number(v.cantidad_bicicletas), 0);
      
      setStats({ totalBs, totalUsd, bicisHoy });
    }
    setLoading(false);
  };

  // 2. Lógica Operativa: Suscripción Realtime
  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('cambios-ventas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas-biciaventuras' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return       <div className="min-h-screen flex items-center justify-center text-primary gap-2">
        <CircularLoading color="#00ff7f" size={80} />
      </div>;

  return (
    <div className="min-h-screen text-white mb-5">
      <Navbar />

      <div className="pt-24 px-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-6">
          Panel de Control
        </h1>

        {/* --- TARJETAS SUPERIORES (Estilo Original) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div>
              <p className="text-sm text-white/70">Generado hoy (Bs)</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {stats.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <span className="text-primary font-semibold text-3xl"> Bs</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div>
              <p className="text-sm text-white/70">Equivalente en USD</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {stats.totalUsd.toFixed(2)}
              </p>
            </div>
            <DollarSign className="text-primary" size={32} />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between col-span-1 sm:col-span-2 backdrop-blur-sm">
            <div>
              <p className="text-sm text-white/70">Bicicletas alquiladas hoy</p>
              <p className="text-2xl font-semibold text-white mt-1">{stats.bicisHoy}</p>
            </div>
            <Bike className="text-primary" size={32} />
          </div>
        </div>

        {/* --- TABLA DE ÚLTIMAS VENTAS (Estructura Original) --- */}
        <div className="mt-10 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4">Últimas ventas</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-white/70 border-b border-white/10">
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Monto</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>

              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id} className="border-b border-white/5">
                    <td className="py-2">
                        <div className="flex flex-col">
                            <span>{v.nombre_cliente}</span>
                            <span className="text-[10px] text-white/40 uppercase">{v.tiempo_alquiler} • {v.cantidad_bicicletas} bici(s)</span>
                        </div>
                    </td>
                    <td className="py-2 font-medium text-primary">Bs. {Number(v.monto_exacto_bs).toFixed(2)}</td>
                    <td className="py-2">
                      {v.pagado ? (
                        <CheckCircle size={18} className="text-green-400" />
                      ) : (
                        <Clock size={18} className="text-yellow-500 animate-pulse" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-4">
            <button className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition">
              Ver todas
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}