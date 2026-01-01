import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  Bike,
  ArrowRight,
  Clock,
  Banknote,
  ListTodo,
  HandCoins,
} from "lucide-react";
import { supabase } from "../supabase/client.js";
import { CircularLoading } from "respinner";
import { useNavigate } from "react-router-dom";
import { FaCircleCheck } from "react-icons/fa6";
import bdvLogo from "/bdv-logo.webp";
import NumberFlow from "@number-flow/react";
import PriceCards from "../components/PriceCards.jsx";

export default function Dashboard() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasa, setTasa] = useState(0);
  const [stats, setStats] = useState({
    totalBs: 0,
    totalUsd: 0,
    bicisHoy: 0,
    pendienteCobrar: 0,
    efectivoCaja: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // Agregado
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasa = async () => {
      try {
        const res = await fetch(
          "https://bici-aventuras-app.vercel.app/api/tasa?t=" + Date.now()
        );
        if (!res.ok) throw new Error("Error API");
        const data = await res.json();
        const precio = data.current?.usd || data.price || 0;
        if (precio > 0) setTasa(Number(precio));
      } catch (err) {
        console.error("Usando tasa base:", err);
      }
      // Nota: No ponemos setLoading(false) aquí para esperar a Supabase
    };
    fetchTasa();
  }, []);

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

    // 1. ELIMINAMOS .limit(5) para traer TODO lo de hoy y calcular bien
    const { data, error } = await supabase
      .from("ventas-biciaventuras")
      .select("*")
      .gte("created_at", today)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVentas(data);

      const ventasConfirmadas = data.filter((v) => v.pagado);
      const ventasPendientes = data.filter((v) => !v.pagado);
      const banco1 = data.filter((v) => !v.efectivo);

      // --- CÁLCULOS ---
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

      // Nuevos Cálculos
      const pendienteCobrar = ventasPendientes.reduce(
        (acc, v) => acc + Number(v.monto_exacto_bs),
        0
      );

      const efectivoCaja = ventasConfirmadas
        .filter(
          (v) => v.ult_4_ref === "EFECTIVO" || v.metodo_pago === "EFECTIVO"
        )
        .reduce((acc, v) => acc + Number(v.monto_exacto_bs), 0);

      const bancoCaja = banco1
        .filter(
          (v) =>
            v.ult_4_ref !== "EFECTIVO" &&
            v.metodo_pago !== "EFECTIVO" &&
            v.pagado === true
        )
        .reduce((acc, v) => acc + Number(v.monto_exacto_bs), 0);

      setStats({
        totalBs,
        totalUsd,
        bicisHoy,
        pendienteCobrar,
        efectivoCaja,
        bancoCaja,
      });
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

      <div className="pt-20 sticky top-0 z-40 backdrop-blur-xl ">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <h1 className="text-lg font-bold text-primary uppercase italic tracking-tighter">
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
      </div>

      <div className="px-4 mt-2 max-w-xl mx-auto">
        <PriceCards />
        {/* --- GRID DE TARJETAS NUEVO --- */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* 1. TOTAL GENERADO (Grande) */}
          <div className="col-span-2 bg-linear-to-r from-primary/20 to-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs text-primary/80 font-medium uppercase tracking-wider">
                Ingreso Total Hoy
              </p>
              <p className="text-3xl font-bold text-white">
                <NumberFlow
                  value={stats.totalBs}
                  duration={0.8}
                  locales="es-VE"
                  className="tabular-nums"
                  format={{
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                />

                <span className="text-sm font-normal text-white/50 ml-1">
                  Bs
                </span>
              </p>
              <p className="text-xs text-white/40 mt-1">
                ≈{" "}
                <NumberFlow
                  locales="en-US"
                  value={stats.totalUsd}
                  duration={0.8}
                  className="tabular-nums"
                  format={{
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                />{" "}
                USD
              </p>
            </div>
            <div className="bg-primary/20 p-3 rounded-full relative z-10">
              <Banknote className="text-primary" size={24} />
            </div>
          </div>

          {/* 2. BANCO (BDV) */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-white/60 uppercase font-bold">
                Banco (BDV)
              </p>
              <img
                src={bdvLogo}
                alt="BDV"
                className="w-4 h-4 object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <p className="text-lg font-semibold text-white">
              <NumberFlow
                value={stats.bancoCaja}
                duration={0.8}
                locales="es-VE"
                className="tabular-nums"
                format={{
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
              <span className="text-[10px] text-white/50 ml-1">Bs</span>
            </p>
          </div>

          {/* 3. EFECTIVO EN CAJA */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-white/60 uppercase font-bold">
                Efectivo
              </p>
              <HandCoins size={16} className="text-green-400" />
            </div>
            <p className="text-lg font-semibold text-white">
              <NumberFlow
                value={stats.efectivoCaja}
                duration={0.8}
                locales="es-VE"
                className="tabular-nums"
                format={{
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
              <span className="text-[10px] text-white/50 ml-1">Bs</span>
            </p>
          </div>

          {/* 4. PENDIENTE POR COBRAR */}
          <div className="bg-white/5 border border-red-500/30 rounded-xl p-3 flex flex-col justify-between backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-red-500/90 uppercase font-bold">
                Por verificar
              </p>
              <Clock size={16} className="text-red-500" />
            </div>
            <p className="text-lg font-semibold text-white">
              <NumberFlow
                value={stats.pendienteCobrar}
                duration={0.8}
                locales="es-VE"
                className="tabular-nums"
                format={{
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
              <span className="text-[10px] text-white/50 ml-1">Bs</span>
            </p>
          </div>

          {/* 5. BICIS ALQUILADAS */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-between backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] text-white/60 uppercase font-bold">
                Bicis alquiladas
              </p>
              <Bike size={16} className="text-blue-400" />
            </div>
            <p className="text-2xl font-semibold text-white">
              <NumberFlow
                value={stats.bicisHoy}
                duration={0.8}
                className="tabular-nums"
                format={{
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }}
              />
            </p>
          </div>
        </div>

        {/* --- TABLA DE ÚLTIMAS VENTAS (Estructura Original) --- */}
        <div className="mt-10 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm p-3.5">
          <h2 className="text-lg font-semibold mb-4 text-white/90">
            Últimas ventas
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden ">
            <table className="w-full text-sm text-center">
              {/* HEADER */}
              <thead className="border-white/10 rounded-t-xl backdrop-blur-md sticky top-0">
                <tr className="text-white/60 uppercase tracking-wider">
                  <th className="py-3 px-2 text-left font-medium">Cliente</th>
                  <th className="py-3 px-2 font-medium">bs</th>
                  <th className="py-3 px-2 font-medium">#</th>
                  <th className="py-3 px-2 font-medium">
                    <ListTodo size={17} />
                  </th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody className="divide-y divide-white/5">
                {ventas.length === 0 ? (
                  /* MENSAJE CUANDO NO HAY RESULTADOS */
                  <tr>
                    <td
                      colSpan={4}
                      className="py-3 text-center text-white/40 italic"
                    >
                      No hay ventas registradas hoy
                    </td>
                  </tr>
                ) : (
                  ventas.slice(0, 5).map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      {/* CLIENTE */}
                      <td className="py-3 px-2 text-left">
                        <div className="flex flex-col">
                          <span className="text-white/90">
                            {v.nombre_cliente}
                          </span>
                          <span className="text-[11px] text-white/40">
                            {v.tiempo_alquiler} • {v.cantidad_bicicletas}{" "}
                            {Number(v.cantidad_bicicletas) === 1
                              ? "Bici"
                              : "Bicis"}
                          </span>
                        </div>
                      </td>

                      {/* MONTO */}
                      <td className="py-3 px-2 text-white/80">
                        {Number(v.monto_exacto_bs).toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* REF */}
                      <td className="py-3 px-2">
                        {v.ult_4_ref === "EFECTIVO" ? (
                          <span className="inline-flex rounded-full text-white/80">
                            Efectivo
                          </span>
                        ) : (
                          <span className="text-white/80">{v.ult_4_ref}</span>
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
                    </tr>
                  ))
                )}
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
