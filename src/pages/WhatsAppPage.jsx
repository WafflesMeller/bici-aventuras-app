import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import io from 'socket.io-client';
import { Loader2, CheckCircle, XCircle, Smartphone, Wifi } from 'lucide-react';
import Navbar from '../components/Navbar'; // Asegúrate de que esta ruta sea correcta


export default function VincularBot() {
  const [qrCode, setQrCode] = useState('');
  // Estados posibles: 'connecting', 'scan_needed', 'connected', 'disconnected'
  const [status, setStatus] = useState('connecting'); 

useEffect(() => {
    // URL limpia, sin paths raros
    const socket = io('https://api.whatsapp-api-check.xyz', {
      transports: ['polling'], // Polling primero para asegurar conexión
      withCredentials: true
    });

    socket.on('connect', () => console.log('✅ Conectado'));
    
    socket.on('qr', (qr) => {
      console.log('QR Recibido');
      setQrCode(qr);
      setStatus('scan_needed');
    });

    // ... resto del código ...

    socket.on('status', (s) => {
      console.log('Estado recibido:', s);
      setStatus(s);
      if(s === 'connected') {
        setQrCode(''); // Limpiamos el QR si ya se conectó
      }
    });

    // Limpieza al salir de la pantalla (desmontar componente)
    return () => {
      console.log('Desconectando socket...');
      socket.disconnect();
    };
  }, []); // El array vacío [] asegura que esto solo corra una vez al entrar

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
            Sistema de mensajería automática WhatsApp
          </p>

          {/* --- ESTADO: CARGANDO INICIAL --- */}
          {status === 'connecting' && (
            <div className="py-12 flex flex-col items-center">
              <Loader2 className="animate-spin text-primary mb-4" size={48} />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Conectando al servidor...</p>
            </div>
          )}

          {/* --- ESTADO: YA CONECTADO --- */}
          {status === 'connected' && (
            <div className="py-8 flex flex-col items-center animate-scale-in">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle className="text-green-500 w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">¡Bot Operativo!</h3>
              <p className="text-sm text-gray-400 max-w-[200px]">
                El sistema está vinculado y listo para enviar mensajes.
              </p>
            </div>
          )}

          {/* --- ESTADO: ESCANEAR QR --- */}
          {status === 'scan_needed' && qrCode && (
            <div className="flex flex-col items-center animate-slide-up">
              <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-primary/20 mb-6 group transition-transform hover:scale-105 duration-300">
                <QRCodeCanvas 
                  value={qrCode} 
                  size={240} 
                  level={"H"} // Nivel de corrección de error alto
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  imageSettings={{
                    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
              
              <div className="flex items-center gap-3 text-xs font-bold bg-white/10 px-6 py-3 rounded-full text-primary border border-white/5">
                <Smartphone size={16} />
                <span>WHATSAPP &gt; VINCULAR DISPOSITIVO</span>
              </div>
            </div>
          )}

          {/* --- ESTADO: DESCONECTADO --- */}
          {status === 'disconnected' && (
            <div className="py-8 flex flex-col items-center">
               <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                <XCircle className="text-red-500 w-10 h-10" />
              </div>
              <p className="text-red-400 font-bold text-lg">Sesión Cerrada</p>
              <p className="text-xs text-gray-500 mt-2">Esperando nuevo QR...</p>
            </div>
          )}

        </div>
        
        <p className="mt-8 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
          Powered by Node.js & Socket.io
        </p>
      </div>
    </div>
  );
}