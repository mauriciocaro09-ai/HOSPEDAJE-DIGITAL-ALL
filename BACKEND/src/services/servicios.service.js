const Servicios = require("../models/servicios.model");
const db = require("../config/db");

const ServiciosService = {

    listar: async ({ soloActivos = false } = {}) => {
        return await Servicios.obtenerTodos({ soloActivos });
    },

    obtener: async (id) => {
        return await Servicios.obtenerPorId(id);
    },

    crear: async (data) => {
        return await Servicios.crear(data);
    },

    actualizar: async (id, data) => {
        return await Servicios.actualizar(id, data);
    },

    eliminar: async (id) => {
        // Verificar si el servicio está asociado a algún paquete
        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM paquete_servicios WHERE IDServicio = ?`,
            [id]
        );
        if (total > 0) {
            const error = new Error(`No se puede eliminar: el servicio está asociado a ${total} paquete${total > 1 ? 's' : ''}.`);
            error.code = 'SERVICIO_EN_USO';
            throw error;
        }
        return await Servicios.eliminar(id);
    },

    toggleEstado: async (id, estado) => {
        return await Servicios.toggleEstado(id, estado);
    }

};

module.exports = ServiciosService;