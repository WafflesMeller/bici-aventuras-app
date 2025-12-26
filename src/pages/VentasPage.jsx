import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { ArrowLeft, CheckCircle, Clock, Bike, User, Hash } from "lucide-react"; // Añadido Hash
import { supabase } from "../supabase/client";
import { CircularLoading } from "respinner";
import { useNavigate } from "react-router-dom";

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchVentas = async () => {
    const { data } = await supabase
      .from("ventas-biciaventuras")
      .select("*")
      .order("created_at", { ascending: false });

    setVentas(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary animate-slide-in-right">
        <CircularLoading size={80} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white animate-slide-in-right">
      <Navbar />

      <div className="pt-24 px-4 max-w-xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6 animate-slide-in-left">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-semibold">Todas las ventas</h1>
        </div>

        {/* LISTA */}
        <div className="space-y-3">
          {ventas.map((v, i) => (
            <div
              key={v.id}
              onClick={() => navigate(`/ventas/${v.id}`)}
              style={{ animationDelay: `${i * 60}ms` }}
              className="
                bg-white/5 border border-white/10 rounded-xl p-4
                flex justify-between items-center
                cursor-pointer hover:bg-white/10 transition-all
                animate-slide-in-right
              "
            >
              <div className="flex flex-col">
                <span className="font-semibold flex items-center gap-2">
                  <User size={14} />
                  {v.nombre_cliente}
                </span>

                <span className="text-xs text-white/50 mt-1 flex items-center gap-2">
                  <Bike size={14} />
                  {v.cantidad_bicicletas} bici(s) • {v.tiempo_alquiler}
                </span>

                {/* --- CAMPO DE REFERENCIA / EFECTIVO --- */}
                <span className="text-[10px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                  <Hash size={12} className="text-primary" />
                  <span className={v.ult_4_ref === "EFECTIVO" ? "text-green-400" : "text-white/60"}>
                    {v.ult_4_ref === "EFECTIVO" ? "Efectivo" : `Ref: ${v.ult_4_ref}`}
                  </span>
                </span>

                <span className="text-[10px] text-white/30 mt-1">
                  {new Date(v.created_at).toLocaleString("es-VE", { timeZone: "America/Caracas" })}
                </span>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-primary font-bold">
                  Bs. {Number(v.monto_exacto_bs).toFixed(2)}
                </span>

                {v.pagado ? (
                  <CheckCircle className="text-green-400" size={18} />
                ) : (
                  <Clock className="text-yellow-500 animate-pulse" size={18} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}