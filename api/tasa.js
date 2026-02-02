import https from "https";
import xpath from "xpath";
import { DOMParser } from "xmldom";

function download(url) {
  return new Promise((resolve, reject) => {

    const agent = new https.Agent({
      rejectUnauthorized: false, // 👈 clave para BCV
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

    const xpathExpression =
      "/html/body/div[4]/div/div[2]/div/div[1]/div[1]/section[1]/div/div[2]/div/div[7]/div/div/div[2]/strong";

    const nodes = xpath.select(xpathExpression, doc);

    if (!nodes || nodes.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "No se encontró el nodo usando el XPath indicado",
      });
    }

    let raw = nodes[0].textContent || "";

    raw = raw
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .replace(",", ".")
      .trim();

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
      value: isNaN(value) ? null : value,
      xpath: xpathExpression,
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
