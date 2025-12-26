import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Notifications from './components/Notifications';
import EscaneoPago from './pages/EscaneoPago';

// Tus páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cobro from './pages/Cobro';
import VentasPage from './pages/VentasPage';
import Bicis from './pages/Bicis';

// import AdminPanel from "./pages/AdminPanel";
function App() {
  return (
    <BrowserRouter>
      {/* 1. Envolvemos todo con el AuthProvider */}
      <AuthProvider>
        <Notifications />
        <Routes>
          {/* RUTA PÚBLICA */}
          <Route path="/login" element={<Login />} />

          {/* RUTAS PROTEGIDAS (Agrupadas) */}
          <Route element={<ProtectedRoute />}>
            {/* Aquí van todas las páginas que requieren sesión */}

            <Route path="/" element={<Dashboard />} />
            <Route path="/panel" element={<Dashboard />} />
            <Route path="/cobro" element={<Cobro />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/escanear" element={<EscaneoPago />} />
            <Route path="/bicis" element={<Bicis />} />

            {/* Si intentan entrar a cualquier otra, redirigir a dashboard o 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
