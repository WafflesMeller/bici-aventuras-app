import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "../supabase/client"; // ⚠️ Asegúrate de corregir esta ruta si sigue fallando

// 🔒 LÓGICA: Dominio interno para usuarios sin correo
const PSEUDO_DOMAIN = "app-rifas.local";

export default function Login() {
  // Estado para alternar entre Login y Registro
  const [isRegister, setIsRegister] = useState(false);

  // Campos de datos
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Solo para registro

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Lógica del Pseudo-Email
    const emailFalso = `${username}@${PSEUDO_DOMAIN}`;

    try {
      if (isRegister) {
        // --- LÓGICA DE REGISTRO ---
        const { error } = await supabase.auth.signUp({
          email: emailFalso,
          password: password,
          options: {
            data: {
              username: username,
              full_name: fullName, // Importante para tu tabla profiles
            },
          },
        });
        if (error) throw error;
        alert("Usuario creado. Ya puedes ingresar.");
        setIsRegister(false); // Cambiar a vista de login automáticamente
      } else {
        // --- LÓGICA DE LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: emailFalso,
          password: password,
        });
        if (error) throw error;
        // El redireccionamiento lo maneja tu router o el estado de sesión de Supabase
      }
    } catch (err) {
      setError(
        err.message.includes("Invalid login") 
          ? "Credenciales incorrectas." 
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 p-8 rounded-xl border border-white/10">
        
        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="w-100 h-auto object-contain"
          />
        </div>

        {/* TÍTULO DINÁMICO */}
        <h1 className="text-center text-2xl font-semibold text-white mb-6">
          {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
        </h1>

        <form onSubmit={handleAuth} className="space-y-5">
          
          {/* CAMPO EXTRA: SOLO APARECE EN REGISTRO (Usa tus mismos estilos) */}
          {isRegister && (
            <div>
              <label className="text-white text-sm">Nombre Completo</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field w-full mt-1 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)]"
                placeholder="Ej. Manuel Alfonzo"
              />
            </div>
          )}

          {/* CAMPO USUARIO (Antes Email) */}
          <div>
            <label className="text-white text-sm">Usuario</label>
            <input
              type="text"
              required
              value={username}
              // Sanitización: minúsculas y sin espacios
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className="input-field w-full mt-1 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)]"
              placeholder="Ej. manuel23"
            />
          </div>

          <div>
            <label className="text-white text-sm">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full mt-1 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-lg text-center hover:opacity-90 transition flex items-center justify-center"
            // Nota: Asegúrate de que tu clase btn-primary tenga color de fondo, o agrégalo aquí si falta
            style={{ backgroundColor: 'var(--brand-green, #10b981)', color: 'white' }} 
          >
            {loading ? <Loader2 className="animate-spin" /> : (isRegister ? "Registrarme" : "Ingresar")}
          </button>
        </form>

        {/* LINK PARA CAMBIAR ENTRE LOGIN Y REGISTRO (Estilo minimalista) */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isRegister 
              ? "¿Ya tienes cuenta? Inicia sesión" 
              : "¿No tienes usuario? Regístrate aquí"}
          </button>
        </div>

      </div>
    </div>
  );
}