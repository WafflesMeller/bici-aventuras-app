import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import QRCode from "react-qr-code";
import {
  ArrowLeft,
  QrCode,
  Loader2,
  CheckCircle2,
  LogOut,
  Smartphone,
  ChevronLeft,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const API_URL = "https://api-whatsapp-bici-aventuras.onrender.com";
export default function WhatsappPage() {
  const navigate = useNavigate();

  // --- ESTADO DE PRUEBA (CAMBIA ESTO MANUALMENTE PARA VER LOS DISEÑOS) ---
  // Opciones: "disconnected", "connecting", "connected"
  const [status, setStatus] = useState("connecting"); // Empezamos conectando para verificar
  const [qrCode, setQrCode] = useState(null); // Aquí guardaremos el string del QR
  const [loadingAction, setLoadingAction] = useState(false); // Para el spinner del botón salir

  // 1. POLLING: Consultar al backend cada 3 segundos
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/status`);
        const data = await res.json();

        // Si el backend dice desconectado pero no mandó QR aún, mantenemos "connecting" visualmente
        if (data.status === "disconnected" && !data.qr) {
          setStatus("connecting");
        } else {
          setStatus(data.status);
        }

        if (data.qr) setQrCode(data.qr);
      } catch (error) {
        console.error("Error backend:", error);
        setStatus("connecting"); // Si falla, asumimos que está intentando conectar
      }
    };

    checkStatus(); // Ejecutar ya
    const interval = setInterval(checkStatus, 3000); // Repetir cada 3s

    return () => clearInterval(interval); // Limpieza al salir
  }, []);

  // 2. LOGOUT: Función para cerrar sesión real
  const handleLogout = async () => {
    if (!window.confirm("¿Seguro que quieres desconectar el Bot?")) return;

    setLoadingAction(true);
    try {
      await fetch(`${API_URL}/logout`, { method: "POST" });
      setStatus("disconnected");
      setQrCode(null);
    } catch (error) {
      alert("Error al cerrar sesión");
    } finally {
      setLoadingAction(false);
    }
  };

  // Configuración visual según el estado
  const getStatusUI = () => {
    switch (status) {
      case "connected":
        return {
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/50",
          title: "Bot Conectado",
          desc: "El sistema está listo para enviar mensajes.",
          icon: <CheckCircle2 size={32} className="text-green-400" />,
        };
      case "connecting":
        return {
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
          title: "Estableciendo conexión...",
          desc: "Por favor espera mientras conectamos con WhatsApp.",
          icon: <Loader2 size={32} className="text-yellow-400 animate-spin" />,
        };
      default: // disconnected
        return {
          color: "text-white",
          bgColor: "bg-white/5",
          borderColor: "border-white/10",
          title: "Escanea el código QR",
          desc: "Abre WhatsApp > Dispositivos vinculados > Vincular un dispositivo.",
          icon: <QrCode size={32} className="text-white" />,
        };
    }
  };

  const ui = getStatusUI();

  return (
    <div className="min-h-screen text-white">
      <Navbar />

      {/* HEADER CON BOTÓN VOLVER */}
      <div className="pt-20 sticky top-0 z-40 backdrop-blur-xl ">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2  hover:text-primary transition group"
          >
            <ChevronLeft
              size={20}
              className="group-hover:scale-110 transition-transform duration-200"
            />
            <FaWhatsapp size={20} className="text-primary" />
            <h1 className="text-lg font-bold text-primary uppercase tracking-tight">
              Conexión WhatsApp
            </h1>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 animate-fade-in mt-4">
        {/* TARJETA DE ESTADO */}
        <div
          className={`relative overflow-hidden rounded-3xl border backdrop-blur-md p-6 transition-all duration-500
            ${ui.bgColor} ${ui.borderColor}
          `}
        >
          <div className="flex flex-col items-center text-center gap-3 relative z-10">
            <div
              className={`p-4 rounded-full bg-black/20 backdrop-blur-sm border border-white/5 shadow-lg`}
            >
              {ui.icon}
            </div>

            <div>
              <h2 className={`text-xl font-bold ${ui.color} mb-1`}>
                {ui.title}
              </h2>
              <p className="text-sm text-white/60 max-w-62.5 mx-auto leading-relaxed">
                {ui.desc}
              </p>
            </div>
          </div>
        </div>

        {/* ÁREA DEL QR O ACCIONES */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl flex flex-col items-center justify-center min-h-[350px]">
          {/* CASO 1: CONECTADO */}
          {status === "connected" && (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-48 h-48 mx-auto bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                <Smartphone size={80} className="text-green-400" />
              </div>

              <button
                onClick={handleLogout} // <--- Usamos la función real
                disabled={loadingAction} // <--- Deshabilitamos si está cargando
                className="w-full py-3 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {/* Mostramos spinner si está cargando */}
                {loadingAction ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <LogOut size={18} />
                )}
                {loadingAction ? "Desconectando..." : "Cerrar Sesión"}
              </button>
            </div>
          )}

          {/* CASO 2: CONECTANDO (Spinner Grande) */}
          {status === "connecting" && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="relative">
                <div className="w-48 h-48 rounded-2xl border-2 border-white/10 flex items-center justify-center bg-black/40">
                  <Loader2 size={60} className="text-primary animate-spin" />
                </div>
                {/* Efecto de escaneo */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_15px_#00ff7f] animate-[scan_2s_ease-in-out_infinite]" />
              </div>
              <p className="text-xs font-mono text-white/40 uppercase tracking-widest animate-pulse">
                Sincronizando...
              </p>
            </div>
          )}

          {/* CASO 3: DESCONECTADO (Muestra QR REAL) */}
          {status === "disconnected" && qrCode && (
            <div className="text-center space-y-6 animate-fade-in w-full">
              {/* Contenedor del QR */}
              <div className="relative w-fit mx-auto bg-white p-4 rounded-xl shadow-2xl">
                <div className="bg-white rounded-lg overflow-hidden">
                  {/* COMPONENTE QR REAL */}
                  <QRCode
                    value={qrCode}
                    size={200}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                </div>
              </div>

              <p className="text-sm text-white/50">
                El código cambiará automáticamente si expira.
              </p>
            </div>
          )}

          {/* CASO 3B: DESCONECTADO PERO SIN QR AUN (Esperando backend) */}
          {status === "disconnected" && !qrCode && (
            <div className="text-center space-y-4">
              <Loader2
                size={40}
                className="text-white/30 animate-spin mx-auto"
              />
              <p className="text-sm text-white/40">Generando código QR...</p>
            </div>
          )}
        </div>

        {/* FOOTER INFORMATIVO */}
        <div className="text-center">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
            BiciAventuras Bot v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
