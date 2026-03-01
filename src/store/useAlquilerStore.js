import { create } from 'zustand';

// Las tarifas viven aquí, centralizadas. Si cambian los precios, solo tocas esto.
const TARIFAS = {
  10: 2,
  20: 3,
  30: 5,
  60: 9,
};

export const useAlquilerStore = create((set, get) => ({
  // --- 1. ESTADO GLOBAL ---
  pasoActual: 1,
  tasaBcv: 0,
  
  // Agrupamos los datos lógicamente
  cliente: {
    cedula: "",
    nombre: "",
    telefono: "",
  },
  
  alquiler: {
    cantidad: 1,
    tiempo: 10, // Guardaremos solo el número limpio (20, 30, 60), nada de "30 min"
  },
  
  pago: {
    metodo: "bdv",
    ult_4_ref: "",
    montoRecibido: 0,
    monedaPago: "USD",
  },

  // --- 2. ACCIONES (Para guardar datos desde los componentes) ---
  setPasoActual: (paso) => set({ pasoActual: paso }),
  setTasaBcv: (tasa) => set({ tasaBcv: tasa }),
  
  setCliente: (datos) => set((state) => ({ 
    cliente: { ...state.cliente, ...datos } 
  })),
  
  setAlquiler: (datos) => set((state) => ({ 
    alquiler: { ...state.alquiler, ...datos } 
  })),
  
  setPago: (datos) => set((state) => ({ 
    pago: { ...state.pago, ...datos } 
  })),

  // --- 3. LÓGICA DE NEGOCIO (Los cálculos matemáticos) ---
  // Esta función calcula el total al vuelo usando los datos guardados
  getTotales: () => {
    const { alquiler, tasaBcv } = get();
    
    // Nos aseguramos de que el tiempo sea un número para evitar el bug anterior
    const tiempoLimpio = parseInt(String(alquiler.tiempo).replace(/\D/g, ""), 10);
    const tiempoFinal = tiempoLimpio === 1 ? 60 : tiempoLimpio;

    const precioUnitario = TARIFAS[tiempoFinal] || 0;
    const totalUSD = precioUnitario * alquiler.cantidad;
    const totalBS = parseFloat((totalUSD * tasaBcv).toFixed(2));

    return { totalUSD, totalBS };
  },

  // Para limpiar todo cuando se termine una venta exitosa
  resetAlquiler: () => set({
    pasoActual: 1,
    cliente: { cedula: "", nombre: "", telefono: "" },
    alquiler: { cantidad: 1, tiempo: 10 },
    pago: { metodo: "bdv", ult_4_ref: "", montoRecibido: 0, monedaPago: "USD" },
  })
}));