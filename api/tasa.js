export default async function handler(req, res) {
  const API_URL = 'https://api.dolarvzla.com/public/exchange-rate';

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Fallo API Externa');

    const data = await response.json();

    // Caso de ÉXITO: Devolvemos la data tal cual
    return res.status(200).json(data);

  } catch (error) {
    console.error('Usando tasa de emergencia:', error);

    // Caso de ERROR (Emergencia):
    // IMPORTANTE: Mantenemos la estructura EXACTA de "current" 
    // para que el frontend no se rompa.
    const fechaHoy = new Date().toISOString().split('T')[0]; // "2025-12-05"

    return res.status(200).json({
      current: {
        usd: 260.00,  // Tasa manual de emergencia
        eur: 310.00,
        date: fechaHoy
      },
      previous: { // Datos ficticios para que no rompa si usas esto
        usd: 260.00,
        eur: 310.00,
        date: fechaHoy
      },
      changePercentage: { // En 0 para que no muestre flechas locas
        usd: 0,
        eur: 0
      },
      source: "Manual (Emergencia)"
    });
  }
}