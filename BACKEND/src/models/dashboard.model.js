const db = require("../config/db");

const Dashboard = {

    totalReservas: async () => {

        const [rows] = await db.query(
            "SELECT COUNT(*) AS total FROM reserva"
        );

        return rows[0];

    },

    ingresosTotales: async () => {

        const [rows] = await db.query(
            "SELECT SUM(Monto_Total) AS ingresos FROM reserva"
        );

        return rows[0];

    },

    reservasHoy: async () => {

        const [rows] = await db.query(
            "SELECT COUNT(*) AS reservasHoy FROM reserva WHERE DATE(FechaReserva) = CURDATE()"
        );

        return rows[0];

    },

    habitacionesDisponibles: async () => {

        const [rows] = await db.query(
            "SELECT COUNT(*) AS disponibles FROM habitacion WHERE Estado = 1"
        );

        return rows[0];

    },

serviciosMasVendidos: async () => {

    const [rows] = await db.query(`
        SELECT 
            s.NombreServicio,
            SUM(drs.Cantidad) AS total
        FROM DetalleReservaServicio drs
        JOIN Servicios s 
            ON drs.IDServicio = s.IDServicio
        GROUP BY s.NombreServicio
        ORDER BY total DESC
        LIMIT 5
    `);

    return rows;

}

};

module.exports = Dashboard;