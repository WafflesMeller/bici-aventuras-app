import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    // 1. Intentamos con CodeTabs (suele ser más robusto para BCV)
    // Usamos un número aleatorio al final para evitar caché del proxy
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=https://www.bcv.org.ve/&dummy=${Date.now()}`;

    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`El proxy respondió con status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Función para limpiar el número (Venezuela usa coma para decimales)
    const parsear = (selector) => {
      const texto = $(selector).text().trim();
      // Ejemplo: "36,2500" -> 36.25
      return parseFloat(texto.replace(',', '.')) || 0;
    };

    const usd = parsear('#dolar strong');
    const eur = parsear('#euro strong');

    // Validación de seguridad: Si obtenemos 0, algo falló en el HTML
    if (usd === 0 || eur === 0) {
      throw new Error('Se descargó el sitio, pero no se encontraron los selectores #dolar o #euro');
    }

    res.status(200).json({
      success: true,
      usd,
      eur,
      fecha: new Date().toISOString(),
      fuente: "BCV (via CodeTabs)"
    });

  } catch (error) {
    console.error("Error scraping BCV:", error);
    
    // Respuesta de error controlada
    res.status(500).json({ 
      success: false, 
      error: "No se pudo obtener la tasa en este momento.",
      detalle: error.message
    });
  }
}