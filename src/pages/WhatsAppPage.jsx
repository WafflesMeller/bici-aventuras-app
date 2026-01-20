import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import Navbar from "../components/Navbar";
import {
  Loader2,
  CheckCircle2,
  LogOut,
  Smartphone,
  ChevronLeft,
  QrCode,
  Wifi,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

// URL DE TU VPS
const API_URL = "https://api.whatsapp-api-check.xyz";

export default function WhatsappPage() {
  const navigate = useNavigate();

  // --- ESTADOS LÓGICOS ---
  const [status, setStatus] = useState("starting");
  const [qrCode, setQrCode] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // --- 1. LÓGICA DE POLLING ---
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/status`);
        const data = await res.json();
        setStatus(data.status);
        setQrCode(data.qr);
      } catch (error) {
        console.error("Error conectando con el Bot:", error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- 2. LÓGICA DE LOGOUT ---
  const handleLogout = async () => {
    if (!window.confirm("¿Seguro que quieres cerrar la sesión del Bot?"))
      return;

    setLoadingAction(true);
    try {
      await fetch(`${API_URL}/logout`, { method: "POST" });
      setStatus("disconnected");
      setQrCode(null);
    } catch (e) {
      alert("Error al cerrar sesión");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* INYECCIÓN DE ESTILOS DE ANIMACIÓN */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <Navbar />

      {/* HEADER */}
      <div className="pt-20 sticky top-0 z-40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 hover:text-primary transition group"
          >
            <ChevronLeft
              size={20}
              className="group-hover:scale-110 transition-transform duration-200"
            />
            <div className="p-2 bg-white/10 rounded-full">
              <FaWhatsapp size={20} className="text-green-400" />
            </div>
            <h1 className="text-sm font-bold text-xl font-black text-primary uppercase italic tracking-tighter">
              Conexión WhatsApp
            </h1>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 animate-fade-in mt-4">
        
        {/* ÁREA PRINCIPAL - Altura fija de 450px para evitar saltos */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl flex flex-col items-center justify-center h-[450px] relative overflow-hidden">
          
          {/* CASO 1: CONECTADO (Animación a la Derecha / Slide In Right) */}
          { status === "connected" && (
            <div className="text-center space-y-6 w-full animate-slide-in-right">
              <div className="w-48 h-48 mx-auto bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                <Smartphone size={80} className="text-green-400" />
              </div>

              <div className="space-y-2">
                 <h3 className="text-xl font-bold text-green-400 uppercase tracking-widest">Bot Activo</h3>
                 <p className="text-sm font-medium text-green-300/70">
                   Conexión establecida
                 </p>
              </div>

              <button
                onClick={handleLogout}
                disabled={loadingAction}
                className="w-full py-3 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loadingAction ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LogOut size={18} />
                )}
                {loadingAction ? "Desconectando" : "Cerrar Sesión"}
              </button>
            </div>
          )}

          {/* CASO 2: INICIANDO / CONECTANDO */}
          {(status === "starting" || status === "connecting") && (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="relative mx-auto">
                <div className="w-48 h-48 rounded-2xl border-2 border-white/10 flex items-center justify-center bg-black/40 mx-auto">
                  <Smartphone size={80} className="text-green-400 animate-pulse" />
                </div>
                {/* Efecto de escaneo decorativo */}
                <div className="absolute top-0 left-0 w-full h-1 bg-green-400/50 shadow-[0_0_15px_#05df72] animate-[scan_2s_ease-in-out_infinite]" />
              </div>
              
              <div className="space-y-2">
                 <h3 className="text-lg font-bold text-green-400 uppercase tracking-widest animate-pulse">
                   Conectando
                 </h3>
                 <p className="text-sm font-mono text-white/40 uppercase tracking-widest">
                   Esperando respuesta del BOT
                 </p>
              </div>
            </div>
          )}

          {/* CASO 3: ESCANEAR QR (Animación a la Izquierda / Slide In Left) */}
          {(status === "scan_needed" ||
            (status === "disconnected" && qrCode)) &&
            qrCode && (
              <div className="text-center space-y-6 w-full flex flex-col items-center animate-slide-in-left">
                {/* Contenedor Blanco del QR */}
                <div className="relative bg-white p-4 rounded-xl shadow-2xl group transition-transform hover:scale-105 duration-300">
                  <div className="overflow-hidden rounded-lg">
                    <QRCodeCanvas
                      value={qrCode}
                      size={220}
                      level={"L"}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                    />
                  </div>
                  {/* Logo de WhatsApp superpuesto */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <FaWhatsapp className="text-black text-6xl" />
                  </div>
                </div>

                {/* INSTRUCCIONES SOLICITADAS */}
                <div className="space-y-1">
                  <p className="text-sm text-white/70 max-w-[260px] mx-auto leading-relaxed">
                    Abre WhatsApp en tu móvil, ve a <strong>Ajustes</strong> {'>'}{" "}
                    <strong>Dispositivos vinculados</strong> y escanea el código.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-4 py-2 rounded-full text-white/80 border border-white/5">
                  <Smartphone size={14} />
                  <span>ESCÁNEALO CON TU CÁMARA</span>
                </div>
              </div>
            )}

          {/* CASO 4: DESCONECTADO SIN QR (Generando) */}
          {status === "disconnected" && !qrCode && (
            <div className="text-center space-y-6 animate-fade-in w-full">
              <div className="relative mx-auto">
                 <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 mx-auto">
                    <Loader2 size={50} className="text-white/50 animate-spin" />
                 </div>
                 <div className="absolute -bottom-3 right-10 bg-neutral-800 p-2 rounded-full border border-white/10 shadow-lg">
                     <QrCode size={20} className="text-white/40" />
                 </div>
              </div>

              <div className="space-y-2">
                 <h3 className="text-lg font-bold text-white/80 uppercase tracking-widest animate-pulse">
                   Creando Sesión
                 </h3>
                 <p className="text-xs font-mono text-white/40">
                   Generando nuevo código QR seguro...
                 </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-center pb-8">
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
            Bici Aventuras bot V11.2
          </p>
        </div>
      </div>
    </div>
  );
}