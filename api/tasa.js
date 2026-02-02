import xpath from "xpath";
import { DOMParser } from "xmldom";

export default async function handler(req, res) {
  try {
    const url = "https://www.bcv.org.ve/";

    const response = await fetch(url, {
      headers: {
        // importante para evitar bloqueos básicos
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(500).json({
        ok: false,
        error: "No se pudo descargar la página del BCV",
      });
    }

    const html = await response.text();

    // Parseamos el HTML como DOM
    const doc = new DOMParser({
      errorHandler: {
        warning: () => {},
        error: () => {},
        fatalError: () => {},
      },
    }).parseFromString(html, "text/html");

    // 👉 TU XPATH EXACTO
    const xpathExpression =
      "/html/body/div[4]/div/div[2]/div/div[1]/div[1]/section[1]/div/div[2]/div/div[7]/div/div/div[2]/strong";

    const nodes = xpath.select(xpathExpression, doc);

    if (!nodes || nodes.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "No se encontró el nodo usando el XPath indicado",
      });
    }

    let value = nodes[0].textContent || "";

    // Limpieza básica
    value = value
      .replace(/\s+/g, " ")
      .replace(",", ".")
      .trim();

    const number = parseFloat(value);

    // Headers de cache (muy recomendado para este tipo de scraping)
    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      ok: true,
      source: "bcv.org.ve",
      currency: "USD",
      raw: value,
      value: isNaN(number) ? null : number,
      xpath: xpathExpression,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      ok: false,
      error: "Error interno consultando BCV",
      detail: err.message,
    });
  }
}
