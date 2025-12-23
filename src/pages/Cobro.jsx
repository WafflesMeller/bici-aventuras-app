import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from '../supabase/client.js';
import Navbar from "../components/Navbar";
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  Banknote, 
  Smartphone, 
  Bot, 
  Loader2 
} from 'lucide-react';

import bdvLogo from "/bdv-logo.png";


// --- VALIDACIONES ---
const paso1Schema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  apellido: z.string().min(1, "Apellido requerido"),
  cedula: z.string().min(6, "Cédula inválida"),
  telefono: z.string().min(10, "Teléfono inválido"),
});

const paso2Schema = z.object({
  cantidad: z.coerce.number().min(1),
  tiempo: z.string(),
});

const paso3Schema = z.object({
  metodo_pago: z.string(),
});

const paso4Schema = z.object({
  ult_4_ref: z.string().optional(),
  monto_recibido: z.any().optional(),
  moneda_pago: z.string().optional(),
});

export default function Cobro() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tasa, setTasa] = useState(60.00);
  // ESTADO NUEVO: Controla la dirección de la animación
  const [direction, setDirection] = useState('forward'); 

  const [formData, setFormData] = useState({
    nombre: "", apellido: "", cedula: "", telefono: "",
    cantidad: 1, tiempo: "10",
    metodo_pago: "bdv",
    ult_4_ref: "", monto_recibido: "", moneda_pago: "USD"
  });

  useEffect(() => {
    const fetchTasa = async () => {
      try {
        const res = await fetch("https://bici-aventuras-app.vercel.app/api/tasa?t=" + Date.now());
        if (!res.ok) throw new Error("Error API");
        const data = await res.json();
        const precio = data.current?.usd || data.price || 0;
        if (precio > 0) setTasa(Number(precio));
      } catch (err) {
        console.error("Usando tasa base:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasa();
  }, []);

  const handleNextStep = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setDirection('forward'); // Marcamos que vamos hacia adelante ->
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection('backward'); // Marcamos que vamos hacia atrás <-
    setStep((prev) => prev - 1);
  };

  const handleFinalSubmit = async (finalData) => {
    const fullData = { ...formData, ...finalData };
    const precioUsd = fullData.tiempo === "10" ? 2 : 3;
    const montoBs = (fullData.cantidad * precioUsd * tasa).toFixed(2);

    try {
      const { error } = await supabase.from('ventas-biciaventuras').insert([{
          cedula_cliente: fullData.cedula,
          nombre_cliente: `${fullData.nombre} ${fullData.apellido}`,
          telefono_cliente: fullData.telefono,
          cantidad_bicicletas: fullData.cantidad,
          tiempo_alquiler: `${fullData.tiempo} min`,
          monto_exacto_bs: parseFloat(montoBs),
          tasa_bcv: tasa,
          ult_4_ref: fullData.ult_4_ref || 'EFECTIVO',
          pagado: true,
          metodo_pago: fullData.metodo_pago 
      }]);

      if (error) throw error;
      alert("¡Venta registrada exitosamente!");
      window.location.reload(); 
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-primary gap-2">
      <Loader2 className="animate-spin" /> Cargando sistema...
    </div>
  );

  // Seleccionamos la clase de animación basada en la dirección
  const animationClass = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left';

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <div className="pt-28 px-4 max-w-md mx-auto pb-10">
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 overflow-hidden">
          
          {/* --- BARRA DE PROGRESO (NUEVO) --- */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  PASO {step} DE 4
                </span>
                <h2 className="text-lg font-bold text-white leading-none mt-1">
                  {step === 1 && "Datos del Cliente"}
                  {step === 2 && "Detalles del Alquiler"}
                  {step === 3 && "Método de Pago"}
                  {step === 4 && "Confirmación"}
                </h2>
              </div>
              <div className="text-xs text-white/30 font-mono">
                {Math.round((step / 4) * 100)}%
              </div>
            </div>
            {/* Track de la barra */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              {/* Relleno animado */}
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary),0.4)]"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
          {/* --- FIN BARRA DE PROGRESO --- */}

          {/* TRUCO: La "key={step}" fuerza a React a destruir y recrear el div,
              disparando la animación CSS cada vez que cambia el paso. */}
          <div key={step} className={animationClass}>
            {step === 1 && <Paso1 onNext={handleNextStep} defaultValues={formData} />}
            {step === 2 && <Paso2 onNext={handleNextStep} onBack={handleBack} defaultValues={formData} tasa={tasa} />}
            {step === 3 && <Paso3 onNext={handleNextStep} onBack={handleBack} defaultValues={formData} />}
            {step === 4 && <Paso4 onSubmit={handleFinalSubmit} onBack={handleBack} defaultValues={formData} tasa={tasa} />}
          </div>

        </div>
      </div>
    </div>
  );
}

