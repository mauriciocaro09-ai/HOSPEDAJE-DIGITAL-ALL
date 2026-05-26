const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Inicializar WhatsApp al arrancar el servidor (muestra QR en consola)
require("./services/whatsapp.service");

const app = express();
const frontendAppPath = path.join(__dirname, "..", "..", "mi-proyecto-frontend");

// =============================
// MIDDLEWARES
// =============================
// CORS:
//   - Desarrollo: acepta los orígenes locales más comunes (Live Server, mismo servidor)
//   - Producción: solo acepta el origen definido en CORS_ORIGIN del .env
const originesDesarrollo = [
  "http://localhost:3000",   // el mismo servidor backend sirve el frontend
  "http://localhost:5500",   // Live Server de VS Code (localhost)
  "http://127.0.0.1:5500",  // Live Server de VS Code (127.0.0.1)
  "http://localhost:5501",   // puerto alternativo de Live Server
  "http://127.0.0.1:5501",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Peticiones sin origen (Postman, curl, mismo servidor) siempre permitidas
    if (!origin) return callback(null, true);

    const enDesarrollo = process.env.NODE_ENV !== "production";
    if (enDesarrollo && originesDesarrollo.includes(origin)) {
      return callback(null, true);
    }

    // En producción (o si no está en la lista dev) verificar CORS_ORIGIN del .env
    const origenProduccion = process.env.CORS_ORIGIN;
    if (origenProduccion && origin === origenProduccion) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origen no permitido → ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use("/img", express.static(path.join(__dirname, "public", "img")));
app.use("/img/paquetes", express.static(path.join(__dirname, "public", "img", "paquetes")));
app.use("/app", express.static(frontendAppPath));

app.get("/app", (req, res) => {
  res.sendFile(path.join(frontendAppPath, "index.html"));
});

// =============================
// RUTAS
// =============================
const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const habitacionesRoutes = require("./routes/habitaciones.routes");
const clientesRoutes = require("./routes/clientes.routes");
const serviciosRoutes = require("./routes/servicios.routes");
const paquetesRoutes = require("./routes/paquetes.routes");
const reservasRoutes = require("./routes/reservas.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const rolesRoutes = require("./routes/roles.routes");
const permisosRoutes = require("./routes/permisos.routes");
const contactoRoutes = require("./routes/contacto.routes");

const verificarToken = require("./middlewares/auth.middleware");

app.use("/api/auth", authRoutes);
// La ruta /alertas no requiere token (solo devuelve conteos, no datos sensibles)
const dashboardController = require("./controllers/dashboard.controller");
app.get("/api/dashboard/alertas", dashboardController.alertas);
app.use("/api/dashboard", verificarToken, dashboardRoutes);
app.use("/api/habitaciones", habitacionesRoutes);
app.use("/api/clientes", verificarToken, clientesRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/paquetes", paquetesRoutes);
app.use("/api/reservas", verificarToken, reservasRoutes);
app.use("/api/usuarios", verificarToken, usuariosRoutes);
app.use("/api/roles", verificarToken, rolesRoutes);
app.use("/api/permisos", verificarToken, permisosRoutes);
app.use("/api/contacto", contactoRoutes);

// =============================
// MANEJO DE ERRORES
// =============================
app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
    console.error("Error no manejado:", err);
    res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;
