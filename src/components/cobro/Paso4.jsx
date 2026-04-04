import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  IdCard,
  Landmark,
  Loader2,
  Phone,
  Smartphone,
} from "lucide-react";
import { FaCircleCheck } from "react-icons/fa6";

// Componentes y assets adicionales (ajusta las rutas según tu proyecto)
import { OtpReferencia } from "../OtpReferencia.jsx";
import QrAccordion from "../QrAccordion.jsx";
import bdvLogo from "/bdv-logo.webp";
import qrBdv from "/qr-bdv.webp";

// IMPORTANTE: Ajusta la ruta dependiendo de dónde guardaste tu store
import { useAlquilerStore } from "../../store/useAlquilerStore.js";

const paso4Schema = z.object({
  ult_4_ref: z.string().optional(),
  monto_recibido: z.any().optional(),
  moneda_pago: z.string().optional(),
});

export default function Paso4({ onSubmit, onBack, isSubmitting }) {
  const [envioEstado, setEnvioEstado] = useState("idle");

  // 1. Traemos la data de Zustand (incluyendo la función de cálculo)
  const cliente = useAlquilerStore((state) => state.cliente);
  const alquiler = useAlquilerStore((state) => state.alquiler);
  const pagoGlobal = useAlquilerStore((state) => state.pago);
  const setPago = useAlquilerStore((state) => state.setPago);
  const tasa = useAlquilerStore((state) => state.tasaBcv);
  
  // Obtenemos los totales ya procesados
 // 1. Traemos la función desde Zustand SIN ejecutarla adentro
  const getTotales = useAlquilerStore((state) => state.getTotales);
  
  // 2. La ejecutamos afuera con tranquilidad
  const { totalUSD, totalBS } = getTotales();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ult_4_ref: pagoGlobal.ult_4_ref,
      monto_recibido: pagoGlobal.montoRecibido || "",
      moneda_pago: pagoGlobal.monedaPago,
    },
    resolver: zodResolver(paso4Schema),
  });

  const metodo = pagoGlobal.metodo; // Viene directamente de Zustand
  const montoRecibido = watch("monto_recibido") || 0;
  const monedaPago = watch("moneda_pago");

  // Montos formateados para strings
  const montoParaUrl = totalBS.toFixed(2);
  const totalBSDisplay = totalBS.toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // --- FUNCIÓN PARA BDV (CON LINK) ---
  const handleBotConnect = async () => {
    setEnvioEstado("enviando");

    const n = cliente.nombre.trim();
    const nombreFormateado =
      n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();

    let telDestino = cliente.telefono.replace(/\D/g, "");
    if (telDestino.startsWith("0")) {
      telDestino = "58" + telDestino.substring(1);
    } else if (/^(412|422|416|426|424|414)/.test(telDestino)) {
      telDestino = "58" + telDestino;
    }

    const urlPagoMovil = `https://bdvdigital.banvenez.com/pagomovil?id=V28659024&phone=584127227017&bank=0102&description=9dxBliWt4XnVSB0LTqNasQ%3D%3D&amount=${montoParaUrl}`;

    const mensajeFormateado =
      `🚲 *HOLA, ${nombreFormateado.toUpperCase()}!*\n` +
      `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n` +
      `Aquí tienes los detalles de tu alquiler en *Biciaventuras*:\n\n` +
      `🚲 *Bicis:* ${alquiler.cantidad}\n` +
      `⏱️ *Tiempo:* ${alquiler.tiempo} min\n` +
      `💰 *Monto a pagar:* ${totalBSDisplay} Bs.\n\n` +
      `*╔════════════════════╗*\n` +
      `* 👉 [ CLICK PARA PAGAR ] 👈       *\n` +
      `*╚════════════════════╝*\n` +
      `${urlPagoMovil}\n\n` +
      `⚠️ *IMPORTANTE:*\n` +
      `Por favor realiza el pago y *envía el capture (comprobante) por este mismo chat* para verificar.\n\n` +
      `🛡️ *SEGURIDAD DEL MENOR:*\n` +
      `El niño debe presentarse con su representante o alguien mayor de edad con la referencia para la verificación del pago. En caso de mandar al niño solo, podemos llamar para verificar los datos del mismo por seguridad del menor de edad.`;

    try {
      const response = await fetch(
        "https://bot-api-biciaventuras.duckdns.org/enviar-mensaje",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numero: telDestino,
            mensaje: mensajeFormateado,
          }),
        }
      );

      if (response.ok) {
        setEnvioEstado("enviado");
        setTimeout(() => setEnvioEstado("idle"), 3500);
      } else {
        setEnvioEstado("error");
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      setEnvioEstado("error");
    }
  };

  // --- FUNCIÓN PARA OTROS BANCOS ---
  const handleBotConnectOtros = async () => {
    setEnvioEstado("enviando");

    const n = cliente.nombre.trim();
    const nombreFormateado =
      n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();

    let telDestino = cliente.telefono.replace(/\D/g, "");
    if (telDestino.startsWith("0")) {
      telDestino = "58" + telDestino.substring(1);
    } else if (/^(412|422|416|426|424|414)/.test(telDestino)) {
      telDestino = "58" + telDestino;
    }

    const mensajeFormateado =
      `🚲 *HOLA, ${nombreFormateado.toUpperCase()}!*\n` +
      `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n` +
      `Aquí tienes los datos para realizar el Pago Móvil:\n\n` +
      `🏦 *Banco:* Venezuela (0102)\n` +
      `👤 *Cédula:* 28.659.024\n` +
      `📱 *Teléfono:* 0412-722-70-17\n` +
      `💰 *Monto exacto a pagar:* ${totalBSDisplay} Bs.\n\n` +
      `⚠️ *IMPORTANTE:*\n` +
      `Por favor realiza el pago por el monto exacto y *envía el capture (comprobante) por este mismo chat* para verificar.\n\n` +
      `🛡️ *SEGURIDAD DEL MENOR:*\n` +
      `El niño debe presentarse con su representante o alguien mayor de edad con la referencia para la verificación del pago. En caso de mandar al niño solo, podemos llamar para verificar los datos del mismo por seguridad del menor de edad.`;

    try {
      const response = await fetch(
        "https://bot-api-biciaventuras.duckdns.org/enviar-mensaje",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numero: telDestino,
            mensaje: mensajeFormateado,
          }),
        }
      );

      if (response.ok) {
        setEnvioEstado("enviado");
        setTimeout(() => setEnvioEstado("idle"), 3500);
      } else {
        setEnvioEstado("error");
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      setEnvioEstado("error");
    }
  };

  let mensajeVuelto = "";
  let faltaDinero = false;
  
  if (metodo === "efectivo") {
    const target = monedaPago === "USD" ? totalUSD : totalBS;
    const diff = montoRecibido - target;
    if (diff < -0.01) {
      faltaDinero = true;
      mensajeVuelto = `Falta: ${Math.abs(diff).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${monedaPago}`;
    } else {
      mensajeVuelto =
        monedaPago === "USD"
          ? `Vuelto: $${diff.toFixed(2)} / ${(diff * tasa).toLocaleString(
              "es-VE",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )} Bs`
          : `Vuelto: ${diff.toFixed(2)} Bs / $${(diff / tasa).toLocaleString(
              "es-VE",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}`;
    }
  }

  const onFinalCheck = (data) => {
    if (
      metodo !== "efectivo" &&
      (!data.ult_4_ref || data.ult_4_ref.length < 4)
    ) {
      setError("ult_4_ref", { message: "Requerido (4 dígitos)" });
      return;
    }
    if (metodo === "efectivo" && faltaDinero) return;

    // Guardamos la última info en Zustand
    setPago({
      ult_4_ref: data.ult_4_ref,
      montoRecibido: data.monto_recibido,
      monedaPago: data.moneda_pago,
    });

    // Inyectamos todo directo a la función de envío (que vive en el Componente Principal)
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit(onFinalCheck)} className="space-y-6">
      <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
        Monto a pagar
      </p>
      <div className="px-5 py-4 bg-linear-to-br from-white/10 to-black/30 rounded-xl mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between">
          {/* USD */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-widest text-primary/80 font-bold">
              USD
            </span>
            <span className="text-3xl font-black text-white tracking-tight">
              ${totalUSD}
            </span>
          </div>

          {/* DIVIDER */}
          <div className="w-px h-10 bg-white/15"></div>

          {/* BS */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-widest text-primary/80 font-bold">
              Bolívares
            </span>
            <span className="text-3xl font-black text-white tracking-tight">
              {totalBSDisplay} <span className="text-white/60 text-xl">Bs</span>
            </span>
          </div>
        </div>
      </div>

      {metodo === "bdv" && (
        <div className="space-y-5 animate-in zoom-in-95 duration-300">
          <button
            type="button"
            onClick={handleBotConnect}
            disabled={envioEstado === "enviando"}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-semibold transition-all duration-300 ease-out hover:bg-white/20 active:scale-[0.98] disabled:opacity-70"
          >
            <div className="w-7 h-7 flex items-center justify-center">
              {envioEstado === "enviando" ? (
                <Loader2 className="w-6 h-6 animate-spin text-white/90" />
              ) : envioEstado === "enviado" ? (
                <FaCircleCheck className="w-6 h-6 text-green-400 animate-[pop_0.35s_ease-out]" />
              ) : (
                <img
                  src={bdvLogo}
                  alt="BDV"
                  className="w-6 h-6 object-contain transition-transform duration-300 group-hover:scale-110"
                />
              )}
            </div>
            <span className="tracking-wide min-w-[140px] text-center transition-opacity duration-300">
              {envioEstado === "enviando"
                ? "Enviando..."
                : envioEstado === "enviado"
                ? "Enviado"
                : "Enviar datos BDV"}
            </span>
          </button>
          <QrAccordion src={qrBdv} alt="BDV QR" />
          <div className="border-t border-white/10 pt-4">
            <OtpReferencia register={register} setValue={setValue} errors={errors} />
          </div>
        </div>
      )}

      {metodo === "otros" && (
        <div className="space-y-5 animate-in zoom-in-95 duration-300">
          <button
            type="button"
            onClick={handleBotConnectOtros}
            disabled={envioEstado === "enviando"}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-semibold transition-all duration-300 ease-out hover:bg-white/20 active:scale-[0.98] disabled:opacity-70"
          >
            <div className="w-7 h-7 flex items-center justify-center">
              {envioEstado === "enviando" ? (
                <Loader2 className="w-6 h-6 animate-spin text-white/90" />
              ) : envioEstado === "enviado" ? (
                <FaCircleCheck className="w-6 h-6 text-green-400 animate-[pop_0.35s_ease-out]" />
              ) : (
                <Smartphone className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" />
              )}
            </div>
            <span className="tracking-wide min-w-[140px] text-center transition-opacity duration-300">
              {envioEstado === "enviando"
                ? "Enviando..."
                : envioEstado === "enviado"
                ? "Enviado"
                : "Enviar datos Pago Móvil"}
            </span>
          </button>

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
              <span className="font-bold text-white">28.659.024</span>
            </div>
            <div className="h-px bg-white/10"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Phone size={16} />
                <span>Teléfono</span>
              </div>
              <span className="font-bold text-white">0412-722-70-17</span>
            </div>
          </div>

          <QrAccordion src={qrBdv} alt="BDV QR" />
          <div className="border-t border-white/10 pt-4">
            <OtpReferencia register={register} setValue={setValue} errors={errors} />
          </div>
        </div>
      )}

      {metodo === "efectivo" && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-1 transition-all duration-300 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
            <label className="absolute top-2 left-4 text-[10px] font-bold text-primary uppercase tracking-widest pointer-events-none">
              Monto Recibido
            </label>
            <div className="flex items-end justify-between px-4 pb-2 pt-5">
              <input
                {...register("monto_recibido")}
                type="number"
                step="any"
                placeholder="0.00"
                className="w-full bg-transparent text-4xl font-black text-white placeholder-white/10 focus:outline-none tabular-nums tracking-tighter"
              />
              <div className="relative shrink-0 ml-2 mb-1">
                <select
                  {...register("moneda_pago")}
                  className="appearance-none bg-black/40 hover:bg-black/60 text-white font-bold py-2 pl-4 pr-10 rounded-lg border border-white/10 focus:border-primary focus:outline-none transition-colors cursor-pointer text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="Bs">Bs</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
              </div>
            </div>
          </div>

          {montoRecibido > 0 && (
            <div
              className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 shadow-xl ${
                faltaDinero
                  ? "bg-red-500/10 border-red-500/50 text-red-200"
                  : "bg-emerald-500/10 border-emerald-500/50 text-emerald-200"
              }`}
            >
              <div className="flex items-center justify-center gap-3 relative z-10">
                <div
                  className={`p-2 rounded-full ${
                    faltaDinero ? "bg-red-500/20" : "bg-emerald-500/20"
                  }`}
                >
                  {faltaDinero ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : (
                    <Check className="w-6 h-6" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold uppercase opacity-70 tracking-widest">
                    {faltaDinero ? "Insuficiente" : "Entregar Cambio"}
                  </p>
                  <p className="text-2xl font-black tracking-tight leading-none mt-1">
                    {mensajeVuelto.replace("Falta: ", "").replace("Vuelto: ", "")}
                  </p>
                </div>
              </div>
              <div
                className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${
                  faltaDinero ? "bg-red-500" : "bg-emerald-500"
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
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-lg bg-white/10 text-white flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <ChevronLeft size={18} /> Atrás
        </button>

        <button
          type="submit"
          disabled={isSubmitting || (metodo === "efectivo" && faltaDinero)}
          className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold disabled:opacity-50 hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
            </>
          ) : (
            <>
              Finalizar <FaCircleCheck size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}