const express = require("express");
const router = express.Router();
const controller = require("../controllers/usuarios.controller");
const verificarToken = require("../middlewares/auth.middleware");

router.get("/", verificarToken, controller.list);
router.get("/search", verificarToken, controller.search);
router.get("/:id", verificarToken, controller.getById);
router.post("/", verificarToken, controller.create);
router.put("/:id", verificarToken, controller.update);
router.delete("/:id", verificarToken, controller.remove);
router.patch("/:id/status", verificarToken, controller.toggleStatus);

module.exports = router;