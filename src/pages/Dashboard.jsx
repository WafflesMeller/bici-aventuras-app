import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  DollarSign,
  Bike,
  ArrowRight,
  CheckCircle,
  Clock,
  CircleCheck,
  Banknote,
  Play, 
  Timer,
} from "lucide-react";
import { supabase } from "../supabase/client.js";
import { CircularLoading } from "respinner";
import { useNavigate } from "react-router-dom";
import { FaCircleCheck } from "react-icons/fa6";

// --- Lógica del Cronómetro ---
const parseDuracion = (texto) => {
  if (!texto) return 0;
  const numero = parseInt(texto.match(/\d+/)?.[0] || 0);
  if (texto.toLowerCase().includes("hora")) return numero * 60;
  return numero;
};

const CronometroVenta = ({ venta, onIniciar }) => {
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [estado, setEstado] = useState("pendiente");

  useEffect(() => {
    if (!venta.fecha_inicio_uso) {
      setEstado("pendiente");
      return;
    }
    const calcular = () => {
      const inicio = new Date(venta.fecha_inicio_uso).getTime();
      const minutos = parseDuracion(venta.tiempo_alquiler);
      const fin = inicio + (minutos * 60 * 1000);
      const diff = fin - new Date().getTime();

      if (diff <= 0) {
        setEstado("finalizado");
        setTiempoRestante("00:00");
      } else {
        setEstado("corriendo");
        const m = Math.floor((diff / 1000 / 60) << 0);
        const s = Math.floor((diff / 1000) % 60);
        setTiempoRestante(`${m}:${s.toString().padStart(2, "0")}`);
      }
    };
    calcular();
    const intervalo = setInterval(calcular, 1000);
    return () => clearInterval(intervalo);
  }, [venta.fecha_inicio_uso, venta.tiempo_alquiler]);

  if (!venta.pagado) return <span className="text-[10px] text-white/40">---</span>;
  if (estado === "pendiente") return <button onClick={() => onIniciar(venta.id)} className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold border border-green-500/50 flex items-center gap-1"><Play size={10} /> INICIAR</button>;
  if (estado === "finalizado") return <span className="text-red-500 font-bold text-xs">TIEMPO FIN</span>;
  
  return <div className="text-yellow-400 font-mono font-bold text-sm bg-yellow-400/10 px-1 py-1 rounded border border-yellow-400/20 animate-pulse flex gap-1 items-center justify-center"><Timer size={12}/> {tiempoRestante}</div>;
};

