const db = require("../config/db");

/* ================= LISTAR TODAS ================= */

const getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM habitacion");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo habitaciones", detalle: error.message });
  }
};

/* ================= DISPONIBLES ================= */

const disponibles = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM habitacion WHERE Estado = 1");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo habitaciones disponibles", detalle: error.message });
  }
};

/* ================= BUSCAR ================= */

const buscar = async (req, res) => {
  try {
    const q = (req.query.q || req.query.query || "").toString().trim();

    if (!q) {
      return res.status(400).json({ error: "Parámetro de búsqueda 'q' requerido" });
    }

    const like = `%${q}%`;
    const [rows] = await db.query(
      "SELECT * FROM habitacion WHERE NombreHabitacion LIKE ? OR Descripcion LIKE ?",
      [like, like]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: "Error buscando habitaciones", detalle: error.message });
  }
};

/* ================= CREAR ================= */

const create = async (req, res) => {
  try {
    const {
      NombreHabitacion, Descripcion, Costo, Estado, ImagenHabitacion,
      nombre, descripcion, precio, estado, imagen
    } = req.body;

    const nombreFinal  = NombreHabitacion  ?? nombre;
    const descFinal    = Descripcion       ?? descripcion;
    const costoFinal   = Costo             ?? precio;
    const estadoFinal  = Estado            ?? estado ?? 1;
    const imagenFinal  = ImagenHabitacion  ?? imagen ?? null;

    await db.query(
      `INSERT INTO habitacion (NombreHabitacion, Descripcion, Costo, Estado, ImagenHabitacion) VALUES (?, ?, ?, ?, ?)`,
      [nombreFinal, descFinal, costoFinal, estadoFinal, imagenFinal]
    );

    res.status(201).json({ mensaje: "Habitación creada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error creando habitación", detalle: error.message });
  }
};

/* ================= ACTUALIZAR ================= */

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      NombreHabitacion, Descripcion, Costo, Estado, ImagenHabitacion,
      nombre, descripcion, precio, estado, imagen
    } = req.body;

    const nombreFinal  = NombreHabitacion  ?? nombre;
    const descFinal    = Descripcion       ?? descripcion;
    const costoFinal   = Costo             ?? precio;
    const estadoFinal  = Estado            ?? estado;
    const imagenFinal  = ImagenHabitacion  ?? imagen ?? null;

    await db.query(
      `UPDATE habitacion SET NombreHabitacion = ?, Descripcion = ?, Costo = ?, Estado = ?, ImagenHabitacion = ? WHERE IDHabitacion = ?`,
      [nombreFinal, descFinal, costoFinal, estadoFinal, imagenFinal, id]
    );

    res.json({ mensaje: "Habitación actualizada con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando habitación", detalle: error.message });
  }
};

/* ================= ELIMINAR ================= */

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM habitacion WHERE IDHabitacion = ?", [id]);
    res.json({ mensaje: "Habitación eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando habitación", detalle: error.message });
  }
};

/* ================= VERIFICAR DISPONIBILIDAD ================= */

const verificarDisponibilidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Parámetros 'fechaInicio' y 'fechaFin' requeridos" });
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM reserva r
       JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
       WHERE r.IDHabitacion = ?
         AND LOWER(e.NombreEstadoReserva) NOT IN ('cancelada', 'completada')
         AND r.FechaInicio < ?
         AND r.FechaFinalizacion > ?`,
      [id, fechaFin, fechaInicio]
    );

    res.json({ disponible: Number(total) === 0 });
  } catch (error) {
    res.status(500).json({ error: "Error verificando disponibilidad", detalle: error.message });
  }
};

module.exports = { getAll, disponibles, buscar, create, update, remove, verificarDisponibilidad };
