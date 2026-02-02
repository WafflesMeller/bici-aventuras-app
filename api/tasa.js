export default async function handler(req, res) {
  try {
    const response = await fetch('https://www.bcv.org.ve/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await response.text();

    // Extraemos el valor usando Regex (buscamos lo que esté dentro de los IDs específicos)
    const extract = (id) => {
      const regex = new RegExp(`<div id="${id}"[^>]*>.*?<strong>\\s*([^<]+)\\s*</strong>`, 's');
      const match = html.match(regex);
      return match ? match[1].trim().replace(',', '.') : 'No encontrado';
    };

    const usd = extract('dolar');
    const eur = extract('euro');

    // Configurar CORS para que tu React pueda leerla
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    res.status(200).json({
      fecha: new Date().toISOString(),
      usd: parseFloat(usd),
      eur: parseFloat(eur),
      unidad: "VES"
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los datos del BCV' });
  }
}