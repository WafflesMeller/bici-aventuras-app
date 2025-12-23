import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../supabase/client.js';
import Navbar from '../components/Navbar';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Banknote,
  Smartphone,
  Loader2,
  Minus,
  Plus,
  Clock,
  AlertCircle,
  Landmark,
  Phone,
  User, 
  IdCard
} from 'lucide-react';
import { FaWhatsapp } from "react-icons/fa";

import bdvLogo from '/bdv-logo.png';
import qrBdv from '/qr-bdv.jpeg';
import { OtpReferencia } from '../components/OtpReferencia.jsx';
import QrAccordion from '../components/QrAccordion.jsx';
import { CircularLoading } from 'respinner';

// --- VALIDACIONES ---
const paso1Schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  cedula: z.string().min(6, 'Cédula inválida'),
  telefono: z.string().min(10, 'Teléfono inválido'),
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
  const [tasa, setTasa] = useState(60.0);
  const [direction, setDirection] = useState('forward');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    cantidad: 1,
    tiempo: '10',
    metodo_pago: 'bdv',
    ult_4_ref: '',
    monto_recibido: '',
    moneda_pago: 'USD',
  });

  useEffect(() => {
    const fetchTasa = async () => {
      try {
        const res = await fetch('https://bici-aventuras-app.vercel.app/api/tasa?t=' + Date.now());
        if (!res.ok) throw new Error('Error API');
        const data = await res.json();
        const precio = data.current?.usd || data.price || 0;
        if (precio > 0) setTasa(Number(precio));
      } catch (err) {
        console.error('Usando tasa base:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasa();
  }, []);

  const handleNextStep = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setDirection('forward');
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection('backward');
    setStep((prev) => prev - 1);
  };

  const handleFinalSubmit = async (finalData) => {
    const fullData = { ...formData, ...finalData };
    const precioUsd = fullData.tiempo === '10' ? 2 : 3;
    const montoBs = (fullData.cantidad * precioUsd * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    try {
      const { error } = await supabase.from('ventas-biciaventuras').insert([
        {
          cedula_cliente: fullData.cedula,
          nombre_cliente: `${fullData.nombre} ${fullData.apellido}`,
          telefono_cliente: fullData.telefono,
          cantidad_bicicletas: fullData.cantidad,
          tiempo_alquiler: `${fullData.tiempo} min`,
          monto_exacto_bs: parseFloat(montoBs),
          tasa_bcv: tasa,
          ult_4_ref: fullData.ult_4_ref || 'EFECTIVO',
          pagado: true,
          metodo_pago: fullData.metodo_pago,
        },
      ]);

      if (error) throw error;
      alert('¡Venta registrada exitosamente!');
      window.location.reload();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-primary gap-2">
        <CircularLoading color="#00ff7f" size={80} />
      </div>
    );

  const animationClass = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left';

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <div className="pt-28 px-4 max-w-md mx-auto pb-10">
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 overflow-hidden">
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">PASO {step} DE 4</span>
                <h2 className="text-lg font-bold text-white uppercase leading-none mt-1">
                  {step === 1 && 'Datos del Cliente'}
                  {step === 2 && 'Detalles del Alquiler'}
                  {step === 3 && 'Método de Pago'}
                  {step === 4 && 'Confirmar Pago'}
                </h2>
              </div>
              <div className="text-xs text-white/30 font-mono">{Math.round((step / 4) * 100)}%</div>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary),0.4)]"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <div key={step} className={animationClass}>
            {step === 1 && <Paso1 onNext={handleNextStep} defaultValues={formData} />}
            {step === 2 && <Paso2 onNext={handleNextStep} onBack={handleBack} defaultValues={formData} tasa={tasa} />}
            {step === 3 && <Paso3 onNext={handleNextStep} onBack={handleBack} defaultValues={formData} />}
            {step === 4 && (
              <Paso4 onSubmit={handleFinalSubmit} onBack={handleBack} defaultValues={formData} tasa={tasa} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PASO 1 ---
function Paso1({ onNext, defaultValues }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: zodResolver(paso1Schema),
  });

  const handleNumeric = (e) => (e.target.value = e.target.value.replace(/[^0-9]/g, ''));

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
<div className="space-y-4">

  {/* NOMBRE */}
  <div className="space-y-1">
    <label className="flex items-center gap-2 text-xs text-white/60 font-semibold">
      <User className="w-4 h-4 text-white/40" />
      Nombre
    </label>
    <input
      {...register("nombre")}
      placeholder="Nombre del cliente"
      className="
        w-full px-4 py-3
        rounded-xl
        bg-white/5
        border border-white/10
        text-white
        focus:outline-none
        focus:border-primary
        transition-colors
      "
    />
    {errors.nombre && (
      <p className="text-red-400 text-xs">{errors.nombre.message}</p>
    )}
  </div>

  {/* APELLIDO */}
  <div className="space-y-1">
    <label className="flex items-center gap-2 text-xs text-white/60 font-semibold">
      <User className="w-4 h-4 text-white/40" />
      Apellido
    </label>
    <input
      {...register("apellido")}
      placeholder="Apellido del cliente"
      className="
        w-full px-4 py-3
        rounded-xl
        bg-white/5
        border border-white/10
        text-white
        focus:outline-none
        focus:border-primary
        transition-colors
      "
    />
    {errors.apellido && (
      <p className="text-red-400 text-xs">{errors.apellido.message}</p>
    )}
  </div>

  {/* CÉDULA */}
  <div className="space-y-1">
    <label className="flex items-center gap-2 text-xs text-white/60 font-semibold">
      <IdCard className="w-4 h-4 text-white/40" />
      Cédula
    </label>
    <input
      {...register("cedula")}
      onInput={handleNumeric}
      inputMode="numeric"
      placeholder="Ej: 26597356"
      className="
        w-full px-4 py-3
        rounded-xl
        bg-white/5
        border border-white/10
        text-white
        focus:outline-none
        focus:border-primary
        transition-colors
      "
    />
    {errors.cedula && (
      <p className="text-red-400 text-xs">{errors.cedula.message}</p>
    )}
  </div>

  {/* TELÉFONO */}
  <div className="space-y-1">
    <label className="flex items-center gap-2 text-xs text-white/60 font-semibold">
      <FaWhatsapp className="w-4 h-4 text-white/40" />
      WhatsApp
    </label>
    <input
      {...register("telefono")}
      onInput={handleNumeric}
      inputMode="numeric"
      placeholder="Ej: 04241234567"
      className="
        w-full px-4 py-3
        rounded-xl
        bg-white/5
        border border-white/10
        text-white
        focus:outline-none
        focus:border-primary
        transition-colors
      "
    />
    {errors.telefono && (
      <p className="text-red-400 text-xs">{errors.telefono.message}</p>
    )}
  </div>

</div>


      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-primary text-black font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
      >
        Siguiente <ArrowRight size={20} />
      </button>
    </form>
  );
}

