import { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { supabase } from '../supabase/client.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wallet, Phone, LogOut, LayoutDashboard, Camera, PlusCircle, List } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('panel');
  const location = useLocation();

useEffect(() => {
  if (location.pathname === "/panel") setActiveTab("panel");
  if (location.pathname === "/cobro") setActiveTab("cobro");
}, [location.pathname]);


  // BLOQUEAR SCROLL CUANDO EL MENÚ MÓVIL ESTÁ ABIERTO
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  const tabs = [
    { key: 'panel', label: 'Panel', icon: <LayoutDashboard size={22} /> },
    { key: 'cobro', label: 'Cobrar', icon: <Wallet size={22} /> },
    { key: 'contacto', label: 'Contacto', icon: <Phone size={22} /> },
    { key: 'escanear', label: 'Escanear', icon: <Camera size={18} /> },
  ];

  const toggleMobile = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleTab = (tab) => {
    // 1. Actualizamos el estado visual (para la barrita de Framer Motion)
    setActiveTab(tab); 
    
    // 2. Cerramos el menú móvil (siempre, sin importar qué pestaña sea)
    setIsMobileMenuOpen(false); 

    // 3. Navegación centralizada
    if (tab === "panel") navigate("/panel");
    if (tab === "cobro") navigate("/cobro");
    if (tab === "escanear") navigate("/escanear"); // Ruta para el OCR
  };

  const handleLogout = async () => {
  try {
    // 1. Cerramos sesión en Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // 2. Limpiamos TODO el almacenamiento local manualmente por seguridad
    localStorage.clear();
    sessionStorage.clear();

    // 3. FORZAR RECARGA (Crucial para PWA)
    window.location.href = '/login'; 
    
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message);
    alert('No se pudo cerrar sesión, intenta de nuevo');
  }
};

  return (
    <LayoutGroup>
      {/* NAVBAR SUPERIOR */}
      <nav
        className={`w-full backdrop-blur-xs fixed top-0 left-0 z-100
      ${isMobileMenuOpen ? '' : 'bg-white/5 transition-colors duration-500'}`}
      >
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          {/* LOGO */}
          <div className="flex items-center">
            <img src="/logo.webp" alt="logo" className="w-40 h-20 object-contain " />
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex items-center gap-6 relative">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTab(t.key)}
                className={`relative flex items-center gap-1 transition ${
                  activeTab === t.key ? 'text-white' : 'text-white hover:text-primary'
                }`}
              >
                {t.icon}
                {t.label}

                {activeTab === t.key && (
                  <motion.span
                    layoutId="indicator"
                    className="absolute left-0 -bottom-1 w-full h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                  />
                )}
              </button>
            ))}

            {/* LOGOUT DESKTOP */}
            <button
              onClick={handleLogout}
              className="ml-3 flex items-center gap-2 text-white px-3 py-1.5 rounded-lg
                         bg-red-500/10 backdrop-blur-sm border border-red-500/20
                         hover:bg-red-500/20 transition"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>

          {/* MOBILE HAMBURGER */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={toggleMobile}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              className="relative w-10 h-10 flex items-center justify-center rounded-md 
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* Linea 1 */}
              <span
                className={`block absolute w-6 h-0.75 bg-white/80 rounded-full transition-transform duration-300 ${
                  isMobileMenuOpen ? 'rotate-45' : '-translate-y-2'
                }`}
              />
              {/* Linea 2 */}
              <span
                className={`block absolute w-6 h-0.75 bg-white/80 rounded-full transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              {/* Linea 3 */}
              <span
                className={`block absolute w-6 h-0.75 bg-white/80 rounded-full transition-transform duration-300 ${
                  isMobileMenuOpen ? '-rotate-45' : 'translate-y-2'
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* ------------------------------ */}
      {/*          MOBILE MENU           */}
      {/* ------------------------------ */}

      <div
        className={`
    md:hidden fixed inset-0 bg-white/5 backdrop-blur-md
    z-99 flex flex-col items-center justify-between
    transition-all duration-300
    ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
  `}
      >
        {/* OPCIONES CENTRADAS */}
        <div className="flex flex-col gap-8 items-center justify-center flex-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTab(t.key)}
              className={`
                flex items-center gap-3 text-3xl transition
                ${activeTab === t.key ? 'text-primary font-bold' : 'text-white hover:text-primary'}
              `}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* LOGOUT ABAJO */}
        <div className="pb-12 w-full flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white px-8 py-2 rounded-full
                       bg-red-500/20 backdrop-blur-sm border border-red-500/20
                       hover:bg-red-500/20 transition text-xl"
          >
            <LogOut size={22} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </LayoutGroup>
  );
}