export default function Dashboard() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBs: 0, totalUsd: 0, bicisHoy: 0 });
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // Agregado
  const navigate = useNavigate();

  // --- Función para guardar inicio al cronometro ---
  const handleIniciarAlquiler = async (id) => {
    await supabase
      .from("ventas-biciaventuras")
      .update({ fecha_inicio_uso: new Date().toISOString() })
      .eq("id", id);
  };
  // ---- Lógica de Permisos de Notificación ---
  const pedirPermiso = async () => {
    const permiso = await Notification.requestPermission();
  };

  // 1. Lógica Operativa: Cargar datos reales de Supabase
  const fetchDashboardData = async () => {
    const now = new Date();
    const adjusted = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const today = `${adjusted.toLocaleDateString("en-CA", {
      timeZone: "America/Caracas",
    })}T06:00:00-04:00`;

    const { data, error } = await supabase
      .from("ventas-biciaventuras")
      .select("*")
      .gte("created_at", today)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setVentas(data);

      // 1. Creamos un filtro intermedio
      const ventasConfirmadas = data.filter((v) => v.pagado);

      // 2. Sumamos usando solo ese filtro
      const totalBs = ventasConfirmadas.reduce(
        (acc, v) => acc + Number(v.monto_exacto_bs),
        0
      );
      const totalUsd = ventasConfirmadas.reduce(
        (acc, v) => acc + Number(v.monto_exacto_bs) / Number(v.tasa_bcv || 1),
        0
      );
      const bicisHoy = ventasConfirmadas.reduce(
        (acc, v) => acc + Number(v.cantidad_bicicletas),
        0
      );

      setStats({ totalBs, totalUsd, bicisHoy });
    }
    setLoading(false);
  };

  /// 2. Lógica Operativa: Suscripción Realtime
  useEffect(() => {
    pedirPermiso();
    fetchDashboardData();

    const channel = supabase
      .channel("cambios-ventas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ventas-biciaventuras" },
        (payload) => {
          // 2.1. Recargar los datos de la tabla siempre
          fetchDashboardData();

          // 2.2. Lógica de Notificación: Si es una actualización y se marcó como pagado
          if (
            payload.eventType === "UPDATE" &&
            payload.new.pagado === true &&
            payload.old.pagado === false
          ) {
            // --- MEJORA PARA ANDROID: USAR SERVICE WORKER REGISTRATION ---
            if (Notification.permission === "granted") {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification("💰 ¡Venta Confirmada!", {
                  body: `Cliente: ${
                    payload.new.nombre_cliente
                  }\nMonto: Bs. ${Number(payload.new.monto_exacto_bs).toFixed(
                    2
                  )}`,
                  icon: "/icons/icon-192x192.png",
                  vibrate: [200, 100, 200],
                  tag: "venta-pagada",
                  renotify: true,
                });
              });

              // Sonido de caja registradora
              const audio = new Audio(
                "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"
              );
              audio
                .play()
                .catch(() => console.log("Audio en espera de interacción"));
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("live");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnectionStatus("error");
        } else {
          setConnectionStatus("connecting");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-primary gap-2">
        <CircularLoading color="#00ff7f" size={80} />
      </div>
    );

  return (
    <div className="min-h-screen mb-5">
      <Navbar />

      <div className="pt-24 px-4 max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-semibold text-white">
            Panel de Control
          </h1>

          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
              connectionStatus === "live"
                ? "bg-green-500/10 border-green-500/50 text-green-400"
                : connectionStatus === "connecting"
                ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500 animate-pulse"
                : "bg-red-500/10 border-red-500/50 text-red-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === "live"
                  ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            {connectionStatus === "live"
              ? "conectado"
              : connectionStatus === "connecting"
              ? "Conectando..."
              : "Sin conexión"}
          </div>
        </div>

        {/* --- TARJETAS SUPERIORES (Estilo Original) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div>
              <p className="text-sm text-white/70">Generado hoy (Bs)</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {stats.totalBs.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
              <p className="text-2xl font-semibold text-white mt-1">
                {stats.bicisHoy}
              </p>
            </div>
            <Bike className="text-primary" size={32} />
          </div>
        </div>

        {/* --- TABLA DE ÚLTIMAS VENTAS (Estructura Original) --- */}
        <div className="mt-10 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4 text-white/90">
            Últimas ventas
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden ">
            <table className="w-full text-sm text-center">
              {/* HEADER */}
              <thead className="border-white/10 rounded-t-xl backdrop-blur-md sticky top-0">
                <tr className="text-white/60 uppercase tracking-wider">
                  <th className="py-3 px-2 text-left font-medium">Cliente</th>
                  <th className="py-3 px-2 font-medium">Monto</th>
                  <th className="py-3 px-2 font-medium">Ref</th>
                  <th className="py-3 px-2 font-medium">Estado</th>
                  <th className="py-3 px-2 font-medium">Tiempo</th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody className="divide-y divide-white/5">
                {ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    {/* CLIENTE */}
                    <td className="py-3 px-2 text-left">
                      <div className="flex flex-col">
                        <span className="text-white/90">
                          {v.nombre_cliente}
                        </span>
                        <span className="text-[11px] text-white/40">
                          {v.tiempo_alquiler} • {v.cantidad_bicicletas} bici(s)
                        </span>
                      </div>
                    </td>

                    {/* MONTO */}
                    <td className="py-3 px-2 font-medium text-white/80">
                      Bs.{" "}
                      {Number(v.monto_exacto_bs).toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* REF */}
                    <td className="py-3 px-2">
                      {v.ult_4_ref === "EFECTIVO" ? (
                        <span className="inline-flex rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          Efectivo
                        </span>
                      ) : (
                        <span className="font-mono text-white/80">
                          #{v.ult_4_ref}
                        </span>
                      )}
                    </td>

                    {/* ESTADO */}
                    <td className="py-3 px-2">
                      {v.pagado ? (
                        <FaCircleCheck
                          size={16}
                          className="text-green-400 mx-auto"
                        />
                      ) : (
                        <Clock
                          size={16}
                          className="text-red-500 animate-pulse mx-auto"
                        />
                      )}
                    </td>

                    {/* TIEMPO */}
                    <td className="py-3 px-2">
                        <div className="flex justify-center">
                            <CronometroVenta venta={v} onIniciar={handleIniciarAlquiler} />
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="flex justify-center mt-5">
            <button
              onClick={() => navigate("/ventas")}
              className="flex items-center gap-2 bg-primary/90 hover:bg-primary text-black px-4 py-2 rounded-lg font-semibold transition"
            >
              Ver todas
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
