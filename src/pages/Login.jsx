import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "../supabase/client"; // ⚠️ Verifica que esta ruta sea correcta

// 🔒 CONFIGURACIÓN: El dominio falso para completar el email
const PSEUDO_DOMAIN = "app-rifas.local"; 

export default function Login() {
  // Estado para controlar si es Login o Registro
  const [isRegister, setIsRegister] = useState(false);

  // Campos del formulario
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Nuevo: para guardar el nombre real

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Generamos el email falso automáticamente
    const emailFalso = `${username}@${PSEUDO_DOMAIN}`;

    try {
      if (isRegister) {
        // --- LÓGICA DE REGISTRO ---
        const { error } = await supabase.auth.signUp({
          email: emailFalso,
          password: password,
          options: {
            // Guardamos el nombre real y username en la metadata
            // para que el Trigger SQL lo mueva a la tabla 'profiles'
            data: {
              username: username,
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        alert("Usuario registrado. Ya puedes iniciar sesión.");
        setIsRegister(false); // Volver al login
      } else {
        // --- LÓGICA DE LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: emailFalso,
          password: password,
        });
        if (error) throw error;
        // Supabase redirige o actualiza el estado de sesión automáticamente
      }
    } catch (err) {
      let msg = "Ocurrió un error.";
      if (err.message.includes("Invalid login")) msg = "Usuario o contraseña incorrectos.";
      if (err.message.includes("already registered")) msg = "Este usuario ya existe.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-900">
      <div className="w-full max-w-md bg-white/5 p-8 rounded-xl border border-white/10 shadow-2xl backdrop-blur-sm">
        
        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.jpg" 
            alt="Logo"
            className="w-32 h-auto object-contain rounded-md" // Ajusté un poco el tamaño
          />
        </div>

        <h1 className="text-center text-2xl font-semibold text-white mb-2">
          {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
        </h1>
        <p className="text-center text-gray-400 text-sm mb-6">
          {isRegister ? "Registra tus datos para acceder" : "Ingresa tu usuario y contraseña"}
        </p>

        <form onSubmit={handleAuth} className="space-y-5">
          
          {/* CAMPO: NOMBRE COMPLETO (Solo en Registro) */}
          {isRegister && (
            <div>
              <label className="text-white text-sm ml-1">Nombre y Apellido</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field w-full mt-1 p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)] transition-all"
                placeholder="Ej. Manuel Alfonzo"
              />
            </div>
          )}

          {/* CAMPO: USUARIO (Reemplaza al Email) */}
          <div>
            <label className="text-white text-sm ml-1">Usuario</label>
            <input
              type="text"
              required
              value={username}
              // Forzamos minúsculas y sin espacios
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className="input-field w-full mt-1 p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)] transition-all"
              placeholder="Ej. manuel23"
            />
            {isRegister && <p className="text-xs text-gray-500 mt-1 ml-1">Sin espacios, usa esto para entrar.</p>}
          </div>

          {/* CAMPO: CONTRASEÑA */}
          <div>
            <label className="text-white text-sm ml-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full mt-1 p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)] transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg">
              <p className="text-red-400 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-lg text-center font-semibold bg-[var(--brand-green)] text-white hover:opacity-90 transition flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'var(--brand-green, #10b981)' }} // Fallback color si la variable no carga
          >
            {loading ? <Loader2 className="animate-spin" /> : (isRegister ? "Registrarme" : "Ingresar")}
          </button>
        </form>

        {/* TOGGLE LOGIN / REGISTRO */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(""); // Limpiar errores al cambiar
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors underline decoration-dotted underline-offset-4"
          >
            {isRegister 
              ? "¿Ya tienes cuenta? Inicia sesión aquí" 
              : "¿No tienes cuenta? Regístrate aquí"}
          </button>
        </div>

      </div>
    </div>
  );
}