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

    // IDs reales del BCV según el HTML que tú pasaste
    const map = {
      EUR: "#euro",
      CNY: "#yuan",
      TRY: "#lira",
      RUB: "#rublo",
      USD: "#dolar",
    };

    const parseNumber = (txt) => {
      if (!txt) return null;

      const n = parseFloat(
        txt
          .replace(/\u00a0/g, "")
          .replace(/\s+/g, "")
          .replace(",", ".")
      );

      if (Number.isNaN(n)) return null;

      // redondeo a 2 decimales, pero manteniendo number
      return Math.round(n * 100) / 100;
    };

    const rates = {};

    for (const [code, selector] of Object.entries(map)) {
      const raw = $(selector).find("strong").first().text();
      rates[code] = parseNumber(raw);
    }

    // Fecha valor publicada por el BCV
    const fechaValor =
      $(".date-display-single").first().text().trim() || null;

    const any = Object.values(rates).some(
      (v) => typeof v === "number"
    );

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
      fecha_valor: fechaValor,
      rates, // ← SOLO números
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
