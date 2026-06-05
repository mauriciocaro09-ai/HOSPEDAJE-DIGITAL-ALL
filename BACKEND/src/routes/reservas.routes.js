const express = require("express");
const router = express.Router();
const reservasController = require("../controllers/reservas.controller");
const verificarToken = require("../middlewares/auth.middleware");

// Todas las rutas de reservas requieren autenticación
router.use(verificarToken);

// Obtener todas las reservas
router.get("/", reservasController.obtenerTodas);

// Obtener estados de reserva disponibles
router.get("/estados", reservasController.obtenerEstados);

// Obtener métodos de pago disponibles
router.get("/metodos-pago", reservasController.obtenerMetodosPago);

// Obtener reservas por estado
router.get("/estado/:idEstado", reservasController.obtenerPorEstado);

// Obtener reservas por cliente
router.get("/cliente/:nroDocumento", reservasController.obtenerPorCliente);

// Obtener reservas por usuario
router.get("/usuario/:idUsuario", reservasController.obtenerPorUsuario);

// Obtener reservas por fechas
router.get("/filtro/fechas", reservasController.obtenerPorFechas);

// Obtener reserva por ID
router.get("/:id", reservasController.obtenerPorId);

// Crear nueva reserva
router.post("/", reservasController.crear);

// Actualizar reserva
router.put("/:id", reservasController.actualizar);

// Cambiar estado de reserva
router.put("/:id/estado", reservasController.actualizarEstado);

// Cancelar reserva (busca el estado "Cancelada" dinámicamente)
router.put("/:id/cancelar", reservasController.cancelar);

// Agregar servicios a reserva existente
router.post("/:id/servicios", reservasController.agregarServicios);

// Eliminar reserva
router.delete("/:id", reservasController.eliminar);

module.exports = router;
