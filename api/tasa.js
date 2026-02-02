export const config = {
  runtime: "nodejs",
};

import https from "https";
import { JSDOM } from "jsdom";


function download(url) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({
      rejectUnauthorized: false, // BCV TLS roto
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
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      }
    ).on("error", reject);
  });
}

export default async function handler(req, res) {
  try {
    const html = await download("https://www.bcv.org.ve/");

    const dom = new JSDOM(html);
    const { document } = dom.window;

    // 👉 TU XPATH EXACTO
    const xpath =
      "/html/body/div[4]/div/div[2]/div/div[1]/div[1]/section[1]/div/div[2]/div/div[7]/div/div/div[2]/strong";

    const result = document.evaluate(
      xpath,
      document,
      null,
      dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );

    const node = result.singleNodeValue;

    if (!node) {
      return res.status(404).json({
        ok: false,
        error: "No se encontró el nodo usando el XPath indicado",
      });
    }

    let raw = node.textContent || "";

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
      value: Number.isNaN(value) ? null : value,
      xpath,
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
