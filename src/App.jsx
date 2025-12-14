import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Tus páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // Asumo que tienes una página principal
import AdminPanel from "./pages/AdminPanel"; // Ejemplo de otra página privada

function App() {
  return (
    <BrowserRouter>
      {/* 1. Envolvemos todo con el AuthProvider */}
      <AuthProvider>
        <Routes>
          
          {/* RUTA PÚBLICA */}
          <Route path="/login" element={<Login />} />

          {/* RUTAS PROTEGIDAS (Agrupadas) */}
          <Route element={<ProtectedRoute />}>
            {/* Aquí van todas las páginas que requieren sesión */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            {/* Si intentan entrar a cualquier otra, redirigir a dashboard o 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;