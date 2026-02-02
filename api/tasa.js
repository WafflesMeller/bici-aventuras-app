export const config = {
  runtime: "nodejs",
};

import axios from "axios";
import https from "https";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const agent = new https.Agent({
      rejectUnauthorized: false, // BCV TLS roto
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

    let raw = null;

    /*
      Estrategia real:
      - buscamos cualquier nodo que contenga exactamente "USD"
      - tomamos el bloque contenedor
      - buscamos el primer <strong> numérico dentro
    */

    $("*").each((_, el) => {
      if (raw) return;

      const text = $(el).text().trim();

      if (text === "USD") {
        const container = $(el).closest("div, section, article");

        container.find("strong").each((__, s) => {
          if (raw) return;

          const t = $(s)
            .text()
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .replace(",", ".")
            .trim();

          if (/^\d+(\.\d+)?$/.test(t)) {
            raw = t;
          }
        });
      }
    });

    // fallback adicional por si el texto no es exactamente "USD"
    if (!raw) {
      $("strong").each((_, s) => {
        if (raw) return;

        const t = $(s)
          .text()
          .replace(/\u00a0/g, " ")
          .replace(/\s+/g, " ")
          .replace(",", ".")
          .trim();

        if (/^\d+(\.\d+)?$/.test(t)) {
          raw = t;
        }
      });
    }

    if (!raw) {
      return res.status(404).json({
        ok: false,
        error: "No se pudo detectar la tasa USD en el HTML",
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
      value: Number.isNaN(value) ? null : value,
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
