import axios from 'axios';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  // Headers para evitar problemas de CORS en tu frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  try {
    // 1. EL TUNEL (Necesario porque Vercel está bloqueado en Venezuela)
    // Usamos corsproxy.io que es gratuito y muy rápido.
    const targetUrl = 'https://www.bcv.org.ve/';
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const response = await axios.get(proxyUrl, {
      timeout: 10000 // Timeout de 10 segundos
    });

    // 2. CARGAMOS EL DOM (Como si fuera un navegador)
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // 3. TU XPATH EXACTO
    // Esta función busca el elemento usando el camino que tú definiste
    const getByXPath = (path) => {
      const result = document.evaluate(
        path,
        document,
        null,
        9, // 9 = FIRST_ORDERED_NODE_TYPE (Devuelve el primer nodo encontrado)
        null
      );
      return result.singleNodeValue;
    };

    // Usamos tu path para el USD
    const usdNode = getByXPath("/html/body/div[4]/div/div[2]/div/div[1]/div[1]/section[1]/div/div[2]/div/div[7]/div/div/div[2]/strong");
    
    // Path calculado para el EURO (Generalmente es el div[8] si el USD es el 7)
    // Si tienes el path exacto del Euro, reemplázalo aquí:
    const eurNode = getByXPath("/html/body/div[4]/div/div[2]/div/div[1]/div[1]/section[1]/div/div[2]/div/div[8]/div/div/div[2]/strong");

    // Limpiamos los datos
    const cleanValue = (node) => {
      if (!node) return 0;
      return parseFloat(node.textContent.trim().replace(',', '.')) || 0;
    };

    const usd = cleanValue(usdNode);
    const eur = cleanValue(eurNode);

    // Validación: Si da 0, es que el path cambió
    if (usd === 0) {
      throw new Error("El XPath no encontró el dato. El BCV pudo haber movido el div.");
    }

    res.status(200).json({
      success: true,
      usd,
      eur,
      fecha: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error en API:", error.message);
    
    // En lugar de crashear (500), devolvemos un JSON explicando el error
    res.status(200).json({
      success: false,
      error: "Ocurrió un error obteniendo los datos",
      detalle: error.message
    });
  }
}