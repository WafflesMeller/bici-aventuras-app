import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { supabase } from '../supabase/client';
import { Camera, RefreshCw, X, ArrowLeft, Check, Hash, DollarSign, User, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from "../components/Notifications"; // Ajusta la ruta si es necesario
import { FaCircleCheck } from 'react-icons/fa6';

export default function EscaneoPago() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [ip, setIp] = useState('');
  const canvasRef = useRef(null);

  const [data, setData] = useState({
    referencia: '',
    monto_numerico: '',
    monto_bs: '',
    cliente: '',
    raw_data: ''
  });

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(res => setIp(res.ip))
      .catch(() => setIp('0.0.0.0'));
  }, []);

  // --- PROCESAMIENTO AVANZADO DE IMAGEN ---
  const preprocessImage = (imageElement) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      // MEJORA: Invertimos para que el texto sea NEGRO y el fondo BLANCO
      // Si el pixel es claro (texto), lo ponemos negro (0). Si es oscuro (fondo), lo ponemos blanco (255).
      const v = brightness > 125 ? 0 : 255; 
      d[i] = d[i+1] = d[i+2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  // --- LÓGICA DE PARSEO INTELIGENTE ---
const parseMontoVzla = (textoCrudo) => {
      // 1. Buscamos específicamente patrones de dinero (ej: 1.800,00 o 500,00)
      // Esta regex ignora puntos sueltos y busca grupos de números con decimales
      const regexMonto = /(\d{1,3}(?:[\.]\d{3})*[,]\d{2})|(\d+[\.,]\d{2})/g;
      const coincidencias = textoCrudo.match(regexMonto) || [];
      
      if (coincidencias.length === 0) return { num: '', txt: '' };

      // Tomamos la coincidencia más larga (suele ser el monto real y no basura del OCR)
      let raw = coincidencias.sort((a, b) => b.length - a.length)[0];
      
      // 2. Identificamos el separador decimal real (el último punto o coma)
      const lastDot = raw.lastIndexOf('.');
      const lastComma = raw.lastIndexOf(',');
      const sepIndex = Math.max(lastDot, lastComma);
      
      // 3. Separamos y limpiamos
      const entero = raw.substring(0, sepIndex).replace(/[.,]/g, ''); // Quitamos puntos de mil
      const decimal = raw.substring(sepIndex + 1);
      
      return {
        num: `${entero}.${decimal}`, // Formato para Supabase: 1800.00
        txt: raw // Formato visual: 1.800,00
      };
    };

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    setPreview(img.src);
    setLoading(true);

    img.onload = async () => {
      const processedImage = preprocessImage(img);
      try {
        const { data: { text } } = await Tesseract.recognize(processedImage, 'spa+eng');
        
        console.log("--- DEBUG OCR ---");
        console.log("TEXTO DETECTADO:", text);

        const t = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

        // 1. Referencia (10-14 dígitos)
        const refMatch = t.match(/(\d{10,14})/);

        // 2. Monto con nueva lógica inteligente
        const resultadoMonto = parseMontoVzla(t);

        console.log("RESULTADO PROCESADO:", resultadoMonto);

        setData(prev => ({
          ...prev,
          referencia: refMatch ? refMatch[0] : '',
          monto_numerico: resultadoMonto.num,
          monto_bs: resultadoMonto.txt,
          raw_data: text 
        }));

        if (!resultadoMonto.num) showError("Monto no detectado.");
      } catch (err) {
        showError("Error al procesar");
      } finally {
        setLoading(false);
      }
    };
  };

  const guardarPagoCompleto = async () => {
    if (isSaving) return;
    if (!data.referencia || !data.monto_numerico) {
      showError("Datos incompletos");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('transacciones-biciaventuras')
        .insert([{
          ip_origen: ip,
          user_agent: navigator.userAgent,
          cliente: data.cliente || 'CLIENTE DESCONOCIDO',
          raw_data: data.raw_data,
          referencia: data.referencia.trim(),
          titulo_notificacion: 'ESCÁNER OCR INTELIGENTE',
          texto_notificacion: `Pago validado por Bs. ${data.monto_bs}`,
          monto_bs: data.monto_bs,
          monto_numerico: parseFloat(data.monto_numerico),
          usada: false,
          fecha_hora: new Date().toISOString()
        }]);

      if (error) throw error;
      showSuccess("¡Pago registrado!");
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      showError(err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      
      <div className="pt-24 px-4 max-w-md mx-auto space-y-6 pb-10">
        <div className="flex items-center justify-center">
          <div className="text-right">
            <h1 className="text-xl font-black text-primary italic uppercase tracking-tighter">Validar Pago</h1>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Biciaventuras Macuto</p>
          </div>
        </div>

        {/* ÁREA DE CÁMARA */}
        <div className="relative aspect-square bg-white/10 border-2 border-dashed border-white/10 rounded-[2.5rem] overflow-hidden flex items-center justify-center">
          {!preview ? (
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <Camera size={48} className="text-primary animate-pulse" />
              <input type="file" accept="image/*" capture="environment" onChange={handleScan} className="hidden" />
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Tocar para escanear</span>
            </label>
          ) : (
            <img src={preview} className="w-full h-full object-contain p-6" />
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
              <RefreshCw className="animate-spin text-primary mb-2" size={40} />
              <p className="text-primary font-black text-xs animate-pulse italic">EXTRAYENDO DATOS...</p>
            </div>
          )}
        </div>

        {/* FORMULARIO EDITABLE */}
        <div className="space-y-4 animate-slide-in-up">

          <div className="bg-white/10 p-4 rounded-3xl border border-white/10">
            <div className="flex items-center gap-2 mb-1 text-primary/60">
                <Hash size={14} /><label className="text-[10px] font-bold uppercase tracking-widest">Referencia / Operación</label>
            </div>
            <input value={data.referencia} onChange={(e) => setData({...data, referencia: e.target.value})} className="w-full bg-transparent text-2xl font-black outline-none focus:text-primary transition-colors" />
          </div>

          <div className="bg-white/10 p-4 rounded-3xl border border-white/10">
            <div className="flex items-center gap-2 mb-1 text-primary/60">
                <DollarSign size={14} /><label className="text-[10px] font-bold uppercase tracking-widest">Monto Bolívares</label>
            </div>
            <input value={data.monto_numerico} onChange={(e) => setData({...data, monto_numerico: e.target.value})} className="w-full bg-transparent text-2xl font-black outline-none focus:text-primary transition-colors" placeholder="0.00" />
          </div>

          <button 
            onClick={guardarPagoCompleto} 
            disabled={isSaving || loading}
            className="w-full py-5 bg-primary text-black font-black rounded-3xl flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-95 transition-all uppercase"
          >
            {isSaving ?
            <>
              cargando<Loader2 className="animate-spin" size={20} />
            </> 
            : 
            <>
            <FaCircleCheck size={20}/> finalizar y vincular
            </>}
          </button>
        </div>
      </div>
    </div>
  );
}