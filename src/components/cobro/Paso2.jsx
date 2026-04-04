import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../supabase/client.js";
import { IdCard, Loader2, Search, User, ChevronLeft, ChevronRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

// IMPORTANTE: Ajusta la ruta dependiendo de dónde guardaste tu store
import { useAlquilerStore } from "../../store/useAlquilerStore.js";

// Mudamos el esquema de validación correspondiente a este paso
const paso2Schema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  cedula: z.string().min(6, "Cédula inválida"),
  telefono: z.string().min(10, "Teléfono inválido"),
});

export default function Paso2({ onNext, onBack }) {
  // 1. Extraemos lo que necesitamos de Zustand
  const cliente = useAlquilerStore((state) => state.cliente);
  const setCliente = useAlquilerStore((state) => state.setCliente);

  // 2. Configuramos React Hook Form usando los datos de Zustand
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      cedula: cliente.cedula,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
    },
    resolver: zodResolver(paso2Schema),
  });

  const [buscando, setBuscando] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState("");

  const cedula = watch("cedula");

  const handleNumeric = (e) =>
    (e.target.value = e.target.value.replace(/[^0-9]/g, ""));

  const handleCedulaKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // evita submit
      buscarCliente();
    }
  };

  const buscarCliente = async () => {
    if (!cedula || cedula.length < 6) return;

    try {
      setBuscando(true);
      setMensajeBusqueda("");

      const { data, error } = await supabase
        .from("ventas-biciaventuras")
        .select("nombre_cliente, telefono_cliente")
        .eq("cedula_cliente", cedula)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // ✅ Caso: cliente encontrado
        setValue("nombre", data.nombre_cliente || "");
        setValue("telefono", data.telefono_cliente || "");

        setMensajeBusqueda(
          "Cliente encontrado, puedes editar los datos si es necesario."
        );
      } else {
        // ❌ Caso: NO encontrado → limpiar campos
        setValue("nombre", "");
        setValue("telefono", "");

        setMensajeBusqueda(
          "No se encontraron registros para esta cédula. Ingresa los datos manualmente."
        );
      }
    } catch (err) {
      console.error("Error buscando cliente:", err.message);

      // En error también limpiamos para evitar datos inconsistentes
      setValue("nombre", "");
      setValue("telefono", "");

      setMensajeBusqueda("Ocurrió un error al buscar el cliente.");
    } finally {
      setBuscando(false);
    }
  };

  // 3. Cuando el usuario da clic en Siguiente
  const onSubmitForm = (data) => {
    // Guardamos la info limpia en Zustand
    setCliente({
      cedula: data.cedula,
      nombre: data.nombre.trim().replace(/\s+/g, " ").toUpperCase(),
      telefono: data.telefono,
    });
    
    // Le decimos al componente principal que avance
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">
      <div className="space-y-4">
        {/* CÉDULA + BUSCAR */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs text-white/60 font-semibold">
            <IdCard className="w-4 h-4 text-white/40" />
            Cédula
          </label>

          <div className="flex items-center gap-2 w-full">
            <input
              {...register("cedula")}
              onInput={handleNumeric}
              onKeyDown={handleCedulaKeyDown}
              inputMode="numeric"
              enterKeyHint="search"
              placeholder="Ej: 26597356"
              className="
                flex-1 min-w-0 px-4 py-3 rounded-xl
                bg-white/5 border border-white/10 text-white
                focus:outline-none focus:border-primary
              "
            />

            <button
              type="button"
              onClick={buscarCliente}
              disabled={buscando}
              className="
                shrink-0 w-12 h-12 rounded-xl
                bg-primary text-black
                flex items-center justify-center
                hover:brightness-110 active:scale-95
                transition-all
              "
            >
              {buscando ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Search size={18} />
              )}
            </button>
          </div>

          {errors.cedula && (
            <p className="text-red-400 text-xs">{errors.cedula.message}</p>
          )}
          {mensajeBusqueda && (
            <p
              className={`text-xs mt-1 ${
                mensajeBusqueda.includes("encontrado")
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {mensajeBusqueda}
            </p>
          )}
        </div>

        {/* NOMBRE */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs text-white/60 font-semibold">
            <User className="w-4 h-4 text-white/40" />
            Nombre y Apellido
          </label>
          <input
            {...register("nombre")}
            placeholder="Nombre y apellido del cliente"
            className="
              w-full px-4 py-3 rounded-xl
              bg-white/5 border border-white/10 text-white
              focus:outline-none focus:border-primary
              disabled:opacity-60
            "
          />
          {errors.nombre && (
            <p className="text-red-400 text-xs">{errors.nombre.message}</p>
          )}
        </div>

        {/* TELÉFONO */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs text-white/60 font-semibold">
            <FaWhatsapp className="w-4 h-4 text-white/40" />
            Teléfono WhatsApp
          </label>
          <input
            {...register("telefono")}
            onInput={handleNumeric}
            inputMode="numeric"
            placeholder="Ej: 04241234567"
            className="
              w-full px-4 py-3 rounded-xl
              bg-white/5 border border-white/10 text-white
              focus:outline-none focus:border-primary
              disabled:opacity-60
            "
          />
          {errors.telefono && (
            <p className="text-red-400 text-xs">{errors.telefono.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-lg bg-white/10 text-white
            flex items-center justify-center gap-2
            hover:bg-white/20 active:scale-95 transition-all"
        >
          <ChevronLeft size={18} /> Atrás
        </button>

        <button
          type="submit"
          className="flex-1 py-3 rounded-lg bg-primary text-black
            font-semibold flex items-center justify-center gap-2
            hover:brightness-110 active:scale-95 transition-all"
        >
          Siguiente <ChevronRight size={18} />
        </button>
      </div>
    </form>
  );
}