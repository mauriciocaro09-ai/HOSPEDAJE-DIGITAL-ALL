const db = require("../config/db");
const Habitaciones = require("../models/habitaciones.model");

const HabitacionesService = {

    // 🔎 BUSCAR HABITACIONES (tipo Booking)
    buscar: async (inicio, fin, personas, precioMax) => {

        const [rows] = await db.query(`
            SELECT h.*
            FROM Habitacion h
            WHERE h.Costo <= ?
            AND NOT EXISTS (
                SELECT 1
                FROM Reserva r
                WHERE r.IDHabitacion = h.IDHabitacion
                AND (
                    r.FechaInicio BETWEEN ? AND ?
                    OR r.FechaFinalizacion BETWEEN ? AND ?
                    OR ? BETWEEN r.FechaInicio AND r.FechaFinalizacion
                )
            )
        `, [precioMax, inicio, fin, inicio, fin, inicio]);

        return rows;
    },

    // LISTAR HABITACIONES
    listar: async () => {
        return await Habitaciones.obtenerTodas();
    },

    // OBTENER UNA HABITACIÓN
    obtener: async (id) => {
        return await Habitaciones.obtenerPorId(id);
    },

    // CREAR HABITACIÓN
    crear: async (data) => {
        return await Habitaciones.crear(data);
    },

    // ACTUALIZAR HABITACIÓN
    actualizar: async (id, data) => {
        return await Habitaciones.actualizar(id, data);
    },

    // ELIMINAR HABITACIÓN
    eliminar: async (id) => {
        return await Habitaciones.eliminar(id);
    },

    // 🔎 HABITACIONES DISPONIBLES
    disponibles: async (inicio, fin) => {

        const [rows] = await db.query(`
            SELECT h.*
            FROM Habitacion h
            WHERE NOT EXISTS (
                SELECT 1
                FROM Reserva r
                WHERE r.IDHabitacion = h.IDHabitacion
                AND (
                    r.FechaInicio BETWEEN ? AND ?
                    OR r.FechaFinalizacion BETWEEN ? AND ?
                    OR ? BETWEEN r.FechaInicio AND r.FechaFinalizacion
                )
            )
        `, [inicio, fin, inicio, fin, inicio]);

        return rows;
    }

};

module.exports = HabitacionesService;