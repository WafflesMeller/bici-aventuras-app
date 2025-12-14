import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Login() {
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

    if (error) setError("Credenciales incorrectas.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white/5 p-8 rounded-xl border border-white/10">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.jpg"   // ← Reemplaza por tu imagen
            alt="Logo"
            className="w-100 h-auto object-contain"
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
              className="input-field w-full mt-1 p-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-green)]"
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
          >
            {loading ? <Loader2 className="animate-spin" /> : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
