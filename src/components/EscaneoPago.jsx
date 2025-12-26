import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Camera, CheckCircle, XCircle, Upload, RefreshCw } from 'lucide-react';
import { supabase } from '../supabase/client.js';
import { CircularLoading } from 'respinner';
import Tesseract from 'tesseract.js';
import toast, { Toaster } from 'react-hot-toast';

export default function EscaneoPago() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const fileInputRef = useRef(null);

  // Formulario con datos extraídos
  const [formData, setFormData] = useState({
    referencia: '',
    monto_numerico: '',
    banco_origen: 'Desconocido', // Intentaremos detectarlo
    fecha_pago: new Date().toISOString().split('T')[0] // Fecha de hoy por defecto
  });

  // 1. Manejar la selección de imagen (Cámara o Galería)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setRawText('');
      setFormData({ ...formData, referencia: '', monto_numerico: '' });
      setProgress(0);
    }
  };

  // -----------------------------------------------------
  // 2. LÓGICA CENTRAL: EL MOTOR DE OCR Y REGEX
  // -----------------------------------------------------
  const procesarImagen = async () => {
    if (!image) return;
    setLoading(true);
    setRawText('');

    try {
      // A) Ejecutar Tesseract (El lector de imágenes)
      const result = await Tesseract.recognize(
        image,
        'spa', // Usamos español para mejorar detección de "Bs." y tildes
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(parseInt(m.progress * 100));
            }
          }
        }
      );

      const textoEscaneado = result.data.text;
      setRawText(textoEscaneado);
      console.log("Texto crudo OCR:", textoEscaneado);

      // B) LÓGICA DE EXTRACCIÓN (REGEX ADAPTADO PARA IMÁGENES)
      // El texto de OCR es sucio, hay que limpiar errores comunes (O por 0, I por 1, etc.)
      let textoLimpio = textoEscaneado
        .replace(/O/g, '0')
        .replace(/l/g, '1')
        .replace(/I/g, '1')
        .replace(/\s+/g, ' '); // Quitar espacios extra

      // --- Buscamos la Referencia (Entre 6 y 12 dígitos seguidos) ---
      // Busca palabras clave como "Ref", "Operación", "Nro" seguidas de números
      const regexRef = /(?:ref|referencia|operaci[óo]n|nro)[:.\-\s]*(\d{6,12})/i;
      const matchRef = textoLimpio.match(regexRef);
      
      // --- Buscamos el Monto (Bs. seguido de números, puntos y comas) ---
      const regexMonto = /(?:bs|bol[íi]vares)[:.\-\s]*([\d.,]+)/i;
      const matchMonto = textoLimpio.match(regexMonto);

      // --- Intentamos detectar banco por palabras clave ---
      let bancoDetectado = 'Desconocido';
      if (textoLimpio.toLowerCase().includes('bdv') || textoLimpio.toLowerCase().includes('venezuela')) bancoDetectado = 'BDV';
      else if (textoLimpio.toLowerCase().includes('banesco')) bancoDetectado = 'Banesco';
      else if (textoLimpio.toLowerCase().includes('mercantil')) bancoDetectado = 'Mercantil';
      else if (textoLimpio.toLowerCase().includes('provincial')) bancoDetectado = 'Provincial';


      // C) FUNCIÓN AUXILIAR PARA LIMPIAR EL MONTO (Igual que en tu servidor)
      const parseMonto = (str) => {
        if (!str) return '';
        // Deja solo números y comas. Asume que la coma es decimal (formato VE)
        let limpio = str.replace(/[^\d,]/g, ''); 
        return limpio.replace(',', '.'); 
      };

      // D) ACTUALIZAR EL FORMULARIO FINAL
      setFormData(prev => ({
        ...prev,
        referencia: matchRef ? matchRef[1] : '',
        monto_numerico: matchMonto ? parseMonto(matchMonto[1]) : '',
        banco_origen: bancoDetectado
      }));
      
      toast.success('Escaneo completado. ¡Verifica los datos!', { icon: '🧐' });

    } catch (err) {
      console.error(err);
      toast.error('Error al procesar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  // 3. ENVIAR A SUPABASE
  const guardarTransaccion = async () => {
    if (!formData.referencia || !formData.monto_numerico) {
      toast.error('Faltan la referencia o el monto.');
      return;
    }

    setLoading(true);
    try {
        const montoFinal = parseFloat(formData.monto_numerico);

        const { error } = await supabase
        .from('transacciones-biciaventuras')
        .insert([
          {
            referencia: formData.referencia.trim(),
            monto_numerico: montoFinal,
            // Guardamos un resumen de lo que detectamos para auditoría
            titulo_notificacion: `Escaneo OCR - ${formData.banco_origen}`,
            texto_notificacion: `Referencia detectada: ${formData.referencia}. Monto detectado: ${montoFinal}`,
            fecha_hora: new Date(formData.fecha_pago).toISOString(),
            usada: false,
            raw_data: { metodo: 'OCR_BROWSER', texto_crudo: rawText.substring(0, 200) + '...' }
          }
        ]);

      if (error) {
        if (error.code === '23505') throw new Error('Esta referencia ya existe en el sistema.');
        throw error;
      }

      toast.success('¡Pago registrado correctamente!', { icon: '🎉' });
      // Limpiar formulario
      setImage(null);
      setFormData({ referencia: '', monto_numerico: '', banco_origen: 'Desconocido', fecha_pago: new Date().toISOString().split('T')[0] });
      setRawText('');

    } catch (error) {
      toast.error(error.message || 'Error al guardar en la base de datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white pb-20 bg-dark-bg">
      <Navbar />
      <Toaster position="top-center" reverseOrder={false} />

      <div className="pt-24 px-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Camera className="text-primary" /> Escáner de Pagos
        </h1>

        {/* --- ÁREA DE CARGA DE IMAGEN --- */}
        <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-4 mb-6 text-center relative">
          <input
            type="file"
            accept="image/*"
            capture="environment" // Esto fuerza abrir la cámara trasera en celulares
            onChange={handleImageChange}
            ref={fileInputRef}
            className="hidden"
          />
          
          {!image ? (
            <div onClick={() => fileInputRef.current.click()} className="cursor-pointer py-8">
              <Upload size={40} className="mx-auto text-white/50 mb-2" />
              <p className="text-white/70 font-medium">Toca para tomar foto o subir captura</p>
              <p className="text-white/40 text-sm mt-1">Soporta BDV, Pago Móvil, etc.</p>
            </div>
          ) : (
            <div className="relative">
              <img src={image} alt="Preview" className="rounded-lg max-h-75 mx-auto object-contain" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 bg-red-500/80 p-1 rounded-full text-white hover:bg-red-600 transition"
              >
                <XCircle size={20} />
              </button>
            </div>
          )}

          {image && !loading && (
            <button
              onClick={procesarImagen}
              className="mt-4 w-full bg-primary text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <Camera size={20} /> Procesar Imagen
            </button>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
                <CircularLoading color="#00ff7f" size={40} />
                <p className="text-primary mt-2 font-bold">Analizando... {progress}%</p>
                <p className="text-white/50 text-xs mt-1">Esto puede tardar unos segundos</p>
            </div>
          )}
        </div>

        {/* --- RESULTADOS EDITABLES --- */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm transition-all duration-300">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
             <CheckCircle size={18} className={formData.referencia ? "text-primary" : "text-white/30"} />
             Resultados Detectados
          </h2>
          <p className="text-white/50 text-sm mb-4 -mt-2">
            ⚠️ Verifica siempre los datos. El escáner puede equivocarse.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/70 block mb-1">Referencia (Últimos dígitos)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.referencia}
                onChange={(e) => setFormData({...formData, referencia: e.target.value})}
                placeholder="Ej: 123456"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-3 text-white font-mono text-lg focus:border-primary outline-none transition"
              />
            </div>

            <div>
              <label className="text-sm text-white/70 block mb-1">Monto Exacto (Bs)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-primary font-bold">Bs.</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto_numerico}
                  onChange={(e) => setFormData({...formData, monto_numerico: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-12 pr-3 py-3 text-white font-bold text-lg focus:border-primary outline-none transition"
                />
              </div>
            </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-white/70 block mb-1">Banco Detectado</label>
                    <input type="text" value={formData.banco_origen} readOnly className="w-full bg-black/10 border border-white/5 rounded-lg px-3 py-2 text-white/50 text-sm" />
                </div>
                 <div>
                    <label className="text-sm text-white/70 block mb-1">Fecha Pago</label>
                    <input type="date" value={formData.fecha_pago} onChange={(e) => setFormData({...formData, fecha_pago: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none" />
                </div>
            </div>

            <button
              onClick={guardarTransaccion}
              disabled={loading || !formData.referencia || !formData.monto_numerico}
              className="w-full mt-4 bg-green-500 hover:bg-green-400 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all relative overflow-hidden"
            >
              <Upload size={20} /> Guardar en Sistema
            </button>

            {rawText && (
                <details className="mt-4">
                    <summary className="text-xs text-white/40 cursor-pointer flex items-center gap-1"><RefreshCw size={10}/> Ver texto crudo detectado</summary>
                    <p className="text-[10px] text-white/30 mt-2 p-2 bg-black/20 rounded border border-white/5 font-mono whitespace-pre-wrap wrap-break-words">
                        {rawText}
                    </p>
                    </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}