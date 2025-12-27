import React from "react";
import toast, { Toaster } from "react-hot-toast";

export function ToastUI({ t, type = "success", message }) {
  const isSuccess = type === "success";

  return (
    <div
      className={`
        pointer-events-auto
        flex items-center gap-3
        px-4 py-3
        backdrop-blur-xl
        rounded-full shadow-2xl
        border border-white/10
        bg-black/20 text-white
        
        /* USAMOS NUESTRAS CLASES MANUALES CSS */
        ${t.visible ? "animate-toast-in" : "animate-toast-out"}
      `}
    >
      <div className="flex h-6 w-6 items-center justify-center text-lg">
        {isSuccess ? "✅" : "❌"}
      </div>

      <span className="text-sm font-medium opacity-90">{message}</span>
    </div>
  );
}

// Helpers
export const showSuccess = (message) => {
  toast.custom((t) => <ToastUI t={t} type="success" message={message} />);
};

export const showError = (message) => {
  toast.custom((t) => <ToastUI t={t} type="error" message={message} />);
};

// Componente Principal
export default function Notifications() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={12}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
        },
      }}
    />
  );
}