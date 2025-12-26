import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import Navbar from "../components/Navbar";
import { FaCircleCheck } from "react-icons/fa6"; // Importamos el icono de Font Awesome 6

import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Hash,
  IdCard,
  Clock,
  User,
  Bike,
  Wallet,
} from "lucide-react";

const PAGE_SIZE = 10;

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
        `nombre_cliente.ilike.%${s}%,telefono_cliente.ilike.%${s}%,ult_4_ref.ilike.%${s}%`
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

  return (
    <div className="min-h-screen text-white pb-20">
      <Navbar />

      <div className="pt-20 sticky top-0 z-40 backdrop-blur bg-black/40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/60 hover:text-primary transition"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          <h1 className="text-lg font-bold text-primary uppercase tracking-tighter italic">
            Historial Biciaventuras
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* BUSCADOR (Igual al anterior) */}
        <div className="flex flex-wrap gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar cliente o referencia..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-primary transition"
            />
          </div>
          <div className="flex gap-2">
            <input type="date" value={desde} onChange={(e) => { setPage(1); setDesde(e.target.value); }} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
            <input type="date" value={hasta} onChange={(e) => { setPage(1); setHasta(e.target.value); }} className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          </div>
        </div>

        {/* LISTADO DE VENTAS */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10 opacity-40 animate-pulse">Cargando jornada...</div>
          ) : (
            ventas.map((v) => {
              const isOpen = expandedId === v.id;

              return (
                <div key={v.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm transition-all">
                  {/* HEADER DE LA CARD */}
                  <button
                    onClick={() => setExpandedId(isOpen ? null : v.id)}
                    className="w-full p-4 text-left hover:bg-white/5 transition"
                  >
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex flex-col gap-1 overflow-hidden flex-1">
                        {/* NOMBRE Y ESTADO */}
                        <div className="flex items-center gap-2 overflow-hidden">
                          {v.pagado ? (
                            <FaCircleCheck className="text-green-400 shrink-0" size={16} />
                          ) : (
                            <Clock className="text-yellow-400 shrink-0" size={16} />
                          )}
                          <span className="font-bold text-white/90 truncate text-sm">
                            {v.nombre_cliente.toUpperCase()}
                          </span>
                        </div>

                        {/* REF Y CÉDULA */}
                        <div className="flex items-center gap-3 text-[11px] text-white/50 font-mono">
                          <span className="flex items-center gap-1 text-primary/80">
                            <Hash size={12} /> {v.ult_4_ref}
                          </span>
                          <span className="flex items-center gap-1">
                            <IdCard size={12} /> {v.cedula_cliente}
                          </span>
                        </div>

                        {/* FECHA */}
                        <div className="text-[10px] text-white/30 italic">
                          {formatFecha(v.created_at)}
                        </div>
                      </div>

                      {/* MONTO Y CHEVRON */}
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-black text-white tracking-tighter">
                          Bs. {Number(v.monto_exacto_bs).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                        </span>
                        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : "text-white/20"}`} />
                      </div>
                    </div>
                  </button>

                  {/* CONTENIDO EXPANDIDO (LO DEMÁS ADENTRO) */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 border-t border-white/5" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="p-4 grid grid-cols-2 gap-4 text-xs bg-black/20">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-white/60">
                            <Wallet size={14} className="text-primary/60" />
                            <span className="font-medium text-white/80">{v.metodo_pago || "EFECTIVO"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/60">
                            <Bike size={14} className="text-primary/60" />
                            <span>{v.cantidad_bicicletas} Bici(s)</span>
                          </div>
                        </div>
                        <div className="space-y-3 text-right">
                          <div className="text-white/40 uppercase font-bold tracking-widest text-[9px]">Tiempo</div>
                          <div className="text-white/90 font-bold">{v.tiempo_alquiler || "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN (Igual al anterior) */}
        <div className="flex justify-center items-center gap-6 pt-4">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 transition">
            <ChevronLeft size={20} />
          </button>
          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Página {page} / {totalPages || 1}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 transition">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}