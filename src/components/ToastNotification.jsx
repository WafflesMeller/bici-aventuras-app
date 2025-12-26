import { toast } from "react-hot-toast";
import { Check, Info, X } from "lucide-react";

// Función helper para llamar al toast fácilmente
export const showToast = (mensaje, tipo = "success") => {
  toast.custom((t) => (
    <div
      className={`
        ${t.visible ? 'animate-enter' : 'animate-leave'}
        flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl 
        backdrop-blur-md border border-white/10 pointer-events-auto
        ${tipo === "success" ? "bg-primary/20 text-white" : "bg-red-500/20 text-white"}
      `}
    >
      <div className={`
        p-2 rounded-full 
        ${tipo === "success" ? "bg-primary text-black" : "bg-red-500 text-white"}
      `}>
        {tipo === "success" ? <Check size={14} strokeWidth={3} /> : <Info size={14} strokeWidth={3} />}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold uppercase tracking-wide">{tipo === "success" ? "Éxito" : "Aviso"}</span>
        <span className="text-xs font-medium opacity-80">{mensaje}</span>
      </div>
      <button onClick={() => toast.dismiss(t.id)} className="ml-2 opacity-50 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  ), { duration: 3000 });
};