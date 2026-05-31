const https = require('https');

const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const TOKEN    = process.env.WHATSAPP_TOKEN;

/**
 * Normaliza un número de teléfono al formato internacional sin + ni espacios.
 * Ejemplo: "3001234567" → "573001234567"
 */
const formatearNumero = (telefono) => {
  if (!telefono) return null;
  const limpio = String(telefono).replace(/\D/g, '');
  if (limpio.length === 10) return `57${limpio}`;       // colombiano sin código
  if (limpio.length === 12 && limpio.startsWith('57')) return limpio;
  if (limpio.length > 10) return limpio;                // ya tiene código de país
  return null;
};

/**
 * Envía un mensaje de texto via WhatsApp Cloud API (Meta).
 * @param {string} telefono  - número del destinatario
 * @param {string} mensaje   - texto a enviar
 * @returns {Promise<boolean>}
 */
const enviarMensaje = async (telefono, mensaje) => {
  const numero = formatearNumero(telefono);
  if (!numero) {
    console.warn(`[WA] Teléfono inválido: "${telefono}"`);
    return false;
  }
  if (!TOKEN || !PHONE_ID) {
    console.warn('[WA] WHATSAPP_TOKEN o WHATSAPP_PHONE_ID no configurados en .env');
    return false;
  }

  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    to: numero,
    type: 'text',
    text: { body: mensaje },
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v25.0/${PHONE_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[WA] Status: ${res.statusCode} | Body: ${data}`);
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`[WA] ✅ Mensaje enviado a ${telefono}`);
          resolve(true);
        } else {
          console.error(`[WA] ❌ Error ${res.statusCode}:`, data);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[WA] Error de red:', err.message);
      resolve(false);
    });

    req.write(body);
    req.end();
  });
};

/**
 * Envía mensaje de confirmación de reserva al cliente.
 */
const enviarConfirmacionReserva = async ({
  clienteNombre,
  clienteTelefono,
  reservaId,
  habitacion,
  fechaInicio,
  fechaFin,
  montoTotal,
}) => {
  const mensaje =
    `✅ *Reserva Confirmada - Hospedaje Digital*\n\n` +
    `Hola *${clienteNombre}*, tu reserva ha sido registrada.\n\n` +
    `📋 *Detalles:*\n` +
    `• Reserva N°: *#${reservaId}*\n` +
    `• Habitación: *${habitacion}*\n` +
    `• Entrada: *${new Date(fechaInicio).toLocaleDateString('es-CO', { dateStyle: 'long' })}*\n` +
    `• Salida: *${new Date(fechaFin).toLocaleDateString('es-CO', { dateStyle: 'long' })}*\n` +
    `• Total: *$${Number(montoTotal).toLocaleString('es-CO')}*\n\n` +
    `Gracias por elegirnos. 🏨`;

  return enviarMensaje(clienteTelefono, mensaje);
};

const WhatsappService = {
  estaListo: () => !!(TOKEN && PHONE_ID),
  enviarMensaje,
  enviarConfirmacionReserva,
};

module.exports = WhatsappService;
