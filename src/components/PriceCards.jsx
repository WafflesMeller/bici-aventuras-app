import React, { useEffect, useState } from "react";
import { Banknote, Clock, Bike } from "lucide-react";
import NumberFlow from "@number-flow/react";

export default function PriceCards() {
  const [tasa, setTasa] = useState(0);
  const [loading, setLoading] = useState(true);

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
        console.error("Error obteniendo tasa:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasa();
  }, []);

  // Si está cargando o la tasa es 0, mostramos esqueletos o 0
  const displayTasa = loading ? 0 : tasa;

  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      {/* CARD 1: TASA BCV */}
      <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center backdrop-blur-sm">
        <span className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
          <Banknote size={10} /> Tasa BCV
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-white tabular-nums">
            <NumberFlow
                locales="es-VE" 
              value={tasa}
              format={{
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </span>
          <span className="text-xs text-white/50">Bs</span>
        </div>
      </div>

      {/* CARD 2: PRECIO 10 MIN ($2) */}
      <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-white/10 px-1.5 py-0.5 rounded-bl-lg">
          <span className="text-xs font-bold text-white/70">2$</span>
        </div>
        <span className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
          <Clock size={10} /> 10 min
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-white tabular-nums">
            <NumberFlow
              locales="es-VE"
              value={tasa * 2}
              format={{
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </span>
          <span className="text-xs text-white/50">Bs</span>
        </div>
      </div>

      {/* CARD 3: PRECIO PASEO ($3) */}
      <div className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-white/10 px-1.5 py-0.5 rounded-bl-lg">
          <span className="text-xs font-bold text-white/70">3$</span>
        </div>
        <span className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
          <Clock size={10} /> 20 min
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-white tabular-nums">
            <NumberFlow
              locales="es-VE"
              value={tasa * 3}
              format={{
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </span>
          <span className="text-xs text-white/50">Bs</span>
        </div>
      </div>
    </div>
  );
}
