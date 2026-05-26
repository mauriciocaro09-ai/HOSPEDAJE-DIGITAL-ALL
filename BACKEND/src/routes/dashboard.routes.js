const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");

router.get("/estadisticas", dashboardController.estadisticas);
router.get("/alertas", dashboardController.alertas);

module.exports = router;