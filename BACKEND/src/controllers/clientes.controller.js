const db = require("../config/db");
const bcrypt = require("bcryptjs");

/* ================= LISTAR CLIENTES ================= */
exports.getAll = async (req, res) => {
  try {
    const { documento } = req.query;

    let sql = "SELECT * FROM cliente";
    let params = [];

    if (documento) {
      sql += " WHERE NroDocumento = ?";
      params = [documento];
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo clientes", detalle: error.message });
  }
};

/* ================= BUSCAR CLIENTE POR DOCUMENTO ================= */
exports.buscarPorDocumento = async (req, res) => {
  try {
    const { documento } = req.query;

    if (!documento) {
      return res.status(400).json({ error: "Documento requerido" });
    }

    const [rows] = await db.query(
      "SELECT * FROM cliente WHERE NroDocumento = ?",
      [documento]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error buscando cliente", detalle: error.message });
  }
};

/* ================= OBTENER CLIENTE POR DOCUMENTO (ID) ================= */
exports.obtenerPorId = async (req, res) => {
  try {
    const id = req.params.id; // aquí id es el NroDocumento según frontend
    const [rows] = await db.query(
      "SELECT * FROM cliente WHERE NroDocumento = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo cliente", detalle: error.message });
  }
};

/* ================= CREAR CLIENTE ================= */
exports.create = async (req, res) => {
  try {
    const { NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol } = req.body;

    const [result] = await db.query(
      `INSERT INTO cliente (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [NroDocumento, Nombre, Apellido, Direccion || null, Email, Telefono || null, Estado || 1, IDRol || 3]
    );

    // Sincronizar con tabla usuarios si no existe ya
    try {
      const [existe] = await db.query(
        'SELECT IDUsuario FROM usuarios WHERE Email = ? OR NumeroDocumento = ? LIMIT 1',
        [Email, NroDocumento]
      );
      if (!existe.length) {
        const hash = await bcrypt.hash(String(NroDocumento), 10);
        await db.query(
          `INSERT INTO usuarios (NombreUsuario, Nombre, Apellido, Email, Contrasena, TipoDocumento, NumeroDocumento, Telefono, Direccion, IDRol, IsActive)
           VALUES (?, ?, ?, ?, ?, 'CC', ?, ?, ?, ?, 1)`,
          [Nombre || NroDocumento, Nombre || null, Apellido || null, Email, hash, NroDocumento, Telefono || null, Direccion || null, 2]
        );
      }
    } catch (syncErr) {
      console.error('Advertencia: no se pudo sincronizar cliente a usuarios:', syncErr.message);
    }

    res.status(201).json({ mensaje: "Cliente creado", data: result });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      return res.status(409).json({ error: 'Ya existe un cliente con ese número de documento. Verifica e intenta con otro.' });
    }
    res.status(500).json({ error: "Error creando cliente", detalle: error.message });
  }
};

/* ================= EDITAR CLIENTE ================= */
exports.update = async (req, res) => {
  try {
    const id = req.params.id; // NroDocumento
    const { Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol } = req.body;

    await db.query(
      `UPDATE cliente
       SET Nombre = ?, Apellido = ?, Direccion = ?, Email = ?, Telefono = ?, Estado = ?, IDRol = ?
       WHERE NroDocumento = ?`,
      [Nombre, Apellido, Direccion || null, Email, Telefono || null, Estado || 1, IDRol || 3, id]
    );

    // Sincronizar cambios a la tabla usuarios
    try {
      await db.query(
        `UPDATE usuarios
         SET Nombre = ?, Apellido = ?, Email = ?, Telefono = ?, Direccion = ?
         WHERE NumeroDocumento = ?`,
        [Nombre || null, Apellido || null, Email, Telefono || null, Direccion || null, id]
      );
    } catch (syncErr) {
      console.error('Advertencia: no se pudo sincronizar cliente a usuarios:', syncErr.message);
    }

    res.json({ mensaje: "Cliente actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando cliente", detalle: error.message });
  }
};

/* ================= ELIMINAR CLIENTE ================= */
exports.remove = async (req, res) => {
  try {
    const id = req.params.id; // NroDocumento
    await db.query("DELETE FROM cliente WHERE NroDocumento = ?", [id]);
    res.json({ mensaje: "Cliente eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando cliente", detalle: error.message });
  }
};
