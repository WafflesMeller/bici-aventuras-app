import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Smartphone, ChevronLeft, ChevronRight } from "lucide-react";

// Ajusta esta ruta según dónde tengas tu logo guardado
import bdvLogo from "/bdv-logo.webp"; 

// IMPORTANTE: Ajusta la ruta dependiendo de dónde guardaste tu store
import { useAlquilerStore } from "../../store/useAlquilerStore";

// Esquema de validación para este paso
const paso3Schema = z.object({
  metodo_pago: z.string(),
});

export default function Paso3({ onNext, onBack }) {
  // 1. Extraemos lo que necesitamos de Zustand
  const pago = useAlquilerStore((state) => state.pago);
  const setPago = useAlquilerStore((state) => state.setPago);

  // 2. Configuramos el formulario con el valor por defecto desde Zustand
  const { register, handleSubmit } = useForm({
    defaultValues: {
      metodo_pago: pago.metodo,
    },
    resolver: zodResolver(paso3Schema),
  });

  const opciones = [
    {
      id: "bdv",
      label: "Banco de Venezuela BDV",
      image: bdvLogo,
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

  // 3. Al enviar, guardamos en Zustand y avanzamos
  const onSubmitForm = (data) => {
    setPago({ metodo: data.metodo_pago });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
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
          <ChevronLeft size={18} /> Atrás
        </button>

        <button
          type="submit"
          className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
        >
          Siguiente <ChevronRight size={18} />
        </button>
      </div>
    </form>
  );
}