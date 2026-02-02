export default async function handler(req, res) {
  // CORS habilitado
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    // Consultamos la API pública de pyDolarVenezuela (monitor)
    // Documentación: https://github.com/fcoagz/api-pydolarvenezuela
    const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv');
    
    if (!response.ok) throw new Error('Error conectando con el proveedor de datos');

    const data = await response.json();
    
    // La estructura de esta API suele devolver "monitors"
    const bcvData = data.monitors.usd;

    res.status(200).json({
      success: true,
      usd: bcvData.price, // Precio del dólar
      eur: data.monitors.eur.price, // Precio del euro (a veces viene separado, si falla avísame)
      fecha: bcvData.last_update,
      fuente: "BCV (vía pyDolarVenezuela API)"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "No se pudo obtener la tasa",
      detalle: error.message
    });
  }
}