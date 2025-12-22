import { Formity } from "@formity/react";
import { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from '../supabase/client.js';

import Navbar from "../components/Navbar";


export default function Cobro() {
  // Estado para la tasa (puedes setearla manual o vía API)
  const [tasa, setTasa] = useState(295.50); 

  const schema = [
    // PASO 1: DATOS DEL CLIENTE
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
              cedula: z.string().min(6, "Cédula muy corta").max(8, "Máximo 8 dígitos"),
              telefono: z.string().min(10, "Mínimo 10 dígitos").max(11, "Máximo 11 dígitos"),
            })
          ),
        });
        const submit = form.handleSubmit(onNext);

        // Función de limpieza común
        const handleNumericInput = (e) => {
          e.target.value = e.target.value.replace(/[^0-9]/g, "");
        };

        return (
          <form onSubmit={submit} className="space-y-5">
            <h2 className="text-xl font-semibold text-white">Datos del cliente</h2>
            
            <input {...form.register("nombre")} placeholder="Nombre" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            
            <input {...form.register("apellido")} placeholder="Apellido" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-primary" />
            
            {/* INPUT CÉDULA */}
            <div className="space-y-1">
              <input 
                {...form.register("cedula")} 
                type="text" 
                inputMode="numeric"
                maxLength={8}
                onInput={handleNumericInput}
                placeholder="Cédula (Solo números)" 
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
              {form.formState.errors.cedula && <p className="text-red-400 text-[10px] ml-1">{form.formState.errors.cedula.message}</p>}
            </div>

            {/* INPUT WHATSAPP */}
            <div className="space-y-1">
              <input 
                {...form.register("telefono")} 
                type="text" 
                inputMode="numeric"
                maxLength={11}
                onInput={handleNumericInput}
                placeholder="WhatsApp (Ej: 04121234567)" 
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
              {form.formState.errors.telefono && <p className="text-red-400 text-[10px] ml-1">{form.formState.errors.telefono.message}</p>}
            </div>

            <button type="submit" className="w-full py-3 rounded-lg bg-primary text-black font-semibold hover:opacity-90 transition">Siguiente</button>
          </form>
        );
      },
      },
    },

    // PASO 2: DETALLES Y PAGO (Aquí agregamos ult_4_ref)
    {
      form: {
        values: () => ({
          cantidad: [1, []],
          tiempo: ["8", []],
          ult_4_ref: ["", []], // NUEVO CAMPO
        }),
        render: ({ values, onNext, onBack }) => {
          const form = useForm({
            defaultValues: values,
            resolver: zodResolver(
              z.object({
                cantidad: z.coerce.number(),
                tiempo: z.string(),
                ult_4_ref: z.string().length(4, "Deben ser exactamente 4 dígitos"),
              })
            ),
          });

          // Cálculo en tiempo real para mostrar al usuario
          const cant = form.watch("cantidad");
          const time = form.watch("tiempo");
          const precioUsd = time === "8" ? 2 : 3;
          const totalBs = (cant * precioUsd * tasa).toFixed(2);

          const submit = form.handleSubmit(onNext);

          return (
            <form onSubmit={submit} className="space-y-5">
              <h2 className="text-xl font-semibold text-white">Detalles del alquiler</h2>
              
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                <p className="text-sm text-primary">Total a pagar en Bs.</p>
                <p className="text-3xl font-bold text-white">{totalBs} Bs.</p>
                <p className="text-xs text-white/40">Tasa: {tasa} Bs/$</p>
              </div>

              <select {...form.register("cantidad")} className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white">
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n} className="text-black">{n} bicicletas</option>
                ))}
              </select>

              <select {...form.register("tiempo")} className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white">
                <option value="8" className="text-black">8 minutos – $2</option>
                <option value="10" className="text-black">10 minutos – $3</option>
              </select>

              <div className="space-y-2">
                <label className="text-xs text-primary font-bold uppercase">Últimos 4 dígitos de la referencia</label>
                <input 
                {...form.register("ult_4_ref")} 
                type="text" 
                inputMode="numeric"
                maxLength={4}
                placeholder="Ej: 6365" 
                autoComplete="off"
                onInput={(e) => {
                  // Reemplaza cualquier cosa que NO sea un número con un string vacío
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-primary text-white text-center text-xl tracking-widest focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
                {form.formState.errors.ult_4_ref && <p className="text-red-400 text-xs">{form.formState.errors.ult_4_ref.message}</p>}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={onBack} className="flex-1 py-3 rounded-lg bg-white/10 text-white">Volver</button>
                <button type="submit" className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold">Finalizar Cobro</button>
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

  // FUNCIÓN FINAL: ENVIAR A SUPABASE
  const onReturn = useCallback(async (data) => {
    const precioUsd = data.tiempo === "8" ? 2 : 3;
    const montoBs = data.cantidad * precioUsd * tasa;

    try {
      const { error } = await supabase
        .from('ventas-biciaventuras') // Tu tabla de ventas
        .insert([{
          cedula_cliente: data.cedula,
          nombre_cliente: `${data.nombre} ${data.apellido}`,
          telefono_cliente: data.telefono,
          cantidad_bicicletas: data.cantidad,
          tiempo_alquiler: `${data.tiempo} min`,
          monto_exacto_bs: montoBs,
          tasa_bcv: tasa,
          ult_4_ref: data.ult_4_ref,
          pagado: false // El Trigger de la DB lo pondrá en true si consigue el match
        }]);

      if (error) throw error;

      alert("¡Venta registrada! Verificando pago con el banco...");
      window.location.reload(); // O redirigir a éxito

    } catch (error) {
      console.error("Error guardando venta:", error);
      alert("Error al registrar la venta");
    }
  }, [tasa]);

  return (
    <div className="min-h-screen text-white bg-black">
      <Navbar />
      <div className="pt-28 px-4 max-w-md mx-auto">
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
          <Formity schema={schema} onReturn={onReturn} />
        </div>
      </div>
    </div>
  );
}