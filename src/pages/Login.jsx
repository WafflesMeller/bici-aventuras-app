import { useState } from "react";
import { supabase } from "../supabase/client.js";
import { Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciales incorrectas.");
      setLoading(false); // Detenemos carga si hay error
    } else {
      // <--- 3. REDIRIGIR SI TODO SALIÓ BIEN
      navigate("/dashboard"); // O a "/dashboard", "/admin", etc.
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
            className="w-40 sm:w-52 h-auto object-contain"
          />
        </div>

        <h1 className="text-center text-2xl font-semibold text-white mb-6">
          Iniciar Sesión
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="text-white text-sm">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-field mt-1 p-3 rounded-lg 
                         text-white placeholder-gray-400 border border-gray-600
                        bg-white/5 focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="correo@example.com"
            />
          </div>

          <div>
            <label className="text-white text-sm">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-field mt-1 p-3 rounded-lg 
                        text-white placeholder-gray-400 border border-gray-600
                        bg-white/5 focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-black font-semibold 
                       bg-brand-green hover:opacity-90 transition 
                       flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Ingresar"}
          </button>

        </form>
      </div>
    </div>
  );
}
