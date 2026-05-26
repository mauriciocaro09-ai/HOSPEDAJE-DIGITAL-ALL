const db = require("../config/db");

const crearTablaContacto = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS consultas_contacto (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      mensaje TEXT NOT NULL,
      fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

crearTablaContacto().catch(() => {});

const recibirMensaje = async (req, res) => {
  try {
    const { nombre, email, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: "nombre, email y mensaje son requeridos" });
    }

    await db.query(
      "INSERT INTO consultas_contacto (nombre, email, mensaje) VALUES (?, ?, ?)",
      [nombre.trim(), email.trim(), mensaje.trim()]
    );

    res.status(201).json({ mensaje: "Consulta recibida. Te responderemos pronto." });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar el mensaje", detalle: error.message });
  }
};

module.exports = { recibirMensaje };
