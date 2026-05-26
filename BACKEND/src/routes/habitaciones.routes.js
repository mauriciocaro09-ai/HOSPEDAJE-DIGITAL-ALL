const express = require("express");
const router = express.Router();
const habitacionesController = require("../controllers/habitaciones.controller");
const verificarToken = require("../middlewares/auth.middleware");

// Lectura pública (el frontend de landing page la usa sin login)
router.get("/", habitacionesController.getAll);
router.get("/disponibles", habitacionesController.disponibles);
router.get("/buscar", habitacionesController.buscar);
router.get("/:id/disponibilidad", habitacionesController.verificarDisponibilidad);

// Escritura protegida
router.post("/", verificarToken, habitacionesController.create);
router.put("/:id", verificarToken, habitacionesController.update);
router.delete("/:id", verificarToken, habitacionesController.remove);

module.exports = router;
