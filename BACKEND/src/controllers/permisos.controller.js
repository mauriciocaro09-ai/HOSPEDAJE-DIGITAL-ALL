const db = require("../config/db");

const obtenerPermisoBase = async (id) => {
    const [rows] = await db.query("SELECT * FROM permisos WHERE IDPermiso = ? LIMIT 1", [id]);
    return rows[0] || null;
};

const construirLike = (q) => `%${String(q || "").trim()}%`;

exports.list = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();
        let sql = "SELECT * FROM permisos";
        const params = [];

        if (q) {
            sql += " WHERE NombrePermisos LIKE ? OR Descripcion LIKE ?";
            const like = construirLike(q);
            params.push(like, like);
        }

        sql += " ORDER BY IDPermiso ASC";

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al listar permisos", detalle: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const permiso = await obtenerPermisoBase(req.params.id);
        if (!permiso) {
            return res.status(404).json({ error: "Permiso no encontrado" });
        }

        res.json(permiso);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener permiso", detalle: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { NombrePermisos, EstadoPermisos, Descripcion } = req.body;

        if (!NombrePermisos) {
            return res.status(400).json({ error: "El nombre del permiso es obligatorio" });
        }

        const [result] = await db.query(
            "INSERT INTO permisos (NombrePermisos, EstadoPermisos, Descripcion) VALUES (?, ?, ?)",
            [NombrePermisos, EstadoPermisos || "Activo", Descripcion || null]
        );

        const permiso = await obtenerPermisoBase(result.insertId);
        res.status(201).json({ mensaje: "Permiso creado", permiso });
    } catch (error) {
        res.status(500).json({ error: "Error al crear permiso", detalle: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const permisoId = Number(req.params.id);
        const permisoActual = await obtenerPermisoBase(permisoId);

        if (!permisoActual) {
            return res.status(404).json({ error: "Permiso no encontrado" });
        }

        const campos = [];
        const valores = [];

        if (req.body.NombrePermisos !== undefined && req.body.NombrePermisos !== "") {
            campos.push("NombrePermisos = ?");
            valores.push(req.body.NombrePermisos);
        }

        if (req.body.EstadoPermisos !== undefined && req.body.EstadoPermisos !== "") {
            campos.push("EstadoPermisos = ?");
            valores.push(req.body.EstadoPermisos);
        }

        if (req.body.Descripcion !== undefined) {
            campos.push("Descripcion = ?");
            valores.push(req.body.Descripcion || null);
        }

        if (!campos.length) {
            return res.status(400).json({ error: "No hay datos para actualizar" });
        }

        valores.push(permisoId);
        await db.query(`UPDATE permisos SET ${campos.join(", ")} WHERE IDPermiso = ?`, valores);

        const permiso = await obtenerPermisoBase(permisoId);
        res.json({ mensaje: "Permiso actualizado", permiso });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar permiso", detalle: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const permisoId = Number(req.params.id);

        await db.query("DELETE FROM rolespermisos WHERE IDPermiso = ?", [permisoId]);
        await db.query("UPDATE permisos SET EstadoPermisos = 'Inactivo' WHERE IDPermiso = ?", [permisoId]);

        res.json({ mensaje: "Permiso desactivado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar permiso", detalle: error.message });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const permisoId = Number(req.params.id);
        const { isActive } = req.body;

        if (typeof isActive !== "boolean") {
            return res.status(400).json({ error: "El campo isActive debe ser booleano" });
        }

        await db.query(
            "UPDATE permisos SET EstadoPermisos = ? WHERE IDPermiso = ?",
            [isActive ? "Activo" : "Inactivo", permisoId]
        );

        const permiso = await obtenerPermisoBase(permisoId);
        res.json({ mensaje: "Estado del permiso actualizado", permiso });
    } catch (error) {
        res.status(500).json({ error: "Error al cambiar estado del permiso", detalle: error.message });
    }
};

exports.search = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();

        if (!q) {
            return res.status(400).json({ error: "El término de búsqueda es obligatorio" });
        }

        const like = construirLike(q);
        const [rows] = await db.query(
            "SELECT * FROM permisos WHERE NombrePermisos LIKE ? OR Descripcion LIKE ? ORDER BY IDPermiso ASC",
            [like, like]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al buscar permisos", detalle: error.message });
    }
};