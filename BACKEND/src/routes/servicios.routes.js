const express = require("express");
const router = express.Router();
const ServiciosController = require("../controllers/servicios.controller");
const verificarToken = require("../middlewares/auth.middleware");

// Lectura pública (el frontend de landing page la puede usar sin login)
router.get("/", ServiciosController.listar);
router.get("/:id", ServiciosController.obtener);

// Escritura protegida (requiere autenticación)
router.post("/", verificarToken, ServiciosController.crear);
router.put("/:id", verificarToken, ServiciosController.actualizar);
router.delete("/:id", verificarToken, ServiciosController.eliminar);
router.patch("/:id/estado", verificarToken, ServiciosController.toggleEstado);

module.exports = router;