const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const verificarToken = require("../middlewares/auth.middleware");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/cliente-set-password", authController.clienteSetPassword);
router.get("/me", verificarToken, authController.perfil);
router.put("/me", verificarToken, authController.actualizarPerfil);
router.post("/change-password", verificarToken, authController.cambiarContrasena);

module.exports = router;