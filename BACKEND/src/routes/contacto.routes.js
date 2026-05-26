const express = require("express");
const router = express.Router();
const { recibirMensaje } = require("../controllers/contacto.controller");

router.post("/", recibirMensaje);

module.exports = router;
