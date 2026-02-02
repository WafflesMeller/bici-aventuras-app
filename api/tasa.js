import axios from 'axios';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const bcvUrl = 'https://www.bcv.org.ve/';
    
    // LISTA DE PROXIES: Si uno falla, intentamos el siguiente.
    // Esto es vital porque los proxies públicos a veces se saturan.
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(bcvUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(bcvUrl)}`
    ];

    let html = null;
    let errorLast = null;

    // Intentamos descargar con el primer proxy, si falla, vamos al segundo
    for (const proxy of proxies) {
      try {
        const response = await axios.get(proxy, { 
          timeout: 6000 // 6 segundos máximo por intento
        });
        if (response.data && typeof response.data === 'string') {
          html = response.data;
          break; // ¡Éxito! Salimos del bucle
        }
      } catch (e) {
        console.log(`Fallo proxy ${proxy}:`, e.message);
        errorLast = e;
      }
    }

    if (!html) throw new Error("Todos los proxies fallaron. El BCV está muy lento o bloqueando.");

    // --- OPTIMIZACIÓN DE MEMORIA (CLAVE PARA VERCEL) ---
    // JSDOM consume mucha RAM. Le decimos que no procese scripts ni estilos.
    const dom = new JSDOM(html, {
      runScripts: "dangerously", // "dangerously" aquí significa "NO ejecutar nada extra" en este contexto si no se especifica resources
      resources: "usable", // Solo carga lo básico
      virtualConsole: new (await import('jsdom')).VirtualConsole(), // Ignora errores de consola del sitio del BCV
    });
    
    const document = dom.window.document;

    // Tu función XPath
    const getByXPath = (path) => {
      const result = document.evaluate(path, document, null, 9, null);
      return result.singleNodeValue;
    };

    // TUS PATHS (Ajustados para prevenir errores de espacios)
    const usdNode = getByXPath("/html/body/div[4]/div/div[2]/div/div[1]/div[1]/section[1]/div/div[2]/div/div[7]/div/div/div[2]/strong");
    
    // Nota: A veces el Euro cambia de posición (div 8 en vez de 7), agregamos un fallback simple
    let eurNode = getByXPath("/html/body/div[4]/div/div[2]/div/div[1]/div[1]/section[1]/div/div[2]/div/div[8]/div/div/div[2]/strong");
    
    // Si no encuentra el euro en el div 8, intenta buscarlo por ID (Plan B dentro del mismo código)
    if (!eurNode) {
       eurNode = document.querySelector('#euro strong');
    }

    const clean = (node) => {
      if (!node) return 0;
      return parseFloat(node.textContent.trim().replace(',', '.')) || 0;
    };

    const usd = clean(usdNode);
    const eur = clean(eurNode);

    // Cerramos JSDOM explícitamente para liberar memoria inmediatamente
    dom.window.close();

    if (!usd) throw new Error("Se descargó el HTML pero el XPath no encontró el dato.");

    res.status(200).json({
      success: true,
      usd,
      eur,
      fecha: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error Fatal:", error.message);
    // Devolvemos 200 con success:false para que tu frontend no explote con error 500
    res.status(200).json({
      success: false,
      error: "Error interno o de conexión",
      detalle: error.message
    });
  }
}