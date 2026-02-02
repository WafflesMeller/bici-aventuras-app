import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Configuración de encabezados CORS para que tu app funcione
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  try {
    // TRUCO: No llamamos al BCV directamente.
    // Llamamos a 'allorigins', un servicio que hace de puente y no está bloqueado.
    // Añadimos un timestamp al final para evitar que nos den datos viejos (cache).
    const targetUrl = 'https://www.bcv.org.ve/';
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&timestamp=${Date.now()}`;

    const response = await fetch(proxyUrl);
    
    if (!response.ok) throw new Error('Falló la conexión con el proxy');

    const data = await response.json();
    
    // 'data.contents' tiene el HTML del BCV
    const html = data.contents; 

    // Usamos cheerio para buscar los datos como si fuera jQuery/ImportXML
    const $ = cheerio.load(html);

    // Función auxiliar para limpiar el texto (quita espacios y cambia comas por puntos)
    const limpiarNumero = (texto) => {
      return parseFloat(texto.trim().replace(',', '.')) || 0;
    };

    // Extraemos usando los selectores específicos del BCV
    const usd = limpiarNumero($('#dolar strong').text());
    const eur = limpiarNumero($('#euro strong').text());

    // Verificamos que hayamos encontrado algo
    if (!usd || !eur) {
      throw new Error('El HTML cambió o no se encontraron los selectores #dolar / #euro');
    }

    res.status(200).json({
      success: true,
      usd: usd,
      eur: eur,
      fecha_consulta: new Date().toISOString(),
      fuente: "Banco Central de Venezuela (vía Proxy)"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'No se pudo obtener la tasa',
      mensaje_tecnico: error.message
    });
  }
}