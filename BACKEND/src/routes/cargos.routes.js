const express = require('express');
const router = express.Router();
const CargosController = require('../controllers/cargos.controller');
const verificarToken = require('../middlewares/auth.middleware');

router.use(verificarToken);

router.post('/reserva/:idReserva', CargosController.crear);
router.get('/reserva/:idReserva', CargosController.obtenerPorReserva);
router.put('/reserva/:idReserva/pagar-lote', CargosController.pagarLote);
router.put('/reserva/:idReserva/aprobar-lote', CargosController.aprobarLote);
router.put('/reserva/:idReserva/rechazar-lote', CargosController.rechazarLote);
router.put('/:id/pagar', CargosController.pagar);
router.put('/:id/aprobar', CargosController.aprobar);
router.put('/:id/rechazar', CargosController.rechazar);
router.delete('/:id', CargosController.cancelar);

module.exports = router;
