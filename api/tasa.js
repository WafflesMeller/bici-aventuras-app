import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Configurar CORS para que tu frontend pueda consultar la API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  try {
    const response = await fetch('https://www.bcv.org.ve/', {
      method: 'GET',
      headers: {
        // Estos headers son vitales para que el servidor del BCV no dé error 403 o 500
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    });

    if (!response.ok) throw new Error(`Error del BCV: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    // Función para limpiar el texto y convertir a número
    const parseRate = (selector) => {
      const value = $(selector).text().trim().replace(',', '.');
      return parseFloat(value) || 0;
    };

    // Usamos los IDs exactos del BCV
    const usd = parseRate('#dolar strong');
    const eur = parseRate('#euro strong');

    if (usd === 0) throw new Error("No se pudo parsear el valor del USD");

    res.status(200).json({
      success: true,
      usd,
      eur,
      fecha: new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' })
    });

  } catch (error) {
    console.error("Error detallado:", error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Error al extraer datos', 
      details: error.message 
    });
  }
}