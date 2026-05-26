const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const EmailService = {
  enviarConfirmacionReserva: async ({ clienteNombre, clienteEmail, reservaId, habitacion, fechaInicio, fechaFin, montoTotal }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail?.trim());
    if (!emailValido) {
      console.warn(`Correo inválido para cliente, no se enviará notificación: "${clienteEmail}"`);
      return false;
    }
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: clienteEmail,
        subject: `Confirmación de Reserva #${reservaId} - Hospedaje Digital`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Hospedaje Digital</h1>
            </div>

            <div style="padding: 30px;">
              <h2 style="color: #333;">¡Reserva Confirmada!</h2>
              <p style="color: #555;">Hola <strong>${clienteNombre}</strong>, tu reserva ha sido registrada exitosamente.</p>

              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1a73e8; margin-top: 0;">Detalles de tu reserva</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #777; width: 40%;">Número de reserva:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: bold;">#${reservaId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #777;">Habitación:</td>
                    <td style="padding: 8px 0; color: #333;">${habitacion}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #777;">Fecha de entrada:</td>
                    <td style="padding: 8px 0; color: #333;">${new Date(fechaInicio).toLocaleDateString("es-CO", { dateStyle: "long" })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #777;">Fecha de salida:</td>
                    <td style="padding: 8px 0; color: #333;">${new Date(fechaFin).toLocaleDateString("es-CO", { dateStyle: "long" })}</td>
                  </tr>
                  <tr style="border-top: 1px solid #ddd;">
                    <td style="padding: 12px 0 8px; color: #777; font-weight: bold;">Total a pagar:</td>
                    <td style="padding: 12px 0 8px; color: #1a73e8; font-weight: bold; font-size: 18px;">$${Number(montoTotal).toLocaleString("es-CO")}</td>
                  </tr>
                </table>
              </div>

              <p style="color: #555;">Si tienes alguna pregunta sobre tu reserva, no dudes en contactarnos.</p>
              <p style="color: #555; margin-bottom: 0;">Gracias por elegirnos.</p>
            </div>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">© 2026 Hospedaje Digital. Todos los derechos reservados.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error("Error enviando correo de confirmación:", error);
        return false;
      }

      console.log(`Correo de confirmación enviado a ${clienteEmail} (ID: ${data.id})`);
      return true;
    } catch (err) {
      console.error("Error inesperado en EmailService:", err);
      return false;
    }
  },

  enviarResetPassword: async ({ usuarioNombre, usuarioEmail, token }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail?.trim());
    if (!emailValido) {
      console.warn(`Correo inválido para reset: "${usuarioEmail}"`);
      return false;
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500/mi-proyecto-frontend';
    const link = `${frontendUrl}/login.html?reset-token=${encodeURIComponent(token)}`;
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: usuarioEmail,
        subject: 'Restablece tu contraseña - Hospedaje Digital',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
            <div style="background-color:#0f3d3e;padding:24px 20px;border-radius:8px 8px 0 0;text-align:center;">
              <h1 style="color:white;margin:0;font-size:24px;">Hospedaje Digital</h1>
            </div>
            <div style="padding:32px 30px;">
              <h2 style="color:#0f3d3e;margin-top:0;">Restablecer contraseña</h2>
              <p style="color:#555;">Hola <strong>${usuarioNombre || 'usuario'}</strong>,</p>
              <p style="color:#555;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña.</p>
              <p style="color:#888;font-size:13px;">Este enlace expira en <strong>30 minutos</strong>. Si no solicitaste este cambio, ignora este correo.</p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${link}" style="background:#ff8a3d;color:#1f2937;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
                  Crear nueva contraseña
                </a>
              </div>
              <p style="color:#aaa;font-size:12px;">O copia este enlace en tu navegador:<br><span style="color:#0f3d3e;word-break:break-all;">${link}</span></p>
            </div>
            <div style="background-color:#f5f5f5;padding:15px;border-radius:0 0 8px 8px;text-align:center;">
              <p style="color:#999;font-size:12px;margin:0;">© 2026 Hospedaje Digital. Todos los derechos reservados.</p>
            </div>
          </div>
        `,
      });
      if (error) { console.error('Error enviando reset password:', error); return false; }
      console.log(`Correo de reset enviado a ${usuarioEmail} (ID: ${data.id})`);
      return true;
    } catch (err) {
      console.error('Error inesperado en enviarResetPassword:', err);
      return false;
    }
  },

  enviarRecuperacionContrasena: async ({ usuarioNombre, usuarioEmail, nuevaContrasena }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail?.trim());
    if (!emailValido) {
      console.warn(`Correo inválido para recuperación: "${usuarioEmail}"`);
      return false;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: usuarioEmail,
        subject: 'Recuperación de contraseña - Hospedaje Digital',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #15232b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Hospedaje Digital</h1>
            </div>

            <div style="padding: 30px;">
              <h2 style="color: #333;">Tu contraseña fue restablecida</h2>
              <p style="color: #555;">Hola <strong>${usuarioNombre || 'usuario'}</strong>,</p>
              <p style="color: #555;">Se generó una contraseña temporal para tu cuenta. Úsala para entrar y cámbiala después desde tu perfil o con el administrador.</p>

              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #777; margin: 0 0 8px;">Contraseña temporal</p>
                <p style="color: #15232b; font-size: 22px; font-weight: bold; letter-spacing: 2px; margin: 0;">${nuevaContrasena}</p>
              </div>

              <p style="color: #555; margin-bottom: 0;">Si no solicitaste este cambio, contacta al administrador del sistema.</p>
            </div>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">© 2026 Hospedaje Digital. Todos los derechos reservados.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Error enviando correo de recuperación:', error);
        return false;
      }

      console.log(`Correo de recuperación enviado a ${usuarioEmail} (ID: ${data.id})`);
      return true;
    } catch (err) {
      console.error('Error inesperado en EmailService al recuperar contraseña:', err);
      return false;
    }
  },
  enviarSetupPassword: async ({ clienteNombre, clienteEmail, token }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail?.trim());
    if (!emailValido) {
      console.warn(`Correo inválido para setup de contraseña: "${clienteEmail}"`);
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000/app';
    const link = `${frontendUrl}/pages/perfil.html?resetToken=${encodeURIComponent(token)}`;

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: clienteEmail,
        subject: 'Establece tu contraseña - Hospedaje Digital',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #1a73e8; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Hospedaje Digital</h1>
            </div>

            <div style="padding: 30px;">
              <h2 style="color: #333;">Establece tu contraseña</h2>
              <p style="color: #555;">Hola <strong>${clienteNombre || 'cliente'}</strong>,</p>
              <p style="color: #555;">Haz clic en el botón abajo para establecer tu contraseña. El enlace expirará en 1 hora.</p>

              <div style="text-align:center;margin:24px 0;">
                <a href="${link}" style="background:#1a73e8;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Establecer contraseña</a>
              </div>

              <p style="color:#777;">Si no solicitaste esto, ignora este correo.</p>
            </div>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">© 2026 Hospedaje Digital. Todos los derechos reservados.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Error enviando correo de setup contraseña:', error);
        return false;
      }

      console.log(`Correo de setup enviado a ${clienteEmail} (ID: ${data.id})`);
      return true;
    } catch (err) {
      console.error('Error inesperado al enviar setup de contraseña:', err);
      return false;
    }
  },

  enviarBienvenida: async ({ usuarioNombre, usuarioEmail }) => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuarioEmail?.trim());
    if (!emailValido) {
      console.warn(`Correo inválido para bienvenida: "${usuarioEmail}"`);
      return false;
    }

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: usuarioEmail,
        subject: '¡Bienvenido a Hospedaje Digital!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #15232b; padding: 24px 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 1px;">Hospedaje Digital</h1>
            </div>

            <div style="padding: 32px 30px;">
              <h2 style="color: #15232b; margin-top: 0;">¡Bienvenido, ${usuarioNombre}! 🎉</h2>
              <p style="color: #555; line-height: 1.6;">
                Nos alegra que te hayas registrado en <strong>Hospedaje Digital</strong>. Tu cuenta ha sido creada exitosamente.
              </p>
              <p style="color: #555; line-height: 1.6;">
                Desde tu cuenta puedes explorar nuestras habitaciones, consultar paquetes disponibles y gestionar tus reservas de forma fácil y rápida.
              </p>

              <div style="background-color: #f0f7ff; border-left: 4px solid #1a73e8; border-radius: 4px; padding: 16px 20px; margin: 24px 0;">
                <p style="color: #333; margin: 0; font-size: 15px;">
                  <strong>¿Listo para explorar?</strong> Inicia sesión y descubre todo lo que tenemos para ti.
                </p>
              </div>

              <p style="color: #777; font-size: 13px; margin-bottom: 0;">
                Si no creaste esta cuenta, ignora este correo o contáctanos.
              </p>
            </div>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">© 2026 Hospedaje Digital. Todos los derechos reservados.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Error enviando correo de bienvenida:', error);
        return false;
      }

      console.log(`Correo de bienvenida enviado a ${usuarioEmail} (ID: ${data.id})`);
      return true;
    } catch (err) {
      console.error('Error inesperado al enviar bienvenida:', err);
      return false;
    }
  }
};

module.exports = EmailService;
