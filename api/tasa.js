export const config = {
  runtime: "nodejs",
};

import axios from "axios";
import https from "https";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  // CORS (para Expo Web o cualquier frontend)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 👇 Tasa de respaldo fija (Fallback)
  const FALLBACK_USD = 433.17;

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

      return Math.round(n * 100) / 100;
    };

    const rates = {};

    for (const [code, selector] of Object.entries(map)) {
      const raw = $(selector).find("strong").first().text();
      rates[code] = parseNumber(raw);
    }

    const fechaValor =
      $(".date-display-single").first().text().trim() || null;

    // Si logró conectarse pero no pudo extraer la tasa USD, forzamos el error
    // para que salte al catch y devuelva tu monto de respaldo.
    if (!rates.USD) {
      throw new Error("No se pudo leer la tasa USD desde el HTML del BCV");
    }

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    // Si todo salió bien, devolvemos la tasa real del BCV
    return res.status(200).json({
      ok: true,
      source: "bcv.org.ve",
      fechaValor: fechaValor,
      current: {
        usd: rates.USD,
        eur: rates.EUR,
        cny: rates.CNY,
        try: rates.TRY,
        rub: rates.RUB
      },
    });

  } catch (error) {
    // 👇 AQUÍ ENTRA SI ALGO FALLA (Error de Host, Timeout, Caída de la web, etc.)
    
    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    // Devolvemos status 200 para que tu app no se rompa, pero con la tasa fija.
    return res.status(200).json({
      ok: true,
      source: "fallback_manual",
      fallback_used: true,
      error_original: error.message, // Te dejo esto por si quieres ver en consola por qué falló
      current: {
        usd: FALLBACK_USD,
      },
    });
  }
}
