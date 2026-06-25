const ReservasService = require("../services/reservas.service");
const CargosService = require("../services/cargos.service");
const db = require("../config/db");
const EmailService = require("../services/email.service");
const WhatsappService = require("../services/whatsapp.service");

/* ================= OBTENER TODAS ================= */

const obtenerTodas = async (req, res) => {
  try {
    const reservas = await ReservasService.obtener();
    return res.status(200).json(reservas);
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error obteniendo reservas", detalle: error.message });
  }
};

/* ================= OBTENER POR ID ================= */

const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await ReservasService.obtenerPorId(id);
    if (!reserva) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json(reserva);
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error obteniendo reserva", detalle: error.message });
  }
};

/* ================= OBTENER ESTADOS ================= */

const obtenerEstados = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM estadosreserva ORDER BY IdEstadoReserva");
    return res.status(200).json(rows);
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error obteniendo estados", detalle: error.message });
  }
};

/* ================= OBTENER METODOS DE PAGO ================= */

const obtenerMetodosPago = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM metodopago ORDER BY IdMetodoPago");
    return res.status(200).json(rows);
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error obteniendo metodos de pago", detalle: error.message });
  }
};

/* ================= OBTENER POR ESTADO ================= */

const obtenerPorEstado = async (req, res) => {
  try {
    const { idEstado } = req.params;
    const [rows] = await db.query(
      `SELECT r.*, c.Nombre AS NombreCliente, c.Apellido AS ApellidoCliente,
              e.NombreEstadoReserva
       FROM reserva r
       LEFT JOIN cliente c ON r.IDCliente = c.IDCliente OR r.IdCliente = c.IDCliente
       LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
       WHERE r.IdEstadoReserva = ?
       ORDER BY r.IdReserva DESC`,
      [idEstado]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error filtrando reservas por estado", detalle: error.message });
  }
};

/* ================= OBTENER POR CLIENTE ================= */

const obtenerPorCliente = async (req, res) => {
  try {
    const { nroDocumento } = req.params;
    const [rows] = await db.query(
      `SELECT r.*, e.NombreEstadoReserva
       FROM reserva r
       LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
       JOIN cliente c ON (r.IDCliente = c.IDCliente OR r.IdCliente = c.IDCliente OR r.NroDocumentoCliente = c.NroDocumento)
       WHERE c.NroDocumento = ?
       ORDER BY r.IdReserva DESC`,
      [nroDocumento]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error filtrando reservas por cliente", detalle: error.message });
  }
};

/* ================= OBTENER POR USUARIO ================= */

const obtenerPorUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const [rows] = await db.query(
      `SELECT r.*, e.NombreEstadoReserva, h.NombreHabitacion,
              COALESCE(ca_sum.cargos_pendientes, 0)  AS cargos_pendientes,
              COALESCE(ca_sum.cargos_verificacion, 0) AS cargos_verificacion
       FROM reserva r
       LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
       LEFT JOIN habitacion h ON r.IDHabitacion = h.IDHabitacion
       LEFT JOIN (
         SELECT IDReserva,
                SUM(CASE WHEN Estado='pendiente' AND (ComprobanteTransferencia IS NULL OR ComprobanteTransferencia='') THEN 1 ELSE 0 END) AS cargos_pendientes,
                SUM(CASE WHEN Estado='pendiente' AND ComprobanteTransferencia IS NOT NULL AND ComprobanteTransferencia!=''            THEN 1 ELSE 0 END) AS cargos_verificacion
         FROM cargo_adicional
         GROUP BY IDReserva
       ) ca_sum ON ca_sum.IDReserva = r.IdReserva
       WHERE r.id_usuario = ?
       ORDER BY r.IdReserva DESC`,
      [idUsuario]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error filtrando reservas por usuario", detalle: error.message });
  }
};

/* ================= OBTENER POR FECHAS ================= */

const obtenerPorFechas = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parametros 'desde' y 'hasta' requeridos" });
    }
    const [rows] = await db.query(
      `SELECT r.*, c.Nombre AS NombreCliente, c.Apellido AS ApellidoCliente,
              e.NombreEstadoReserva
       FROM reserva r
       LEFT JOIN cliente c ON r.IDCliente = c.IDCliente OR r.IdCliente = c.IDCliente
       LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
       WHERE r.FechaInicio >= ? AND r.FechaFinalizacion <= ?
       ORDER BY r.FechaInicio ASC`,
      [desde, hasta]
    );
    return res.status(200).json(rows);
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error filtrando reservas por fechas", detalle: error.message });
  }
};

/* ================= CREAR ================= */

