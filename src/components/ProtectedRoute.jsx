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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'red', zIndex: 99999 }}>
      <h1 style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>
        DEBUG: VERIFICANDO ACCESO...
      </h1>
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