import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Componente de protección de rutas.
 * Verifica si hay un usuario autenticado usando el contexto global.
 */
const ProtectedRoute = () => {
  // Extraemos user y loading desde tu AuthContext
  const { user, loading } = useAuth();

  // 1. ESTADO DE CARGA:
  // Mientras Supabase verifica las cookies de sesión, mostramos un indicador visual.
  // Esto evita que React intente renderizar el Outlet o el Redirect antes de tiempo.
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        {/* Spinner simple con los colores de tu marca */}
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-medium animate-pulse">Verificando acceso...</p>
      </div>
    );
  }

  // 2. CONTROL DE ACCESO:
  // Si terminó de cargar y el objeto 'user' es null, significa que no hay sesión.
  // Usamos 'replace' para que el usuario no pueda volver atrás con el botón del navegador.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. RUTA AUTORIZADA:
  // Si hay usuario, renderizamos las rutas hijas (Dashboard, Cobro, etc.)
  return <Outlet />;
};

export default ProtectedRoute;