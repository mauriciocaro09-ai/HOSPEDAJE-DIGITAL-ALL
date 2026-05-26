const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const paquetesController = require("../controllers/paquetes.controller");
const verificarToken = require("../middlewares/auth.middleware");

const storage = multer.diskStorage({
    destination: path.join(__dirname, "../public/img/paquetes"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `paquete_${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const permitidos = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, permitidos.includes(ext));
    }
});

// ── Lectura pública (landing page sin login) ──────────────────────────────────
router.get("/", paquetesController.getAll);
router.get("/buscar", paquetesController.buscar);
router.get("/:id", paquetesController.getById);
router.get("/:id/servicios", paquetesController.obtenerServicios);

// ── Escritura protegida (requiere autenticación) ──────────────────────────────
// Subir imagen de paquete
router.post("/upload-imagen", verificarToken, upload.single("imagen"), paquetesController.uploadImagen);

// Crear paquete
router.post("/", verificarToken, paquetesController.create);

// Actualizar paquete
router.put("/:id", verificarToken, paquetesController.update);

// Eliminar servicio de paquete (debe ir ANTES de /:id para no ser capturada por ese patrón)
router.delete("/servicios/:idPaqueteServicio", verificarToken, paquetesController.eliminarServicio);

// Agregar servicio a paquete
router.post("/:id/servicios", verificarToken, paquetesController.agregarServicio);

// Eliminar paquete
router.delete("/:id", verificarToken, paquetesController.remove);

module.exports = router;
