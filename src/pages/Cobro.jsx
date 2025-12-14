import { Formity } from "@formity/react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import Navbar from "../components/Navbar";

export default function Cobro() {
  const schema = [
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
                cedula: z.string().min(6, "Cédula inválida"),
                telefono: z.string().min(10, "Teléfono inválido"),
              })
            ),
          });

          const submit = form.handleSubmit(onNext);

          return (
            <form onSubmit={submit} className="space-y-5">
              <h2 className="text-xl font-semibold text-white">
                Datos del cliente
              </h2>

              <input
                {...form.register("nombre")}
                placeholder="Nombre"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                           text-white placeholder-white/40 focus:outline-none 
                           focus:ring-2 focus:ring-primary"
              />

              <input
                {...form.register("apellido")}
                placeholder="Apellido"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                           text-white placeholder-white/40 focus:outline-none 
                           focus:ring-2 focus:ring-primary"
              />

              <input
                {...form.register("cedula")}
                placeholder="Cédula"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                           text-white placeholder-white/40 focus:outline-none 
                           focus:ring-2 focus:ring-primary"
              />

              <input
                {...form.register("telefono")}
                placeholder="WhatsApp"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                           text-white placeholder-white/40 focus:outline-none 
                           focus:ring-2 focus:ring-primary"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-primary text-black font-semibold
                           hover:opacity-90 transition"
              >
                Siguiente
              </button>
            </form>
          );
        },
      },
    },

    {
      form: {
        values: () => ({
          cantidad: [1, []],
          tiempo: ["8", []],
        }),
        render: ({ values, onNext, onBack }) => {
          const form = useForm({
            defaultValues: {
              cantidad: values.cantidad,
              tiempo: values.tiempo,
            },
          });

          const submit = form.handleSubmit(onNext);

          return (
            <form onSubmit={submit} className="space-y-5">
              <h2 className="text-xl font-semibold text-white">
                Detalles del alquiler
              </h2>

              <select
                {...form.register("cantidad")}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                           text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n} className="text-black">
                    {n} bicicletas
                  </option>
                ))}
              </select>

              <select
                {...form.register("tiempo")}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                           text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="8" className="text-black">
                  8 minutos – $2
                </option>
                <option value="10" className="text-black">
                  10 minutos – $3
                </option>
              </select>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 py-3 rounded-lg bg-white/10 text-white
                             hover:bg-white/20 transition"
                >
                  Volver
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold
                             hover:opacity-90 transition"
                >
                  Generar factura
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

  const onReturn = useCallback((data) => {
    const precio = data.tiempo === "8" ? 2 : 3;
    const total = data.cantidad * precio;

    alert(`Total a pagar: $${total}`);
    console.log("FACTURA:", data);
  }, []);

  return (
    <div className="min-h-screen  text-white">
      <Navbar />

      <div className="pt-28 px-4 max-w-md mx-auto">
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
          <Formity schema={schema} onReturn={onReturn} />
        </div>
      </div>
    </div>
  );
}
