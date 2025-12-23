import { Formity } from "@formity/react";
import { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from '../supabase/client.js';

import Navbar from "../components/Navbar";

export default function Cobro() {
  const [tasa, setTasa] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. OBTENER TASA
  useEffect(() => {
    const fetchTasa = async () => {
      try {
        const res = await fetch("https://bici-aventuras-app.vercel.app/api/tasa");
        const data = await res.json();
        const precio = data.monitors?.usd?.price || data.price || 0;
        
        if (precio > 0) setTasa(Number(precio));
        else throw new Error("Precio inválido");
      } catch (err) {
        console.error("Error API:", err);
        setTasa(60.00); // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchTasa();
  }, []);

  // 2. ESQUEMA DEL FORMULARIO (ESTRUCTURA EXPLÍCITA)
  const schema = [
    // --- PASO 1: DATOS DEL CLIENTE ---
    {
      form: {
        values: () => ({
          nombre: ["", []],
          apellido: ["", []],
          cedula: ["", []],
          telefono: ["", []],
        }),
        render: ({ values, onNext }) => {
          const form = useForm({
            defaultValues: values,
            resolver: zodResolver(z.object({
                nombre: z.string().min(1, "Requerido"),
                apellido: z.string().min(1, "Requerido"),
                cedula: z.string().min(6, "Mínimo 6 dígitos"),
                telefono: z.string().min(10, "Mínimo 10 dígitos"),
            }))
          });
          
          const handleNumeric = (e) => e.target.value = e.target.value.replace(/[^0-9]/g, "");

          return (
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-5">
              <h2 className="text-xl font-semibold text-white">1. Datos del Cliente</h2>
              <input {...form.register("nombre")} placeholder="Nombre" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary" />
              <input {...form.register("apellido")} placeholder="Apellido" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary" />
              <input {...form.register("cedula")} onInput={handleNumeric} inputMode="numeric" placeholder="Cédula" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary" />
              <input {...form.register("telefono")} onInput={handleNumeric} inputMode="numeric" placeholder="WhatsApp" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary" />
              <button type="submit" className="w-full py-3 rounded-lg bg-primary text-black font-semibold">Siguiente</button>
            </form>
          );
        },
      },
    },

    // --- PASO 2: PEDIDO ---
    {
      form: {
        // RECIBIMOS explícitamente los datos del paso 1
        values: (prev) => ({
          nombre: [prev.nombre, []],
          apellido: [prev.apellido, []],
          cedula: [prev.cedula, []],
          telefono: [prev.telefono, []],
          // Nuevos campos
          cantidad: [1, []],
          tiempo: ["10", []],
        }),
        render: ({ values, onNext, onBack }) => {
          const form = useForm({ defaultValues: values });
          
          const cant = form.watch("cantidad");
          const time = form.watch("tiempo");
          const precioUsd = time === "10" ? 2 : 3;
          const totalUsd = cant * precioUsd;
          const totalBs = (totalUsd * tasa).toFixed(2);

          return (
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
              <h2 className="text-xl font-semibold text-white">2. Detalles</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Bicicletas</label>
                  <select {...form.register("cantidad")} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-lg">
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n} className="text-black">{n}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Duración</label>
                  <select {...form.register("tiempo")} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-lg">
                    <option value="10" className="text-black">10 Min</option>
                    <option value="20" className="text-black">20 Min</option>
                  </select>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-black border border-primary/30 rounded-2xl p-6 text-center">
                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">Total</p>
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-black text-white tracking-tight">${totalUsd}</span>
                  <div className="w-full h-px bg-white/10 my-2"></div>
                  <span className="text-3xl font-bold text-white/90">{totalBs} Bs</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onBack} className="flex-1 py-3 rounded-lg bg-white/10 text-white">Atrás</button>
                <button type="submit" className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold">Continuar</button>
              </div>
            </form>
          );
        },
      },
    },

    // --- PASO 3: MÉTODO DE PAGO ---
    {
      form: {
        // Arrastramos todo lo anterior explícitamente
        values: (prev) => ({
          nombre: [prev.nombre, []],
          apellido: [prev.apellido, []],
          cedula: [prev.cedula, []],
          telefono: [prev.telefono, []],
          cantidad: [prev.cantidad, []],
          tiempo: [prev.tiempo, []],
          // Nuevo campo
          metodo_pago: ["bdv", []],
        }),
        render: ({ values, onNext, onBack }) => {
          const form = useForm({ defaultValues: values });
          const opciones = [
            { id: "bdv", label: "Banco de Venezuela", icon: "🏦" },
            { id: "otros", label: "Otros Bancos", icon: "📲" },
            { id: "efectivo", label: "Efectivo", icon: "💵" },
          ];

          return (
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-5">
              <h2 className="text-xl font-semibold text-white">3. Pago</h2>
              <div className="space-y-3">
                {opciones.map((op) => (
                  <label key={op.id} className="flex items-center p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                    <span className="text-2xl mr-4">{op.icon}</span>
                    <span className="text-white font-bold flex-1">{op.label}</span>
                    <input type="radio" {...form.register("metodo_pago")} value={op.id} className="w-5 h-5 accent-primary" />
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onBack} className="flex-1 py-3 rounded-lg bg-white/10 text-white">Atrás</button>
                <button type="submit" className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold">Siguiente</button>
              </div>
            </form>
          );
        },
      },
    },

    // --- PASO 4: FINALIZAR ---
    {
      form: {
        // Arrastramos TODO lo anterior
        values: (prev) => ({
          nombre: [prev.nombre, []],
          apellido: [prev.apellido, []],
          cedula: [prev.cedula, []],
          telefono: [prev.telefono, []],
          cantidad: [prev.cantidad, []],
          tiempo: [prev.tiempo, []],
          metodo_pago: [prev.metodo_pago, []],
          // Campos finales
          ult_4_ref: ["", []],
          monto_recibido: ["", []],
          moneda_pago: ["USD", []],
        }),
        render: ({ values, onNext, onBack }) => {
          const metodo = values.metodo_pago;
          const cantidad = values.cantidad;
          const tiempo = values.tiempo;
          
          const totalUSD = cantidad * (tiempo === "10" ? 2 : 3);
          const totalBS = (totalUSD * tasa).toFixed(2);

          const form = useForm({
            defaultValues: values,
            resolver: zodResolver(
              z.object({
                // Validación estricta: si no es efectivo, referencia obligatoria (4 chars)
                ult_4_ref: metodo !== 'efectivo' ? z.string().min(4, "Faltan dígitos") : z.any(),
                // Si es efectivo, validar que el monto no esté vacío
                monto_recibido: metodo === 'efectivo' ? z.coerce.number().min(0.01, "Ingrese monto") : z.any(),
              })
            ),
          });

          const handleBotConnect = async () => {
             alert("🤖 Conectando con Bot (Simulado)...");
          };

          const montoRecibido = form.watch("monto_recibido") || 0;
          const monedaPago = form.watch("moneda_pago");
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

          return (
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
              <h2 className="text-xl font-bold text-white text-center mb-4">
                 {metodo === 'efectivo' ? 'Cobro en Efectivo' : 'Confirmar Pago'}
              </h2>

              {/* VISUALIZACIÓN DE MONTO FINAL */}
              <div className="flex justify-between px-4 py-3 bg-white/5 rounded-lg border border-white/10 mb-4">
                 <div className="text-center"><p className="text-[10px] text-white/50">USD</p><p className="text-2xl font-bold text-white">${totalUSD}</p></div>
                 <div className="w-px bg-white/10"></div>
                 <div className="text-center"><p className="text-[10px] text-white/50">Bolívares</p><p className="text-2xl font-bold text-white">{totalBS} Bs</p></div>
              </div>

              {/* CASO A: BDV */}
              {metodo === 'bdv' && (
                <div className="space-y-4">
                  <button type="button" onClick={handleBotConnect} className="w-full py-4 rounded-xl bg-[#25D366] text-black font-bold flex items-center justify-center gap-2 hover:brightness-110">
                    <span className="text-xl">🤖</span> Solicitar al Bot
                  </button>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-center text-white/50 mb-2">O ingresa referencia manual:</p>
                    <input {...form.register("ult_4_ref")} maxLength={4} inputMode="numeric" placeholder="0000" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 text-center text-white text-xl focus:border-primary focus:outline-none tracking-widest" />
                    {form.formState.errors.ult_4_ref && <p className="text-red-400 text-xs text-center mt-1">Requerido (4 dígitos)</p>}
                  </div>
                </div>
              )}

              {/* CASO B: OTROS */}
              {metodo === 'otros' && (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm space-y-2">
                    <p className="flex justify-between"><span className="text-white/60">Banco:</span> <span className="font-bold">Venezuela (0102)</span></p>
                    <p className="flex justify-between"><span className="text-white/60">Cédula:</span> <span className="font-bold">26.597.356</span></p>
                    <p className="flex justify-between"><span className="text-white/60">Teléf:</span> <span className="font-bold">0424-2929579</span></p>
                  </div>
                  <div>
                    <label className="text-xs text-primary font-bold uppercase ml-1">Referencia</label>
                    <input {...form.register("ult_4_ref")} maxLength={4} inputMode="numeric" placeholder="0000" className="w-full bg-black/30 border-2 border-white/20 focus:border-primary rounded-xl py-3 text-center text-white text-2xl focus:outline-none tracking-widest" />
                    {form.formState.errors.ult_4_ref && <p className="text-red-400 text-xs text-center mt-1">Requerido</p>}
                  </div>
                </div>
              )}

              {/* CASO C: EFECTIVO */}
              {metodo === 'efectivo' && (
                <div className="space-y-4">
                   <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                    <label className="text-xs text-white/70 mb-2 block">Monto Recibido</label>
                    <div className="flex gap-2">
                      <input {...form.register("monto_recibido")} type="number" step="any" placeholder="0.00" className="flex-1 text-right text-3xl font-bold bg-transparent border-b-2 border-white/20 focus:border-primary text-white focus:outline-none pb-1" />
                      <select {...form.register("moneda_pago")} className="bg-white/10 rounded-lg text-white font-bold px-2 border border-white/10 text-black">
                        <option value="USD" className="text-black">$ USD</option>
                        <option value="Bs" className="text-black">Bs</option>
                      </select>
                    </div>
                  </div>
                  {montoRecibido > 0 && (
                     <div className={`p-3 rounded-xl text-center border-2 ${faltaDinero ? 'border-red-500/50 text-red-200' : 'border-green-500/50 text-green-300'}`}>
                       <p className="text-xl font-bold">{mensajeVuelto}</p>
                     </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onBack} className="w-1/3 py-3 rounded-lg bg-white/5 text-white border border-white/10">Volver</button>
                <button 
                  type="submit" 
                  disabled={metodo === 'efectivo' && faltaDinero} 
                  className="w-2/3 py-3 rounded-lg bg-primary text-black font-bold disabled:opacity-50 hover:brightness-110"
                >
                  Finalizar
                </button>
              </div>
            </form>
          );
        },
      },
    },
    {
      return: (values) => values,
    },
  ];

  // 3. GUARDAR DATOS
  const onReturn = useCallback(async (data) => {
    console.log("Datos recibidos para guardar:", data);
    const precioUsd = data.tiempo === "10" ? 2 : 3;
    const montoBs = (data.cantidad * precioUsd * tasa).toFixed(2);

    try {
      const { error } = await supabase
        .from('ventas-biciaventuras')
        .insert([{
          cedula_cliente: data.cedula,
          nombre_cliente: `${data.nombre} ${data.apellido}`,
          telefono_cliente: data.telefono,
          cantidad_bicicletas: data.cantidad,
          tiempo_alquiler: `${data.tiempo} min`,
          monto_exacto_bs: parseFloat(montoBs),
          tasa_bcv: tasa,
          ult_4_ref: data.ult_4_ref || 'EFECTIVO',
          pagado: true,
          metodo_pago: data.metodo_pago
        }]);

      if (error) throw error;
      alert("¡Venta registrada!");
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("Error guardando: " + error.message);
    }
  }, [tasa]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary">Cargando...</div>;

  return (
    <div className="min-h-screen text-white bg-black/95">
      <Navbar />
      <div className="pt-28 px-4 max-w-md mx-auto pb-10">
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
          <Formity schema={schema} onReturn={onReturn} />
        </div>
      </div>
    </div>
  );
}