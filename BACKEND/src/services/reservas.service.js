const Reservas = require("../models/reservas.model");
const db = require("../config/db");

const ReservasService = {

  /* ── Crear ─────────────────────────────────── */
  create: async (data) => {
    const result = await Reservas.crear(data);
    const reservaId = result.insertId;

    if (Array.isArray(data.servicios) && data.servicios.length) {
      try {
        for (const s of data.servicios) {
          const idServicio = s.IDServicio || s.idServicio;
          const cantidad = s.cantidad || 1;
          if (!idServicio) continue;
          const [[srv]] = await db.query(
            'SELECT Costo FROM servicio WHERE IDServicio = ? LIMIT 1',
            [idServicio]
          );
          const precio = srv ? Number(srv.Costo || 0) * cantidad : 0;
          await db.query(
            'INSERT INTO detallereservaservicio (IDReserva, IDServicio, Cantidad, Precio, Estado) VALUES (?, ?, ?, ?, 1)',
            [reservaId, idServicio, cantidad, precio]
          );
        }
      } catch (e) {
        console.error('Error insertando servicios en detalle:', e.message);
      }
    }

    if (Array.isArray(data.paquetes) && data.paquetes.length) {
      try {
        for (const p of data.paquetes) {
          const idPaquete = p.IDPaquete || p.idPaquete;
          const cantidad = p.cantidad || 1;
          if (!idPaquete) continue;
          const [[paq]] = await db.query(
            'SELECT PrecioPaquete FROM paquetes WHERE IDPaquete = ? LIMIT 1',
            [idPaquete]
          );
          const precio = paq ? Number(paq.PrecioPaquete || 0) * cantidad : 0;
          await db.query(
            'INSERT INTO detallereservapaquetes (IDReserva, IDPaquete, Cantidad, Precio, Estado) VALUES (?, ?, ?, ?, 1)',
            [reservaId, idPaquete, cantidad, precio]
          );
        }
      } catch (e) {
        console.error('Error insertando paquetes en detalle:', e.message);
      }
    }

    return result;
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
