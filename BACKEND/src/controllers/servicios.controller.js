const ServiciosService = require("../services/servicios.service");

const ServiciosController = {

    listar: async (req, res) => {

        try {

            const soloActivos = req.query.soloActivos === 'true';
            const data = await ServiciosService.listar({ soloActivos });

            res.json(data);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: "Error obteniendo servicios"
            });

        }

    },

    obtener: async (req, res) => {

        try {

            const data = await ServiciosService.obtener(req.params.id);

            res.json(data);

        } catch (error) {

            res.status(500).json({
                error: "Error obteniendo servicio"
            });

        }

    },

crear: async (req, res) => {

    try {

        console.log("BODY:", req.body);

        const data = await ServiciosService.crear(req.body);

        res.status(201).json({
            mensaje: "Servicio creado correctamente",
            data
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error creando servicio",
            detalle: error.message
        });

    }

},

    actualizar: async (req, res) => {

        try {

            const data = await ServiciosService.actualizar(
                req.params.id,
                req.body
            );

            res.json({
                mensaje: "Servicio actualizado",
                data
            });

        } catch (error) {

            res.status(500).json({
                error: "Error actualizando servicio"
            });

        }

    },

    eliminar: async (req, res) => {

        try {

            const data = await ServiciosService.eliminar(req.params.id);

            res.json({
                mensaje: "Servicio eliminado",
                data
            });

        } catch (error) {

            if (error.code === 'SERVICIO_EN_USO') {
                return res.status(409).json({ error: error.message });
            }

            res.status(500).json({
                error: "Error eliminando servicio"
            });

        }

    },

    toggleEstado: async (req, res) => {

        try {

            const { Estado } = req.body;

            if (Estado === undefined || Estado === null) {
                return res.status(400).json({ error: "Campo Estado es requerido" });
            }

            await ServiciosService.toggleEstado(req.params.id, Estado);

            res.json({ mensaje: "Estado del servicio actualizado", Estado });

        } catch (error) {

            res.status(500).json({ error: "Error actualizando estado del servicio" });

        }

    }

};

module.exports = ServiciosController;