// --- PASO 1 ---
function Paso1({ onNext, defaultValues }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues,
    resolver: zodResolver(paso1Schema)
  });

  const handleNumeric = (e) => e.target.value = e.target.value.replace(/[^0-9]/g, "");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="space-y-4">
        <div>
          <input {...register("nombre")} placeholder="Nombre" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors" />
          {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <input {...register("apellido")} placeholder="Apellido" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors" />
          {errors.apellido && <p className="text-red-400 text-xs mt-1">{errors.apellido.message}</p>}
        </div>
        <div>
          <input {...register("cedula")} onInput={handleNumeric} inputMode="numeric" placeholder="Cédula" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors" />
          {errors.cedula && <p className="text-red-400 text-xs mt-1">{errors.cedula.message}</p>}
        </div>
        <div>
          <input {...register("telefono")} onInput={handleNumeric} inputMode="numeric" placeholder="WhatsApp" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary transition-colors" />
          {errors.telefono && <p className="text-red-400 text-xs mt-1">{errors.telefono.message}</p>}
        </div>
      </div>
      
      <button type="submit" className="w-full py-3 rounded-lg bg-primary text-black font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
        Siguiente <ArrowRight size={20} />
      </button>
    </form>
  );
}

// --- PASO 2 ---
function Paso2({ onNext, onBack, defaultValues, tasa }) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues,
    resolver: zodResolver(paso2Schema)
  });

  const cant = watch("cantidad");
  const time = watch("tiempo");
  const precioUsd = time === "10" ? 2 : 3;
  const totalUsd = cant * precioUsd;
  const totalBs = (totalUsd * tasa).toFixed(2);

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-white/60">Bicicletas</label>
          <div className="relative">
            <select {...register("cantidad")} className="w-full p-3 pr-10 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-lg focus:outline-none appearance-none cursor-pointer hover:bg-white/20 transition-colors">
              {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/60">Duración</label>
          <div className="relative">
            <select {...register("tiempo")} className="w-full p-3 pr-10 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-lg focus:outline-none appearance-none cursor-pointer text-black hover:bg-white/20 transition-colors">
              <option value="10">10 Min</option>
              <option value="20">20 Min</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-linear-to-br from-primary/20 to-black border border-primary/30 rounded-2xl p-6 text-center shadow-lg">
        <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">Total</p>
        <div className="flex flex-col items-center">
          <span className="text-5xl font-black text-white tracking-tight">${totalUsd}</span>
          <div className="w-full h-px bg-white/10 my-2"></div>
          <span className="text-3xl font-bold text-white/90">{totalBs} Bs</span>
        </div>
        <p className="text-[10px] text-white/40 mt-1">Tasa: {tasa}</p>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-lg bg-white/10 text-white flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all">
          <ArrowLeft size={18} /> Atrás
        </button>
        <button type="submit" className="flex-1 py-3 rounded-lg bg-primary text-black font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
          Continuar <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}