// --- PASO 2 ---
function Paso2({ onNext, onBack, defaultValues, tasa }) {
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues,
    resolver: zodResolver(paso2Schema),
  });

  const cant = watch('cantidad');
  const time = watch('tiempo');
  const precioUsd = time === '10' ? 2 : 3;
  const totalUsd = cant * precioUsd;
  const totalBs = (totalUsd * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="grid gap-4">
        {/* TOTAL */}
        <div className="bg-linear-to-br from-primary/20 to-black border border-primary/30 rounded-2xl p-6 text-center ">
          <p className="text-sm text-primary font-bold uppercase tracking-widest mb-2">Total</p>

          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-white tracking-tight">${totalUsd}</span>

            <div className="w-full h-px bg-white/10 my-2"></div>

            <span className="text-3xl font-bold text-white/90">{totalBs} Bs</span>
          </div>

          <p className="text-sm text-white/40 mt-1">Tasa: {tasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs</p>
        </div>
        {/* CANTIDAD (CONTADOR) */}
        <div className="space-y-2">
          <label className="text-sm text-white/60">Bicicletas</label>

          <div className="flex items-center justify-between bg-white/10 border border-white/10 rounded-xl p-3">
            <button
              type="button"
              onClick={() => {
                const v = Math.max(1, Number(watch('cantidad')) - 1);
                setValue('cantidad', v);
              }}
              className="w-10 h-10 rounded-lg bg-black/30 text-white flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
            >
              <Minus size={18} />
            </button>

            <span className="text-3xl font-black text-white transition-all scale-100">{watch('cantidad')}</span>

            <button
              type="button"
              onClick={() => {
                const v = Math.min(100, Number(watch('cantidad')) + 1);
                setValue('cantidad', v);
              }}
              className="w-10 h-10 rounded-lg bg-black/30 text-white flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
          <input type="hidden" {...register('cantidad')} />
        </div>

        {/* DURACIÓN (BOTONES) */}
        <div className="space-y-2">
          <label className="text-sm text-white/60">Duración</label>

          <div className="grid grid-cols-2 gap-2">
            {[
              { value: '10', label: '10 Min' },
              { value: '20', label: '20 Min' },
            ].map((opt) => {
              const active = watch('tiempo') === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('tiempo', opt.value)}
                  className={`
                    flex items-center justify-center gap-2
                    py-3 rounded-xl font-semibold
                    border transition-all
                    ${
                      active
                        ? 'bg-primary text-black border-primary scale-[1.02]'
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                    }
                    active:scale-95
                  `}
                >
                  <Clock size={18} />
                  {opt.label}
                </button>
              );
            })}
          </div>
          <input type="hidden" {...register('tiempo')} />
        </div>
      </div>

      {/* BOTONES NAVEGACIÓN */}
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
          className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
        >
          Siguiente <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}

