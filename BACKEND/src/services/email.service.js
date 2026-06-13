const https = require("https");

function enviarBrevo({ toEmail, toName, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "mauriciocaro09@gmail.com";

  const data = JSON.stringify({
    sender: { name: "Hospedaje Digital", email: fromEmail },
    to: [{ email: toEmail, name: toName || toEmail }],
    subject: subject,
    htmlContent: htmlContent
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.brevo.com",
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error("Brevo API error " + res.statusCode + ": " + body));
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

const EmailService = {

  enviarConfirmacionReserva: async ({ clienteNombre, clienteEmail, reservaId, habitacion, fechaInicio, fechaFin, montoTotal }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail && clienteEmail.trim());
    if (!emailValido) { console.warn("Correo invalido: " + clienteEmail); return false; }
    try {
      const fechaInicioStr = new Date(fechaInicio).toLocaleDateString("es-CO", { dateStyle: "long" });
      const fechaFinStr = new Date(fechaFin).toLocaleDateString("es-CO", { dateStyle: "long" });
      const montoStr = Number(montoTotal).toLocaleString("es-CO");
      await enviarBrevo({
        toEmail: clienteEmail,
        toName: clienteNombre,
        subject: "Confirmacion de Reserva #" + reservaId + " - Hospedaje Digital",
        htmlContent: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">' +
          '<div style="background-color:#1a73e8;padding:20px;border-radius:8px 8px 0 0;text-align:center;"><h1 style="color:white;margin:0;">Hospedaje Digital</h1></div>' +
          '<div style="padding:30px;"><h2 style="color:#333;">Reserva Confirmada!</h2>' +
          '<p>Hola <strong>' + clienteNombre + '</strong>, tu reserva fue registrada exitosamente.</p>' +
          '<div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0;">' +
          '<h3 style="color:#1a73e8;margin-top:0;">Detalles</h3>' +
          '<table style="width:100%;border-collapse:collapse;">' +
          '<tr><td style="padding:8px 0;color:#777;">Numero de reserva:</td><td style="color:#333;font-weight:bold;">#' + reservaId + '</td></tr>' +
          '<tr><td style="padding:8px 0;color:#777;">Habitacion:</td><td style="color:#333;">' + habitacion + '</td></tr>' +
          '<tr><td style="padding:8px 0;color:#777;">Entrada:</td><td style="color:#333;">' + fechaInicioStr + '</td></tr>' +
          '<tr><td style="padding:8px 0;color:#777;">Salida:</td><td style="color:#333;">' + fechaFinStr + '</td></tr>' +
          '<tr style="border-top:1px solid #ddd;"><td style="padding:12px 0 8px;font-weight:bold;color:#777;">Total:</td><td style="color:#1a73e8;font-weight:bold;font-size:18px;">$' + montoStr + '</td></tr>' +
          '</table></div></div>' +
          '<div style="background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 Hospedaje Digital.</p></div></div>'
      });
      console.log("Correo de confirmacion enviado a " + clienteEmail);
      return true;
    } catch (err) {
      console.error("Error en EmailService.enviarConfirmacionReserva:", err.message);
      return false;
    }
  },

  enviarResetPassword: async ({ usuarioNombre, usuarioEmail, token }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail && usuarioEmail.trim());
    if (!emailValido) { console.warn("Correo invalido para reset: " + usuarioEmail); return false; }
    const frontendUrl = (process.env.FRONTEND_URL || "https://hospedaje-digital-all.vercel.app").trim();
    const link = frontendUrl + "/login.html?reset-token=" + encodeURIComponent(token);
    try {
      await enviarBrevo({
        toEmail: usuarioEmail,
        toName: usuarioNombre,
        subject: "Restablece tu contrasena - Hospedaje Digital",
        htmlContent: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">' +
          '<div style="background:#0f3d3e;padding:24px;border-radius:8px 8px 0 0;text-align:center;"><h1 style="color:white;margin:0;">Hospedaje Digital</h1></div>' +
          '<div style="padding:32px;"><h2 style="color:#0f3d3e;margin-top:0;">Restablecer contrasena</h2>' +
          '<p>Hola <strong>' + (usuarioNombre || "usuario") + '</strong>,</p>' +
          '<p>Haz clic en el boton para crear una nueva contrasena. Expira en <strong>30 minutos</strong>.</p>' +
          '<div style="text-align:center;margin:32px 0;"><a href="' + link + '" style="background:#ff8a3d;color:#1f2937;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Crear nueva contrasena</a></div>' +
          '<p style="color:#aaa;font-size:12px;">O copia: <span style="color:#0f3d3e;word-break:break-all;">' + link + '</span></p></div>' +
          '<div style="background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 Hospedaje Digital.</p></div></div>'
      });
      console.log("Correo de reset enviado a " + usuarioEmail);
      return true;
    } catch (err) {
      console.error("Error en EmailService.enviarResetPassword:", err.message);
      return false;
    }
  },

  enviarRecuperacionContrasena: async ({ usuarioNombre, usuarioEmail, nuevaContrasena }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail && usuarioEmail.trim());
    if (!emailValido) { return false; }
    try {
      await enviarBrevo({
        toEmail: usuarioEmail,
        toName: usuarioNombre,
        subject: "Recuperacion de contrasena - Hospedaje Digital",
        htmlContent: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">' +
          '<div style="background:#15232b;padding:20px;border-radius:8px 8px 0 0;text-align:center;"><h1 style="color:white;margin:0;">Hospedaje Digital</h1></div>' +
          '<div style="padding:30px;"><h2>Tu contrasena fue restablecida</h2>' +
          '<p>Hola <strong>' + (usuarioNombre || "usuario") + '</strong>, tu contrasena temporal es:</p>' +
          '<div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">' +
          '<p style="font-size:22px;font-weight:bold;letter-spacing:2px;color:#15232b;margin:0;">' + nuevaContrasena + '</p></div></div>' +
          '<div style="background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 Hospedaje Digital.</p></div></div>'
      });
      return true;
    } catch (err) {
      console.error("Error en EmailService.enviarRecuperacionContrasena:", err.message);
      return false;
    }
  },

  enviarSetupPassword: async ({ clienteNombre, clienteEmail, token }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail && clienteEmail.trim());
    if (!emailValido) { return false; }
    const frontendUrl = (process.env.FRONTEND_URL || "https://hospedaje-digital-all.vercel.app").trim();
    const link = frontendUrl + "/pages/perfil.html?resetToken=" + encodeURIComponent(token);
    try {
      await enviarBrevo({
        toEmail: clienteEmail,
        toName: clienteNombre,
        subject: "Establece tu contrasena - Hospedaje Digital",
        htmlContent: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">' +
          '<div style="background:#1a73e8;padding:20px;border-radius:8px 8px 0 0;text-align:center;"><h1 style="color:white;margin:0;">Hospedaje Digital</h1></div>' +
          '<div style="padding:30px;"><h2>Establece tu contrasena</h2>' +
          '<p>Hola <strong>' + (clienteNombre || "cliente") + '</strong>, haz clic para establecer tu contrasena (expira en 1 hora).</p>' +
          '<div style="text-align:center;margin:24px 0;"><a href="' + link + '" style="background:#1a73e8;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;">Establecer contrasena</a></div></div>' +
          '<div style="background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 Hospedaje Digital.</p></div></div>'
      });
      return true;
    } catch (err) {
      console.error("Error en EmailService.enviarSetupPassword:", err.message);
      return false;
    }
  },


  enviarCancelacionReserva: async ({
    clienteNombre, clienteEmail, reservaId, habitacion,
    fechaInicio, fechaFin, montoTotal, montoReembolso,
    montoRetenido, porcentajeRetencion, descripcionPolitica, motivo
  }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail && clienteEmail.trim());
    if (!emailValido) { console.warn("Correo invalido para cancelacion: " + clienteEmail); return false; }
    try {
      const fechaInicioStr = new Date(fechaInicio).toLocaleDateString("es-CO", { dateStyle: "long" });
      const fechaFinStr    = new Date(fechaFin).toLocaleDateString("es-CO", { dateStyle: "long" });
      const fmtCOP = (v) => "$" + Number(v || 0).toLocaleString("es-CO");
      const colorReembolso = porcentajeRetencion === 0 ? "#16a34a" : porcentajeRetencion === 100 ? "#dc2626" : "#ea580c";

      let filaMotivoHtml = "";
      if (motivo) {
        filaMotivoHtml = "<tr><td style=\"padding:8px 0;color:#777;\">Motivo:</td>" +
          "<td style=\"color:#333;\">" + motivo + "</td></tr>";
      }

      await enviarBrevo({
        toEmail: clienteEmail,
        toName: clienteNombre,
        subject: "Cancelacion de Reserva #" + reservaId + " - Hospedaje Digital",
        htmlContent:
          "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;\">" +
          "<div style=\"background:#dc2626;padding:20px;border-radius:8px 8px 0 0;text-align:center;\">" +
          "<h1 style=\"color:white;margin:0;\">Hospedaje Digital</h1></div>" +
          "<div style=\"padding:30px;\">" +
          "<h2 style=\"color:#dc2626;\">Reserva Cancelada</h2>" +
          "<p>Hola <strong>" + clienteNombre + "</strong>, tu reserva ha sido cancelada.</p>" +
          "<div style=\"background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0;\">" +
          "<h3 style=\"color:#333;margin-top:0;\">Detalles de la reserva</h3>" +
          "<table style=\"width:100%;border-collapse:collapse;\">" +
          "<tr><td style=\"padding:8px 0;color:#777;\">Numero de reserva:</td><td style=\"color:#333;font-weight:bold;\">#" + reservaId + "</td></tr>" +
          "<tr><td style=\"padding:8px 0;color:#777;\">Habitacion:</td><td style=\"color:#333;\">" + habitacion + "</td></tr>" +
          "<tr><td style=\"padding:8px 0;color:#777;\">Entrada:</td><td style=\"color:#333;\">" + fechaInicioStr + "</td></tr>" +
          "<tr><td style=\"padding:8px 0;color:#777;\">Salida:</td><td style=\"color:#333;\">" + fechaFinStr + "</td></tr>" +
          filaMotivoHtml +
          "</table></div>" +
          "<div style=\"background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px;margin:20px 0;\">" +
          "<h3 style=\"color:#c2410c;margin-top:0;\">Politica de cancelacion aplicada</h3>" +
          "<p style=\"color:#666;margin:0 0 12px;\">" + descripcionPolitica + "</p>" +
          "<table style=\"width:100%;border-collapse:collapse;\">" +
          "<tr><td style=\"padding:6px 0;color:#777;\">Monto total:</td><td style=\"color:#333;\">" + fmtCOP(montoTotal) + "</td></tr>" +
          (porcentajeRetencion > 0 ? "<tr><td style=\"padding:6px 0;color:#777;\">Retencion (" + porcentajeRetencion + "%):</td><td style=\"color:#dc2626;\">- " + fmtCOP(montoRetenido) + "</td></tr>" : "") +
          "<tr style=\"border-top:2px solid #fed7aa;\">" +
          "<td style=\"padding:10px 0 6px;font-weight:bold;color:#555;\">Monto a reembolsar:</td>" +
          "<td style=\"font-weight:bold;font-size:18px;color:" + colorReembolso + ";\">" + fmtCOP(montoReembolso) + "</td></tr>" +
          "</table>" +
          (montoReembolso > 0 ? "<p style=\"color:#666;font-size:13px;margin:12px 0 0;\">El reembolso se acreditara en un plazo de <strong>5 a 10 dias habiles</strong> por transferencia bancaria segun los datos registrados.</p>" : "") +
          "</div></div>" +
          "<div style=\"background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;\">" +
          "<p style=\"color:#999;font-size:12px;margin:0;\">&copy; 2026 Hospedaje Digital.</p></div></div>"
      });
      console.log("Correo de cancelacion enviado a " + clienteEmail);
      return true;
    } catch (err) {
      console.error("Error en EmailService.enviarCancelacionReserva:", err.message);
      return false;
    }
  },

  enviarAvisoComprobante: async ({ clienteNombre, clienteEmail, reservaId, fechaLimite }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail && clienteEmail.trim());
    if (!emailValido) { console.warn("Correo invalido para aviso comprobante: " + clienteEmail); return false; }
    try {
      const limiteStr = new Date(fechaLimite).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      const frontendUrl = (process.env.FRONTEND_URL || "https://hospedaje-digital-all.vercel.app").trim();
      await enviarBrevo({
        toEmail: clienteEmail,
        toName: clienteNombre,
        subject: "Accion requerida: Sube tu comprobante de pago — Reserva #" + reservaId,
        htmlContent:
          "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;\">" +
          "<div style=\"background:#f59e0b;padding:20px;border-radius:8px 8px 0 0;text-align:center;\"><h1 style=\"color:white;margin:0;\">Hospedaje Digital</h1></div>" +
          "<div style=\"padding:30px;\">" +
          "<h2 style=\"color:#b45309;\">&#9201; Tenes 3 minutos para subir tu comprobante</h2>" +
          "<p>Hola <strong>" + clienteNombre + "</strong>, tu reserva <strong>#" + reservaId + "</strong> fue registrada con metodo de pago <strong>Transferencia Bancaria</strong>.</p>" +
          "<div style=\"background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;\">" +
          "<p style=\"margin:0;color:#92400e;\"><strong>Plazo limite:</strong> hoy a las <strong>" + limiteStr + "</strong></p>" +
          "<p style=\"margin:8px 0 0;color:#92400e;\">Si no sube el comprobante antes de esa hora, la reserva sera cancelada automaticamente.</p></div>" +
          "<div style=\"text-align:center;margin:28px 0;\"><a href=\"" + frontendUrl + "/cliente.html\" style=\"background:#f59e0b;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;\">Subir comprobante ahora</a></div>" +
          "<p style=\"color:#666;font-size:13px;\">Ingresa a tu portal de cliente, ve a <strong>Mis Reservas</strong>, abre el detalle de la reserva #" + reservaId + " y sube la imagen de tu comprobante.</p>" +
          "</div><div style=\"background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;\"><p style=\"color:#999;font-size:12px;margin:0;\">&copy; 2026 Hospedaje Digital.</p></div></div>"
      });
      console.log("Correo aviso comprobante enviado a " + clienteEmail);
      return true;
    } catch (err) {
      console.error("Error en EmailService.enviarAvisoComprobante:", err.message);
      return false;
    }
  },

  enviarPagoVerificado: async ({ clienteNombre, clienteEmail, reservaId, fechaInicio, fechaFin, montoTotal }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail && clienteEmail.trim());
    if (!emailValido) { console.warn("Correo invalido para pago verificado: " + clienteEmail); return false; }
    try {
      const fechaInicioStr = new Date(fechaInicio).toLocaleDateString("es-CO", { dateStyle: "long" });
      const fechaFinStr    = new Date(fechaFin).toLocaleDateString("es-CO", { dateStyle: "long" });
      const montoStr = Number(montoTotal).toLocaleString("es-CO");
      await enviarBrevo({
        toEmail: clienteEmail,
        toName: clienteNombre,
        subject: "Pago verificado! Tu reserva #" + reservaId + " esta confirmada — Hospedaje Digital",
        htmlContent:
          "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;\">" +
          "<div style=\"background:#16a34a;padding:20px;border-radius:8px 8px 0 0;text-align:center;\"><h1 style=\"color:white;margin:0;\">Hospedaje Digital</h1></div>" +
          "<div style=\"padding:30px;\">" +
          "<h2 style=\"color:#15803d;\">&#10003; Pago verificado — Reserva Confirmada</h2>" +
          "<p>Hola <strong>" + clienteNombre + "</strong>, hemos revisado y verificado tu comprobante de transferencia bancaria. Tu reserva queda oficialmente confirmada.</p>" +
          "<div style=\"background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;\">" +
          "<h3 style=\"color:#15803d;margin-top:0;\">Detalles de tu reserva</h3>" +
          "<table style=\"width:100%;border-collapse:collapse;\">" +
          "<tr><td style=\"padding:8px 0;color:#777;\">Numero de reserva:</td><td style=\"color:#333;font-weight:bold;\">#" + reservaId + "</td></tr>" +
          "<tr><td style=\"padding:8px 0;color:#777;\">Entrada:</td><td style=\"color:#333;\">" + fechaInicioStr + "</td></tr>" +
          "<tr><td style=\"padding:8px 0;color:#777;\">Salida:</td><td style=\"color:#333;\">" + fechaFinStr + "</td></tr>" +
          "<tr style=\"border-top:1px solid #ddd;\"><td style=\"padding:12px 0 8px;font-weight:bold;color:#777;\">Total pagado:</td><td style=\"color:#15803d;font-weight:bold;font-size:18px;\">$" + montoStr + "</td></tr>" +
          "</table></div>" +
          "<p style=\"color:#555;\">Te esperamos. Si tenes alguna consulta, comunicate con nosotros.</p>" +
          "</div><div style=\"background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;\"><p style=\"color:#999;font-size:12px;margin:0;\">&copy; 2026 Hospedaje Digital.</p></div></div>"
      });
      console.log("Correo pago verificado enviado a " + clienteEmail);
      return true;
    } catch (err) {
      console.error("Error en EmailService.enviarPagoVerificado:", err.message);
      return false;
    }
  },

  enviarRechazoComprobante: async ({ clienteNombre, clienteEmail, reservaId, motivo }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail && clienteEmail.trim());
    if (!emailValido) { console.warn("Correo invalido para rechazo: " + clienteEmail); return false; }
    try {
      const frontendUrl = (process.env.FRONTEND_URL || "https://hospedaje-digital-all.vercel.app").trim();
      await enviarBrevo({
        toEmail: clienteEmail,
        toName: clienteNombre,
        subject: "Comprobante rechazado — Reserva #" + reservaId + " pendiente de pago",
        htmlContent:
          "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;\">" +
          "<div style=\"background:#dc2626;padding:20px;border-radius:8px 8px 0 0;text-align:center;\"><h1 style=\"color:white;margin:0;\">Hospedaje Digital</h1></div>" +
          "<div style=\"padding:30px;\">" +
          "<h2 style=\"color:#dc2626;\">&#10007; Comprobante no aprobado</h2>" +
          "<p>Hola <strong>" + clienteNombre + "</strong>, revisamos el comprobante de pago de tu reserva <strong>#" + reservaId + "</strong> y no pudimos aprobarlo.</p>" +
          "<div style=\"background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0;\">" +
          "<p style=\"margin:0;color:#b91c1c;\"><strong>Motivo del rechazo:</strong></p>" +
          "<p style=\"margin:8px 0 0;color:#7f1d1d;\">" + (motivo || "El comprobante no pudo ser verificado.") + "</p></div>" +
          "<p style=\"color:#555;\">Tu reserva sigue <strong>Pendiente</strong>. Podes subir un nuevo comprobante valido desde tu portal de cliente.</p>" +
          "<div style=\"text-align:center;margin:28px 0;\"><a href=\"" + frontendUrl + "/cliente.html\" style=\"background:#dc2626;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;\">Subir nuevo comprobante</a></div>" +
          "</div><div style=\"background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;\"><p style=\"color:#999;font-size:12px;margin:0;\">&copy; 2026 Hospedaje Digital.</p></div></div>"
      });
      console.log("Correo rechazo comprobante enviado a " + clienteEmail);
      return true;
    } catch (err) {
      console.error("Error en EmailService.enviarRechazoComprobante:", err.message);
      return false;
    }
  },

  enviarCancelacionPorVencimiento: async ({ clienteNombre, clienteEmail, reservaId }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail && clienteEmail.trim());
    if (!emailValido) { console.warn("Correo invalido para vencimiento: " + clienteEmail); return false; }
    try {
      const frontendUrl = (process.env.FRONTEND_URL || "https://hospedaje-digital-all.vercel.app").trim();
      await enviarBrevo({
        toEmail: clienteEmail,
        toName: clienteNombre,
        subject: "Reserva #" + reservaId + " cancelada — plazo de pago vencido",
        htmlContent:
          "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;\">" +
          "<div style=\"background:#6b7280;padding:20px;border-radius:8px 8px 0 0;text-align:center;\"><h1 style=\"color:white;margin:0;\">Hospedaje Digital</h1></div>" +
          "<div style=\"padding:30px;\">" +
          "<h2 style=\"color:#374151;\">Reserva cancelada por vencimiento</h2>" +
          "<p>Hola <strong>" + clienteNombre + "</strong>, lamentablemente tu reserva <strong>#" + reservaId + "</strong> fue cancelada automaticamente porque no recibimos el comprobante de pago dentro de los <strong>3 minutos</strong> establecidos.</p>" +
          "<div style=\"background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0;\">" +
          "<p style=\"margin:0;color:#374151;\">La disponibilidad de la habitacion/paquete ha sido liberada. Si aun deseas hospedarte con nosotros, podes hacer una nueva reserva.</p></div>" +
          "<div style=\"text-align:center;margin:28px 0;\"><a href=\"" + frontendUrl + "/cliente.html\" style=\"background:#1a2744;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;\">Hacer nueva reserva</a></div>" +
          "</div><div style=\"background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;\"><p style=\"color:#999;font-size:12px;margin:0;\">&copy; 2026 Hospedaje Digital.</p></div></div>"
      });
      console.log("Correo vencimiento enviado a " + clienteEmail);
      return true;
    } catch (err) {
      console.error("Error en EmailService.enviarCancelacionPorVencimiento:", err.message);
      return false;
    }
  },

  enviarBienvenida: async ({ usuarioNombre, usuarioEmail }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail && usuarioEmail.trim());
    if (!emailValido) { console.warn("Correo invalido para bienvenida: " + usuarioEmail); return false; }
    try {
      await enviarBrevo({
        toEmail: usuarioEmail,
        toName: usuarioNombre,
        subject: "Bienvenido a Hospedaje Digital!",
        htmlContent: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">' +
          '<div style="background:#15232b;padding:24px;border-radius:8px 8px 0 0;text-align:center;"><h1 style="color:white;margin:0;font-size:26px;">Hospedaje Digital</h1></div>' +
          '<div style="padding:32px;"><h2 style="color:#15232b;margin-top:0;">Bienvenido, ' + usuarioNombre + '!</h2>' +
          '<p style="color:#555;line-height:1.6;">Tu cuenta ha sido creada exitosamente en <strong>Hospedaje Digital</strong>.</p>' +
          '<p style="color:#555;line-height:1.6;">Explora nuestras habitaciones, paquetes y gestiona tus reservas de forma facil y rapida.</p>' +
          '<div style="background:#f0f7ff;border-left:4px solid #1a73e8;border-radius:4px;padding:16px;margin:24px 0;">' +
          '<p style="color:#333;margin:0;"><strong>Listo para explorar?</strong> Inicia sesion y descubre todo lo que tenemos para ti.</p></div></div>' +
          '<div style="background:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">&copy; 2026 Hospedaje Digital.</p></div></div>'
      });
      console.log("Correo de bienvenida enviado a " + usuarioEmail);
      return true;
    } catch (err) {
      console.error("Error en EmailService.enviarBienvenida:", err.message);
      return false;
    }
  }
};

module.exports = EmailService;