// --- PASO 3 ---
function Paso3({ onNext, onBack, defaultValues }) {
  const { register, handleSubmit } = useForm({
    defaultValues,
    resolver: zodResolver(paso3Schema)
  });

  const opciones = [
    {
      id: "bdv",
      label: "Banco de Venezuela BDV",
      image: bdvLogo, // 👈 SOLO ESTE USA IMAGEN
    },
    {
      id: "otros",
      label: "Otros Bancos",
      icon: <Smartphone className="w-6 h-6 text-blue-400" />,
    },
    {
      id: "efectivo",
      label: "Efectivo",
      icon: <Banknote className="w-6 h-6 text-green-400" />,
    },
  ];

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">

      <div className="space-y-3">
        {opciones.map((op) => (
          <label
            key={op.id}
            className="
              flex items-center p-4 rounded-xl
              border border-white/10 bg-white/5
              cursor-pointer
              has-:checked:border-primary
              has-:checked:bg-primary/10
              hover:bg-white/10
              transition-all
            "
          >
            {/* ICONO O IMAGEN */}
            <span className="mr-4 flex items-center justify-center w-8 h-8">
              {op.image ? (
                <img
                  src={op.image}
                  alt={op.label}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                op.icon
              )}
            </span>

            <span className="text-white/90 font-semibold flex-1">
              {op.label}
            </span>

            <input
              type="radio"
              {...register("metodo_pago")}
              value={op.id}
              className="w-5 h-5 accent-primary bg-black"
            />
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-lg bg-white/10 text-white flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} /> Atrás
        </button>

        <button
          type="submit"
          className="flex-1 py-3 rounded-lg bg-primary text-black font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
        >
          Siguiente <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}


// --- PASO 4 ---
function Paso4({ onSubmit, onBack, defaultValues, tasa }) {
  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm({
    defaultValues,
    resolver: zodResolver(paso4Schema)
  });

  const metodo = watch("metodo_pago");
  const montoRecibido = watch("monto_recibido") || 0;
  const monedaPago = watch("moneda_pago");

  const totalUSD = defaultValues.cantidad * (defaultValues.tiempo === "10" ? 2 : 3);
  const totalBS = (totalUSD * tasa).toFixed(2);

  const handleBotConnect = () => alert("🤖 Conectando...");

  let mensajeVuelto = "";
  let faltaDinero = false;
  if (metodo === 'efectivo') {
    const target = monedaPago === "USD" ? totalUSD : parseFloat(totalBS);
    const diff = montoRecibido - target;
    if (diff < -0.01) {
        faltaDinero = true;
        mensajeVuelto = `Falta: ${Math.abs(diff).toFixed(2)} ${monedaPago}`;
    } else {
        mensajeVuelto = monedaPago === "USD" 
          ? `Vuelto: $${diff.toFixed(2)} / ${(diff * tasa).toFixed(2)} Bs`
          : `Vuelto: ${diff.toFixed(2)} Bs / $${(diff / tasa).toFixed(2)}`;
    }
  }

  const onFinalCheck = (data) => {
    if (metodo !== 'efectivo' && (!data.ult_4_ref || data.ult_4_ref.length < 4)) {
       setError("ult_4_ref", { message: "Requerido (4 dígitos)" });
       return;
    }
    if (metodo === 'efectivo' && faltaDinero) return;
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFinalCheck)} className="space-y-6">

      <div className="flex justify-between px-4 py-3 bg-white/5 rounded-lg border border-white/10 mb-4">
         <div className="text-center"><p className="text-[10px] text-white/50">USD</p><p className="text-2xl font-bold text-white">${totalUSD}</p></div>
         <div className="w-px bg-white/10"></div>
         <div className="text-center"><p className="text-[10px] text-white/50">Bolívares</p><p className="text-2xl font-bold text-white">{totalBS} Bs</p></div>
      </div>

      {metodo === 'bdv' && (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <button type="button" onClick={handleBotConnect} className="w-full py-4 rounded-xl bg-[#25D366] text-black font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-green-500/10">
            <Bot size={24} /> Solicitar al Bot
          </button>
          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-center text-white/50 mb-2">O ingresa referencia manual:</p>
            <input {...register("ult_4_ref")} maxLength={4} inputMode="numeric" placeholder="0000" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 text-center text-white text-xl focus:border-primary focus:outline-none tracking-widest transition-colors" />
            {errors.ult_4_ref && <p className="text-red-400 text-xs text-center mt-1">{errors.ult_4_ref.message}</p>}
          </div>
        </div>
      )}

      {metodo === 'otros' && (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm space-y-2">
            <p className="flex justify-between"><span className="text-white/60">Banco:</span> <span className="font-bold">Venezuela (0102)</span></p>
            <p className="flex justify-between"><span className="text-white/60">Cédula:</span> <span className="font-bold">26.597.356</span></p>
            <p className="flex justify-between"><span className="text-white/60">Teléf:</span> <span className="font-bold">0424-2929579</span></p>
          </div>
          <div>
            <label className="text-xs text-primary font-bold uppercase ml-1">Referencia</label>
            <input {...register("ult_4_ref")} maxLength={4} inputMode="numeric" placeholder="0000" className="w-full bg-black/30 border-2 border-white/20 focus:border-primary rounded-xl py-3 text-center text-white text-2xl focus:outline-none tracking-widest transition-colors" />
            {errors.ult_4_ref && <p className="text-red-400 text-xs text-center mt-1">{errors.ult_4_ref.message}</p>}
          </div>
        </div>
      )}

      {metodo === 'efectivo' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
           <div className="bg-black/20 p-4 rounded-xl border border-white/10">
            <label className="text-xs text-white/70 mb-2 block">Monto Recibido</label>
            <div className="flex gap-2">
              <input {...register("monto_recibido")} type="number" step="any" placeholder="0.00" className="flex-1 text-right text-3xl font-bold bg-transparent border-b-2 border-white/20 focus:border-primary text-white focus:outline-none pb-1" />
              <div className="relative w-28">
                  <select {...register("moneda_pago")} className="w-full h-full bg-white/10 rounded-lg text-white font-bold px-2 border border-white/10 appearance-none focus:outline-none text-black cursor-pointer">
                    <option value="USD">USD</option>
                    <option value="Bs">Bs</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
              </div>
            </div>
          </div>
          {montoRecibido > 0 && (
             <div className={`p-3 rounded-xl text-center border-2 ${faltaDinero ? 'border-red-500/50 text-red-200 bg-red-500/10' : 'border-green-500/50 text-green-300 bg-green-500/10'}`}>
               <p className="text-xl font-bold">{mensajeVuelto}</p>
             </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="w-1/3 py-3 rounded-lg bg-white/5 text-white border border-white/10 flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all">
          <ArrowLeft size={18} /> Volver
        </button>
        <button type="submit" disabled={metodo === 'efectivo' && faltaDinero} className="w-2/3 py-3 rounded-lg bg-primary text-black font-bold disabled:opacity-50 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
           Finalizar <Check size={20} />
        </button>
      </div>
    </form>
  );
}