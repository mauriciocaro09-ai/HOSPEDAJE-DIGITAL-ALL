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

        return {
            pendientes:      Number(pendientes),
            checkins:        Number(checkins),
            checkouts:       Number(checkouts),
            total:           Number(pendientes) + Number(checkins) + Number(checkouts),
            listaPendientes,
            listaCheckins,
            listaCheckouts
        };
    }

};

module.exports = DashboardService;