const express = require('express');
const router = express.Router();
const CargosController = require('../controllers/cargos.controller');
const verificarToken = require('../middlewares/auth.middleware');

router.use(verificarToken);

router.get('/reserva/:idReserva', CargosController.obtenerPorReserva);
router.put('/:id/pagar', CargosController.pagar);
router.delete('/:id', CargosController.cancelar);

module.exports = router;
