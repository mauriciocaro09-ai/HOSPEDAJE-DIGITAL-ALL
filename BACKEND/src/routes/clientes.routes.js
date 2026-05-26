const express = require("express");
const router = express.Router();
const clientesController = require("../controllers/clientes.controller");
const verificarToken = require("../middlewares/auth.middleware");

router.use(verificarToken);

// 1. OBTENER CLIENTES (GET)
router.get("/", clientesController.getAll);

// 2. BUSCAR CLIENTE POR DOCUMENTO (GET)
router.get("/buscar", clientesController.buscarPorDocumento);

// 3. OBTENER CLIENTE POR ID (GET)
router.get("/:id", clientesController.obtenerPorId);

// 4. CREAR UN NUEVO CLIENTE (POST)
router.post("/", clientesController.create);

// 5. ELIMINAR CLIENTE (DELETE)
router.delete("/:id", clientesController.remove);

// 6. ACTUALIZAR CLIENTE (PUT)
router.put("/:id", clientesController.update);

module.exports = router;
