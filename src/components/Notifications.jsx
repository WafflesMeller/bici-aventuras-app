import React from "react";
import toast, { Toaster } from "react-hot-toast";

// UI adaptada para mantener tu diseño pero con los colores de Biciaventuras
export function ToastUI({ t, type = "success", message }) {
  const isSuccess = type === "success";

  return (
    <div
      className={`
        pointer-events-auto
        flex items-center
        px-4 py-2.5
        backdrop-blur-xl
        rounded-full shadow-2xl
        border border-white/10
        transition-all duration-300
        ${isSuccess ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
        ${t.visible ? "animate-in fade-in slide-in-from-top-2" : "animate-out fade-out"}
      `}
    >
      <div className="flex h-7 w-7 items-center justify-center text-md mr-2">
        {isSuccess ? "✅" : "❌"}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider">{message}</span>
    </div>
  );
}

// Helpers globales
export const showSuccess = (message) => {
  toast.custom((t) => <ToastUI t={t} type="success" message={message} />);
};

export const showError = (message) => {
  toast.custom((t) => <ToastUI t={t} type="error" message={message} />);
};

export default function Notifications() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={12}
      toastOptions={{ duration: 4000 }}
    />
  );
}