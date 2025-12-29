import React from "react";

export default function VentaCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm animate-pulse">
      <div className="w-full p-4">
        <div className="flex justify-between items-center gap-4">
          
          {/* LADO IZQUIERDO: Simulación de Nombre e Info */}
          <div className="flex flex-col gap-2 flex-1">
            
            {/* Fila 1: Círculo (Icono) + Barra (Nombre) */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/10 shrink-0" />
              <div className="h-5 w-32 sm:w-48 bg-white/10 rounded-md" />
            </div>

            {/* Fila 2: Tags (Ref, Cédula, Fecha) */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-4 w-16 bg-white/5 rounded-md" />
              <div className="h-4 w-20 bg-white/5 rounded-md" />
              <div className="h-4 w-14 bg-white/5 rounded-md opacity-70" />
            </div>
          </div>

          {/* LADO DERECHO: Simulación de Monto y Flecha */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Monto */}
            <div className="h-5 w-20 bg-white/10 rounded-md" />
            {/* Flecha */}
            <div className="h-5 w-5 bg-white/5 rounded-full" />
          </div>

        </div>
      </div>
    </div>
  );
}