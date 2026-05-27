let client = null;
let clienteListo = false;

// WhatsApp solo se inicializa en entorno local (no en producción)
if (process.env.NODE_ENV !== 'production') {
  const { Client, LocalAuth } = require("whatsapp-web.js");
  const qrcode = require("qrcode-terminal");

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: "./.wwebjs_auth" }),
    puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] },
  });

  client.on("qr", (qr) => {
    console.log("\n📱 Escanea este QR con tu WhatsApp (Vincular dispositivo → Escanear código QR):\n");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    clienteListo = true;
    console.log("✅ WhatsApp listo (evento ready).");
  });

  client.on("authenticated", () => {
    clienteListo = true;
    console.log("🔐 WhatsApp autenticado — mensajes habilitados.");
  });

  client.on("auth_failure", (msg) => {
    console.error("❌ Error de autenticación WhatsApp:", msg);
    clienteListo = false;
  });

  client.on("disconnected", (reason) => {
    console.warn("⚠️  WhatsApp desconectado:", reason);
    clienteListo = false;
  });

  client.initialize().catch((err) => {
    console.error("❌ Error al inicializar WhatsApp (Puppeteer):", err.message);
  });
} else {
  console.log("ℹ️  WhatsApp desactivado en entorno de producción.");
}

const formatearNumero = (telefono) => {
  const limpio = telefono.replace(/\D/g, "");
  // Si ya tiene código de país Colombia (57) y 10 dígitos después → ok
  if (limpio.length === 12 && limpio.startsWith("57")) return `${limpio}@c.us`;
  // Si tiene 10 dígitos (número colombiano sin código) → agregar 57
  if (limpio.length === 10) return `57${limpio}@c.us`;
  // Si tiene otro código de país (+X seguido de dígitos)
  if (limpio.length > 10) return `${limpio}@c.us`;
  return null;
};

const WhatsappService = {
  estaListo: () => clienteListo,

  enviarMensaje: async (telefono, mensaje) => {
    console.log(`[WA] clienteListo=${clienteListo} | telefono="${telefono}"`);
    if (!client || !clienteListo) {
      console.warn("[WA] Cliente no está listo todavía.");
      return false;
    }
    const numeroFormateado = formatearNumero(telefono ?? "");
    console.log(`[WA] Número formateado: ${numeroFormateado}`);
    if (!numeroFormateado) {
      console.warn(`[WA] Teléfono inválido: "${telefono}"`);
      return false;
    }
    try {
      const solo = numeroFormateado.replace("@c.us", "");
      const numberId = await client.getNumberId(solo);
      console.log(`[WA] getNumberId(${solo}) →`, numberId);
      if (!numberId) {
        console.warn(`[WA] Número no registrado en WhatsApp: ${telefono}`);
        return false;
      }
      await client.sendMessage(numberId._serialized, mensaje);
      console.log(`[WA] ✅ Mensaje enviado a ${telefono}`);
      return true;
    } catch (err) {
      console.error("[WA] Error al enviar:", err.message);
      return false;
    }
  },

  enviarConfirmacionReserva: async ({ clienteNombre, clienteTelefono, reservaId, habitacion, fechaInicio, fechaFin, montoTotal }) => {
    const mensaje =
      `✅ *Reserva Confirmada - Hospedaje Digital*\n\n` +
      `Hola *${clienteNombre}*, tu reserva ha sido registrada.\n\n` +
      `📋 *Detalles:*\n` +
      `• Reserva N°: *#${reservaId}*\n` +
      `• Habitación: *${habitacion}*\n` +
      `• Entrada: *${new Date(fechaInicio).toLocaleDateString("es-CO", { dateStyle: "long" })}*\n` +
      `• Salida: *${new Date(fechaFin).toLocaleDateString("es-CO", { dateStyle: "long" })}*\n` +
      `• Total: *$${Number(montoTotal).toLocaleString("es-CO")}*\n\n` +
      `Gracias por elegirnos. 🏨`;

    return WhatsappService.enviarMensaje(clienteTelefono, mensaje);
  },
};

module.exports = WhatsappService;
