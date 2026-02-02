import https from "https";
import xpath from "xpath";
import { DOMParser } from "xmldom";

function download(url) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({
      rejectUnauthorized: false, // necesario para el TLS del BCV
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

    // ----------------------------
    // 1️⃣ Tu XPath EXACTO
    // ----------------------------
    const xpathExact =
      "/html/body/div[4]/div/div[2]/div/div[1]/div[1]/section[1]/div/div[2]/div/div[7]/div/div/div[2]/strong";

    // ----------------------------
    // 2️⃣ XPath semántico (robusto)
    //   Busca el contenedor que tenga el texto USD
    //   y luego cualquier <strong> dentro
    // ----------------------------
    const xpathByUSD =
      "//*[contains(normalize-space(.),'USD')]//following::strong";

    let nodes = xpath.select(xpathExact, doc);
    let usedXpath = xpathExact;

    if (!nodes || nodes.length === 0) {
      nodes = xpath.select(xpathByUSD, doc);
      usedXpath = xpathByUSD;
    }

    if (!nodes || nodes.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "No se pudo localizar la tasa con ninguno de los XPaths",
      });
    }

    // Tomamos el primer <strong> que parezca una tasa
    let raw = null;

    for (const n of nodes) {
      const t = (n.textContent || "")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .replace(",", ".")
        .trim();

      // Formato típico: 36.54 / 38.1234
      if (/^\d+(\.\d+)?$/.test(t)) {
        raw = t;
        break;
      }
    }

    if (!raw) {
      return res.status(404).json({
        ok: false,
        error: "Se encontraron nodos, pero ninguno parece una tasa válida",
      });
    }

    const value = parseFloat(raw);

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      ok: true,
      source: "bcv.org.ve",
      currency: "USD",
      raw,
      value,
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
