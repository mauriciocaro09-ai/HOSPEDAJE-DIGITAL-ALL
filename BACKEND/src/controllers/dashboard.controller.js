const DashboardService = require("../services/dashboard.service");

const estadisticas = async (req, res) => {

    try {

        const data = await DashboardService.estadisticas();

        res.json(data);

    } catch (error) {

        res.status(500).json({
            error: "Error obteniendo estadísticas",
            detalle: error.message
        });

    }

};

const alertas = async (req, res) => {
    try {
        const data = await DashboardService.alertas();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo alertas", detalle: error.message });
    }
};

module.exports = {
    estadisticas,
    alertas
};