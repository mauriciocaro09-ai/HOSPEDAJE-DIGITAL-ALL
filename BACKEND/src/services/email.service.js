const nodemailer = require("nodemailer");

function crearTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

const EmailService = {

  enviarConfirmacionReserva: async ({ clienteNombre, clienteEmail, reservaId, habitacion, fechaInicio, fechaFin, montoTotal }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail && clienteEmail.trim());
    if (!emailValido) {
      console.warn('Correo invalido para cliente, no se enviara notificacion: "' + clienteEmail + '"');
      return false;
    }
    try {
      const transporter = crearTransporter();
      const fechaInicioStr = new Date(fechaInicio).toLocaleDateString("es-CO", { dateStyle: "long" });
      const fechaFinStr = new Date(fechaFin).toLocaleDateString("es-CO", { dateStyle: "long" });
      const montoStr = Number(montoTotal).toLocaleString("es-CO");

      await transporter.sendMail({
        from: '"Hospedaje Digital" <' + process.env.EMAIL_USER + '>',
        to: clienteEmail,
        subject: 'Confirmacion de Reserva #' + reservaId + ' - Hospedaje Digital',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">' +
          '<div style="background-color: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">' +
          '<h1 style="color: white; margin: 0; font-size: 24px;">Hospedaje Digital</h1>' +
          '</div>' +
          '<div style="padding: 30px;">' +
          '<h2 style="color: #333;">Reserva Confirmada!</h2>' +
          '<p style="color: #555;">Hola <strong>' + clienteNombre + '</strong>, tu reserva ha sido registrada exitosamente.</p>' +
          '<div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">' +
          '<h3 style="color: #1a73e8; margin-top: 0;">Detalles de tu reserva</h3>' +
          '<table style="width: 100%; border-collapse: collapse;">' +
          '<tr><td style="padding: 8px 0; color: #777; width: 40%;">Numero de reserva:</td><td style="padding: 8px 0; color: #333; font-weight: bold;">#' + reservaId + '</td></tr>' +
          '<tr><td style="padding: 8px 0; color: #777;">Habitacion:</td><td style="padding: 8px 0; color: #333;">' + habitacion + '</td></tr>' +
          '<tr><td style="padding: 8px 0; color: #777;">Fecha de entrada:</td><td style="padding: 8px 0; color: #333;">' + fechaInicioStr + '</td></tr>' +
          '<tr><td style="padding: 8px 0; color: #777;">Fecha de salida:</td><td style="padding: 8px 0; color: #333;">' + fechaFinStr + '</td></tr>' +
          '<tr style="border-top: 1px solid #ddd;"><td style="padding: 12px 0 8px; color: #777; font-weight: bold;">Total a pagar:</td><td style="padding: 12px 0 8px; color: #1a73e8; font-weight: bold; font-size: 18px;">$' + montoStr + '</td></tr>' +
          '</table>' +
          '</div>' +
          '<p style="color: #555;">Si tienes alguna pregunta sobre tu reserva, no dudes en contactarnos.</p>' +
          '<p style="color: #555; margin-bottom: 0;">Gracias por elegirnos.</p>' +
          '</div>' +
          '<div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">' +
          '<p style="color: #999; font-size: 12px; margin: 0;">&copy; 2026 Hospedaje Digital. Todos los derechos reservados.</p>' +
          '</div>' +
          '</div>'
      });

      console.log('Correo de confirmacion enviado a ' + clienteEmail);
      return true;
    } catch (err) {
      console.error('Error en EmailService.enviarConfirmacionReserva:', err.message);
      return false;
    }
  },

  enviarResetPassword: async ({ usuarioNombre, usuarioEmail, token }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail && usuarioEmail.trim());
    if (!emailValido) {
      console.warn('Correo invalido para reset: "' + usuarioEmail + '"');
      return false;
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500/mi-proyecto-frontend';
    const link = frontendUrl + '/login.html?reset-token=' + encodeURIComponent(token);
    try {
      const transporter = crearTransporter();
      await transporter.sendMail({
        from: '"Hospedaje Digital" <' + process.env.EMAIL_USER + '>',
        to: usuarioEmail,
        subject: 'Restablece tu contrasena - Hospedaje Digital',
        html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">' +
          '<div style="background-color:#0f3d3e;padding:24px 20px;border-radius:8px 8px 0 0;text-align:center;">' +
          '<h1 style="color:white;margin:0;font-size:24px;">Hospedaje Digital</h1>' +
          '</div>' +
          '<div style="padding:32px 30px;">' +
          '<h2 style="color:#0f3d3e;margin-top:0;">Restablecer contrasena</h2>' +
          '<p style="color:#555;">Hola <strong>' + (usuarioNombre || 'usuario') + '</strong>,</p>' +
          '<p style="color:#555;">Recibimos una solicitud para restablecer la contrasena de tu cuenta. Haz clic en el boton de abajo para crear una nueva contrasena.</p>' +
          '<p style="color:#888;font-size:13px;">Este enlace expira en <strong>30 minutos</strong>. Si no solicitaste este cambio, ignora este correo.</p>' +
          '<div style="text-align:center;margin:32px 0;">' +
          '<a href="' + link + '" style="background:#ff8a3d;color:#1f2937;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">Crear nueva contrasena</a>' +
          '</div>' +
          '<p style="color:#aaa;font-size:12px;">O copia este enlace en tu navegador:<br><span style="color:#0f3d3e;word-break:break-all;">' + link + '</span></p>' +
          '</div>' +
          '<div style="background-color:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;">' +
          '<p style="color:#999;font-size:12px;margin:0;">&copy; 2026 Hospedaje Digital. Todos los derechos reservados.</p>' +
          '</div>' +
          '</div>'
      });
      console.log('Correo de reset enviado a ' + usuarioEmail);
      return true;
    } catch (err) {
      console.error('Error en EmailService.enviarResetPassword:', err.message);
      return false;
    }
  },

  enviarRecuperacionContrasena: async ({ usuarioNombre, usuarioEmail, nuevaContrasena }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail && usuarioEmail.trim());
    if (!emailValido) {
      console.warn('Correo invalido para recuperacion: "' + usuarioEmail + '"');
      return false;
    }
    try {
      const transporter = crearTransporter();
      await transporter.sendMail({
        from: '"Hospedaje Digital" <' + process.env.EMAIL_USER + '>',
        to: usuarioEmail,
        subject: 'Recuperacion de contrasena - Hospedaje Digital',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">' +
          '<div style="background-color: #15232b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">' +
          '<h1 style="color: white; margin: 0; font-size: 24px;">Hospedaje Digital</h1>' +
          '</div>' +
          '<div style="padding: 30px;">' +
          '<h2 style="color: #333;">Tu contrasena fue restablecida</h2>' +
          '<p style="color: #555;">Hola <strong>' + (usuarioNombre || 'usuario') + '</strong>,</p>' +
          '<p style="color: #555;">Se genero una contrasena temporal para tu cuenta. Usala para entrar y cambiala despues.</p>' +
          '<div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">' +
          '<p style="color: #777; margin: 0 0 8px;">Contrasena temporal</p>' +
          '<p style="color: #15232b; font-size: 22px; font-weight: bold; letter-spacing: 2px; margin: 0;">' + nuevaContrasena + '</p>' +
          '</div>' +
          '<p style="color: #555; margin-bottom: 0;">Si no solicitaste este cambio, contacta al administrador del sistema.</p>' +
          '</div>' +
          '<div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">' +
          '<p style="color: #999; font-size: 12px; margin: 0;">&copy; 2026 Hospedaje Digital. Todos los derechos reservados.</p>' +
          '</div>' +
          '</div>'
      });
      console.log('Correo de recuperacion enviado a ' + usuarioEmail);
      return true;
    } catch (err) {
      console.error('Error en EmailService.enviarRecuperacionContrasena:', err.message);
      return false;
    }
  },

  enviarSetupPassword: async ({ clienteNombre, clienteEmail, token }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail && clienteEmail.trim());
    if (!emailValido) {
      console.warn('Correo invalido para setup de contrasena: "' + clienteEmail + '"');
      return false;
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000/app';
    const link = frontendUrl + '/pages/perfil.html?resetToken=' + encodeURIComponent(token);
    try {
      const transporter = crearTransporter();
      await transporter.sendMail({
        from: '"Hospedaje Digital" <' + process.env.EMAIL_USER + '>',
        to: clienteEmail,
        subject: 'Establece tu contrasena - Hospedaje Digital',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">' +
          '<div style="background-color: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">' +
          '<h1 style="color: white; margin: 0; font-size: 24px;">Hospedaje Digital</h1>' +
          '</div>' +
          '<div style="padding: 30px;">' +
          '<h2 style="color: #333;">Establece tu contrasena</h2>' +
          '<p style="color: #555;">Hola <strong>' + (clienteNombre || 'cliente') + '</strong>,</p>' +
          '<p style="color: #555;">Haz clic en el boton abajo para establecer tu contrasena. El enlace expirara en 1 hora.</p>' +
          '<div style="text-align:center;margin:24px 0;">' +
          '<a href="' + link + '" style="background:#1a73e8;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Establecer contrasena</a>' +
          '</div>' +
          '<p style="color:#777;">Si no solicitaste esto, ignora este correo.</p>' +
          '</div>' +
          '<div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">' +
          '<p style="color: #999; font-size: 12px; margin: 0;">&copy; 2026 Hospedaje Digital. Todos los derechos reservados.</p>' +
          '</div>' +
          '</div>'
      });
      console.log('Correo de setup enviado a ' + clienteEmail);
      return true;
    } catch (err) {
      console.error('Error en EmailService.enviarSetupPassword:', err.message);
      return false;
    }
  },

  enviarBienvenida: async ({ usuarioNombre, usuarioEmail }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail && usuarioEmail.trim());
    if (!emailValido) {
      console.warn('Correo invalido para bienvenida: "' + usuarioEmail + '"');
      return false;
    }
    try {
      const transporter = crearTransporter();
      await transporter.sendMail({
        from: '"Hospedaje Digital" <' + process.env.EMAIL_USER + '>',
        to: usuarioEmail,
        subject: 'Bienvenido a Hospedaje Digital!',
        html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">' +
          '<div style="background-color: #15232b; padding: 24px 20px; border-radius: 8px 8px 0 0; text-align: center;">' +
          '<h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 1px;">Hospedaje Digital</h1>' +
          '</div>' +
          '<div style="padding: 32px 30px;">' +
          '<h2 style="color: #15232b; margin-top: 0;">Bienvenido, ' + usuarioNombre + '!</h2>' +
          '<p style="color: #555; line-height: 1.6;">Nos alegra que te hayas registrado en <strong>Hospedaje Digital</strong>. Tu cuenta ha sido creada exitosamente.</p>' +
          '<p style="color: #555; line-height: 1.6;">Desde tu cuenta puedes explorar nuestras habitaciones, consultar paquetes disponibles y gestionar tus reservas de forma facil y rapida.</p>' +
          '<div style="background-color: #f0f7ff; border-left: 4px solid #1a73e8; border-radius: 4px; padding: 16px 20px; margin: 24px 0;">' +
          '<p style="color: #333; margin: 0; font-size: 15px;"><strong>Listo para explorar?</strong> Inicia sesion y descubre todo lo que tenemos para ti.</p>' +
          '</div>' +
          '<p style="color: #777; font-size: 13px; margin-bottom: 0;">Si no creaste esta cuenta, ignora este correo o contactanos.</p>' +
          '</div>' +
          '<div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">' +
          '<p style="color: #999; font-size: 12px; margin: 0;">&copy; 2026 Hospedaje Digital. Todos los derechos reservados.</p>' +
          '</div>' +
          '</div>'
      });
      console.log('Correo de bienvenida enviado a ' + usuarioEmail);
      return true;
    } catch (err) {
      console.error('Error en EmailService.enviarBienvenida:', err.message);
      return false;
    }
  }
};

module.exports = EmailService;
