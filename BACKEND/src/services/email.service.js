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
