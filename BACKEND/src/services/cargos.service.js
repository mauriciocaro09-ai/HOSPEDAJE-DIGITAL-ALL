const db = require('../config/db');
const EmailService = require('./email.service');

const CargosService = {

  crear: async (idReserva, servicios) => {
    const [[reserva]] = await db.query(
      `SELECT r.IdReserva, e.NombreEstadoReserva
       FROM reserva r
       LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
       WHERE r.IdReserva = ? LIMIT 1`,
      [idReserva]
    );
    if (!reserva) throw { code: 'NOT_FOUND', message: 'Reserva no encontrada' };

    const estado = (reserva.NombreEstadoReserva || '').toLowerCase();
    if (!['confirmada', 'pendiente'].includes(estado)) {
      throw { code: 'ESTADO_INVALIDO', message: 'Solo se pueden agregar servicios a reservas confirmadas o pendientes' };
    }

    const cargos = [];
    for (const s of servicios) {
      const idServicio = s.IDServicio || s.idServicio;
      const cantidad = Number(s.cantidad) || 1;
      if (!idServicio) continue;

      const [[srv]] = await db.query(
        'SELECT IDServicio, NombreServicio, Costo FROM servicio WHERE IDServicio = ? AND Estado = 1 LIMIT 1',
        [idServicio]
      );
      if (!srv) continue;

      const precioUnitario = Number(srv.Costo || 0);
      const precioTotal = Math.round(precioUnitario * cantidad * 1.19);

      const [result] = await db.query(
        `INSERT INTO cargo_adicional (IDReserva, IDServicio, Cantidad, PrecioUnitario, PrecioTotal, Estado)
         VALUES (?, ?, ?, ?, ?, 'pendiente')`,
        [idReserva, idServicio, cantidad, precioUnitario, precioTotal]
      );
      cargos.push({ IDCargo: result.insertId, NombreServicio: srv.NombreServicio, PrecioTotal: precioTotal });
    }
    return cargos;
  },

  obtenerPorReserva: async (idReserva) => {
    const [rows] = await db.query(
      `SELECT ca.IDCargo, ca.IDReserva, ca.IDServicio, ca.Cantidad,
              ca.PrecioUnitario, ca.PrecioTotal, ca.Estado,
              ca.IDMetodoPago, ca.FechaCreacion, ca.FechaPago,
              ca.ComprobanteTransferencia,
              (ca.ComprobanteTransferencia IS NOT NULL AND ca.ComprobanteTransferencia != '') AS TieneComprobante,
              COALESCE(s.NombreServicio, ca.NombreCargo, 'Cargo adicional') AS NombreServicio,
              mp.NomMetodoPago
       FROM cargo_adicional ca
       LEFT JOIN servicio s ON ca.IDServicio = s.IDServicio
       LEFT JOIN metodopago mp ON ca.IDMetodoPago = mp.IdMetodoPago
       WHERE ca.IDReserva = ?
       ORDER BY ca.FechaCreacion DESC`,
      [idReserva]
    );
    return rows;
  },

  pagar: async (idCargo, idMetodoPago, comprobante = null) => {
    const [[cargo]] = await db.query(
      'SELECT * FROM cargo_adicional WHERE IDCargo = ? LIMIT 1',
      [idCargo]
    );
    if (!cargo) throw { code: 'NOT_FOUND', message: 'Cargo no encontrado' };
    if (cargo.Estado !== 'pendiente') throw { code: 'ESTADO_INVALIDO', message: 'El cargo no está pendiente de pago' };

    const [[mp]] = await db.query('SELECT NomMetodoPago FROM metodopago WHERE IdMetodoPago = ? LIMIT 1', [idMetodoPago]);
    const esTransferencia = mp && (mp.NomMetodoPago || '').toLowerCase().includes('transferencia');

    if (esTransferencia && comprobante) {
      // Guardar comprobante y dejar en pendiente para aprobación del admin
      await db.query(
        `UPDATE cargo_adicional SET IDMetodoPago = ?, ComprobanteTransferencia = ? WHERE IDCargo = ?`,
        [idMetodoPago, comprobante, idCargo]
      );
    } else {
      // Pago directo (efectivo u otro)
      await db.query(
        `UPDATE cargo_adicional SET Estado = 'pagado', IDMetodoPago = ?, FechaPago = NOW() WHERE IDCargo = ?`,
        [idMetodoPago, idCargo]
      );
    }
    return { esTransferencia: !!esTransferencia };
  },

  pagarLote: async (idReserva, idMetodoPago, comprobante = null) => {
    const [cargos] = await db.query(
      `SELECT IDCargo FROM cargo_adicional
       WHERE IDReserva = ? AND Estado = 'pendiente'
         AND (ComprobanteTransferencia IS NULL OR ComprobanteTransferencia = '')`,
      [idReserva]
    );
    if (!cargos.length) throw { code: 'NOT_FOUND', message: 'No hay cargos pendientes de pago' };

    const [[mp]] = await db.query('SELECT NomMetodoPago FROM metodopago WHERE IdMetodoPago = ? LIMIT 1', [idMetodoPago]);
    const esTransferencia = mp && (mp.NomMetodoPago || '').toLowerCase().includes('transferencia');

    for (const cargo of cargos) {
      if (esTransferencia && comprobante) {
        await db.query(
          `UPDATE cargo_adicional SET IDMetodoPago = ?, ComprobanteTransferencia = ? WHERE IDCargo = ?`,
          [idMetodoPago, comprobante, cargo.IDCargo]
        );
      } else {
        await db.query(
          `UPDATE cargo_adicional SET Estado = 'pagado', IDMetodoPago = ?, FechaPago = NOW() WHERE IDCargo = ?`,
          [idMetodoPago, cargo.IDCargo]
        );
      }
    }
    return { esTransferencia: !!esTransferencia, cantidad: cargos.length };
  },

  aprobarLote: async (idReserva) => {
    // Obtener cargos ANTES de aprobar para incluirlos en el correo
    const [cargosVerif] = await db.query(
      `SELECT ca.Cantidad, ca.PrecioTotal, s.NombreServicio
       FROM cargo_adicional ca
       LEFT JOIN servicio s ON ca.IDServicio = s.IDServicio
       WHERE ca.IDReserva = ? AND ca.Estado = 'pendiente'
         AND ca.ComprobanteTransferencia IS NOT NULL AND ca.ComprobanteTransferencia != ''`,
      [idReserva]
    );

    await db.query(
      `UPDATE cargo_adicional SET Estado = 'pagado', FechaPago = NOW()
       WHERE IDReserva = ? AND Estado = 'pendiente'
         AND ComprobanteTransferencia IS NOT NULL AND ComprobanteTransferencia != ''`,
      [idReserva]
    );

    // Enviar correo al cliente (sin bloquear la respuesta)
    db.query(
      `SELECT r.IdReserva, c.Nombre, c.Apellido, c.Email
       FROM reserva r
       LEFT JOIN cliente c ON c.NroDocumento = r.NroDocumentoCliente
       WHERE r.IdReserva = ? LIMIT 1`,
      [idReserva]
    ).then(([[info]]) => {
      if (info && info.Email && cargosVerif.length > 0) {
        const totalCargos = cargosVerif.reduce((s, c) => s + Number(c.PrecioTotal), 0);
        EmailService.enviarAprobacionCargosAdicionales({
          clienteNombre: (info.Nombre || '') + ' ' + (info.Apellido || ''),
          clienteEmail: info.Email,
          reservaId: idReserva,
          cargos: cargosVerif,
          totalCargos
        }).catch(e => console.error('Email aprobacion cargos:', e.message));
      }
    }).catch(e => console.error('Fetch cliente para email cargos:', e.message));

    return true;
  },

  rechazarLote: async (idReserva) => {
    await db.query(
      `UPDATE cargo_adicional SET ComprobanteTransferencia = NULL, IDMetodoPago = NULL
       WHERE IDReserva = ? AND Estado = 'pendiente'
         AND ComprobanteTransferencia IS NOT NULL AND ComprobanteTransferencia != ''`,
      [idReserva]
    );

    // Enviar correo al cliente avisando el rechazo
    db.query(
      `SELECT r.IdReserva, c.Nombre, c.Apellido, c.Email
       FROM reserva r
       LEFT JOIN cliente c ON c.NroDocumento = r.NroDocumentoCliente
       WHERE r.IdReserva = ? LIMIT 1`,
      [idReserva]
    ).then(([[info]]) => {
      if (info && info.Email) {
        EmailService.enviarRechazoCargoComprobante({
          clienteNombre: (info.Nombre || '') + ' ' + (info.Apellido || ''),
          clienteEmail: info.Email,
          reservaId: idReserva
        }).catch(e => console.error('Email rechazo cargo:', e.message));
      }
    }).catch(e => console.error('Fetch cliente para email rechazo cargo:', e.message));

    return true;
  },

  aprobar: async (idCargo) => {
    const [[cargo]] = await db.query(
      'SELECT * FROM cargo_adicional WHERE IDCargo = ? LIMIT 1',
      [idCargo]
    );
    if (!cargo) throw { code: 'NOT_FOUND', message: 'Cargo no encontrado' };
    await db.query(
      `UPDATE cargo_adicional SET Estado = 'pagado', FechaPago = NOW() WHERE IDCargo = ?`,
      [idCargo]
    );
    return true;
  },

  rechazar: async (idCargo) => {
    const [[cargo]] = await db.query(
      'SELECT * FROM cargo_adicional WHERE IDCargo = ? LIMIT 1',
      [idCargo]
    );
    if (!cargo) throw { code: 'NOT_FOUND', message: 'Cargo no encontrado' };
    await db.query(
      `UPDATE cargo_adicional SET ComprobanteTransferencia = NULL, IDMetodoPago = NULL WHERE IDCargo = ?`,
      [idCargo]
    );
    return true;
  },

  cancelar: async (idCargo) => {
    const [[cargo]] = await db.query(
      'SELECT * FROM cargo_adicional WHERE IDCargo = ? LIMIT 1',
      [idCargo]
    );
    if (!cargo) throw { code: 'NOT_FOUND', message: 'Cargo no encontrado' };
    if (cargo.Estado !== 'pendiente') throw { code: 'ESTADO_INVALIDO', message: 'Solo se pueden cancelar cargos pendientes' };

    await db.query(
      `UPDATE cargo_adicional SET Estado = 'cancelado' WHERE IDCargo = ?`,
      [idCargo]
    );
    return true;
  },
};

module.exports = CargosService;
