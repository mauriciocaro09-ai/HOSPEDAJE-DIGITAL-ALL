const CargosService = require('../services/cargos.service');

const CargosController = {

  crear: async (req, res) => {
    try {
      const { servicios } = req.body;
      if (!servicios || !servicios.length) return res.status(400).json({ error: 'Servicios requeridos' });
      const cargos = await CargosService.crear(req.params.idReserva, servicios);
      res.json(cargos);
    } catch (error) {
      if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
      if (error.code === 'ESTADO_INVALIDO') return res.status(400).json({ error: error.message });
      console.error(error);
      res.status(500).json({ error: 'Error creando cargo adicional' });
    }
  },

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
      const { IDMetodoPago, ComprobanteTransferencia } = req.body;
      if (!IDMetodoPago) return res.status(400).json({ error: 'Método de pago requerido' });
      const result = await CargosService.pagar(req.params.id, IDMetodoPago, ComprobanteTransferencia || null);
      const mensaje = result.esTransferencia
        ? 'Comprobante recibido. Pendiente de aprobación por el administrador.'
        : 'Cargo pagado correctamente';
      res.json({ mensaje });
    } catch (error) {
      if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
      if (error.code === 'ESTADO_INVALIDO') return res.status(400).json({ error: error.message });
      console.error(error);
      res.status(500).json({ error: 'Error procesando pago' });
    }
  },

  pagarLote: async (req, res) => {
    try {
      const { IDMetodoPago, ComprobanteTransferencia } = req.body;
      if (!IDMetodoPago) return res.status(400).json({ error: 'Método de pago requerido' });
      const result = await CargosService.pagarLote(req.params.idReserva, IDMetodoPago, ComprobanteTransferencia || null);
      const mensaje = result.esTransferencia
        ? `Comprobante recibido para ${result.cantidad} cargo(s). Pendiente de aprobación.`
        : `${result.cantidad} cargo(s) pagado(s) correctamente.`;
      res.json({ mensaje });
    } catch (error) {
      if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
      console.error(error);
      res.status(500).json({ error: 'Error procesando pagos' });
    }
  },

  aprobar: async (req, res) => {
    try {
      await CargosService.aprobar(req.params.id);
      res.json({ mensaje: 'Cargo aprobado y marcado como pagado' });
    } catch (error) {
      if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
      console.error(error);
      res.status(500).json({ error: 'Error aprobando cargo' });
    }
  },

  rechazar: async (req, res) => {
    try {
      await CargosService.rechazar(req.params.id);
      res.json({ mensaje: 'Comprobante rechazado. El cargo vuelve a pendiente de pago.' });
    } catch (error) {
      if (error.code === 'NOT_FOUND') return res.status(404).json({ error: error.message });
      console.error(error);
      res.status(500).json({ error: 'Error rechazando cargo' });
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
