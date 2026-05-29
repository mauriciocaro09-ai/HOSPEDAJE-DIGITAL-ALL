const ReservasService = require("../services/reservas.service");
const db = require("../config/db");
const EmailService = require("../services/email.service");

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

        emailData = {
          clienteNombre: nombreCliente,
          clienteEmail: emailCliente,
          reservaId,
          habitacion: (hab && hab.NombreHabitacion) ? hab.NombreHabitacion : 'Habitacion',
          fechaInicio: req.body.FechaInicio,
          fechaFin: req.body.FechaFinalizacion,
          montoTotal: req.body.Sub_Total || req.body.MontoTotal || 0
        };
      }
    } catch (emailErr) {
      console.error('Error preparando datos para correo de confirmacion:', emailErr.message);
    }

    res.status(201).json({ mensaje: "Reserva creada", reservaId });

    // Enviar correo de confirmacion sin bloquear la respuesta
    if (emailData) {
      EmailService.enviarConfirmacionReserva(emailData)
        .catch(function(e) { console.error('Error enviando correo de confirmacion de reserva:', e); });
    }

  } catch (error) {
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
    const ok = await ReservasService.cancelar(id);
    if (!ok) return res.status(404).json({ error: "Reserva no encontrada" });
    return res.status(200).json({ mensaje: "Reserva cancelada" });
  } catch (error) {
    console.error("RESERVAS ERROR:", error);
    return res.status(500).json({ error: "Error al cancelar", detalle: error.message });
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
  obtenerPorFechas,
  crear,
  actualizar,
  actualizarEstado,
  cancelar,
  eliminar
};
