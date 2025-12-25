import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Definimos la estructura de los datos que vienen de tu tabla 'ventas-biciaventuras'
interface Venta {
  nombre_cliente: string;
  telefono_cliente: string;
  pagado: boolean;
}

interface WebhookPayload {
  record: Venta;
  old_record: Venta;
}

serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { record, old_record } = payload;

    // Filtro: Solo si el estado 'pagado' cambió de false a true
    if (record.pagado === true && old_record.pagado === false) {
      
      const nombre: string = record.nombre_cliente;
      const tiktok: string = "@bici_aventuras_macuto";
      
      const mensajeTexto: string = `¡Hola *${nombre}*! 🚲✨\n\n` +
                           `¡Muchas gracias por tu compra en *Bici Aventuras*!\n\n` +
                           `Aquí te enviamos las reglas de uso para que tengas la mejor experiencia. 📋\n\n` +
                           `¡Síguenos en TikTok para ver más rutas! \n` +
                           `👉 https://www.tiktok.com/${tiktok}`;

      // URL de la imagen en Vercel
      const urlImagen: string = "https://bici-aventuras-app.vercel.app/reglas.jpeg"; 

      // 1. Descargar la imagen
      const resImagen = await fetch(urlImagen);
      if (!resImagen.ok) throw new Error("No se pudo descargar la imagen de Vercel");
      const blob = await resImagen.blob();

      // 2. Preparar el FormData para tu servidor en Render
      const formData = new FormData();
      formData.append("numero", record.telefono_cliente);
      formData.append("mensaje", mensajeTexto);
      formData.append("media", blob, "reglas.jpeg");

      // 3. Envío al bot en Render (Asegúrate de poner tu URL real aquí)
      const responseRender = await fetch("https://tu-bot-en-render.onrender.com/enviar-mensaje-media", {
        method: "POST",
        body: formData
      });

      if (!responseRender.ok) {
        console.error("Error en el servidor de Render:", await responseRender.text());
      } else {
        console.log(`✅ Notificación enviada exitosamente a ${nombre}`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("❌ Error en la función:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { "Content-Type": "application/json" } 
    });
  }
})