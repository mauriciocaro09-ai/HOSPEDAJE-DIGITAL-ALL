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
    // Construir lista de habitaciones a verificar
    const habitacionesList = Array.isArray(data.habitaciones) && data.habitaciones.length
      ? data.habitaciones.map(Number).filter(Boolean)
      : data.IDHabitacion ? [Number(data.IDHabitacion)] : [];

    // Garantizar que IDHabitacion sea la primera habitación (columna de la tabla reserva)
    if (habitacionesList.length > 0) data.IDHabitacion = habitacionesList[0];

    // Validar bloqueo por reserva Pendiente para cada habitación
    for (const idHab of habitacionesList) {
      const [bloqueadas] = await db.query(`
        SELECT r.IDReserva FROM reserva r
        LEFT JOIN reservahabitacion rh ON rh.IDReserva = r.IDReserva
        JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
        WHERE (r.IDHabitacion = ? OR rh.IDHabitacion = ?)
          AND LOWER(e.NombreEstadoReserva) LIKE '%pendiente%'
          AND r.FechaInicio < ? AND r.FechaFinalizacion > ?
        LIMIT 1
      `, [idHab, idHab, data.FechaFinalizacion, data.FechaInicio]);
      if (bloqueadas.length > 0) {
        const err = new Error('Una de las habitaciones seleccionadas tiene una reserva pendiente para esas fechas. Por favor elige otra habitacion o intenta mas tarde.');
        err.statusCode = 409;
        throw err;
      }
    }

    if (Array.isArray(data.paquetes) && data.paquetes.length > 0) {
      for (const p of data.paquetes) {
        const idPaquete = p.IDPaquete || p.idPaquete;
        if (!idPaquete) continue;
        const [[paq]] = await db.query('SELECT IncluirHabitacion FROM paquete WHERE IDPaquete = ? LIMIT 1', [idPaquete]);
        if (paq && paq.IncluirHabitacion) {
          const [bloqPaq] = await db.query(`
            SELECT r.IDReserva FROM reserva r
            JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
            JOIN detallereservapaquetes dp ON dp.IDReserva = r.IDReserva
            WHERE dp.IDPaquete = ?
              AND LOWER(e.NombreEstadoReserva) LIKE '%pendiente%'
              AND r.FechaInicio < ? AND r.FechaFinalizacion > ?
            LIMIT 1
          `, [idPaquete, data.FechaFinalizacion, data.FechaInicio]);
          if (bloqPaq.length > 0) {
            const err = new Error('Este paquete tiene una reserva pendiente de confirmacion de pago para esas fechas. Por favor elige otro paquete o intenta mas tarde.');
            err.statusCode = 409;
            throw err;
          }
        }
      }
    }

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

    // Enviar email de aviso si el pago es por transferencia bancaria
    try {
      const [[mp]] = await db.query(
        'SELECT mp.NomMetodoPago FROM metodopago mp JOIN reserva r ON r.MetodoPago = mp.IdMetodoPago WHERE r.IDReserva = ? LIMIT 1',
        [reservaId]
      ).catch(() => [[null]]);
      if (mp && mp.NomMetodoPago && mp.NomMetodoPago.toLowerCase().includes('transferencia')) {
        const [[clienteData]] = await db.query(
          'SELECT c.Nombre, c.Apellido, c.Email FROM reserva r JOIN cliente c ON r.NroDocumentoCliente = c.NroDocumento WHERE r.IDReserva = ? LIMIT 1',
          [reservaId]
        ).catch(() => [[null]]);
        if (clienteData && clienteData.Email) {
          const fechaLimite = new Date(Date.now() + 3 * 60 * 1000);
          EmailService.enviarAvisoComprobante({
            clienteNombre: (clienteData.Nombre || '') + ' ' + (clienteData.Apellido || ''),
            clienteEmail: clienteData.Email,
            reservaId,
            fechaLimite
          }).catch(e => console.error('Error enviando aviso comprobante:', e.message));
        }
      }
    } catch (e) {
      console.error('Error verificando metodo de pago para aviso:', e.message);
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

  /* ── Aprobar comprobante ────────────────────── */
  aprobar: async (id) => {
    const reserva = await Reservas.obtenerPorId(id);
    if (!reserva) return null;

    const [[estadoConf]] = await db.query(
      "SELECT IdEstadoReserva FROM estadosreserva WHERE LOWER(NombreEstadoReserva) LIKE '%confirmad%' LIMIT 1"
    );
    const idEstado = estadoConf ? estadoConf.IdEstadoReserva : 2;
    const result = await Reservas.actualizar(id, { IdEstadoReserva: idEstado });
    if (!result || result.affectedRows === 0) return null;

    if (reserva.EmailCliente) {
      EmailService.enviarPagoVerificado({
        clienteNombre: reserva.NombreCliente || "Cliente",
        clienteEmail: reserva.EmailCliente,
        reservaId: id,
        fechaInicio: reserva.FechaInicio,
        fechaFin: reserva.FechaFinalizacion,
        montoTotal: Number(reserva.Monto_Total ?? reserva.MontoTotal ?? 0)
      }).catch(e => console.error("Error enviando email pago verificado:", e.message));
    }

    return result;
  },

  /* ── Rechazar comprobante ───────────────────── */
  rechazar: async (id, motivo) => {
    const reserva = await Reservas.obtenerPorId(id);
    if (!reserva) return null;

    // Limpiar comprobante y guardar motivo, mantener estado Pendiente
    await db.query(
      "UPDATE reserva SET ComprobanteTransferencia = NULL, MotivoCancelacion = ? WHERE IDReserva = ?",
      [motivo || null, id]
    );

    if (reserva.EmailCliente) {
      EmailService.enviarRechazoComprobante({
        clienteNombre: reserva.NombreCliente || "Cliente",
        clienteEmail: reserva.EmailCliente,
        reservaId: id,
        motivo: motivo || null
      }).catch(e => console.error("Error enviando email rechazo:", e.message));
    }

    return { ok: true };
  },

  /* ── Auto-cancelar vencidas ─────────────────── */
  autoCancelarVencidas: async () => {
    try {
      const limite = new Date(Date.now() - 3 * 60 * 1000); // hace 3 minutos
      const [vencidas] = await db.query(`
        SELECT r.IDReserva, c.Nombre, c.Apellido, c.Email
        FROM reserva r
        JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
        JOIN cliente c ON r.NroDocumentoCliente = c.NroDocumento
        WHERE LOWER(e.NombreEstadoReserva) LIKE '%pendiente%'
          AND (r.ComprobanteTransferencia IS NULL OR r.ComprobanteTransferencia = '')
          AND r.FechaCreacion IS NOT NULL
          AND r.FechaCreacion <= ?
      `, [limite]);

      if (vencidas.length === 0) return;

      const [[estadoCancelada]] = await db.query(
        "SELECT IdEstadoReserva FROM estadosreserva WHERE LOWER(NombreEstadoReserva) LIKE '%cancelad%' LIMIT 1"
      );
      const idEstado = estadoCancelada ? estadoCancelada.IdEstadoReserva : 4;

      for (const r of vencidas) {
        await db.query(
          "UPDATE reserva SET IdEstadoReserva = ?, MotivoCancelacion = 'Cancelacion automatica: plazo de 3 minutos vencido sin comprobante' WHERE IDReserva = ?",
          [idEstado, r.IDReserva]
        );
        if (r.Email) {
          EmailService.enviarCancelacionPorVencimiento({
            clienteNombre: (r.Nombre || '') + ' ' + (r.Apellido || ''),
            clienteEmail: r.Email,
            reservaId: r.IDReserva
          }).catch(e => console.error("Error enviando email vencimiento:", e.message));
        }
        console.log(`Reserva #${r.IDReserva} auto-cancelada por vencimiento de plazo.`);
      }
    } catch (e) {
      console.error("Error en autoCancelarVencidas:", e.message);
    }
  },

  /* ── Extender días ──────────────────────────── */
  extender: async (id, diasExtra) => {
    // Guardar fecha fin original antes de extender
    const reservaAntes = await Reservas.obtenerPorId(id);
    if (!reservaAntes) return null;
    const fechaFinAnterior = (reservaAntes.FechaFinalizacion instanceof Date
      ? reservaAntes.FechaFinalizacion.toISOString()
      : String(reservaAntes.FechaFinalizacion)).split('T')[0];

    const resultado = await Reservas.extender(id, diasExtra);
    if (!resultado) return null;

    // Crear cargo adicional por los días extra
    const nombreCargo = `Extensión de estadía — ${diasExtra} día(s): ${fechaFinAnterior} → ${resultado.nuevaFechaFin}`;
    await db.query(
      `INSERT INTO cargo_adicional (IDReserva, IDServicio, NombreCargo, Cantidad, PrecioUnitario, PrecioTotal, Estado)
       VALUES (?, NULL, ?, ?, ?, ?, 'pendiente')`,
      [id, nombreCargo, diasExtra, resultado.costoBase / diasExtra, Math.round(resultado.costoTotal * 100) / 100]
    ).catch(e => console.error('Error creando cargo extensión:', e.message));

    // Enviar email al cliente (sin bloquear la respuesta)
    db.query(
      `SELECT r.IdReserva, c.Nombre, c.Apellido, c.Email, h.NombreHabitacion
       FROM reserva r
       LEFT JOIN cliente c ON c.NroDocumento = r.NroDocumentoCliente
       LEFT JOIN habitacion h ON r.IDHabitacion = h.IDHabitacion
       WHERE r.IdReserva = ? LIMIT 1`,
      [id]
    ).then(([[info]]) => {
      if (info && info.Email) {
        EmailService.enviarExtensionReserva({
          clienteNombre: (info.Nombre || '') + ' ' + (info.Apellido || ''),
          clienteEmail: info.Email,
          reservaId: id,
          habitacion: info.NombreHabitacion || '—',
          diasExtra,
          fechaFinAnterior,
          nuevaFechaFin: resultado.nuevaFechaFin,
          costoExtra: resultado.costoTotal
        }).catch(e => console.error('Error enviando email extension:', e.message));
      }
    }).catch(e => console.error('Error fetch cliente para email extension:', e.message));

    return resultado;
  },

  /* ── Eliminar ───────────────────────────────── */
  eliminar: async (id) => {
    const result = await Reservas.eliminar(id);
    return result && result.affectedRows > 0 ? result : null;
  },

};

module.exports = ReservasService;
