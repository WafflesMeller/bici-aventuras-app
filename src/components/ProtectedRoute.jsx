import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabase/client';

const ProtectedRoute = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Chequeo inicial de sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios (por si cierras sesión o expira)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen bg-black flex items-center justify-center text-primary">Cargando...</div>;
  }

  // SI NO HAY SESIÓN, REDIRIGE AL LOGIN
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // SI HAY SESIÓN, MUESTRA EL CONTENIDO (Dashboard, Cobro, etc)
  return <Outlet />;
};

export default ProtectedRoute;