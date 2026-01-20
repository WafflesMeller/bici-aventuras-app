import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Loader2, CheckCircle, XCircle, Smartphone, Wifi, LogOut } from 'lucide-react';
import Navbar from '../components/Navbar'; 

const API_URL = 'https://api.whatsapp-api-check.xyz';

export default function VincularBot() {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('connecting'); // starting, scan_needed, connected, disconnected
  const [loading, setLoading] = useState(false);

  // FUNCIÓN DE POLLING (Consulta cada 3 segundos)
useEffect(() => {
    const checkStatus = async () => {
      try {
        // ASEGÚRATE DE QUE NO HAYA UN PUNTO AL FINAL AQUÍ
        // Correcto:
        const res = await fetch(`${API_URL}/status`); 
        
        // Incorrecto (lo que causa el error status.):
        // const res = await fetch(`${API_URL}/status.`); 
        
        const data = await res.json();
        setStatus(data.status);
        setQrCode(data.qr);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    // Consultar inmediatamente
    checkStatus();

    // Crear intervalo
    const interval = setInterval(checkStatus, 3000);

    // Limpiar intervalo al salir
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
        await fetch(`${API_URL}/logout`, { method: 'POST' });
        setStatus('disconnected');
    } catch (e) {
        alert("Error al cerrar sesión");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 pt-24 animate-fade-in">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center backdrop-blur-md shadow-2xl">
          
          <div className="flex justify-center mb-6">
            <div className="bg-primary/20 p-4 rounded-full">
              <Wifi className="text-primary w-8 h-8 animate-pulse" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-primary mb-2 italic uppercase tracking-tighter">
            Vincular Bot
          </h2>
          <p className="text-sm text-gray-400 mb-8 font-medium">
            Sistema HTTP Polling (Sin WebSockets)
          </p>

          {/* ESTADO: CARGANDO / CONECTANDO */}
          {(status === 'starting' || status === 'connecting') && (
            <div className="py-12 flex flex-col items-center">
              <Loader2 className="animate-spin text-primary mb-4" size={48} />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Iniciando motor...</p>
            </div>
          )}

          {/* ESTADO: YA CONECTADO */}
          {status === 'connected' && (
            <div className="py-8 flex flex-col items-center animate-scale-in">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle className="text-green-500 w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">¡Bot Operativo!</h3>
              <p className="text-sm text-gray-400 max-w-[200px] mb-6">
                El sistema está listo para enviar mensajes.
              </p>
              
              <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 text-sm hover:underline">
                 {loading ? <Loader2 className="animate-spin" size={16}/> : <LogOut size={16}/>} Cerrar Sesión
              </button>
            </div>
          )}

          {/* ESTADO: ESCANEAR QR */}
          {(status === 'scan_needed' || (status === 'disconnected' && qrCode)) && qrCode && (
            <div className="flex flex-col items-center animate-slide-up">
              <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-primary/20 mb-6">
                <QRCodeCanvas 
                  value={qrCode} 
                  size={240} 
                  level={"L"}
                />
              </div>
              <div className="flex items-center gap-3 text-xs font-bold bg-white/10 px-6 py-3 rounded-full text-primary border border-white/5">
                <Smartphone size={16} />
                <span>ESCANEA CON WHATSAPP</span>
              </div>
            </div>
          )}

           {/* ESTADO: DESCONECTADO SIN QR */}
           {(status === 'disconnected' && !qrCode) && (
             <div className="py-8 flex flex-col items-center">
                <Loader2 className="animate-spin text-white/50 mb-2" size={32}/>
                <p className="text-xs text-gray-500">Generando nuevo QR...</p>
             </div>
           )}

        </div>
      </div>
    </div>
  );
}