const crear = async (req, res) => {
  try {
    // Resolver id_usuario, email y nombre del cliente desde NroDocumento
    const docCliente = req.body.NroDocumentoCliente;
    if (docCliente) {
      try {
        const [uRows] = await db.query(
          'SELECT IDUsuario, Email, NombreUsuario, Apellido FROM usuarios WHERE NumeroDocumento = ? LIMIT 1',
          [docCliente]
        );
        if (uRows && uRows[0]) {
          if (uRows[0].IDUsuario)  req.body.id_usuario   = uRows[0].IDUsuario;
          if (!req.body.EmailCliente   && uRows[0].Email)        req.body.EmailCliente   = uRows[0].Email;
          if (!req.body.ContactoCliente && uRows[0].NombreUsuario) req.body.ContactoCliente = `${uRows[0].NombreUsuario} ${uRows[0].Apellido || ''}`.trim();
        }
      } catch (e) {
        console.error('No se pudo resolver datos del cliente:', e.message);
      }
    }

    // Asignar estado según método de pago:
    // efectivo → Confirmada automáticamente; transferencia → Pendiente (espera comprobante)
    const idMetodo = req.body.MetodoPago || req.body.IdMetodoPago;
    if (idMetodo) {
      try {
        const [[mp]] = await db.query('SELECT NomMetodoPago FROM metodopago WHERE IdMetodoPago = ? LIMIT 1', [idMetodo]);
        const nombreMetodo = (mp?.NomMetodoPago || '').toLowerCase();
        if (nombreMetodo.includes('efectivo')) {
          const [[estadoConf]] = await db.query(
            "SELECT IdEstadoReserva FROM estadosreserva WHERE LOWER(NombreEstadoReserva) LIKE '%confirmad%' LIMIT 1"
          );
          if (estadoConf) req.body.IdEstadoReserva = estadoConf.IdEstadoReserva;
        }
        // transferencia: no se cambia → queda en Pendiente (default del modelo)
      } catch (e) {
        console.error('No se pudo determinar estado por método de pago:', e.message);
      }
    }

    const result = await ReservasService.create(req.body);
    const reservaId = result.insertId;

    // Preparar datos para correo de confirmacion
    let emailData = null;
    try {
      const emailCliente = req.body.EmailCliente;
      const nombreCliente = req.body.ContactoCliente || '';
      const IDHabitacion = req.body.IDHabitacion || req.body.IdHabitacion;

      if (emailCliente) {
        const [habitaciones] = IDHabitacion
          ? await db.query('SELECT NombreHabitacion FROM habitacion WHERE IDHabitacion = ? LIMIT 1', [IDHabitacion])
          : [[null]];

        const hab = habitaciones ? habitaciones[0] : null;

        // Buscar teléfono del cliente en la BD si no viene en el body
        let clienteTelefono = req.body.TelefonoCliente || req.body.Telefono || null;
        if (!clienteTelefono) {
          const docCliente = req.body.NroDocumentoCliente || req.body.IDCliente;
          if (docCliente) {
            const [clientes] = await db.query(
              'SELECT Telefono FROM cliente WHERE NroDocumento = ? LIMIT 1',
              [docCliente]
            );
            if (clientes && clientes[0] && clientes[0].Telefono) {
              clienteTelefono = clientes[0].Telefono;
            }
          }
        }

        emailData = {
          clienteNombre: nombreCliente,
          clienteEmail: emailCliente,
          clienteTelefono,
          reservaId,
          habitacion: (hab && hab.NombreHabitacion) ? hab.NombreHabitacion : 'Habitacion',
          fechaInicio: req.body.FechaInicio,
          fechaFin: req.body.FechaFinalizacion,
          montoTotal: req.body.Monto_Total || req.body.MontoTotal || req.body.Sub_Total || 0
        };
      }
    } catch (emailErr) {
      console.error('Error preparando datos para correo de confirmacion:', emailErr.message);
    }

    res.status(201).json({ mensaje: "Reserva creada", reservaId });

    // Enviar correo y WhatsApp de confirmacion sin bloquear la respuesta
    if (emailData) {
      EmailService.enviarConfirmacionReserva(emailData)
        .catch(function(e) { console.error('Error enviando correo de confirmacion de reserva:', e); });

      if (emailData.clienteTelefono) {
        WhatsappService.enviarConfirmacionReserva(emailData)
          .catch(function(e) { console.error('Error enviando WhatsApp de confirmacion:', e); });
      }
    }

  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ error: error.message });
    }
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error creando la reserva", detalle: error.message });
  }
};

/* ================= ACTUALIZAR ================= */

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await ReservasService.actualizar(id, req.body);
    if (!ok) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json({ mensaje: "Reserva actualizada" });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error al actualizar", detalle: error.message });
  }
};

