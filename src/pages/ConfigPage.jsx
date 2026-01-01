import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { 
  Settings, 
  MessageCircle, 
  ChevronRight, 
  Smartphone, 
  ShieldCheck,
  LogOut 
} from "lucide-react";

export default function ConfigPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white pb-24">
      <Navbar />

      {/* HEADER FIJO */}
      <div className="pt-20 sticky top-0 z-40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-full">
            <Settings size={20} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
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
            className="w-full backdrop-blur-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/10 hover:border-green-500/50 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 group shadow-sm"
          >
            <div className="flex items-center gap-4">
              {/* Icono con fondo verde */}
              <div className="bg-green-500/20 p-3 rounded-full text-green-400 group-hover:bg-green-500 group-hover:text-black transition-colors">
                <MessageCircle size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-white group-hover:text-green-400 transition-colors">
                  WhatsApp Bot
                </p>
                <p className="text-xs text-white/50">
                  Conectar, escanear QR y estado
                </p>
              </div>
            </div>
            
            <div className="bg-white/5 p-2 rounded-full group-hover:bg-white/10">
              <ChevronRight size={18} className="text-white/40 group-hover:text-white" />
            </div>
          </button>
        </div>

        {/* SECCIÓN 2: OTROS AJUSTES (Ejemplo visual para rellenar) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">
            General
          </h2>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
            {/* Item 1 */}
            <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-white/60" />
                <span className="text-sm font-medium">Dispositivos</span>
              </div>
              <ChevronRight size={16} className="text-white/20" />
            </button>

            {/* Item 2 */}
            <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-white/60" />
                <span className="text-sm font-medium">Seguridad</span>
              </div>
              <ChevronRight size={16} className="text-white/20" />
            </button>
          </div>
        </div>

        {/* BOTÓN SALIR */}
        <button className="w-full py-4 text-red-500 font-bold text-sm bg-red-500/10 hover:bg-red-500/20 rounded-2xl flex items-center justify-center gap-2 transition-colors">
            <LogOut size={18} />
            Cerrar Sesión
        </button>

      </div>
    </div>
  );
}