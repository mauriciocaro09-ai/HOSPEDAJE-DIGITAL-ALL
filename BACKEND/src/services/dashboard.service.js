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
            SELECT SUM(MontoTotal) AS ingresosTotales
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
                COUNT(d.IDServicio) AS total
            FROM detallereservaservicio d
            JOIN servicio s
            ON d.IDServicio = s.IDServicio
            GROUP BY d.IDServicio
            ORDER BY total DESC
            LIMIT 5
        `);

        return {
            totalReservas: reservas[0].totalReservas,
            ingresosTotales: ingresos[0].ingresosTotales || 0,
            habitacionesMasReservadas: habitaciones,
            serviciosMasVendidos: servicios
        };

    },

    alertas: async () => {
        const hoy = new Date().toISOString().split('T')[0];

        // Solo reservas pendientes desde hoy en adelante (no históricas sin confirmar)
        const [[{ pendientes }]] = await db.query(`
            SELECT COUNT(*) AS pendientes FROM reserva
            WHERE IdEstadoReserva = 1 AND FechaInicio >= CURDATE()
        `);

        // Check-ins hoy: confirmadas Y pendientes (pendiente+hoy es más urgente aún)
        const [[{ checkins }]] = await db.query(`
            SELECT COUNT(*) AS checkins FROM reserva
            WHERE DATE(FechaInicio) = ? AND IdEstadoReserva IN (1, 2)
        `, [hoy]);

        // Check-outs hoy: solo confirmadas (las canceladas/finalizadas no hacen checkout)
        const [[{ checkouts }]] = await db.query(`
            SELECT COUNT(*) AS checkouts FROM reserva
            WHERE DATE(FechaFinalizacion) = ? AND IdEstadoReserva = 2
        `, [hoy]);

        return {
            pendientes: Number(pendientes),
            checkins:   Number(checkins),
            checkouts:  Number(checkouts),
            total:      Number(pendientes) + Number(checkins) + Number(checkouts)
        };
    }

};

module.exports = DashboardService;