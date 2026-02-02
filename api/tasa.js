import axios from 'axios';
import { DOMParser } from '@xmldom/xmldom';
import xpath from 'xpath';
import https from 'https';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    // 1. Configuración de RED para engañar al servidor viejo del BCV
    // Esto evita el error "fetch failed" o problemas de certificado
    const agent = new https.Agent({
      rejectUnauthorized: false, // Ignorar certificados vencidos
      ciphers: 'DEFAULT:@SECLEVEL=0' // Permitir cifrado antiguo (vital para webs del gobierno)
    });

    // 2. Descargamos el HTML
    const response = await axios.get('https://www.bcv.org.ve/', {
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000 // 10 segundos máximo
    });

    const html = response.data;

    // 3. Convertimos el HTML texto en un Documento navegable (como el DOM del navegador)
    // El "errorHandler" silencia las advertencias de que el HTML del BCV está mal hecho
    const doc = new DOMParser({
      errorHandler: { warning: () => {}, error: () => {}, fatalError: () => {} }
    }).parseFromString(html, 'text/html');

    // 4. USAMOS TU PATH EXACTO (XPath)
    // Nota: A veces xmldom añade validaciones estrictas, usamos select para buscar.
    
    // Función helper para extraer por XPath
    const extractByPath = (path) => {
      const nodes = xpath.select(path, doc);
      if (nodes && nodes.length > 0) {
        // Obtenemos el valor dentro de la etiqueta, quitamos espacios y comas
        let valor = nodes[0].textContent.trim();
        return parseFloat(valor.replace(',', '.')) || 0;
      }
      return null;
    };

    // TU PATH EXACTO DE USD:
    const usdPath = "/html/body/div[4]/div/div[2]/div/div[1]/div[1]/section[1]/div/div[2]/div/div[7]/div/div/div[2]/strong";
    
    // PATH DEL EURO (Generalmente está en el div[8] si el Dolar es el 7, o puedes buscarlo igual)
    // Asumiremos una estructura similar para el ejemplo, o usamos el ID para asegurar.
    // Si tienes el path del euro exacto, pégalo aquí abajo:
    const eurPath = "//*[@id='euro']/div/div/div[2]/strong"; // XPath híbrido más seguro

    const usd = extractByPath(usdPath);
    const eur = extractByPath(eurPath); // O usa otro path si lo tienes

    // Si devuelve null, es que el BCV cambió el orden de los divs (algo común)
    if (!usd) {
      throw new Error("El XPath no coincidió con la estructura actual del sitio.");
    }

    res.status(200).json({
      success: true,
      usd,
      eur: eur || "No definido",
      fecha: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      success: false,
      error: 'Error procesando la solicitud',
      detalle: error.message
    });
  }
}