// --- PASO 3 ---
function Paso3({ onNext, onBack, defaultValues }) {
  const { register, handleSubmit } = useForm({
    defaultValues,
    resolver: zodResolver(paso3Schema),
  });

  const opciones = [
    {
      id: 'bdv',
      label: 'Banco de Venezuela BDV',
      image: bdvLogo,
    },
    {
      id: 'otros',
      label: 'Otros Bancos',
      icon: <Smartphone className="w-6 h-6 text-blue-400" />,
    },
    {
      id: 'efectivo',
      label: 'Efectivo',
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
              has-checked:border-primary
              has-checked:bg-primary/10
              hover:bg-white/10
              transition-all
            "
          >
            <span className="mr-4 flex items-center justify-center w-8 h-8">
              {op.image ? <img src={op.image} alt={op.label} className="w-8 h-8 object-contain" /> : op.icon}
            </span>

            <span className="text-white/90 font-semibold flex-1">{op.label}</span>

            <input
              type="radio"
              {...register('metodo_pago')}
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
          className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
        >
          Siguiente <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}

// --- PASO 4 ---
function Paso4({ onSubmit, onBack, defaultValues, tasa }) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: zodResolver(paso4Schema),
  });

  const metodo = watch('metodo_pago');
  const montoRecibido = watch('monto_recibido') || 0;
  const monedaPago = watch('moneda_pago');

  const totalUSD = defaultValues.cantidad * (defaultValues.tiempo === '10' ? 2 : 3);
  const totalBS = (totalUSD * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleBotConnect = () => alert('🤖 Conectando...');

  let mensajeVuelto = '';
  let faltaDinero = false;
  if (metodo === 'efectivo') {
    const target = monedaPago === 'USD' ? totalUSD : parseFloat(totalBS);
    const diff = montoRecibido - target;
    if (diff < -0.01) {
      faltaDinero = true;
      mensajeVuelto = `Falta: ${Math.abs(diff).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${monedaPago}`;
    } else {
      mensajeVuelto =
        monedaPago === 'USD'
          ? `Vuelto: $${diff.toFixed(2)} / ${(diff * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`
          : `Vuelto: ${diff.toFixed(2)} Bs / $${(diff / tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  const onFinalCheck = (data) => {
    if (metodo !== 'efectivo' && (!data.ult_4_ref || data.ult_4_ref.length < 4)) {
      setError('ult_4_ref', { message: 'Requerido (4 dígitos)' });
      return;
    }
    if (metodo === 'efectivo' && faltaDinero) return;

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFinalCheck)} className="space-y-6">
      <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Monto a pagar</p>
      <div className="px-5 py-4 bg-linear-to-br from-white/10 to-black/30 rounded-xl mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between">
          {/* USD */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-widest text-primary/80 font-bold">USD</span>
            <span className="text-3xl font-black text-white tracking-tight">${totalUSD}</span>
          </div>

          {/* DIVIDER */}
          <div className="w-px h-10 bg-white/15"></div>

          {/* BS */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-widest text-primary/80 font-bold">Bolívares</span>
            <span className="text-3xl font-black text-white tracking-tight">
              {totalBS} <span className="text-white/60 text-xl">Bs</span>
            </span>
          </div>
        </div>
      </div>

      {metodo === 'bdv' && (
        <div className="space-y-5 animate-in zoom-in-95 duration-300">
          {/* BOTÓN BDV */}
          <button
            type="button"
            onClick={handleBotConnect}
            className="
      w-full
      flex items-center justify-center gap-2
      py-3
      rounded-xl 
      bg-white/10
      text-white font-semibold
      hover:bg-white/20 active:scale-95 transition-all
    "
          >
            {/* LOGO */}
            <div className="p-1">
              <img src={bdvLogo} alt="Banco de Venezuela" className="w-7 h-7 object-contain" />
            </div>

            <span className="tracking-wide">Enviar datos BDV</span>
          </button>

          {/* QR */}
          <QrAccordion src={qrBdv} alt="BDV QR" />

          {/* OTP */}
          <div className="border-t border-white/10 pt-4">
            <OtpReferencia register={register} setValue={setValue} errors={errors} />
          </div>
        </div>
      )}

      {metodo === 'otros' && (
        <div className="space-y-5 animate-in zoom-in-95 duration-300">
          <div className="bg-linear-to-br from-white/10 to-black/30  rounded-2xl p-5 text-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Landmark size={16} />
                <span>Banco</span>
              </div>
              <span className="font-bold text-white">
                Venezuela <span className="text-white/40">(0102)</span>
              </span>
            </div>

            <div className="h-px bg-white/10"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <IdCard size={16} />
                <span>Cédula</span>
              </div>
              <span className="font-bold text-white">26.597.356</span>
            </div>

            <div className="h-px bg-white/10"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Phone size={16} />
                <span>Teléfono</span>
              </div>
              <span className="font-bold text-white">0424-2929579</span>
            </div>
          </div>

          <QrAccordion src={qrBdv} alt="BDV QR" />

          <div className="border-t border-white/10 pt-4">
            <OtpReferencia register={register} setValue={setValue} errors={errors} />
          </div>
        </div>
      )}

      {metodo === 'efectivo' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          {/* CÁPSULA DE INPUT PRINCIPAL */}
          <div className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-1 transition-all duration-300 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
            <label className="absolute top-2 left-4 text-[10px] font-bold text-primary uppercase tracking-widest pointer-events-none">
              Monto Recibido
            </label>

            <div className="flex items-end justify-between px-4 pb-2 pt-5">
              {/* INPUT NUMÉRICO GIGANTE */}
              <input
                {...register('monto_recibido')}
                type="number"
                step="any"
                placeholder="0.00"
                className="w-full bg-transparent text-4xl font-black text-white placeholder-white/10 focus:outline-none tabular-nums tracking-tighter"
              />

              {/* SELECTOR DE MONEDA ESTILIZADO */}
              <div className="relative shrink-0 ml-2 mb-1">
                <select
                  {...register('moneda_pago')}
                  className="appearance-none bg-black/40 hover:bg-black/60 text-white font-bold py-2 pl-4 pr-10 rounded-lg border border-white/10 focus:border-primary focus:outline-none transition-colors cursor-pointer text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="Bs">Bs</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
              </div>
            </div>
          </div>

          {/* TARJETA DE RESULTADO (VUELTO O FALTA) */}
          {montoRecibido > 0 && (
            <div
              className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 shadow-xl ${
                faltaDinero
                  ? 'bg-red-500/10 border-red-500/50 text-red-200'
                  : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-center gap-3 relative z-10">
                {/* ICONO DINÁMICO */}
                <div className={`p-2 rounded-full ${faltaDinero ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                  {faltaDinero ? <AlertCircle className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold uppercase opacity-70 tracking-widest">
                    {faltaDinero ? 'Insuficiente' : 'Entregar Cambio'}
                  </p>
                  <p className="text-2xl font-black tracking-tight leading-none mt-1">
                    {mensajeVuelto.replace('Falta: ', '').replace('Vuelto: ', '')}
                  </p>
                </div>
              </div>

              {/* FONDO DECORATIVO */}
              <div
                className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${
                  faltaDinero ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-lg bg-white/10 text-white flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} /> Volver
        </button>
        <button
          type="submit"
          disabled={metodo === 'efectivo' && faltaDinero}
          className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold disabled:opacity-50 hover:brightness-110 active:scale-95 flex items-center justify-center gap-2  transition-all"
        >
          Finalizar <Check size={18} />
        </button>
      </div>
    </form>
  );
}
