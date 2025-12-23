export default async function handler(req, res) {
  // 1. CONFIGURACIÓN CORS (Permisos de acceso)
  // Permite acceso desde cualquier origen (*)
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Permite los métodos GET y OPTIONS
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  // Permite ciertos encabezados
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. MANEJO DE PREFLIGHT (Solicitud OPTIONS)
  // Los navegadores preguntan primero con OPTIONS si pueden entrar. 
  // Aquí les respondemos "OK" inmediatamente.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- TU CÓDIGO ORIGINAL SIGUE AQUÍ ---

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
      previous: { 
        usd: 260.00,
        eur: 310.00,
        date: fechaHoy
      },
      changePercentage: { 
        usd: 0,
        eur: 0
      },
      source: "Manual (Emergencia)"
    });
  }
}