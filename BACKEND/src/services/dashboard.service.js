const db = require("../config/db");

const DashboardService = {

    estadisticas: async () => {

        // total reservas
        const [reservas] = await db.query(`
            SELECT COUNT(*) AS totalReservas
            FROM reserva
        `);

        // ingresos totales
        const [ingresos] = await db.query(`
            SELECT SUM(Monto_Total) AS ingresosTotales
            FROM reserva
            WHERE IdEstadoReserva = 2
        `);

        // habitaciones más reservadas
        const [habitaciones] = await db.query(`
            SELECT
                h.NombreHabitacion,
                COUNT(r.IDHabitacion) AS total
            FROM reserva r
            JOIN habitacion h
            ON r.IDHabitacion = h.IDHabitacion
            GROUP BY r.IDHabitacion
            ORDER BY total DESC
            LIMIT 5
        `);

        // servicios más vendidos
        const [servicios] = await db.query(`
            SELECT
                s.NombreServicio,
                SUM(d.Cantidad) AS total
            FROM detallereservaservicio d
            JOIN servicio s ON d.IDServicio = s.IDServicio
            GROUP BY d.IDServicio
            ORDER BY total DESC
            LIMIT 5
        `);

        // paquetes más vendidos
        const [paquetes] = await db.query(`
            SELECT
                p.NombrePaquete,
                SUM(dp.Cantidad) AS total
            FROM detallereservapaquetes dp
            JOIN paquete p ON dp.IDPaquete = p.IDPaquete
            GROUP BY dp.IDPaquete
            ORDER BY total DESC
            LIMIT 5
        `);

        return {
            totalReservas: reservas[0].totalReservas,
            ingresosTotales: ingresos[0].ingresosTotales || 0,
            habitacionesMasReservadas: habitaciones,
            serviciosMasVendidos: servicios,
            paquetesMasVendidos: paquetes
        };

    },

    alertas: async () => {
        const hoy = new Date().toISOString().split('T')[0];

        const [[{ pendientes }]] = await db.query(`
            SELECT COUNT(*) AS pendientes FROM reserva
            WHERE IdEstadoReserva = 1 AND FechaInicio >= CURDATE()
        `);

        const [[{ checkins }]] = await db.query(`
            SELECT COUNT(*) AS checkins FROM reserva
            WHERE DATE(FechaInicio) = ? AND IdEstadoReserva IN (1, 2)
        `, [hoy]);

        const [[{ checkouts }]] = await db.query(`
            SELECT COUNT(*) AS checkouts FROM reserva
            WHERE DATE(FechaFinalizacion) = ? AND IdEstadoReserva = 2
        `, [hoy]);

        const [listaPendientes] = await db.query(`
            SELECT r.IDReserva,
                   CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente,
                   h.NombreHabitacion, r.FechaInicio, r.FechaFinalizacion
            FROM reserva r
            JOIN cliente c ON r.NroDocumentoCliente = c.NroDocumento
            JOIN habitacion h ON r.IDHabitacion = h.IDHabitacion
            WHERE r.IdEstadoReserva = 1 AND r.FechaInicio >= CURDATE()
            ORDER BY r.FechaInicio ASC
            LIMIT 10
        `);

        const [listaCheckins] = await db.query(`
            SELECT r.IDReserva,
                   CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente,
                   h.NombreHabitacion, r.FechaInicio, r.FechaFinalizacion
            FROM reserva r
            JOIN cliente c ON r.NroDocumentoCliente = c.NroDocumento
            JOIN habitacion h ON r.IDHabitacion = h.IDHabitacion
            WHERE DATE(r.FechaInicio) = ? AND r.IdEstadoReserva IN (1, 2)
            ORDER BY r.FechaInicio ASC
            LIMIT 10
        `, [hoy]);

        const [listaCheckouts] = await db.query(`
            SELECT r.IDReserva,
                   CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente,
                   h.NombreHabitacion, r.FechaInicio, r.FechaFinalizacion
            FROM reserva r
            JOIN cliente c ON r.NroDocumentoCliente = c.NroDocumento
            JOIN habitacion h ON r.IDHabitacion = h.IDHabitacion
            WHERE DATE(r.FechaFinalizacion) = ? AND r.IdEstadoReserva = 2
            ORDER BY r.FechaFinalizacion ASC
            LIMIT 10
        `, [hoy]);

        // Comprobantes de reservas subidos por clientes pendientes de revisión del admin
        const [[{ comprobantes }]] = await db.query(`
            SELECT COUNT(*) AS comprobantes FROM reserva r
            JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
            WHERE LOWER(e.NombreEstadoReserva) LIKE '%pendiente%'
              AND r.ComprobanteTransferencia IS NOT NULL
              AND r.ComprobanteTransferencia != ''
        `).catch(() => [[{ comprobantes: 0 }]]);

        const [listaComprobantesReserva] = await db.query(`
            SELECT r.IDReserva,
                   CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente,
                   c.Email AS EmailCliente,
                   r.FechaCreacion AS FechaSubida
            FROM reserva r
            JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
            JOIN cliente c ON r.NroDocumentoCliente = c.NroDocumento
            WHERE LOWER(e.NombreEstadoReserva) LIKE '%pendiente%'
              AND r.ComprobanteTransferencia IS NOT NULL
              AND r.ComprobanteTransferencia != ''
            ORDER BY r.FechaCreacion DESC
            LIMIT 10
        `).catch(() => [[]]);

        // Comprobantes de cargos adicionales pendientes de aprobación
        const [[{ cargosComprobantes }]] = await db.query(`
            SELECT COUNT(*) AS cargosComprobantes FROM cargo_adicional
            WHERE Estado = 'pendiente'
              AND ComprobanteTransferencia IS NOT NULL
              AND ComprobanteTransferencia != ''
        `).catch(() => [[{ cargosComprobantes: 0 }]]);

        const [listaCargosComprobantes] = await db.query(`
            SELECT ca.IDReserva,
                   CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente,
                   s.NombreServicio AS EmailCliente,
                   ca.FechaCreacion AS FechaSubida
            FROM cargo_adicional ca
            JOIN reserva r ON ca.IDReserva = r.IdReserva
            JOIN cliente c ON r.NroDocumentoCliente = c.NroDocumento
            JOIN servicio s ON ca.IDServicio = s.IDServicio
            WHERE ca.Estado = 'pendiente'
              AND ca.ComprobanteTransferencia IS NOT NULL
              AND ca.ComprobanteTransferencia != ''
            ORDER BY ca.FechaCreacion DESC
            LIMIT 10
        `).catch(() => [[]]);

        const listaComprobantes = [...listaComprobantesReserva, ...listaCargosComprobantes];

        const totalComprobantes = Number(comprobantes) + Number(cargosComprobantes);
        return {
            pendientes:      Number(pendientes),
            checkins:        Number(checkins),
            checkouts:       Number(checkouts),
            comprobantes:    totalComprobantes,
            total:           Number(pendientes) + Number(checkins) + Number(checkouts) + totalComprobantes,
            listaPendientes,
            listaCheckins,
            listaCheckouts,
            listaComprobantes
        };
    }

};

module.exports = DashboardService;