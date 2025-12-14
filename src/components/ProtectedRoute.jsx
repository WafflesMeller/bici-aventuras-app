import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Opcional: Mostrar un spinner mientras verificamos
  if (loading) return <div className="text-white">Cargando...</div>;

  // Si no hay usuario, redirigir al Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, renderizar la ruta hija (Outlet)
  return <Outlet />;
};