/* ================= ACTUALIZAR ESTADO ================= */

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { IdEstadoReserva } = req.body;
    if (!IdEstadoReserva) {
      return res.status(400).json({ error: "IdEstadoReserva requerido" });
    }
    const ok = await ReservasService.actualizar(id, { IdEstadoReserva });
    if (!ok) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json({ mensaje: "Estado actualizado" });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error actualizando estado", detalle: error.message });
  }
};

/* ================= CANCELAR ================= */

const cancelar = async (req, res) => {
  try {
    const { id } = req.params;
    const motivo = req.body?.motivo || null;
    const resultado = await ReservasService.cancelar(id, motivo);
    if (!resultado) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json({
      mensaje: "Reserva cancelada",
      politica: resultado.politica || null
    });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error al cancelar", detalle: error.message });
  }
};

/* ================= SUBIR COMPROBANTE DE TRANSFERENCIA ================= */

const subirComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const { comprobante } = req.body;
    if (!comprobante) return res.status(400).json({ error: 'Comprobante requerido' });
    if (comprobante.length > 3 * 1024 * 1024)
      return res.status(400).json({ error: 'El archivo supera el límite de 2 MB' });
    await db.query('UPDATE reserva SET ComprobanteTransferencia = ? WHERE IdReserva = ?', [comprobante, id]);
    return res.status(200).json({ mensaje: 'Comprobante guardado' });
  } catch (error) {
    console.error('Error subiendo comprobante:', error);
    return res.status(500).json({ error: 'Error al guardar el comprobante' });
  }
};

/* ================= APROBAR COMPROBANTE ================= */

const aprobarComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await ReservasService.aprobar(id);
    if (!resultado) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json({ mensaje: "Comprobante aprobado. Reserva confirmada." });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error al aprobar comprobante", detalle: error.message });
  }
};

/* ================= RECHAZAR COMPROBANTE ================= */

const rechazarComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const motivo = req.body?.motivo || null;
    if (!motivo || motivo.trim().length === 0)
      return res.status(400).json({ error: "El motivo de rechazo es requerido" });
    const resultado = await ReservasService.rechazar(id, motivo.trim());
    if (!resultado) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json({ mensaje: "Comprobante rechazado. Email enviado al cliente." });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error al rechazar comprobante", detalle: error.message });
  }
};

/* ================= AGREGAR SERVICIOS (crea cargo adicional) ================= */

const agregarServicios = async (req, res) => {
  try {
    const { id } = req.params;
    const { servicios } = req.body;
    if (!Array.isArray(servicios) || servicios.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un servicio' });
    }
    const cargos = await CargosService.crear(id, servicios);
    return res.status(201).json({ mensaje: 'Cargo adicional creado', cargos });
  } catch (error) {
    if (error.code === 'ESTADO_INVALIDO') return res.status(400).json({ error: error.message });
    if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
    console.error('RESERVAS ERROR:', error);
    return res.status(500).json({ error: 'Error al crear cargo adicional', detalle: error.message });
  }
};

/* ================= EXTENDER DÍAS ================= */

const extenderDias = async (req, res) => {
  try {
    const { id } = req.params;
    const diasExtra = parseInt(req.body?.diasExtra, 10);
    if (!diasExtra || diasExtra < 1 || diasExtra > 365) {
      return res.status(400).json({ error: 'diasExtra debe ser un número entre 1 y 365' });
    }
    const resultado = await ReservasService.extender(id, diasExtra);
    if (!resultado) return res.status(404).json({ error: 'Reserva no encontrada' });
    return res.status(200).json({ mensaje: 'Reserva extendida correctamente', ...resultado });
  } catch (error) {
    if (error.code === 'ESTADO_INVALIDO') return res.status(400).json({ error: error.message });
    if (error.code === 'CONFLICTO_FECHAS') return res.status(409).json({ error: error.message });
    console.error('RESERVAS ERROR:', error);
    return res.status(500).json({ error: 'Error al extender la reserva', detalle: error.message });
  }
};

/* ================= ELIMINAR ================= */

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await ReservasService.eliminar(id);
    if (!ok) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json({ mensaje: "Reserva eliminada" });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error al eliminar", detalle: error.message });
  }
};

module.exports = {
  obtenerTodas,
  obtenerPorId,
  obtenerEstados,
  obtenerMetodosPago,
  obtenerPorEstado,
  obtenerPorCliente,
  obtenerPorUsuario,
  obtenerPorFechas,
  crear,
  actualizar,
  actualizarEstado,
  cancelar,
  aprobarComprobante,
  rechazarComprobante,
  extenderDias,
  eliminar,
  agregarServicios,
  subirComprobante,
};
