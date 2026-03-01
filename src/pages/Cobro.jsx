import { useState, useEffect } from "react";
import { supabase } from "../supabase/client.js";
import Navbar from "../components/Navbar";
import { CircularLoading } from "respinner";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../components/Notifications";
import PriceCards from "../components/PriceCards.jsx";

// Importamos los pasos separados
import Paso1 from "../components/cobro/Paso1.jsx";
import Paso2 from "../components/cobro/Paso2.jsx";
import Paso3 from "../components/cobro/Paso3.jsx";
import Paso4 from "../components/cobro/Paso4.jsx";

// Importamos la bóveda de Zustand
import { useAlquilerStore } from "../store/useAlquilerStore.js";

export default function Cobro() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState("forward");
  
  const navigate = useNavigate();

  // Traemos las funciones de Zustand que necesitamos aquí
  const setTasaBcv = useAlquilerStore((state) => state.setTasaBcv);
  const resetAlquiler = useAlquilerStore((state) => state.resetAlquiler);

  useEffect(() => {
    const fetchTasa = async () => {
      try {
        const res = await fetch(
          "https://bici-aventuras-app.vercel.app/api/tasa?t=" + Date.now()
        );
        if (!res.ok) throw new Error("Error API");
        const data = await res.json();
        const precio = data.current?.usd || data.price || 0;
        
        if (precio > 0) {
          setTasaBcv(Number(precio)); // Guardamos la tasa directo en la bóveda
        }
      } catch (err) {
        console.error("Usando tasa base:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasa();
    
    // Al desmontar el componente (si el usuario se va sin terminar), limpiamos la bóveda
    return () => resetAlquiler();
  }, [setTasaBcv, resetAlquiler]);

  // Funciones de navegación (solo cambian el aspecto visual)
  const handleNextStep = () => {
    setDirection("forward");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection("backward");
    setStep((prev) => prev - 1);
  };

  // Función final de envío
  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Leemos TODA la información limpia y calculada directo de la bóveda
    const cliente = useAlquilerStore.getState().cliente;
    const alquiler = useAlquilerStore.getState().alquiler;
    const pago = useAlquilerStore.getState().pago;
    const tasa = useAlquilerStore.getState().tasaBcv;
    const { totalBS } = useAlquilerStore.getState().getTotales();

    try {
      const { error } = await supabase.from("ventas-biciaventuras").insert([
        {
          cedula_cliente: cliente.cedula,
          nombre_cliente: cliente.nombre, // Ya viene en mayúsculas desde el Paso 2
          telefono_cliente: cliente.telefono,
          cantidad_bicicletas: alquiler.cantidad,
          tiempo_alquiler: `${alquiler.tiempo} min`, // Aseguramos formato correcto
          monto_exacto_bs: totalBS, // El monto ya está perfectamente calculado por Zustand
          tasa_bcv: tasa,
          ult_4_ref: pago.metodo === "efectivo" ? "EFECTIVO" : pago.ult_4_ref,
          pagado: true,
          metodo_pago: pago.metodo,
        },
      ]);

      if (error) throw error;

      showSuccess("¡Venta registrada con éxito!");
      resetAlquiler(); // Limpiamos la bóveda para el siguiente alquiler
      
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      showError("Error: " + error.message);
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-primary gap-2">
        <CircularLoading color="#00ff7f" size={80} />
      </div>
    );

  const animationClass =
    direction === "forward"
      ? "animate-slide-in-right"
      : "animate-slide-in-left";

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <div className="pt-24 px-4 max-w-md mx-auto pb-10">
        <PriceCards />
        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 overflow-hidden">
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  PASO {step} DE 4
                </span>
                <h2 className="text-lg font-bold text-white uppercase leading-none mt-1">
                  {step === 1 && "Detalles del Alquiler"}
                  {step === 2 && "Datos del Cliente"}
                  {step === 3 && "Método de Pago"}
                  {step === 4 && "Confirmar Pago"}
                </h2>
              </div>
              <div className="text-xs text-white/30 font-mono">
                {Math.round((step / 4) * 100)}%
              </div>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary),0.4)]"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <div key={step} className={animationClass}>
            {step === 1 && <Paso1 onNext={handleNextStep} />}
            {step === 2 && <Paso2 onNext={handleNextStep} onBack={handleBack} />}
            {step === 3 && <Paso3 onNext={handleNextStep} onBack={handleBack} />}
            {step === 4 && (
              <Paso4
                onSubmit={handleFinalSubmit}
                onBack={handleBack}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}