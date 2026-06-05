const CargosService = require('../services/cargos.service');

const CargosController = {

  obtenerPorReserva: async (req, res) => {
    try {
      const data = await CargosService.obtenerPorReserva(req.params.idReserva);
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error obteniendo cargos adicionales' });
    }
  },

  pagar: async (req, res) => {
    try {
      const { IDMetodoPago } = req.body;
      if (!IDMetodoPago) return res.status(400).json({ error: 'Método de pago requerido' });
      await CargosService.pagar(req.params.id, IDMetodoPago);
      res.json({ mensaje: 'Cargo pagado correctamente' });
    } catch (error) {
      if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
      if (error.code === 'ESTADO_INVALIDO') return res.status(400).json({ error: error.message });
      console.error(error);
      res.status(500).json({ error: 'Error procesando pago' });
    }
  },

  cancelar: async (req, res) => {
    try {
      await CargosService.cancelar(req.params.id);
      res.json({ mensaje: 'Cargo cancelado' });
    } catch (error) {
      if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
      if (error.code === 'ESTADO_INVALIDO') return res.status(400).json({ error: error.message });
      console.error(error);
      res.status(500).json({ error: 'Error cancelando cargo' });
    }
  },
};

module.exports = CargosController;
