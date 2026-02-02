export const config = {
  runtime: "nodejs",
};

import axios from "axios";
import https from "https";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false, // BCV tiene TLS con cadena incompleta
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

    // -----------------------------
    // Selectores reales del BCV
    // -----------------------------
    const rawUSD = $("#dolar strong").first().text();
    const rawEUR = $("#euro strong").first().text();

    const normalize = (v) => {
      if (!v) return null;

      return v
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, "")
        .replace(",", ".");
    };

    const usdStr = normalize(rawUSD);
    const eurStr = normalize(rawEUR);

    const usd = usdStr ? parseFloat(usdStr) : null;
    const eur = eurStr ? parseFloat(eurStr) : null;

    if (!usd && !eur) {
      return res.status(404).json({
        ok: false,
        error: "No se pudieron leer las tasas USD ni EUR desde el HTML",
      });
    }

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      ok: true,
      source: "bcv.org.ve",
      usd: Number.isNaN(usd) ? null : usd,
      eur: Number.isNaN(eur) ? null : eur,
      raw: {
        usd: rawUSD?.trim() || null,
        eur: rawEUR?.trim() || null,
      },
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
