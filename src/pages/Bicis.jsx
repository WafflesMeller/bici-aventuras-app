import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import { Bike, Timer, Trash2, AlertCircle, PlayCircle, Plus, CheckCircle2 } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { showToast } from "../components/ToastNotification";

const BICIS_ORIGINALES = [
  "Consentida", "mini Gaby", "Gaby", 
  "1", "2", "3", "4", "5", 
  "6", "7", "8", "9", "10", 
  "11", "12", "13"
];

// --- COMPONENTE TARJETA MEJORADO ---
const BiciCard = ({ bici, info, now, onIniciar, onTerminar, onAgregar }) => {
  const ocupada = !!info;
  const tiempoAgotado = ocupada && now > info.fin;

  const getTiempoRestante = (fin) => {
    const restante = fin - now;
    if (restante <= 0) return "00:00";
    const min = Math.floor(restante / 60000);
    const sec = Math.floor((restante % 60000) / 1000);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Cálculo del progreso (0 a 1) para escalar el fondo
  const progreso = ocupada && !tiempoAgotado 
    ? Math.max(0, ((now - info.inicio) / (info.fin - info.inicio))) 
    : 0;

  return (
    <div
      className={`
        relative rounded-3xl overflow-hidden border transition-all duration-300 transform animate-fade-in-up
        ${!ocupada 
          ? "bg-white/5 border-white/10 hover:border-white/30" 
          : tiempoAgotado
            ? "bg-red-950/30 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
            : "border-primary shadow-[0_0_15px_rgba(0,255,127,0.15)]"
        }
      `}
    >
      {/* --- FONDO DINÁMICO (LA BARRA DE PROGRESO ES ESTO AHORA) --- */}
      {ocupada && !tiempoAgotado && (
        <div 
          className="absolute inset-0 bg-primary/20 z-0 origin-left transition-transform duration-1000 ease-linear pointer-events-none"
          style={{ 
            transform: `scaleX(${progreso})` 
          }}
        />
      )}

      {/* --- CONTENIDO (z-10 para estar encima del fondo) --- */}
      <div className="relative z-10 p-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full transition-colors ${ocupada ? (tiempoAgotado ? "bg-red-500 text-black" : "bg-primary text-black") : "bg-white/15 text-white/50"}`}>
              <Bike size={14} strokeWidth={2.5} />
            </div>
            <span className={`font-black text-base tracking-tight ${ocupada ? "text-white" : "text-white/60"}`}>
              {bici}
            </span>
          </div>
          
          {ocupada && (
            <button 
              onClick={() => onTerminar(bici)}
              className="p-2 -mr-2 -mt-2 text-white/40 hover:text-red-500 transition-colors bg-black/20 rounded-full"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* CUERPO */}
        <div>
          {!ocupada ? (
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onIniciar(bici, 10)}
                className="py-2.5 bg-white/5 active:bg-primary active:text-black border border-white/10 rounded-xl text-xs font-bold transition-colors flex flex-col items-center gap-1"
              >
                <Timer size={14} className="opacity-50" /> 
                10m
              </button>
              <button 
                onClick={() => onIniciar(bici, 20)}
                className="py-2.5 bg-white/5 active:bg-primary active:text-black border border-white/10 rounded-xl text-xs font-bold transition-colors flex flex-col items-center gap-1"
              >
                <Timer size={14} className="opacity-50" /> 
                20m
              </button>
            </div>
          ) : (
            <div className="text-center pt-1">
              {/* Reloj Grande */}
              <div className={`text-4xl font-mono font-black tracking-tighter mb-2 drop-shadow-md ${tiempoAgotado ? "text-red-500 animate-pulse" : "text-white"}`}>
                {getTiempoRestante(info.fin)}
              </div>
              
              {tiempoAgotado ? (
                <div className="flex items-center justify-center gap-1 text-red-500 text-[10px] font-black uppercase tracking-widest bg-black/40 py-1.5 rounded border border-red-500/30">
                  <AlertCircle size={10} /> Tiempo Fuera
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1 text-primary text-[10px] font-black uppercase tracking-widest bg-black/20 py-1.5 rounded border border-primary/20 backdrop-blur-sm">
                    <PlayCircle size={10} /> En curso
                  </div>
                  
                  {/* Botón +5 min */}
                  <button 
                    onClick={() => onAgregar(bici, 5)}
                    className="w-full py-1 text-[10px] font-bold text-white/50 hover:text-white bg-black/20 rounded transition-colors flex justify-center items-center gap-1 border border-white/5"
                  >
                    <Plus size={10} /> +5 min
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function BicisPage() {
  const [tiempos, setTiempos] = useState(() => {
    const guardados = localStorage.getItem("bicis-activas");
    return guardados ? JSON.parse(guardados) : {};
  });

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("bicis-activas", JSON.stringify(tiempos));
  }, [tiempos]);

  const { enPista, disponibles } = useMemo(() => {
    const pista = [];
    const disp = [];

    BICIS_ORIGINALES.forEach(bici => {
      if (tiempos[bici]) {
        pista.push(bici);
      } else {
        disp.push(bici);
      }
    });

    pista.sort((a, b) => tiempos[a].fin - tiempos[b].fin);
    return { enPista: pista, disponibles: disp };
  }, [tiempos]);

  const iniciarAlquiler = (bici, minutos) => {
    const inicio = Date.now();
    const fin = inicio + minutos * 60 * 1000;
    setTiempos(prev => ({ ...prev, [bici]: { inicio, fin, duracion: minutos } }));
    showToast(`${bici}: ${minutos}m iniciados`, "success");
  };

  const agregarTiempo = (bici, minutosExtra) => {
    setTiempos(prev => {
      const actual = prev[bici];
      if (!actual) return prev;
      return {
        ...prev,
        [bici]: { 
          ...actual, 
          fin: actual.fin + (minutosExtra * 60 * 1000),
          duracion: actual.duracion + minutosExtra 
        }
      };
    });
    showToast(`${bici}: +${minutosExtra}m`, "success");
  };

  const terminarAlquiler = (bici) => {
    const nuevaLista = { ...tiempos };
    delete nuevaLista[bici];
    setTiempos(nuevaLista);
    showToast(`${bici} finalizada`, "info");
  };

  return (
    <div className="min-h-screen text-white pb-24 font-sans">
      <Navbar />
      <Toaster position="top-center" />

      <div className="pt-24 px-4 mb-4">
        <h1 className="text-xl font-black text-primary uppercase italic tracking-tighter">
          Pista Bicis
        </h1>
      </div>

      <div className="px-4 space-y-8">
        
        {/* EN PISTA */}
        {enPista.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-primary border-b border-primary/20 pb-1">
              <PlayCircle size={16} />
              <h2 className="text-xs font-black uppercase tracking-widest">En Pista ({enPista.length})</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {enPista.map(bici => (
                <BiciCard 
                  key={bici} 
                  bici={bici} 
                  info={tiempos[bici]} 
                  now={now}
                  onIniciar={iniciarAlquiler}
                  onTerminar={terminarAlquiler}
                  onAgregar={agregarTiempo}
                />
              ))}
            </div>
          </div>
        )}

        {/* DISPONIBLES */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white/40 border-b border-white/10 pb-1">
            <CheckCircle2 size={16} />
            <h2 className="text-xs font-black uppercase tracking-widest">Disponibles ({disponibles.length})</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {disponibles.map(bici => (
              <BiciCard 
                key={bici} 
                bici={bici} 
                info={null} 
                now={now}
                onIniciar={iniciarAlquiler}
                onTerminar={terminarAlquiler}
                onAgregar={agregarTiempo}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}