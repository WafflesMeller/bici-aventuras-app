import { Formity } from "@formity/react";
import { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from '../supabase/client.js';

import Navbar from "../components/Navbar";

export default function Cobro() {
  // 1. ESTADOS
  const [tasa, setTasa] = useState(0);
  const [loading, setLoading] = useState(true);

  // 2. FUNCIÓN MÁGICA (ESTA ES LA SOLUCIÓN AL ERROR DE FORMITY)
  // Convierte los datos planos del paso anterior al formato que Formity exige: ["valor", []]
  const recoverData = (prev) => {
    const data = {};
    if (!prev) return data;
    Object.keys(prev).forEach((key) => {
      data[key] = [prev[key], []];
    });
    return data;
  };

// 3. OBTENER TASA (CORREGIDO)
  useEffect(() => {
    const fetchTasa = async () => {
      try {
        // CORRECCIÓN: Usamos la URL absoluta de una API pública confiable
        const res = await fetch("https://bici-aventuras-app.vercel.app/api/tasa");
        
        if (!res.ok) throw new Error("Error al conectar con la API");

        const data = await res.json();
        console.log("Datos API:", data); // Para que veas la estructura en consola

        // La API de PyDolarVenezuela devuelve la tasa en: data.monitors.usd.price
        const precio = data.monitors?.usd?.price || data.price || 0;
        
        if (precio > 0) {
            setTasa(Number(precio));
        } else {
            throw new Error("No se encontró el precio en la respuesta");
        }
      } catch (err) {
        console.error("Error obteniendo tasa, usando manual:", err);
        setTasa(60.00); // Tasa de respaldo manual si falla la API
      } finally {
        setLoading(false);
      }
    };
    fetchTasa();
  }, []);

  // 4. EL ESQUEMA DEL FORMULARIO
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
            resolver: zodResolver(
              z.object({
                nombre: z.string().min(1, "Requerido"),
                apellido: z.string().min(1, "Requerido"),
                cedula: z.string().min(6, "Mínimo 6 dígitos"),
                telefono: z.string().min(10, "Mínimo 10 dígitos"),
              })
            ),
          });
          
          const handleNumeric = (e) => e.target.value = e.target.value.replace(/[^0-9]/g, "");

          return (
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-5">
              <h2 className="text-xl font-semibold text-white">1. Datos del Cliente</h2>
              <input {...form.register("nombre")} placeholder="Nombre" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary focus:outline-none" />
              <input {...form.register("apellido")} placeholder="Apellido" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary focus:outline-none" />
              <input {...form.register("cedula")} onInput={handleNumeric} inputMode="numeric" placeholder="Cédula" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary focus:outline-none" />
              <input {...form.register("telefono")} onInput={handleNumeric} inputMode="numeric" placeholder="WhatsApp (Ej: 0412...)" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-primary focus:outline-none" />
              <button type="submit" className="w-full py-3 rounded-lg bg-primary text-black font-semibold">Siguiente</button>
            </form>
          );
        },
      },
    },

    // --- PASO 2: PEDIDO Y MONTOS ---
    {
      form: {
        // Usamos recoverData aquí
        values: (prev) => ({
          ...recoverData(prev), 
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
              <h2 className="text-xl font-semibold text-white">2. Detalles del Alquiler</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Bicicletas</label>
                  <select {...form.register("cantidad")} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-lg focus:outline-none">
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n} className="text-black">{n}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Duración</label>
                  <select {...form.register("tiempo")} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold text-lg focus:outline-none">
                    <option value="10" className="text-black">10 Min</option>
                    <option value="20" className="text-black">20 Min</option>
                  </select>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/20 to-black border border-primary/30 rounded-2xl p-6 text-center shadow-lg">
                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">Total a Pagar</p>
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-black text-white tracking-tight">${totalUsd}</span>
                  <div className="w-full h-px bg-white/10 my-2"></div>
                  <span className="text-3xl font-bold text-white/90">{totalBs} Bs</span>
                </div>
                <p className="text-[10px] text-white/40 mt-2">Tasa BCV: {tasa}</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={onBack} className="flex-1 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20">Atrás</button>
                <button type="submit" className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold hover:brightness-110">Continuar al Pago</button>
              </div>
            </form>
          );
        },
      },
    },

    // --- PASO 3: SELECCIÓN DE MÉTODO ---
    {
      form: {
        // Usamos recoverData aquí
        values: (prev) => ({
          ...recoverData(prev),
          metodo_pago: ["bdv", []],
        }),
        render: ({ values, onNext, onBack }) => {
          const form = useForm({ defaultValues: values });
          const opciones = [
            { id: "bdv", label: "Banco de Venezuela", sub: "Bot Automático", icon: "🏦" },
            { id: "otros", label: "Otros Bancos", sub: "Pago Móvil Manual", icon: "📲" },
            { id: "efectivo", label: "Efectivo", sub: "USD o Bs", icon: "💵" },
          ];

          return (
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-5">
              <h2 className="text-xl font-semibold text-white">3. Método de Pago</h2>
              <div className="space-y-3">
                {opciones.map((op) => (
                  <label key={op.id} className="flex items-center p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl mr-4">{op.icon}</div>
                    <div className="flex-1">
                      <p className="text-white font-bold">{op.label}</p>
                      <p className="text-xs text-white/50">{op.sub}</p>
                    </div>
                    <input type="radio" {...form.register("metodo_pago")} value={op.id} className="w-5 h-5 accent-primary" />
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onBack} className="flex-1 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20">Atrás</button>
                <button type="submit" className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold hover:brightness-110">Siguiente</button>
              </div>
            </form>
          );
        },
      },
    },

    // --- PASO 4: PANTALLAS DIFERENCIADAS ---
    {
      form: {
        // Usamos recoverData aquí (CRÍTICO para que onReturn tenga los datos)
        values: (prev) => ({
          ...recoverData(prev),
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
                // Validación condicional
                ult_4_ref: metodo !== 'efectivo' ? z.string().min(4, "Mínimo 4 dígitos") : z.any().optional(),
                monto_recibido: metodo === 'efectivo' ? z.coerce.number().min(0.01, "Ingrese monto válido") : z.any().optional(),
              })
            ),
          });

          // Función Bot BDV
          const handleBotConnect = async () => {
             try {
                await fetch('https://api-whatsapp-bici-aventuras.onrender.com/solicitar-pago', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ monto: totalBS, concepto: `Alquiler ${cantidad} bicis` })
                });
                alert("✅ Solicitud enviada al Bot");
             } catch (e) {
                console.error(e);
                alert("❌ Error conectando con el bot");
             }
          };

          // Lógica Efectivo
          const montoRecibido = form.watch("monto_recibido") || 0;
          const monedaPago = form.watch("moneda_pago");
          let mensajeVuelto = "";
          let estadoVuelto = "neutro"; 

          if (metodo === 'efectivo') {
             const target = monedaPago === "USD" ? totalUSD : parseFloat(totalBS);
             const diff = montoRecibido - target;
             
             if (diff < -0.01) { // Pequeña tolerancia
                estadoVuelto = "falta";
                mensajeVuelto = `Falta: ${Math.abs(diff).toFixed(2)} ${monedaPago}`;
             } else {
                estadoVuelto = "completo";
                if (monedaPago === "USD") {
                   mensajeVuelto = `Vuelto: $${diff.toFixed(2)} / ${(diff * tasa).toFixed(2)} Bs`;
                } else {
                   mensajeVuelto = `Vuelto: ${diff.toFixed(2)} Bs / $${(diff / tasa).toFixed(2)}`;
                }
             }
          }

          return (
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
              
              {/* CASO A: BDV */}
              {metodo === 'bdv' && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <h2 className="text-xl font-bold text-white text-center">Pago Móvil BDV</h2>
                  <div className="bg-primary/20 border border-primary/40 p-4 rounded-xl text-center">
                    <p className="text-sm text-primary uppercase font-bold">Monto a pagar</p>
                    <p className="text-3xl font-black text-white">{totalBS} Bs.</p>
                  </div>
                  
                  <button type="button" onClick={handleBotConnect} className="w-full py-4 rounded-xl bg-[#25D366] text-black font-bold flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-green-900/20">
                    <span className="text-xl">🤖</span> Solicitar cobro al Bot
                  </button>

                  <div className="relative border-t border-white/10 pt-4 mt-4">
                    <p className="text-xs text-center text-white/50 mb-2">O ingresa la referencia manual:</p>
                    <input {...form.register("ult_4_ref")} maxLength={4} inputMode="numeric" placeholder="Últimos 4 dígitos" className="w-full bg-white/5 border border-white/10 rounded-lg py-3 text-center text-white tracking-widest text-xl focus:border-primary focus:outline-none" />
                    {form.formState.errors.ult_4_ref && <p className="text-red-400 text-xs text-center mt-1">{form.formState.errors.ult_4_ref.message}</p>}
                  </div>
                </div>
              )}

              {/* CASO B: OTROS */}
              {metodo === 'otros' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <h2 className="text-xl font-bold text-white text-center">Pago Móvil (Otros)</h2>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                       <span className="text-white/60">Banco:</span><span className="text-white font-bold">Venezuela (0102)</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                       <span className="text-white/60">Cédula:</span><span className="text-white font-bold tracking-wider">26.597.356</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                       <span className="text-white/60">Teléfono:</span><span className="text-white font-bold tracking-wider">0424-2929579</span>
                    </div>
                    <div className="flex justify-between pt-2">
                       <span className="text-primary font-bold">Monto:</span><span className="text-primary font-black text-xl">{totalBS} Bs</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-primary font-bold uppercase ml-1">Referencia (4 dígitos)</label>
                    <input {...form.register("ult_4_ref")} maxLength={4} inputMode="numeric" placeholder="0000" className="w-full bg-black/30 border-2 border-white/20 focus:border-primary rounded-xl py-4 text-center text-white tracking-[0.5em] text-2xl focus:outline-none" />
                    {form.formState.errors.ult_4_ref && <p className="text-red-400 text-xs text-center mt-1">{form.formState.errors.ult_4_ref.message}</p>}
                  </div>
                </div>
              )}

              {/* CASO C: EFECTIVO */}
              {metodo === 'efectivo' && (
                <div className="space-y-5 animate-in slide-in-from-bottom duration-300">
                   <h2 className="text-xl font-bold text-white text-center">Cobro en Efectivo</h2>
                   <div className="flex justify-between px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-center"><p className="text-[10px] text-white/50">USD</p><p className="text-xl font-bold text-white">${totalUSD}</p></div>
                      <div className="w-px bg-white/10"></div>
                      <div className="text-center"><p className="text-[10px] text-white/50">Bolívares</p><p className="text-xl font-bold text-white">{totalBS} Bs</p></div>
                   </div>
                   <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                    <label className="text-xs text-white/70 mb-2 block">Monto Recibido</label>
                    <div className="flex gap-2">
                      <input {...form.register("monto_recibido")} type="number" step="any" placeholder="0.00" className="flex-1 text-right text-3xl font-bold bg-transparent border-b-2 border-white/20 focus:border-primary text-white focus:outline-none placeholder:text-white/10 pb-1" />
                      <select {...form.register("moneda_pago")} className="bg-white/10 rounded-lg text-white font-bold px-3 border border-white/10 text-black">
                        <option value="USD" className="text-black">$ USD</option>
                        <option value="Bs" className="text-black">Bs</option>
                      </select>
                    </div>
                  </div>
                  {montoRecibido > 0 && (
                     <div className={`p-4 rounded-xl text-center border-2 transition-all ${estadoVuelto === 'falta' ? 'bg-red-900/20 border-red-500/50 text-red-200' : 'bg-green-900/20 border-green-500/50 text-green-300'}`}>
                       <p className="text-2xl font-bold">{mensajeVuelto}</p>
                     </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onBack} className="w-1/3 py-3 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10">Volver</button>
                <button 
                  type="submit" 
                  disabled={metodo === 'efectivo' && estadoVuelto === 'falta'} 
                  className="w-2/3 py-3 rounded-lg bg-primary text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
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

  // 5. GUARDADO EN SUPABASE
  const onReturn = useCallback(async (data) => {
    console.log("Datos Finales:", data); // Verifica que aquí lleguen todos los campos

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
      
      alert("¡Venta registrada exitosamente!");
      window.location.reload(); 
    } catch (error) {
      console.error("Error guardando venta:", error);
      alert("Error al registrar en base de datos: " + error.message);
    }
  }, [tasa]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-primary animate-pulse font-bold text-lg">
          Sincronizando tasa de cambio...
        </div>
      </div>
    );
  }

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