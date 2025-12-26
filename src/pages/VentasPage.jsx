import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import Navbar from "../components/Navbar";
import { FaCircleCheck } from "react-icons/fa6"; // Requiere: npm install react-icons

import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Hash,
  IdCard,
  Clock,
  Bike,
  Phone,
  Layers,
  Banknote, // Icono para Efectivo
  Smartphone, // Icono para Otros
  CalendarDays,
  DollarSign, // Icono para Fecha
} from "lucide-react";
import { CircularLoading } from "respinner";

const PAGE_SIZE = 10;

// Formato de fecha limpio (sin cursivas)
const formatFecha = (date) =>
  new Intl.DateTimeFormat("es-VE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));

export default function VentasPage() {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const t = setTimeout(fetchVentas, 300);
    return () => clearTimeout(t);
  }, [page, desde, hasta, search]);

  const fetchVentas = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("ventas-biciaventuras")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

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
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Helper para renderizar el método de pago según tu lógica
  const renderMetodoPago = (metodo) => {
    const m = (metodo || "").toLowerCase();

    // Caso BDV: Logo específico + Mayúsculas
    if (m.includes("bdv")) {
      return (
        <div className="flex items-center gap-2">
          <img
            src="/bdv-logo.webp"
            alt="BDV"
            className="w-5 h-5 object-contain rounded-full" // Pequeño fondo por si el logo es png transparente
          />
          <span className="text-white/90">BDV</span>
        </div>
      );
    }

    // Caso Efectivo: Icono Billete
    if (m === "efectivo") {
      return (
        <div className="flex items-center gap-2">
          <Banknote size={16} className="text-green-400" />
          <span className="text-white/90 uppercase">EFECTIVO</span>
        </div>
      );
    }

    // Caso Otros: Icono Smartphone
    return (
      <div className="flex items-center gap-2">
        <Smartphone size={16} className="text-blue-400" />
        <span className="text-white/90 uppercase">
          {metodo || "OTROS"}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white pb-20">
      <Navbar />
      {/* HEADER FIJO */}
      <div className="pt-20 sticky top-0 z-40 backdrop-blur-xs ">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-primary transition"
          >
            <ArrowLeft size={18} />
            <span className="">Volver</span>
          </button>
          <h1 className="text-lg font-bold text-primary uppercase tracking-tight">
            Historial de Ventas
          </h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4 space-y-6 animate-fade-in">
        {/* BUSCADOR */}
{/* BUSCADOR Y FILTROS */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-xl flex flex-col gap-4">
          
          {/* BARRA DE BÚSQUEDA (Full Width) */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors duration-300">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar cliente, cédula o referencia..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full bg-black/20 border border-white/10 rounded-2xl pl-11 pr-4 h-14 text-base text-white placeholder:text-white/30 focus:border-primary/50 focus:bg-black/40 focus:ring-1 focus:ring-primary/20 transition-all outline-none"
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
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 h-11 text-sm text-white focus:border-primary/50 focus:bg-black/40 transition-all outline-none appearance-none min-h-[44px]"
                  style={{ colorScheme: "dark" }} // Fuerza el calendario oscuro en el navegador
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
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 h-11 text-sm text-white focus:border-primary/50 focus:bg-black/40 transition-all outline-none appearance-none min-h-[44px]"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
            
          </div>
        </div>

        {/* LISTADO DE VENTAS */}
        <div className="space-y-3">
          {loading ? (
            <div className="min-h-screen flex items-center justify-center text-primary gap-2">
              <CircularLoading color="#00ff7f" size={80} />
            </div>
          ) : (
            ventas.map((v) => {
              const isOpen = expandedId === v.id;

              return (
                <div
                  key={v.id}
                  className={`bg-white/5 border rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 shadow-sm
                    ${
                      isOpen
                        ? "border-primary/30 bg-white/10"
                        : "border-white/10 hover:bg-white/10"
                    }
                  `}
                >
                  {/* HEADER DE LA TARJETA (Siempre visible) */}
                  <button
                    onClick={() => setExpandedId(isOpen ? null : v.id)}
                    className="w-full p-4 text-left transition-colors"
                  >
                    <div className="flex justify-between items-center gap-4">
                      {/* LADO IZQUIERDO: Nombre e Info Clave */}
                      <div className="flex flex-col gap-1 overflow-hidden flex-1">
                        {/* Fila 1: Estado + Nombre */}
                        <div className="flex items-center gap-2 overflow-hidden">
                          {v.pagado ? (
                            <FaCircleCheck
                              className="text-green-400 shrink-0"
                              size={18}
                            />
                          ) : (
                            <Clock
                              className="text-yellow-400 shrink-0"
                              size={18}
                            />
                          )}
                          <span className="font-bold text-white text-base truncate tracking-tight">
                            {v.nombre_cliente.toUpperCase()}
                          </span>
                        </div>

                        {/* Fila 2: Ref, Cédula y Fecha */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/60 ">
                          <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-primary border border-white/5">
                            <Hash size={10} /> {v.ult_4_ref || "---"}
                          </span>
                          <span className="flex items-center gap-1">
                            <IdCard size={12} /> {v.cedula_cliente}
                          </span>
                          <span className="flex items-center gap-1 opacity-70">
                            <CalendarDays size={12} />{" "}
                            {formatFecha(v.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* LADO DERECHO: Monto y Flecha */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-bold text-white tracking-tight">
                          {Number(v.monto_exacto_bs).toLocaleString("es-VE", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          Bs
                        </span>
                        <ChevronDown
                          size={20}
                          className={`transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-primary" : "text-white/30"
                          }`}
                        />
                      </div>
                    </div>
                  </button>

                  {/* CONTENIDO DESPLEGABLE (Datos Detallados) */}
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100 border-t border-white/10"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden bg-black/20">
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 text-xs">
                        {/* COLUMNA 1: Financiero y Contacto */}
                        <div className="space-y-4">
                          {/* Método de Pago Personalizado */}
                          <div className="flex flex-col gap-1">
                            <span className="text-white/40 uppercase font-bold tracking-widest text-[9px]">
                              Método de Pago
                            </span>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5 w-fit">
                              {renderMetodoPago(v.metodo_pago)}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-white/40 uppercase font-bold tracking-widest text-[9px]">
                              Referencia Completa
                            </span>
                            <div className="flex items-center gap-2 text-white/90 font-mono text-xs select-all">
                              <Layers size={14} className="text-primary/50" />
                              {v.referencia_pago || "No registrada"}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-white/40 uppercase font-bold tracking-widest text-[9px]">
                              Teléfono Contacto
                            </span>
                            <div className="flex items-center gap-2 text-white/90 ">
                              <Phone size={14} className="text-primary/50" />
                              {v.telefono_cliente || "Sin número"}
                            </div>
                          </div>
                        </div>

                        {/* COLUMNA 2: Detalles del Alquiler */}
                        <div className="space-y-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-white/40 uppercase font-bold tracking-widest text-[9px]">
                              Alquiler
                            </span>
                            <div className="flex items-center gap-2 text-white/90 text-sm">
                              <Bike size={16} className="text-primary/50" />
                              {v.cantidad_bicicletas} Bicicleta
                              {v.cantidad_bicicletas > 1 ? "s" : ""}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-white/40 uppercase font-bold tracking-widest text-[9px]">
                              Duración
                            </span>
                            <div className="flex items-center gap-2 text-white/90">
                              <Clock size={14} className="text-primary/50" />
                              {v.tiempo_alquiler || "Tiempo indefinido"}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-white/40 uppercase font-bold tracking-widest text-[9px]">
                              Tasa de Cambio (BCV)
                            </span>
                            <div className="flex items-center gap-2 text-white/90">
                              <DollarSign size={14} className="text-primary/50" />
                              {Number(v.tasa_bcv || 0).toLocaleString("es-VE", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              Bs
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN */}
        <div className="flex justify-center items-center gap-6 pt-4 pb-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 transition shadow-sm border border-white/5"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
            Página <span className="text-white">{page}</span> /{" "}
            {totalPages || 1}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 transition shadow-sm border border-white/5"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
