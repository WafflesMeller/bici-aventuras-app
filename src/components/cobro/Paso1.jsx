import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus, Clock, ChevronRight } from "lucide-react";
import NumberFlow from "@number-flow/react";

// IMPORTANTE: Ajusta la ruta dependiendo de dónde guardaste tu store
import { useAlquilerStore } from "../../store/useAlquilerStore"; 

// Mudamos el esquema de validación correspondiente a este paso
const paso1Schema = z.object({
  cantidad: z.coerce.number().min(1),
  tiempo: z.string(),
});

export default function Paso1({ onNext }) {
  // 1. Extraemos lo que necesitamos de Zustand
  const alquiler = useAlquilerStore((state) => state.alquiler);
  const setAlquiler = useAlquilerStore((state) => state.setAlquiler);
  const tasa = useAlquilerStore((state) => state.tasaBcv);

  // 2. Configuramos React Hook Form usando los datos de Zustand
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      cantidad: alquiler.cantidad,
      tiempo: String(alquiler.tiempo), // Aseguramos que sea string para los botones
    },
    resolver: zodResolver(paso1Schema),
  });

  // 3. Leemos los valores en vivo para la interfaz (Draft visual)
  const cant = Number(watch("cantidad"));
  const time = watch("tiempo");
  
  const tarifas = {
    10: 2,
    20: 3,
    30: 5,
    60: 9,
  };

  const precioUsd = tarifas[time] || 0;
  const totalUsd = cant * precioUsd;
  const totalBs = totalUsd * tasa;

  // 4. Cuando el usuario da clic en Siguiente
  const onSubmitForm = (data) => {
    // Guardamos la info limpia en Zustand
    setAlquiler({
      cantidad: data.cantidad,
      tiempo: data.tiempo,
    });
    
    // Le decimos al componente principal que avance (ya no le pasamos los datos, Zustand los tiene)
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="grid gap-4">
        {/* TOTAL */}
        <div className="bg-linear-to-br from-primary/20 to-black border border-primary/30 rounded-2xl p-6 text-center">
          <p className="text-sm text-primary font-bold uppercase tracking-widest mb-2">
            Total
          </p>

          <div className="flex flex-col items-center">
            {/* USD ANIMADO */}
            <div className="text-5xl font-black text-white tracking-tight ">
              <NumberFlow
                locales="en-US"
                value={totalUsd}
                duration={0.8}
                className="tabular-nums"
                format={{
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }}
              />
            </div>

            <div className="w-full h-px bg-white/10 my-2"></div>

            {/* BS ANIMADO CON toLocaleString es-VE */}
            <div className="text-3xl font-bold text-white/90 flex items-baseline gap-1">
              <NumberFlow
                value={totalBs}
                duration={0.8}
                locales="es-VE"
                className="tabular-nums"
                format={{
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
              <span>Bs</span>
            </div>
          </div>

          <p className="text-sm text-white/40 mt-1">
            Tasa:{" "}
            {tasa.toLocaleString("es-VE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            Bs
          </p>
        </div>

        {/* CANTIDAD (CONTADOR) */}
        <div className="space-y-2">
          <label className="text-sm text-white/60">Bicicletas</label>

          <div className="flex items-center justify-between bg-white/10 border border-white/10 rounded-xl p-3">
            <button
              type="button"
              onClick={() => {
                const v = Math.max(1, cant - 1);
                setValue("cantidad", v);
              }}
              className="w-10 h-10 rounded-lg bg-black/30 text-white flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
            >
              <Minus size={18} />
            </button>

            {/* CONTADOR ANIMADO */}
            <NumberFlow
              value={cant}
              duration={0.4}
              className="text-3xl font-black text-white tabular-nums"
            />

            <button
              type="button"
              onClick={() => {
                const v = Math.min(100, cant + 1);
                setValue("cantidad", v);
              }}
              className="w-10 h-10 rounded-lg bg-black/30 text-white flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>

          <input type="hidden" {...register("cantidad")} />
        </div>

        {/* DURACIÓN (BOTONES) */}
        <div className="space-y-2">
          <label className="text-sm text-white/60">Duración</label>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: "10", label: "10 Min" },
              { value: "20", label: "20 Min" },
              { value: "30", label: "30 Min" },
              { value: "60", label: "1 Hora" },
            ].map((opt) => {
              const active = watch("tiempo") === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("tiempo", opt.value)}
                  className={`
                    flex items-center justify-center gap-2
                    py-3 rounded-xl font-semibold
                    border transition-all
                    ${
                      active
                        ? "bg-primary text-black border-primary scale-[1.02]"
                        : "bg-white/10 text-white border-white/10 hover:bg-white/20"
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
          <input type="hidden" {...register("tiempo")} />
        </div>
      </div>

      {/* BOTONES NAVEGACIÓN */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-primary text-black font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
        >
          Siguiente <ChevronRight size={20} />
        </button>
      </div>
    </form>
  );
}