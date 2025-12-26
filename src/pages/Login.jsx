import { useState } from 'react';
import { supabase } from '../supabase/client.js';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales incorrectas.');
      setLoading(false); // Detenemos carga si hay error
    } else {
      // <--- 3. REDIRIGIR SI TODO SALIÓ BIEN
      navigate('/panel'); // O a "/dashboard", "/admin", etc.
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md p-8 rounded-xl border border-white/10">
        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img src="/logo.webp" alt="Logo" className="w-80 h-auto object-contain" />
        </div>

        <h1 className="text-center text-2xl font-semibold text-white mb-6">Iniciar Sesión</h1>

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
                        bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary"
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
                        bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-black font-semibold 
                       bg-primary hover:opacity-90 transition 
                       flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
