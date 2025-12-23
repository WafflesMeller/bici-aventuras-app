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
  Clock
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

          <p className="flex items-center gap-2 text-xs text-white/50">
            <Clock /> {new Date(venta.created_at).toLocaleString("es-VE")}
          </p>

        </div>
      </div>
    </div>
  );
}
