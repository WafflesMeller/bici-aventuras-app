import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import Navbar from "../components/Navbar";
import VentaCard from "../components/VentaCard";
import NumberFlow from "@number-flow/react"; // Asegúrate de tener esto instalado

import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Banknote,
  HandCoins,
  Clock,
  Bike,
} from "lucide-react";
import { CircularLoading } from "respinner";
import SearchForm from "../components/SearchForm";
import VentaCardSkeleton from "../components/VentaCardSkeleton";

// Placeholder para el logo BDV si no lo tienes importado globalmente
const bdvLogo = "/bdv-logo.webp";

const PAGE_SIZE = 10;

export default function VentasPage() {
  const navigate = useNavigate();

  // Estados de Datos
  const [ventas, setVentas] = useState([]);
  const [stats, setStats] = useState({
    totalBs: 0,
    totalUsd: 0,
    bancoCaja: 0,
    efectivoCaja: 0,
    pendienteCobrar: 0,
    bicisHoy: 0,
  });

  // Estados de UI y Filtros
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Efecto único para recargar datos cuando cambian los filtros
  useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(t);
  }, [page, desde, hasta, search]);

  // Función Maestra que llama a la lista y a las estadísticas
  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchVentasList(), fetchStats()]);
    setLoading(false);
  };

  // 1. Obtener Lista Paginada (Para las tarjetas de abajo)
  const fetchVentasList = async () => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("ventas-biciaventuras")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    // Aplicar Filtros
    if (desde) query = query.gte("created_at", desde);
    if (hasta) query = query.lte("created_at", `${hasta}T23:59:59`);
    if (search.trim()) {
      const s = search.trim();
      query = query.or(
        `nombre_cliente.ilike.%${s}%,telefono_cliente.ilike.%${s}%,ult_4_ref.ilike.%${s}%,cedula_cliente.ilike.%${s}%`
      );
    }

    const { data, error, count } = await query;
    if (!error) {
      setVentas(data || []);
      setTotalCount(count || 0);
    }
  };

  // 2. Obtener Estadísticas Globales (Basadas en el filtro actual, SIN paginación)
  const fetchStats = async () => {
    // Seleccionamos solo las columnas necesarias para calcular sumas (optimización)
    let query = supabase
      .from("ventas-biciaventuras")
      .select(
        "monto_exacto_bs, tasa_bcv, pagado, ult_4_ref, metodo_pago, cantidad_bicicletas"
      );

    // Aplicar EXACTAMENTE los mismos filtros que arriba
    if (desde) query = query.gte("created_at", desde);
    if (hasta) query = query.lte("created_at", `${hasta}T23:59:59`);
    if (search.trim()) {
      const s = search.trim();
      query = query.or(
        `nombre_cliente.ilike.%${s}%,telefono_cliente.ilike.%${s}%,ult_4_ref.ilike.%${s}%,cedula_cliente.ilike.%${s}%`
      );
    }

    const { data, error } = await query;

    if (!error && data) {
      const ventasConfirmadas = data.filter((v) => v.pagado);
      const ventasPendientes = data.filter((v) => !v.pagado);

      // Cálculos
      const totalBs = ventasConfirmadas.reduce(
        (acc, v) => acc + Number(v.monto_exacto_bs),
        0
      );

      const totalUsd = ventasConfirmadas.reduce(
        (acc, v) => acc + Number(v.monto_exacto_bs) / Number(v.tasa_bcv || 1),
        0
      );

      const bancoCaja = ventasConfirmadas
        .filter(
          (v) =>
            v.ult_4_ref !== "EFECTIVO" &&
            v.metodo_pago !== "EFECTIVO" &&
            v.pagado === true
        )
        .reduce((acc, v) => acc + Number(v.monto_exacto_bs), 0);

      const efectivoCaja = ventasConfirmadas
        .filter(
          (v) => v.ult_4_ref === "EFECTIVO" || v.metodo_pago === "EFECTIVO"
        )
        .reduce((acc, v) => acc + Number(v.monto_exacto_bs), 0);

      const pendienteCobrar = ventasPendientes.reduce(
        (acc, v) => acc + Number(v.monto_exacto_bs),
        0
      );

      const bicisHoy = ventasConfirmadas.reduce(
        (acc, v) => acc + Number(v.cantidad_bicicletas),
        0
      );

      setStats({
        totalBs,
        totalUsd,
        bancoCaja,
        efectivoCaja,
        pendienteCobrar,
        bicisHoy,
      });
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      {/* HEADER FIJO */}
      <div className="pt-20 sticky top-0 z-40 backdrop-blur-xl ">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-primary transition group"
          >
            <ChevronLeft
              size={20}
              className="group-hover:scale-110 transition-transform duration-200"
            />
            <h1 className="text-lg font-bold text-primary uppercase tracking-tight">
              Historial de Ventas
            </h1>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6 animate-fade-in">
        {/* BUSCADOR Y FILTROS */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-xl flex flex-col gap-4">
          {/* BARRA DE BÚSQUEDA (Full Width) */}
          <div className="relative group">
            <SearchForm
              loading={loading}
              search={search}
              setSearch={(value) => {
                setPage(1); // Mantenemos la lógica de resetear página al escribir
                setSearch(value);
              }}
              handleSearch={fetchData} // Permite buscar con ENTER
            />
          </div>

          {/* FILTROS DE FECHA (Grid 2 columnas) */}
          <div className="grid grid-cols-2 gap-3">
            {/* INPUT: DESDE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1 flex items-center gap-1">
                <CalendarDays size={10} /> Desde
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => {
                    setPage(1);
                    setDesde(e.target.value);
                  }}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 h-11 text-sm text-white focus:border-primary/50 focus:bg-black/40 transition-all outline-none appearance-none min-h-11"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* INPUT: HASTA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1 flex items-center gap-1">
                <CalendarDays size={10} /> Hasta
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => {
                    setPage(1);
                    setHasta(e.target.value);
                  }}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 h-11 text-sm text-white focus:border-primary/50 focus:bg-black/40 transition-all outline-none appearance-none min-h-11"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- GRID DE ESTADÍSTICAS (Actualizado con filtros) --- */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. TOTAL GENERADO (Grande) */}
          <div className="col-span-2 bg-linear-to-r from-primary/20 to-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs text-primary/80 font-medium uppercase tracking-wider">
                Ingreso Total
              </p>
              <div className="flex items-baseline gap-1 mt-1">
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
                </p>
                <span className="text-sm font-normal text-white/50">Bs</span>
              </div>
              <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                ≈
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
                />
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

        {/* LISTADO DE VENTAS */}
        <div className="space-y-3">
          {loading ? (
            // Muestra 5 skeletons mientras carga
            <>
              {[...Array(10)].map((_, i) => (
                <VentaCardSkeleton key={i} />
              ))}
            </>
          ) : (
            ventas.map((v) => (
              <VentaCard
                key={v.id}
                v={v}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            ))
          )}
        </div>

        {/* PAGINACIÓN MEJORADA */}
        <div className="flex justify-center mb-6 pt-2">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl">
            {/* Botón Anterior */}
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className={`
                h-10 w-10 flex items-center justify-center rounded-full border border-white/5 transition-all duration-300
                ${
                  page === 1
                    ? "opacity-30 cursor-not-allowed bg-transparent"
                    : "bg-white/10 hover:bg-white/20 hover:text-white hover:border-white/30 active:scale-90"
                }
              `}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Texto Central */}
            <div className="flex flex-col items-center px-2">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mb-0.5">
                Página
              </span>
              <div className="flex items-baseline gap-1 text-sm font-medium text-white/60">
                <span className="text-white font-bold text-lg">{page}</span>
                <span className="opacity-40">/</span>
                <span>{totalPages || 1}</span>
              </div>
            </div>

            {/* Botón Siguiente */}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={`
                h-10 w-10 flex items-center justify-center rounded-full border border-white/5 transition-all duration-300
                ${
                  page >= totalPages
                    ? "opacity-30 cursor-not-allowed bg-transparent"
                    : "bg-white/10 hover:bg-white/20 hover:text-white hover:border-white/30 active:scale-90"
                }
              `}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
