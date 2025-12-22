import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// 1. Cambiamos a exportación nombrada para que coincida con tu import { ProtectedRoute }
export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // DEBUG: Si ves la pantalla en blanco, abre la consola (F12) 
  // y mira qué dice este log.
  console.log("Auth State:", { user, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-medium animate-pulse">Verificando acceso...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Mantenemos el default por si acaso, pero la clave es la exportación de arriba
export default ProtectedRoute;