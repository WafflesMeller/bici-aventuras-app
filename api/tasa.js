export default async function handler(req, res) {
  // 1. CONFIGURACIÓN CORS (Permisos de acceso)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-dolarvzla-key');

  // 2. MANEJO DE PREFLIGHT (Solicitud OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. OBTENER PARAMETROS Y API KEY
  // Leemos si el frontend pide 'history', 'interventions' o la actual (default)
  const { type, from, to } = req.query; 
  
  // IMPORTANTE: Asegúrate de tener esta variable en tu archivo .env de Vercel
  const API_KEY = process.env.DOLAR_VZLA_KEY; 

  // URL Base
  const BASE_URL = 'https://api.dolarvzla.com/public';
  let targetUrl = `${BASE_URL}/exchange-rate`; // Por defecto: Tasa actual

  // Lógica para cambiar la URL según lo que pida tu React
  if (type === 'history') {
    targetUrl = `${BASE_URL}/exchange-rate/list`;
  } else if (type === 'interventions') {
    targetUrl = `${BASE_URL}/interventions`;
  }

  // Construimos la URL con parámetros (from, to) si existen
  const urlObj = new URL(targetUrl);
  if (from) urlObj.searchParams.append('from', from);
  if (to) urlObj.searchParams.append('to', to);

  try {
    // 4. PETICIÓN A LA API EXTERNA
    const response = await fetch(urlObj.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'x-dolarvzla-key': API_KEY || '' // Insertamos la llave aquí
      }
    });

    if (!response.ok) throw new Error(`Fallo API Externa: ${response.status}`);

    const data = await response.json();

    // Caso de ÉXITO: Devolvemos la data tal cual
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error detectado, activando modo emergencia:', error);

    // 5. MODO EMERGENCIA (FALLBACK)
    
    // Si la petición era de HISTORIAL, no podemos devolver el objeto de emergencia
    // porque el frontend espera un Arreglo []. Devolvemos array vacío para no romper la app.
    if (type === 'history' || type === 'interventions') {
        return res.status(200).json([]); 
    }

    // Si la petición era de TASA ACTUAL, devolvemos tu objeto manual
    const fechaHoy = new Date().toISOString().split('T')[0]; 

    return res.status(200).json({
      current: {
        usd: 370.25,  // Tasa manual de emergencia
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
      source: "Manual (Emergencia - Fallo API)"
    });
    
  }
}