import React from "react";
import Navbar from "../components/Navbar";
import { DollarSign, Bike, ArrowRight } from "lucide-react";

export default function Dashboard() {
  // Datos temporales (luego tú los reemplazas con Supabase)
  const totalBs = 1540.50;
  const totalUsd = (totalBs / 40).toFixed(2);
  const bicisHoy = 12;

  const ventas = [
    { id: 1, cliente: "Carlos Pérez", monto: "120.00", tipo: "Alquiler" },
    { id: 2, cliente: "María Gómez", monto: "85.00", tipo: "Tour Guiado" },
    { id: 3, cliente: "Luis Rojas", monto: "50.00", tipo: "Alquiler" },
    { id: 4, cliente: "Ana Mendoza", monto: "140.00", tipo: "Servicio" },
    { id: 5, cliente: "Pedro Alfonzo", monto: "200.00", tipo: "Alquiler" },
    { id: 6, cliente: "Sofía Linares", monto: "75.00", tipo: "Mantenimiento" },
    { id: 7, cliente: "Rafael López", monto: "90.00", tipo: "Alquiler" },
    { id: 8, cliente: "Carlos Rivas", monto: "100.00", tipo: "Tour" },
    { id: 9, cliente: "Yelitza Mora", monto: "65.00", tipo: "Alquiler" },
    { id: 10, cliente: "Andrés Figueroa", monto: "110.00", tipo: "Servicio" }
  ];

  return (
    <div className="min-h-screen text-white mb-5">
      {/* NAVBAR */}
      <Navbar />

      {/* CONTENIDO PRINCIPAL – con espacio para que el navbar NO lo tape */}
      <div className="pt-24 px-4 max-w-xl mx-auto">

        {/* HEADER */}
        <h1 className="text-2xl font-semibold text-white mb-6">
          Panel de Control
        </h1>

        {/* --- TARJETAS SUPERIORES --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Generado Hoy Bs */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div>
              <p className="text-sm text-white/70">Generado hoy (Bs)</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {totalBs.toFixed(2).toLocaleString()}
              </p>
            </div>
            <span className="text-primary font-semibold text-3xl"> Bs</span>
          </div>

          {/* Generado en $ */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
            <div>
              <p className="text-sm text-white/70">Equivalente en USD</p>
              <p className="text-2xl font-semibold text-white mt-1">{totalUsd}</p>
            </div>
            <DollarSign className="text-primary" size={32} />
          </div>

          {/* Bicis Alquiladas */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between col-span-1 sm:col-span-2 backdrop-blur-sm">
            <div>
              <p className="text-sm text-white/70">Bicicletas alquiladas hoy</p>
              <p className="text-2xl font-semibold text-white mt-1">{bicisHoy}</p>
            </div>
            <Bike className="text-primary" size={32} />
          </div>
        </div>

        {/* --- TABLA DE ÚLTIMAS VENTAS --- */}
        <div className="mt-10 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-4">Últimas ventas</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-white/70 border-b border-white/10">
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Monto</th>
                  <th className="py-2">Tipo</th>
                </tr>
              </thead>

              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id} className="border-b border-white/5">
                    <td className="py-2">{v.cliente}</td>
                    <td className="py-2">Bs. {v.monto}</td>
                    <td className="py-2">{v.tipo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botón ver más */}
          <div className="flex justify-center mt-4">
            <button className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition">
              Ver todas
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
