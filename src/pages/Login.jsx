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
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">

      {/* Glows verdes */}
      <div className="absolute w-[500px] h-[500px] glow-green opacity-20 -top-40 -left-20"></div>
      <div className="absolute w-[500px] h-[500px] glow-green-2 opacity-20 bottom-0 right-0"></div>

      {/* Card glass */}
      <div className="glass w-[90%] max-w-md p-8 rounded-2xl shadow-xl relative z-10">

        <h1 className="text-3xl font-bold text-brand-gray text-center mb-6 tracking-wide">
          Bici Aventuras Macuto
        </h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-brand-gray text-sm font-medium">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ring-brand-green2"
              placeholder="usuario@example.com"
            />
          </div>

          <div>
            <label className="text-brand-gray text-sm font-medium">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ring-brand-green2"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg btn-gradient text-black font-bold hover:opacity-90 transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
