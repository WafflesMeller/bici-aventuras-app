import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { supabase } from "../supabase/client";
import {
  ArrowLeft,
  Bike,
  DollarSign,
  User,
  Phone,
  IdCard,
  Clock,
  Hash,      // Icono para la referencia
  CheckCircle, // Icono para estado pagado
  AlertCircle  // Icono para estado pendiente
} from "lucide-react";
import { CircularLoading } from "respinner";

export default function VentaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);

  useEffect(() => {
    const fetchVenta = async () => {
      const { data } = await supabase
        .from("ventas-biciaventuras")
        .select("*")
        .eq("id", id)
        .single();

      setVenta(data);
    };

    fetchVenta();
  }, [id]);

  if (!venta) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary animate-slide-in-right">
        <CircularLoading size={80} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white animate-slide-in-right">
      <Navbar />

      <div className="pt-24 px-4 max-w-xl mx-auto space-y-4">
        {/* VOLVER */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white animate-slide-in-left"
        >
          <ArrowLeft /> Volver
        </button>

        {/* CARD DETALLE */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3 animate-slide-in-right">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User /> {venta.nombre_cliente}
          </h2>

          <p className="flex items-center gap-2 text-sm text-white/70">
            <IdCard /> Cédula: {venta.cedula_cliente}
          </p>

          <p className="flex items-center gap-2 text-sm text-white/70">
            <Phone /> Teléfono: {venta.telefono_cliente}
          </p>

          <div className="h-px bg-white/10 my-2" />

          <p className="flex items-center gap-2">
            <Bike /> {venta.cantidad_bicicletas} bicicletas • {venta.tiempo_alquiler}
          </p>

          <p className="flex items-center gap-2">
            <DollarSign /> Bs. {Number(venta.monto_exacto_bs).toFixed(2)}
          </p>

          {/* --- BLOQUE DE REFERENCIA Y ESTADO --- */}
          <div className={`mt-4 p-3 rounded-lg border ${venta.pagado ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
            <p className="text-[10px] uppercase font-bold tracking-widest mb-1 flex items-center gap-2">
              {venta.pagado ? (
                <><CheckCircle size={14} className="text-green-400" /> Pago Confirmado</>
              ) : (
                <><AlertCircle size={14} className="text-yellow-500 animate-pulse" /> Pendiente de Conciliación</>
              )}
            </p>
            
            <p className="flex items-center gap-2 text-sm">
              <Hash size={16} className="text-white/40" />
              <span className="text-white/60">Referencia:</span>
              <span className="font-mono font-medium text-white">
                {venta.referencia_pago || `${venta.ult_4_ref} (Esperando banco...)`}
              </span>
            </p>
          </div>

          <div className="h-px bg-white/10 my-2" />

          <p className="flex items-center gap-2 text-xs text-white/50">
            <Clock /> 
            {/* Usando hora de Caracas para consistencia */}
            {new Date(venta.created_at).toLocaleString("es-VE", { timeZone: "America/Caracas" })}
          </p>
        </div>
      </div>
    </div>
  );
}