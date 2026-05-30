const db = require("../config/db");

let reservaColsPromise = null;

async function getReservaCols() {
  if (!reservaColsPromise) {
    reservaColsPromise = db
      .query("SHOW COLUMNS FROM `reserva`")
      .then(([rows]) => new Set(rows.map((r) => r.Field)));
  }
  return reservaColsPromise;
}

function n(v, def = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : def;
}

function firstDefined(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
}

const Reservas = {
  obtenerTodas: async () => {
    const cols = await getReservaCols();

    const joinClientes = cols.has("IDCliente")
      ? "INNER JOIN cliente c ON r.IDCliente = c.NroDocumento"
      : cols.has("IdCliente")
        ? "INNER JOIN cliente c ON r.IdCliente = c.NroDocumento"
        : cols.has("NroDocumentoCliente")
          ? "INNER JOIN cliente c ON r.NroDocumentoCliente = c.NroDocumento"
          : null;

    if (!joinClientes) {
      throw new Error(
        "La tabla `Reserva` no tiene `IDCliente`/`IdCliente` ni `NroDocumentoCliente`. No se puede relacionar con Clientes."
      );
    }

    // JOINs opcionales según columnas reales
    let joinMetodoPago = "";
    let selectMetodoPago = "NULL AS NomMetodoPago";
    if (cols.has("MetodoPago")) {
      joinMetodoPago = "LEFT JOIN metodopago mp ON r.MetodoPago = mp.IdMetodoPago";
      selectMetodoPago = "mp.NomMetodoPago AS NomMetodoPago";
    } else if (cols.has("IdMetodoPago")) {
      joinMetodoPago = "LEFT JOIN metodopago mp ON r.IdMetodoPago = mp.IdMetodoPago";
      selectMetodoPago = "mp.NomMetodoPago AS NomMetodoPago";
    }

    let joinEstado = "";
    let selectEstado = "NULL AS NombreEstadoReserva";
    if (cols.has("IdEstadoReserva")) {
      joinEstado = "LEFT JOIN estadosreserva er ON r.IdEstadoReserva = er.IdEstadoReserva";
      selectEstado = "er.NombreEstadoReserva AS NombreEstadoReserva";
    }

    let joinUsuario = "";
    let selectUsuario = "NULL AS NombreUsuario";
    if (cols.has("UsuarioIdusuario")) {
      joinUsuario = "LEFT JOIN usuarios u ON r.UsuarioIdusuario = u.IDUsuario";
      selectUsuario = "u.NombreUsuario AS NombreUsuario";
    }

    const [rows] = await db.query(`
      SELECT 
        r.*,
        c.Nombre AS NombreCliente,
        c.Apellido AS ApellidoCliente,
        ${selectMetodoPago},
        ${selectEstado},
        ${selectUsuario}
      FROM reserva r
      ${joinClientes}
      ${joinMetodoPago}
      ${joinEstado}
      ${joinUsuario}
      ORDER BY r.IdReserva DESC
    `);

    return rows;
  },

  obtenerPorId: async (id) => {
    const cols = await getReservaCols();

    const joinClientes = cols.has("IDCliente")
      ? "LEFT JOIN cliente c ON r.IDCliente = c.NroDocumento"
      : cols.has("IdCliente")
        ? "LEFT JOIN cliente c ON r.IdCliente = c.NroDocumento"
        : cols.has("NroDocumentoCliente")
          ? "LEFT JOIN cliente c ON r.NroDocumentoCliente = c.NroDocumento"
          : "";

    let joinMetodoPago = "";
    let selectMetodoPago = "NULL AS NomMetodoPago";
    if (cols.has("MetodoPago")) {
      joinMetodoPago = "LEFT JOIN metodopago mp ON r.MetodoPago = mp.IdMetodoPago";
      selectMetodoPago = "mp.NomMetodoPago AS NomMetodoPago";
    } else if (cols.has("IdMetodoPago")) {
      joinMetodoPago = "LEFT JOIN metodopago mp ON r.IdMetodoPago = mp.IdMetodoPago";
      selectMetodoPago = "mp.NomMetodoPago AS NomMetodoPago";
    }

    let joinEstado = "";
    let selectEstado = "NULL AS NombreEstadoReserva";
    if (cols.has("IdEstadoReserva")) {
      joinEstado = "LEFT JOIN estadosreserva er ON r.IdEstadoReserva = er.IdEstadoReserva";
      selectEstado = "er.NombreEstadoReserva AS NombreEstadoReserva";
    }

    let joinHabitacion = "";
    let selectHabitacion = "NULL AS NombreHabitacion, NULL AS CostoHabitacion";
    if (cols.has("IDHabitacion")) {
      joinHabitacion = "LEFT JOIN habitacion h ON r.IDHabitacion = h.IDHabitacion";
      selectHabitacion = "h.NombreHabitacion AS NombreHabitacion, h.Costo AS CostoHabitacion";
    }

    const [rows] = await db.query(`
      SELECT
        r.*,
        c.Nombre AS NombreCliente,
        c.Apellido AS ApellidoCliente,
        c.Email AS EmailCliente,
        c.Telefono AS TelefonoCliente,
        ${selectHabitacion},
        ${selectMetodoPago},
        ${selectEstado}
      FROM reserva r
      ${joinClientes}
      ${joinHabitacion}
      ${joinMetodoPago}
      ${joinEstado}
      WHERE r.IdReserva = ?
    `, [id]);

    const reserva = rows[0];
    if (!reserva) return null;

    try {
      const [servicios] = await db.query(`
        SELECT ds.IDServicio, ds.Cantidad, ds.Precio AS SubtotalItem,
               s.NombreServicio, s.Costo
        FROM detallereservaservicio ds
        JOIN servicio s ON ds.IDServicio = s.IDServicio
        WHERE ds.IDReserva = ?
      `, [id]);
      reserva.servicios = servicios;
    } catch (e) {
      console.error('detallereservaservicio query error:', e.message);
      reserva.servicios = [];
    }

    try {
      const [paquetes] = await db.query(`
        SELECT dp.IDPaquete, dp.Cantidad, dp.Precio AS SubtotalItem,
               p.NombrePaquete, p.PrecioPaquete
        FROM detallereservapaquetes dp
        JOIN paquete p ON dp.IDPaquete = p.IDPaquete
        WHERE dp.IDReserva = ?
      `, [id]);
      reserva.paquetes = paquetes;
    } catch (e) {
      console.error('detallereservapaquetes query error:', e.message);
      reserva.paquetes = [];
    }

    return reserva;
  },

  crear: async (reserva) => {
    const cols = await getReservaCols();

    const IDCliente = firstDefined(reserva.IDCliente, reserva.IdCliente);
    const NroDocumentoCliente = firstDefined(reserva.NroDocumentoCliente);

    const IDHabitacion = firstDefined(reserva.IDHabitacion, reserva.IdHabitacion);

    const FechaInicio = reserva.FechaInicio;
    const FechaFinalizacion = reserva.FechaFinalizacion;

    const SubTotal = n(reserva.Sub_Total ?? reserva.SubTotal);
    const Descuento = n(reserva.Descuento);
    const IVA = n(reserva.IVA);
    const MontoTotal = n(reserva.Monto_Total ?? reserva.MontoTotal);

    const MetodoPago = firstDefined(reserva.MetodoPago, reserva.IdMetodoPago, 1);
    const IdEstadoReserva = firstDefined(reserva.IdEstadoReserva, 1);
    const IdUsuario = firstDefined(reserva.id_usuario, reserva.UsuarioIdusuario, reserva.IDUsuario);

    const insertCols = [];
    const insertValsSql = [];
    const params = [];

    // Cliente
    if (cols.has("IDCliente")) {
      if (!IDCliente) throw new Error("Falta IDCliente para crear la reserva.");
      insertCols.push("IDCliente");
      insertValsSql.push("?");
      params.push(IDCliente);
    } else if (cols.has("IdCliente")) {
      if (!IDCliente) throw new Error("Falta IdCliente para crear la reserva.");
      insertCols.push("IdCliente");
      insertValsSql.push("?");
      params.push(IDCliente);
    } else if (cols.has("NroDocumentoCliente")) {
      if (!NroDocumentoCliente) throw new Error("Falta NroDocumentoCliente para crear la reserva.");
      insertCols.push("NroDocumentoCliente");
      insertValsSql.push("?");
      params.push(NroDocumentoCliente);
    } else {
      throw new Error("La tabla `Reserva` no tiene `IDCliente`/`IdCliente` ni `NroDocumentoCliente`.");
    }

    // Habitación (MUY PROBABLE que sea requerida)
    if (cols.has("IDHabitacion")) {
      if (!IDHabitacion) throw new Error("Falta IDHabitacion para crear la reserva.");
      insertCols.push("IDHabitacion");
      insertValsSql.push("?");
      params.push(IDHabitacion);
    } else if (cols.has("IdHabitacion")) {
      if (!IDHabitacion) throw new Error("Falta IdHabitacion para crear la reserva.");
      insertCols.push("IdHabitacion");
      insertValsSql.push("?");
      params.push(IDHabitacion);
    }

    // FechaReserva
    if (cols.has("FechaReserva")) {
      insertCols.push("FechaReserva");
      insertValsSql.push("NOW()");
    }

    // Fechas
    insertCols.push("FechaInicio");
    insertValsSql.push("?");
    params.push(FechaInicio);

    insertCols.push("FechaFinalizacion");
    insertValsSql.push("?");
    params.push(FechaFinalizacion);

    // Totales (soporta Sub_Total y SubTotal)
    if (cols.has("Sub_Total")) {
      insertCols.push("Sub_Total");
      insertValsSql.push("?");
      params.push(SubTotal);
    } else if (cols.has("SubTotal")) {
      insertCols.push("SubTotal");
      insertValsSql.push("?");
      params.push(SubTotal);
    }
    if (cols.has("Descuento")) {
      insertCols.push("Descuento");
      insertValsSql.push("?");
      params.push(Descuento);
    }
    if (cols.has("IVA")) {
      insertCols.push("IVA");
      insertValsSql.push("?");
      params.push(IVA);
    }
    // Soporta Monto_Total y MontoTotal
    if (cols.has("Monto_Total")) {
      insertCols.push("Monto_Total");
      insertValsSql.push("?");
      params.push(MontoTotal);
    } else if (cols.has("MontoTotal")) {
      insertCols.push("MontoTotal");
      insertValsSql.push("?");
      params.push(MontoTotal);
    }

    // Método de pago (soporta ambos nombres)
    if (cols.has("MetodoPago")) {
      insertCols.push("MetodoPago");
      insertValsSql.push("?");
      params.push(MetodoPago);
    } else if (cols.has("IdMetodoPago")) {
      insertCols.push("IdMetodoPago");
      insertValsSql.push("?");
      params.push(MetodoPago);
    }

    if (cols.has("IdEstadoReserva")) {
      insertCols.push("IdEstadoReserva");
      insertValsSql.push("?");
      params.push(IdEstadoReserva);
    }

    // Soporta id_usuario y UsuarioIdusuario
    if (cols.has("id_usuario")) {
      insertCols.push("id_usuario");
      insertValsSql.push("?");
      params.push(IdUsuario);
    } else if (cols.has("UsuarioIdusuario")) {
      insertCols.push("UsuarioIdusuario");
      insertValsSql.push("?");
      params.push(IdUsuario);
    }

    const sql = `
      INSERT INTO reserva (${insertCols.join(", ")})
      VALUES (${insertValsSql.join(", ")})
    `;

    const [result] = await db.query(sql, params);
    return result;
  },

  actualizar: async (id, reserva) => {
    const cols = await getReservaCols();

    // Update simple + compatible
    const fields = [];
    const params = [];

    const setIf = (colName, value) => {
      if (!cols.has(colName)) return;
      if (value === undefined) return;
      fields.push(`${colName}=?`);
      params.push(value);
    };

    setIf("FechaInicio", reserva.FechaInicio);
    setIf("FechaFinalizacion", reserva.FechaFinalizacion);

    setIf("SubTotal", n(reserva.SubTotal));
    setIf("Descuento", n(reserva.Descuento));
    setIf("IVA", n(reserva.IVA));
    setIf("MontoTotal", n(reserva.MontoTotal));

    if (cols.has("MetodoPago")) setIf("MetodoPago", reserva.MetodoPago);
    if (cols.has("IdMetodoPago")) setIf("IdMetodoPago", reserva.IdMetodoPago ?? reserva.MetodoPago);

    setIf("IdEstadoReserva", reserva.IdEstadoReserva);

    if (!fields.length) return { affectedRows: 0 };

    params.push(id);
    const [result] = await db.query(
      `UPDATE reserva SET ${fields.join(", ")} WHERE IdReserva=?`,
      params
    );
    return result;
  },

  eliminar: async (id) => {
    const [result] = await db.query("DELETE FROM reserva WHERE IdReserva=?", [id]);
    return result;
  },
};

module.exports = Reservas;