const db = require('../config/db');

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
      `SELECT ca.*, s.NombreServicio, mp.NombreMetodoPago
       FROM cargo_adicional ca
       LEFT JOIN servicio s ON ca.IDServicio = s.IDServicio
       LEFT JOIN metodopago mp ON ca.IDMetodoPago = mp.IdMetodoPago
       WHERE ca.IDReserva = ?
       ORDER BY ca.FechaCreacion DESC`,
      [idReserva]
    );
    return rows;
  },

  pagar: async (idCargo, idMetodoPago) => {
    const [[cargo]] = await db.query(
      'SELECT * FROM cargo_adicional WHERE IDCargo = ? LIMIT 1',
      [idCargo]
    );
    if (!cargo) throw { code: 'NOT_FOUND', message: 'Cargo no encontrado' };
    if (cargo.Estado !== 'pendiente') throw { code: 'ESTADO_INVALIDO', message: 'El cargo no está pendiente de pago' };

    await db.query(
      `UPDATE cargo_adicional SET Estado = 'pagado', IDMetodoPago = ?, FechaPago = NOW() WHERE IDCargo = ?`,
      [idMetodoPago, idCargo]
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
