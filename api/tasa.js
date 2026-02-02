export const config = {
  runtime: "nodejs",
};

import axios from "axios";
import https from "https";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const response = await axios.get("https://www.bcv.org.ve/", {
      httpsAgent: agent,
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // IDs reales del BCV
    const map = {
      EUR: "#euro",
      CNY: "#yuan",
      TRY: "#lira",
      RUB: "#rublo",
      USD: "#dolar",
    };

    // Normaliza, redondea a 2 decimales y deja coma decimal
    const normalizeAndFormat = (txt) => {
      if (!txt) return null;

      const n = parseFloat(
        txt
          .replace(/\u00a0/g, "")
          .replace(/\s+/g, "")
          .replace(",", ".")
      );

      if (Number.isNaN(n)) return null;

      // 2 decimales
      const fixed = n.toFixed(2);

      // coma decimal
      return fixed.replace(".", ",");
    };

    const rates = {};

    for (const [code, selector] of Object.entries(map)) {
      const raw = $(selector).find("strong").first().text();
      rates[code] = normalizeAndFormat(raw);
    }

    // -----------------------------
    // Fecha valor real publicada
    // -----------------------------
    const fechaValor = $(".date-display-single").first().text().trim() || null;

    const any = Object.values(rates).some((v) => v !== null);

    if (!any) {
      return res.status(404).json({
        ok: false,
        error: "No se pudieron leer las tasas desde el HTML del BCV",
      });
    }

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      ok: true,
      source: "bcv.org.ve",
      fecha_valor: fechaValor,   // ← la fecha publicada por el BCV
      rates,                     // ← una sola estructura
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("BCV ERROR:", err);

    return res.status(500).json({
      ok: false,
      error: "Error consultando BCV",
      detail: err.message,
    });
  }
}
