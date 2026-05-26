const db = require("../config/db");
const Paquetes = require("../models/paquetes.model");

const PaquetesService = {

    // Listar paquetes. soloActivos=true para vista pública, false para admin
    listar: async (soloActivos = true) => {
        return await Paquetes.obtenerTodos(soloActivos);
    },

    // Obtener un paquete con todos sus servicios
    obtener: async (id) => {
        return await Paquetes.obtenerConServicios(id);
    },

    // Crear paquete
    crear: async (data) => {
        return await Paquetes.crear(data);
    },

    // Actualizar paquete
    actualizar: async (id, data) => {
        return await Paquetes.actualizar(id, data);
    },

    // Eliminar paquete (solo cambia Estado, no toca otros campos)
    eliminar: async (id) => {
        return await Paquetes.inactivar(id);
    },

    // Agregar servicio a paquete
    agregarServicio: async (idPaquete, idServicio, cantidad = 1, precioServicio = null) => {
        return await Paquetes.agregarServicio(idPaquete, idServicio, cantidad, precioServicio);
    },

    // Eliminar servicio de paquete
    eliminarServicio: async (idPaqueteServicio) => {
        return await Paquetes.eliminarServicio(idPaqueteServicio);
    },

    // Obtener servicios de un paquete
    obtenerServicios: async (idPaquete) => {
        return await Paquetes.obtenerServicios(idPaquete);
    },

    // Buscar paquetes por criterios
    buscar: async (termino) => {
        const [rows] = await db.query(`
            SELECT * FROM paquete 
            WHERE Estado = 1 AND (
                NombrePaquete LIKE ? OR 
                Descripcion LIKE ?
            )
        `, [`%${termino}%`, `%${termino}%`]);
        return rows;
    },

    // Obtener paquetes por rango de precio
    obtenerPorRangoPrecios: async (precioMin, precioMax) => {
        const [rows] = await db.query(`
            SELECT * FROM paquete 
            WHERE Estado = 1 AND 
            PrecioPaquete BETWEEN ? AND ?
            ORDER BY PrecioPaquete ASC
        `, [precioMin, precioMax]);
        return rows;
    },

    // Obtener paquetes con estadísticas
    obtenerConEstadisticas: async (idPaquete) => {
        const paquete = await Paquetes.obtenerConServicios(idPaquete);
        
        if (!paquete) return null;

        // Calcular costo total de servicios
        const [estadisticas] = await db.query(`
            SELECT 
                COUNT(*) as totalServicios,
                COALESCE(SUM(ps.Cantidad), 0) as totalCantidadServicios
            FROM paquete_servicios ps
            WHERE ps.IDPaquete = ?
        `, [idPaquete]);

        return {
            ...paquete,
            estadisticas: estadisticas[0]
        };
    }

};

module.exports = PaquetesService;
