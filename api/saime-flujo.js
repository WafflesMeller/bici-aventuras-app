// saime-flujo.js
import got from 'got';
import { CookieJar } from 'tough-cookie';
import { load } from 'cheerio';
import https from 'https';

// URL Base
const BASE = 'https://controlfronterizo.saime.gob.ve/index.php?r=dregistro/dregistro';

// Pausa para no saturar
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function consultaCedula(letra = 'V', cedula) {
  const jar = new CookieJar();
  
  // Configuración del cliente HTTP
  const client = got.extend({
    http2: true,
    cookieJar: jar,
    timeout: { request: 20000 },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    },
    https: { rejectUnauthorized: true },
    agent: { https: new https.Agent({ keepAlive: true }) },
    followRedirect: true,
    throwHttpErrors: false
  });

  let csrfToken = null;

  const getToken = async () => {
    const resp = await client.get(`${BASE}/cedula`);
    const $ = load(resp.body);
    csrfToken = $('input[name="YII_CSRF_TOKEN"]').attr('value') || '';
  };

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!csrfToken) await getToken();

      const formBase = { YII_CSRF_TOKEN: csrfToken, 'Dregistro[letra]': letra };

      // Paso 1: Nacionalidad
      await client.post(`${BASE}/letra`, {
        form: { ...formBase, 'Dregistro[num_cedula]': '', 'Dregistro[num_pasaporte]': '' }
      });

      // Paso 2: Cédula
      const resp = await client.post(`${BASE}/cedula`, {
        form: { ...formBase, 'Dregistro[num_cedula]': cedula.toString(), 'Dregistro[num_pasaporte]': '' }
      });

      if (resp.statusCode >= 500) throw new Error(`HTTP ${resp.statusCode}`);

      const $ = load(resp.body);
      const getVal = sel => $(sel).val()?.trim() || '';
      
      const pNombre = getVal('#Dregistro_primernombre');
      const pApellido = getVal('#Dregistro_primerapellido');
      const fechaNac = getVal('#Dregistro_fecha_nac');

      if (pNombre && pApellido) {
        return {
          found: true,
          nombres: `${pNombre} ${getVal('#Dregistro_segundonombre')}`.trim(),
          apellidos: `${pApellido} ${getVal('#Dregistro_segundoapellido')}`.trim(),
          fechaNacimiento: fechaNac
        };
      }

      const alerta = $('.btn.btn-danger').first().text().trim();
      if (alerta) return { found: false, alert: alerta };

      if (attempt < maxRetries) { csrfToken = null; await sleep(1500); continue; }
      
      return { found: false, error: 'No encontrado' };

    } catch (err) {
      if (attempt === maxRetries) throw err;
      await sleep(2000);
    }
  }
}