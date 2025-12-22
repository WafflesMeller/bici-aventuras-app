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
      <span style="font-weight: 800; font-size: 14px;">🚲 BICIAVENTURAS APP</span>
      <span style="font-size: 12px;">Añádela a tu pantalla de inicio</span>
    </div>
    <button id="install-btn" style="background: black; color: white; border: none; 
            padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 12px;
            cursor: pointer;">INSTALAR</button>
  `;

  document.body.appendChild(alertBox);

  document.getElementById('install-btn').addEventListener('click', async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') alertBox.remove();
  });
});

// 3. Tu renderizado original
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)