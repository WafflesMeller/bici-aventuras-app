import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Settings, MessageCircle, ChevronRight, LogOut } from "lucide-react";

export default function ConfigPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white pb-24">
      <Navbar />

      {/* HEADER FIJO */}
      <div className="pt-20 sticky top-0 z-40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Settings size={20} className="text-primary" />
          <h1 className="text-lg font-bold text-primary uppercase">
            Configuración
          </h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-8 animate-fade-in">
        {/* SECCIÓN 1: INTEGRACIONES */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
            Integraciones y Bots
          </h2>

          {/* BOTÓN WHATSAPP (Destacado) */}
          <button
            onClick={() => navigate("/whatsapp")}
            className="w-full backdrop-blur-xl bg-white/5 hover:bg-white/10 active:scale-[0.90] border border-white/10 hover:border-green-500/50 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 group shadow-sm"
          >
            <div className="flex items-center gap-4">
              {/* Icono con fondo verde */}
              <div className="p-3 rounded-full bg-green-500 text-black">
                <MessageCircle size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-green-400">
                  WhatsApp Bot
                </p>
                <p className="text-xs text-white/50">
                  Conectar, escanear QR y estado
                </p>
              </div>
            </div>

            <div className="p-2 rounded-full bg-white/10">
              <ChevronRight
                size={18}
                className="text-white"
              />
            </div>
          </button>
        </div>

        {/* BOTÓN SALIR */}
        <button className="w-full py-4 backdrop-blur-xl text-red-500 font-bold text-sm bg-red-500/10 hover:bg-red-500/20 rounded-2xl flex items-center justify-center gap-2 transition-colors">
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
