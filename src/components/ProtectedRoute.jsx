import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Componente de protección de rutas.
 * Verifica si hay un usuario autenticado usando el contexto global.
 */
export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // AGREGA ESTE CONSOLE LOG PARA VER QUÉ PASA EN TU NAVEGADOR
  console.log("Estado de la ruta:", { user, loading });

  if (loading) return <div className="text-white bg-red-500">CARGANDO...</div>;
  
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};


export default ProtectedRoute;