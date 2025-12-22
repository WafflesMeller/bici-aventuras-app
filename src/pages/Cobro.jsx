import { Formity } from "@formity/react";
import { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from '../supabase/client.js';

import Navbar from "../components/Navbar";

export default function Cobro() {
  // 1. ESTADOS PARA LA API
  const [tasa, setTasa] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. OBTENER TASA AL CARGAR
  useEffect(() => {
  const fetchTasa = async () => {
    try {
      // Añadimos un timestamp para obligar al navegador a pedir datos frescos
      const res = await fetch(`/api/tasa?t=${Date.now()}`); 
      const data = await res.json();
      
      console.log("Datos recibidos de la API:", data); // Mira esto en la consola (F12)

      if (data?.current?.usd) {
        setTasa(Number(data.current.usd));
      }
    } catch (err) {
      console.error("Error en el fetch:", err);
      setTasa(295.50); // Fallback
    } finally {
      setLoading(false);
    }
  };
  fetchTasa();
}, []);

const schema = [
    // --- PASO 1: DATOS DEL CLIENTE (Igual que antes) ---
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
                cedula: z.string().min(6, "Cédula muy corta"),
                telefono: z.string().min(10, "Mínimo 10 dígitos"),
              })
            ),
          });
          // ... (Lógica de renderizado del Paso 1 igual al anterior)
          // Para no hacer el código gigante, asumo que mantienes el return del Paso 1 aquí.
           const submit = form.handleSubmit(onNext);
           return (
             <form onSubmit={submit} className="space-y-5">
               <h2 className="text-xl font-semibold text-white">Datos del cliente</h2>
               {/* Inputs de nombre, apellido, etc... */}
               <input {...form.register("nombre")} placeholder="Nombre" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white" />
               <input {...form.register("apellido")} placeholder="Apellido" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white" />
               <input {...form.register("cedula")} placeholder="Cédula" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white" />
               <input {...form.register("telefono")} placeholder="Teléfono" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white" />
               <button type="submit" className="w-full py-3 rounded-lg bg-primary text-black font-semibold">Siguiente</button>
             </form>
           )
        },
      },
    },

    // --- PASO 2: SELECCIÓN DE MÉTODO (El Router) ---
    {
      form: {
        values: () => ({
          metodo_pago: ["pago_movil_bdv", []], // Valor por defecto
        }),
        render: ({ values, onNext, onBack }) => {
          const form = useForm({ defaultValues: values });
          const submit = form.handleSubmit(onNext);

          // Opciones de pago estilizadas
          const opciones = [
            { id: "pago_movil_bdv", label: "Pago Móvil BDV", icon: "📱" },
            { id: "pago_movil_otros", label: "Pago Móvil (Otros)", icon: "📲" },
            { id: "efectivo", label: "Efectivo ($ o Bs)", icon: "💵" },
          ];

          return (
            <form onSubmit={submit} className="space-y-6">
              <h2 className="text-xl font-semibold text-white text-center">¿Cómo pagará el cliente?</h2>
              
              <div className="grid grid-cols-1 gap-3">
                {opciones.map((op) => (
                  <label key={op.id} className="relative flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{op.icon}</span>
                      <span className="text-white font-medium">{op.label}</span>
                    </div>
                    <input type="radio" {...form.register("metodo_pago")} value={op.id} className="w-5 h-5 accent-primary" />
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={onBack} className="flex-1 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20">Atrás</button>
                <button type="submit" className="flex-1 py-3 rounded-lg bg-primary text-black font-bold hover:opacity-90">Continuar</button>
              </div>
            </form>
          );
        },
      },
    },

    // --- PASO 3: CAJA REGISTRADORA (Súper Mejorado) ---
    {
      form: {
        values: (prev) => ({
          cantidad: [1, []],
          tiempo: ["10", []],
          ult_4_ref: ["", []],
          monto_recibido: ["", []], // Lo que el cliente te entrega
          moneda_pago: ["USD", []], // En qué moneda te lo entrega
          metodo_seleccionado: [prev.metodo_pago, []], // Guardamos lo que eligió antes
        }),
        render: ({ values, onNext, onBack }) => {
          const metodo = values.metodo_seleccionado;
          const esEfectivo = metodo === "efectivo";

          const form = useForm({
            defaultValues: values,
            resolver: zodResolver(
              z.object({
                cantidad: z.coerce.number(),
                tiempo: z.string(),
                // Si NO es efectivo, exigimos referencia. Si ES efectivo, la referencia es opcional.
                ult_4_ref: !esEfectivo ? z.string().length(4, "Faltan 4 dígitos") : z.string().optional(),
                // Si ES efectivo, exigimos que el monto recibido sea mayor a 0.
                monto_recibido: esEfectivo ? z.coerce.number().min(0.01, "Ingrese monto") : z.any(),
              })
            ),
          });

          // 1. CALCULOS DE PRECIO TOTAL
          const cantidad = form.watch("cantidad");
          const tiempo = form.watch("tiempo");
          const precioUnitario = tiempo === "10" ? 2 : 3;
          
          const totalUSD = cantidad * precioUnitario;
          const totalBS = (totalUSD * tasa).toFixed(2);

          // 2. CALCULOS DE VUELTO (Solo para efectivo)
          const montoRecibido = form.watch("monto_recibido") || 0;
          const monedaPago = form.watch("moneda_pago"); // "USD" o "BS"
          
          let estadoVuelto = "neutro"; // neutro, falta, completo
          let valorVuelto = 0;
          let mensajeVuelto = "";

          if (esEfectivo) {
            if (monedaPago === "USD") {
              const diferencia = montoRecibido - totalUSD;
              if (diferencia < 0) {
                estadoVuelto = "falta";
                mensajeVuelto = `Faltan $${Math.abs(diferencia).toFixed(2)}`;
              } else {
                estadoVuelto = "completo";
                valorVuelto = diferencia;
                // Calculamos cuánto sería ese vuelto en Bs también por si acaso
                const vueltoEnBs = (valorVuelto * tasa).toFixed(2);
                mensajeVuelto = `Vuelto: $${valorVuelto.toFixed(2)} (o ${vueltoEnBs} Bs)`;
              }
            } else {
              // Si paga en Bolívares
              const diferencia = montoRecibido - totalBS;
              if (diferencia < -1) { // Margen de error pequeño
                estadoVuelto = "falta";
                mensajeVuelto = `Faltan ${(Math.abs(diferencia)).toFixed(2)} Bs`;
              } else {
                estadoVuelto = "completo";
                valorVuelto = diferencia;
                // Calculamos cuánto sería ese vuelto en Dólares
                const vueltoEnDolares = (valorVuelto / tasa).toFixed(2);
                mensajeVuelto = `Vuelto: ${valorVuelto.toFixed(2)} Bs (o $${vueltoEnDolares})`;
              }
            }
          }

          return (
            <form onSubmit={form.handleSubmit(onNext)} className="space-y-5">
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                {esEfectivo ? "Caja / Efectivo" : "Confirmar Transferencia"}
              </h2>

              {/* SECCIÓN 1: DETALLES DEL PRODUCTO */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-white/60 ml-1">Bicicletas</label>
                  <select {...form.register("cantidad")} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n} className="text-black">{n}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/60 ml-1">Tiempo</label>
                  <select {...form.register("tiempo")} className="w-full p-3 rounded-lg bg-white/10 border border-white/10 text-white font-bold">
                    <option value="10" className="text-black">10 Min ($2)</option>
                    <option value="20" className="text-black">20 Min ($3)</option>
                  </select>
                </div>
              </div>

              {/* SECCIÓN 2: TOTAL A PAGAR (VISUALIZACIÓN GRANDE) */}
              <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">Total a cobrar</p>
                <div className="flex justify-center items-end gap-2 text-white">
                  <span className="text-4xl font-black">${totalUSD}</span>
                  <span className="text-lg opacity-60 mb-1">/</span>
                  <span className="text-2xl font-bold text-white/90">{totalBS} Bs</span>
                </div>
                <p className="text-[10px] text-white/40 mt-1">Tasa: {tasa} Bs/$</p>
              </div>

              {/* SECCIÓN 3: DINÁMICA (Efectivo vs Pago Móvil) */}
              {esEfectivo ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* INPUT DE EFECTIVO */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                    <label className="text-xs text-white/70 mb-2 block">¿Cuánto dinero entrega el cliente?</label>
                    <div className="flex gap-2">
                      <input 
                        {...form.register("monto_recibido")}
                        type="number" step="any"
                        placeholder="0.00"
                        className="flex-1 text-right text-2xl font-bold bg-transparent border-b-2 border-white/20 focus:border-primary text-white focus:outline-none placeholder:text-white/10 pb-1"
                      />
                      <select {...form.register("moneda_pago")} className="bg-white/10 rounded-lg text-white font-bold px-3 border border-white/10">
                        <option value="USD" className="text-black">$ USD</option>
                        <option value="BS" className="text-black">Bs</option>
                      </select>
                    </div>
                  </div>

                  {/* CALCULADORA DE VUELTO */}
                  {montoRecibido > 0 && (
                     <div className={`p-4 rounded-xl text-center border-2 transition-all ${
                       estadoVuelto === 'falta' 
                         ? 'bg-red-500/10 border-red-500 text-red-200' 
                         : 'bg-green-500/10 border-green-500 text-green-300'
                     }`}>
                       <p className="text-sm font-bold uppercase">{estadoVuelto === 'falta' ? '⚠️ Insuficiente' : '✅ Entregar Cambio'}</p>
                       <p className="text-2xl font-black mt-1">{mensajeVuelto}</p>
                     </div>
                  )}
                </div>
              ) : (
                // SI ES PAGO MÓVIL
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                      <p className="text-sm text-white mb-2">Realizar pago a: <span className="font-bold text-primary">0412-1234567</span></p>
                      <label className="text-xs text-primary font-bold uppercase block mb-1">Últimos 4 dígitos Referencia</label>
                      <input 
                        {...form.register("ult_4_ref")} 
                        type="text" inputMode="numeric" maxLength={4}
                        placeholder="0000" 
                        onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ""); }}
                        className="w-full bg-black/20 border-2 border-white/20 focus:border-primary rounded-lg text-white text-center text-3xl tracking-[0.5em] font-mono py-3 focus:outline-none transition-colors" 
                      />
                       {form.formState.errors.ult_4_ref && <p className="text-red-400 text-xs mt-1">Requerido</p>}
                   </div>
                </div>
              )}

              {/* BOTONES FINALES */}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onBack} className="w-1/3 py-3 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10">
                  Volver
                </button>
                <button 
                  type="submit" 
                  disabled={esEfectivo && estadoVuelto === 'falta'} // Bloquea si falta dinero
                  className="w-2/3 py-3 rounded-lg bg-primary text-black font-bold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                >
                  {esEfectivo ? "Registrar Pago" : "Verificar y Guardar"}
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

  const onReturn = useCallback(async (data) => {
    const precioUsd = data.tiempo === "10" ? 2 : 3;
    const montoBs = data.cantidad * precioUsd * tasa;

    try {
      const { error } = await supabase
        .from('ventas-biciaventuras')
        .insert([{
          cedula_cliente: data.cedula,
          nombre_cliente: `${data.nombre} ${data.apellido}`,
          telefono_cliente: data.telefono,
          cantidad_bicicletas: data.cantidad,
          tiempo_alquiler: `${data.tiempo} min`,
          monto_exacto_bs: montoBs,
          tasa_bcv: tasa,
          ult_4_ref: data.ult_4_ref,
          pagado: false 
        }]);

      if (error) throw error;
      alert("¡Venta registrada! Verificando pago...");
      window.location.reload();
    } catch (error) {
      console.error("Error guardando venta:", error);
      alert("Error al registrar la venta");
    }
  }, [tasa]);

  // 3. PANTALLA DE CARGA PARA LA TASA
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary animate-pulse font-bold text-lg">
          Sincronizando tasa de cambio...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <div className="pt-28 px-4 max-w-md mx-auto">
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
          <Formity schema={schema} onReturn={onReturn} />
        </div>
      </div>
    </div>
  );
}