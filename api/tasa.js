export const config = {
  runtime: "nodejs",
};

import axios from "axios";
import https from "https";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false, // TLS incompleto del BCV
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

    // Mapeo directo por IDs reales del BCV
    const map = {
      EUR: "#euro",
      CNY: "#yuan",
      TRY: "#lira",
      RUB: "#rublo",
      USD: "#dolar",
    };

    const normalize = (v) => {
      if (!v) return null;
      return v
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, "")
        .replace(",", ".");
    };

    const rates = {};
    const raw = {};

    for (const [code, selector] of Object.entries(map)) {
      const txt = $(selector).find("strong").first().text();
      raw[code] = txt?.trim() || null;

      const n = normalize(txt);
      rates[code] = n ? Number.parseFloat(n) : null;
    }

    // Validación mínima
    const anyValue = Object.values(rates).some(
      (v) => typeof v === "number" && !Number.isNaN(v)
    );

    if (!anyValue) {
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
      rates, // <- todas las monedas
      raw,   // <- texto original por moneda
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
