import React from "react";
import { FaCircleCheck } from "react-icons/fa6";
import {
  Hash,
  IdCard,
  Clock,
  Bike,
  Phone,
  Layers,
  Banknote,
  Smartphone,
  CalendarDays,
  DollarSign,
  ChevronDown,
} from "lucide-react";

// Helper de fecha (movido aquí porque es donde se usa)
const formatFecha = (date) =>
  new Intl.DateTimeFormat("es-VE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));

export default function VentaCard({ v, expandedId, setExpandedId }) {
  const isOpen = expandedId === v.id;

  // Helper para renderizar el método de pago
  const renderMetodoPago = (metodo) => {
    const m = (metodo || "").toLowerCase();

    // Caso BDV
    if (m.includes("bdv")) {
      return (
        <div className="flex items-center gap-2">
          <img
            src="/bdv-logo.webp"
            alt="BDV"
            className="w-5 h-5 object-contain rounded-full"
          />
          <span className="text-white/90">BDV</span>
        </div>
      );
    }

    // Caso Efectivo
    if (m === "efectivo") {
      return (
        <div className="flex items-center gap-2">
          <Banknote size={16} className="text-green-400" />
          <span className="text-white/90 uppercase">EFECTIVO</span>
        </div>
      );
    }

    // Caso Otros
    return (
      <div className="flex items-center gap-2">
        <Smartphone size={16} className="text-blue-400" />
        <span className="text-white/90 uppercase">{metodo || "OTROS"}</span>
      </div>
    );
  };

  return (
    <div
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
                <Clock className="text-yellow-400 shrink-0" size={18} />
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
                <CalendarDays size={12} /> {formatFecha(v.created_at)}
              </span>
            </div>
          </div>

          {/* LADO DERECHO: Monto y Flecha */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="font-bold text-white tracking-tight">
              {Number(v.monto_exacto_bs).toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
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
                    maximumFractionDigits: 2,
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
}