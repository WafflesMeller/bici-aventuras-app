import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    // Usamos corsproxy.io que es muy rápido y suele pasar los filtros
    const target = 'https://www.bcv.org.ve/';
    const proxy = `https://corsproxy.io/?${encodeURIComponent(target)}`;

    const response = await fetch(proxy);
    const html = await response.text();
    const $ = cheerio.load(html);

    const parsear = (id) => {
      const val = $(`${id} strong`).text().trim().replace(',', '.');
      return parseFloat(val);
    };

    const usd = parsear('#dolar');
    const eur = parsear('#euro');

    if (!usd || !eur) throw new Error("No se encontraron los datos en el HTML");

    res.status(200).json({
      success: true,
      usd,
      eur,
      fecha: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}