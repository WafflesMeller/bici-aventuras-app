import https from "https";
import xpath from "xpath";
import { DOMParser } from "xmldom";

function download(url) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({
      rejectUnauthorized: false, // necesario para BCV
    });

    https.get(
      url,
      {
        agent,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    ).on("error", reject);
  });
}

export default async function handler(req, res) {
  try {
    const html = await download("https://www.bcv.org.ve/");

    const doc = new DOMParser({
      errorHandler: {
        warning: () => {},
        error: () => {},
        fatalError: () => {},
      },
    }).parseFromString(html, "text/html");

    // 👉 1. Tu XPath EXACTO
    const xpathExact =
      "/html/body/div[4]/div/div[2]/div/div[1]/div[1]/section[1]/div/div[2]/div/div[7]/div/div/div[2]/strong";

    // 👉 2. XPath de respaldo (mucho más estable)
    // Busca el strong del bloque de USD por contexto
    const xpathFallback =
      "//div[contains(@class,'views-row')]//strong";

    let nodes = xpath.select(xpathExact, doc);
    let usedXpath = xpathExact;

    // Fallback automático
    if (!nodes || nodes.length === 0) {
      nodes = xpath.select(xpathFallback, doc);
      usedXpath = xpathFallback;
    }

    if (!nodes || nodes.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "No se pudo localizar la tasa con ninguno de los XPaths",
      });
    }

    // En el fallback pueden venir varios strong, tomamos
    // el primero que tenga forma de número
    let raw = null;

    for (const n of nodes) {
      const t = (n.textContent || "")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .replace(",", ".")
        .trim();

      if (/\d+\.\d+/.test(t)) {
        raw = t;
        break;
      }
    }

    if (!raw) {
      return res.status(404).json({
        ok: false,
        error: "No se encontró un valor numérico válido",
      });
    }

    const value = parseFloat(raw);

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      ok: true,
      currency: "USD",
      raw,
      value: isNaN(value) ? null : value,
      xpath_used: usedXpath,
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("BCV error:", err);

    return res.status(500).json({
      ok: false,
      error: "Error interno consultando BCV",
      detail: err.message,
    });
  }
}
