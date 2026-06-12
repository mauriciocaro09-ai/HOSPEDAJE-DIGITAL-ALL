const Reservas = require("../models/reservas.model");
const db = require("../config/db");
const EmailService = require("../services/email.service");

/* ══════════════════════════════════════════════════════
   POLÍTICA DE CANCELACIÓN
   ──────────────────────────────────────────────────────
   Reservas normales:
     > 5 días  → 0% retención (gratis)
     1-5 días  → 50% retención
     < 24 h    → 100% (sin reembolso)
   Reservas con paquetes:
     > 8 días  → 0% retención (gratis)
     1-8 días  → 50% retención
     < 24 h    → 100% (sin reembolso)
══════════════════════════════════════════════════════ */
function calcularPoliticaCancelacion(fechaInicio, montoTotal, tienesPaquetes) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const checkIn = new Date(fechaInicio);
  checkIn.setHours(0, 0, 0, 0);
  const diasAnticipacion = Math.floor((checkIn - hoy) / (1000 * 60 * 60 * 24));

  const diasLibres = tienesPaquetes ? 8 : 5;
  const monto = Number(montoTotal) || 0;

  let porcentajeRetencion = 0;
  let descripcion = "";

  if (diasAnticipacion > diasLibres) {
    porcentajeRetencion = 0;
    descripcion = "Cancelacion gratuita — reembolso completo";
  } else if (diasAnticipacion >= 1) {
    porcentajeRetencion = 50;
    descripcion = `${diasAnticipacion} dia(s) antes del check-in — retencion del 50%`;
  } else {
    porcentajeRetencion = 100;
    descripcion = "Menos de 24 horas o no presentacion — sin reembolso";
  }

  const montoRetenido = Math.round(monto * porcentajeRetencion / 100);
  const montoReembolso = monto - montoRetenido;

  return { diasAnticipacion, porcentajeRetencion, montoRetenido, montoReembolso, descripcion };
}

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
            'SELECT PrecioPaquete FROM paquete WHERE IDPaquete = ? LIMIT 1',
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
  cancelar: async (id, motivo = null) => {
    // 1. Obtener datos de la reserva antes de cancelar
    const reserva = await Reservas.obtenerPorId(id);
    if (!reserva) return null;

    // 2. Calcular política de cancelación
    const montoTotal = Number(reserva.Monto_Total ?? reserva.MontoTotal ?? 0);
    const tienesPaquetes = Array.isArray(reserva.paquetes) && reserva.paquetes.length > 0;
    const politica = calcularPoliticaCancelacion(reserva.FechaInicio, montoTotal, tienesPaquetes);

    // 3. Cambiar estado a cancelada
    const [[estadoCancelada]] = await db.query(
      "SELECT IdEstadoReserva FROM estadosreserva WHERE LOWER(NombreEstadoReserva) LIKE '%cancelad%' LIMIT 1"
    );
    const idEstado = estadoCancelada ? estadoCancelada.IdEstadoReserva : 4;

    const result = await Reservas.actualizar(id, { IdEstadoReserva: idEstado });
    if (!result || result.affectedRows === 0) return null;

    // 4. Guardar motivo si existe
    if (motivo) {
      await db.query(
        "UPDATE reserva SET MotivoCancelacion = ? WHERE IdReserva = ?",
        [motivo, id]
      ).catch(() => {});
    }

    // 5. Enviar email de cancelación con desglose
    if (reserva.EmailCliente) {
      EmailService.enviarCancelacionReserva({
        clienteNombre: reserva.NombreCliente || "Cliente",
        clienteEmail: reserva.EmailCliente,
        reservaId: id,
        habitacion: reserva.NombreHabitacion || "—",
        fechaInicio: reserva.FechaInicio,
        fechaFin: reserva.FechaFinalizacion,
        montoTotal,
        montoReembolso: politica.montoReembolso,
        montoRetenido: politica.montoRetenido,
        porcentajeRetencion: politica.porcentajeRetencion,
        descripcionPolitica: politica.descripcion,
        motivo: motivo || null
      }).catch(e => console.error("Error enviando email cancelacion:", e.message));
    }

    return { ...result, politica };
  },

  /* ── Eliminar ───────────────────────────────── */
  eliminar: async (id) => {
    const result = await Reservas.eliminar(id);
    return result && result.affectedRows > 0 ? result : null;
  },

};

module.exports = ReservasService;
