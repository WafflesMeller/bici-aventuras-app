// =====================================================================
// ARCHIVO: api/procesar.js
// CARACTERÍSTICAS: Soporte Híbrido + Reintentos + Anti-Duplicados + Red de Seguridad
// =====================================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // Configuración CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    // -----------------------------------------------------------------
    // 1. RECIBIR DATOS
    // -----------------------------------------------------------------
    const bodyData = req.body || {};
    const queryData = req.query || {};

    const TituloNotificacion = bodyData.TituloNotificacion || queryData.TituloNotificacion;
    const TextoNotificacion = bodyData.TextoNotificacion || queryData.TextoNotificacion;

    // Auditoría
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Desconocido';

    if (!TituloNotificacion || !TextoNotificacion) {
        return res.status(400).json({ error: 'Faltan parámetros (Titulo o Texto)' });
    }

    // -----------------------------------------------------------------
    // 2. LÓGICA DE PROCESAMIENTO (REGEX)
    // -----------------------------------------------------------------
    const parseMonto = (str) => {
        if (!str) return 0;
        let limpio = str.replace(/[^\d,]/g, ''); 
        return parseFloat(limpio.replace(',', '.')); 
    };

    const formatearMontoVisual = (numero) => {
        return "Bs. " + numero.toLocaleString('es-VE', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    };

    let data = {
        tipo: 'DESCONOCIDO',
        banco: 'DESCONOCIDO',
        monto: 0,
        referencia: 'N/A',
        emisor: 'No identificado'
    };

    let procesado = false;
    let mensajeCliente = "";
    let esErrorFormato = false; // Nueva bandera
    const tituloLimpio = TituloNotificacion.trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Esto quita tildes (ó -> o)
    const textoParaProcesar = TextoNotificacion.replace(/"/g,'').trim(); 

// --- CASO A: PAGO MÓVIL BDV ---
    if (tituloLimpio.toLowerCase().includes('pagomovilbdv')) {
        data.tipo = 'PAGO_MOVIL';
        data.banco = 'BDV';
        data.emisor = 'BDV';

        // Regex eliminando el ancla de inicio y el grupo del nombre
        const regexFormato1 = /por Bs\. ?([\d\.,]+).*operaci[oó]n[:\s] (\d+)/i;
        
        // También actualizamos el formato 2 por si acaso
        const regexFormato2 = /por Bs\. ?([\d\.,]+).*Ref[:\s]+(\d+)/i;
        // Usamos la variable textoParaProcesar para evitar problemas con comillas u otros caracteres especiales
        const match1 = textoParaProcesar.match(regexFormato1);
        const match2 = textoParaProcesar.match(regexFormato2);

        if (match1) {
            data.monto = parseMonto(match1[1]);
            data.referencia = match1[2];
            procesado = true;
            mensajeCliente = "Pago Móvil BDV procesado.";
        } else if (match2) {
            data.monto = parseMonto(match2[1]);
            data.referencia = match2[2];
            procesado = true;
            mensajeCliente = "Pago Móvil BDV procesado.";
        }
    } 
    // --- CASO B: OTROS BANCOS ---
    else if (tituloLimpio.toLowerCase().includes('transferencia de otros bancos')) {
        data.tipo = 'TRANSFERENCIA_INTERBANCARIA';
        data.banco = 'OTROS';
        data.emisor = 'OTROS_BANCOS';
        const regexOtros = /por Bs\. ?([\d\.,]+).*operaci[oó]n[:\s] (\d+)/i;
        const match = textoParaProcesar.match(regexOtros);
        if (match) {
            data.monto = parseMonto(match[1]);
            data.referencia = match[2];
            procesado = true;
            mensajeCliente = "Transferencia Otros Bancos procesada.";
        }
    } 
    // --- CASO C: TRANSFERENCIA BDV ---
    else if (tituloLimpio.toLowerCase().includes('transferencia bdv')) {
        data.tipo = 'TRANSFERENCIA_INTERNA';
        data.banco = 'BDV';
        data.emisor = 'BDV';
        const regexFormato1 = /por Bs\. ?([\d\.,]+).*operaci[oó]n[:\s] (\d+)/i;
        const regexFormato2 = /Bs\. ?([\d\.,]+).*Ref[:\s]+(\d+)/i;
        const match1 = textoParaProcesar.match(regexFormato1);
        const match2 = textoParaProcesar.match(regexFormato2);

        if (match1) {
            data.monto = parseMonto(match1[1]);
            data.referencia = match1[2];
            procesado = true;
            mensajeCliente = "Transferencia BDV procesada.";
        } else if (match2) {
            data.monto = parseMonto(match2[1]);
            data.referencia = match2[2];
            procesado = true;
            mensajeCliente = "Transferencia BDV procesada.";
        }
    }

    // -----------------------------------------------------------------
// 3. PREPARAR PAYLOAD (AJUSTADO A TABLA transacciones-biciaventuras)
// -----------------------------------------------------------------
let payloadDB = {};

if (procesado) {
    payloadDB = {
        referencia: data.referencia,
        monto_bs: formatearMontoVisual(data.monto), // Coincide con SQL
        monto_numerico: data.monto,
        titulo_notificacion: TituloNotificacion,    // Coincide con SQL
        texto_notificacion: TextoNotificacion,      // Coincide con SQL
        cliente: data.emisor,                       // Usamos emisor como cliente
        fecha_hora: new Date().toISOString(),       // Coincide con SQL
        ip_origen: clientIp,
        user_agent: userAgent,
        raw_data: { body: bodyData, query: queryData, estado: 'OK' },
        usada: false
    };
} else {
    // RED DE SEGURIDAD 🛡️
    esErrorFormato = true;
    mensajeCliente = "Formato no reconocido. Guardado para revisión manual.";
    const refError = `ERR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    payloadDB = {
        referencia: refError,
        monto_bs: "Bs. 0,00",
        monto_numerico: 0,
        titulo_notificacion: TituloNotificacion,
        texto_notificacion: TextoNotificacion,
        cliente: 'SISTEMA_ERROR',
        fecha_hora: new Date().toISOString(),
        ip_origen: clientIp,
        user_agent: userAgent,
        raw_data: { body: bodyData, query: queryData, estado: 'REVISION_REQUERIDA' },
        usada: false
    };
}

// -----------------------------------------------------------------
// 4. GUARDAR EN SUPABASE
// -----------------------------------------------------------------
const guardarConReintentos = async (intentosMaximos = 3) => {
    for (let i = 1; i <= intentosMaximos; i++) {
        try {
            // IMPORTANTE: El nombre de la tabla entre comillas por el guion
            const { error } = await supabase
                .from('transacciones-biciaventuras') 
                .insert(payloadDB);

            if (!error) return { exito: true };
            if (error.code === '23505') return { exito: false, esDuplicado: true };

            throw error; 
        } catch (err) {
            if (i === intentosMaximos) return { exito: false, esDuplicado: false, error: err };
            await new Promise(resolve => setTimeout(resolve, 1000 * i));
        }
    }
};
    const resultado = await guardarConReintentos();

    // -----------------------------------------------------------------
    // 5. RESPONDER A MACRODROID
    // -----------------------------------------------------------------
    
    // CASO A: GUARDADO EXITOSO (Sea válido o sea Error de Formato)
    if (resultado.exito) {
        console.log(esErrorFormato ? `⚠️ Guardado como Error: ${payloadDB.referencia}` : `✅ Guardado OK: ${data.referencia}`);
        
        // Respondemos 200 siempre para que MacroDroid deje de insistir
        return res.status(200).json({ 
            success: true, 
            mensaje: mensajeCliente, 
            data: data,
            advertencia: esErrorFormato ? "Requiere revisión manual en base de datos" : null
        });
    } 
    
    // CASO B: DUPLICADO (Ya existía)
    else if (resultado.esDuplicado) {
        console.warn(`⛔ Duplicado: ${payloadDB.referencia}`);
        return res.status(409).json({ 
            success: false, 
            codigo: 'DUPLICADO',
            mensaje: "Esta referencia ya existe.", 
            data: data 
        });
    } 
    
    // CASO C: FALLO REAL DE SERVIDOR (BD Caída)
    else {
        console.error("❌ Error CRÍTICO:", resultado.error);
        return res.status(503).json({ 
            success: false, 
            mensaje: "Error de conexión con la base de datos.",
            error_detalle: resultado.error ? resultado.error.message : "Desconocido"
        });
    }
}