import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { registerSW } from 'virtual:pwa-register'

// 1. Registro del Service Worker (Para que funcione como App)
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Hay una nueva versión de Biciaventuras. ¿Actualizar ahora?')) {
      updateSW(true);
    }
  },
})

// 2. Lógica del Aviso de Instalación "Biciaventuras"
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  const deferredPrompt = e;

  // Si el usuario ya cerró el aviso en esta sesión, no lo mostramos
  if (sessionStorage.getItem('pwa-banner-closed')) return;

  // Creamos el aviso visual
  const alertBox = document.createElement('div');
  alertBox.id = 'pwa-install-banner';
  alertBox.style.cssText = `
    position: fixed; bottom: 20px; left: 20px; right: 20px;
    background: #facc15; color: black; padding: 16px; 
    border-radius: 16px; z-index: 10000; font-family: sans-serif;
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 2px solid black;
  `;

  alertBox.innerHTML = `
    <div style="display: flex; flex-direction: column;">
    <button id="close-pwa-btn" style="background: none; border: none; font-size: 26px; 
              cursor: pointer; color: black; font-weight: bold; line-height: 1; padding: 0 4px;">&times;</button>
      <span style="font-weight: 800; font-size: 14px;">🚲 BICIAVENTURAS APP</span>
      <span style="font-size: 12px;">Añádela a tu pantalla de inicio</span>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <button id="install-btn" style="background: black; color: white; border: none; 
              padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 12px;
              cursor: pointer;">INSTALAR</button>
    </div>
  `;

  document.body.appendChild(alertBox);

  // Lógica del botón INSTALAR
  document.getElementById('install-btn').addEventListener('click', async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') alertBox.remove();
  });

  // LÓGICA DE LA "X" PARA CERRAR
  document.getElementById('close-pwa-btn').addEventListener('click', () => {
    alertBox.remove(); // Elimina el elemento del HTML
    sessionStorage.setItem('pwa-banner-closed', 'true'); // Evita que salga otra vez al recargar
  });
});

// 3. Tu renderizado original
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)