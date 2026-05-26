const Reservas = require("../models/reservas.model");
const db = require("../config/db");

const ReservasService = {

  /* ── Crear ─────────────────────────────────── */
  create: async (data) => {
    return await Reservas.crear(data);
  },

  /* ── Obtener todas ──────────────────────────── */
  obtener: async () => {
    return await Reservas.obtenerTodas();
  },

  /* ── Obtener por ID ─────────────────────────── */
  obtenerPorId: async (id) => {
    return await Reservas.obtenerPorId(id);
  },

  /* ── Actualizar ─────────────────────────────── */
  actualizar: async (id, data) => {
    const result = await Reservas.actualizar(id, data);
    return result && result.affectedRows > 0 ? result : null;
  },

  /* ── Cancelar ───────────────────────────────── */
  cancelar: async (id) => {
    // Buscar el ID del estado "Cancelada"
    const [[estadoCancelada]] = await db.query(
      "SELECT IdEstadoReserva FROM estadosreserva WHERE LOWER(NombreEstadoReserva) LIKE '%cancelad%' LIMIT 1"
    );
    const idEstado = estadoCancelada ? estadoCancelada.IdEstadoReserva : 4;

    const result = await Reservas.actualizar(id, { IdEstadoReserva: idEstado });
    return result && result.affectedRows > 0 ? result : null;
  },

  /* ── Eliminar ───────────────────────────────── */
  eliminar: async (id) => {
    const result = await Reservas.eliminar(id);
    return result && result.affectedRows > 0 ? result : null;
  },
};

module.exports = ReservasService;
