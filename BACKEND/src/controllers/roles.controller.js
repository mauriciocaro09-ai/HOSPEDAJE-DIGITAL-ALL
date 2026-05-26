const db = require("../config/db");

const obtenerPermisosRol = async (rolId) => {
    const [permisos] = await db.query(
        `SELECT p.IDPermiso, p.NombrePermisos, p.EstadoPermisos, p.Descripcion
         FROM rolespermisos rp
         INNER JOIN permisos p ON p.IDPermiso = rp.IDPermiso
         WHERE rp.IDRol = ?
         ORDER BY p.NombrePermisos ASC`,
        [rolId]
    );

    return permisos.map((permiso) => ({
        id: permiso.IDPermiso,
        nombre: permiso.NombrePermisos,
        estado: permiso.EstadoPermisos,
        descripcion: permiso.Descripcion,
    }));
};

const mapRol = async (rol) => {
    if (!rol) return null;

    const permisos = await obtenerPermisosRol(rol.IDRol);
    return {
        ...rol,
        permisos,
    };
};

const actualizarPermisosRol = async (rolId, permisos) => {
    await db.query("DELETE FROM rolespermisos WHERE IDRol = ?", [rolId]);

    const ids = Array.isArray(permisos) ? permisos.map((permiso) => Number(permiso)).filter(Number.isFinite) : [];
    if (!ids.length) return;

    const valores = ids.map((idPermiso) => [rolId, idPermiso]);
    await db.query("INSERT INTO rolespermisos (IDRol, IDPermiso) VALUES ?", [valores]);
};

const obtenerRolBase = async (id) => {
    const [rows] = await db.query("SELECT * FROM roles WHERE IDRol = ? LIMIT 1", [id]);
    return rows[0] || null;
};

const construirLike = (q) => `%${String(q || "").trim()}%`;

exports.list = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();

        let sql = "SELECT * FROM roles";
        const params = [];

        if (q) {
            sql += " WHERE Nombre LIKE ?";
            params.push(construirLike(q));
        }

        sql += " ORDER BY IDRol ASC";

        const [rows] = await db.query(sql, params);
        const roles = await Promise.all(rows.map(async (rol) => mapRol(rol)));
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: "Error al listar roles", detalle: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const rol = await obtenerRolBase(req.params.id);
        if (!rol) {
            return res.status(404).json({ error: "Rol no encontrado" });
        }

        res.json(await mapRol(rol));
    } catch (error) {
        res.status(500).json({ error: "Error al obtener rol", detalle: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { Nombre, Estado, IsActive, Permisos } = req.body;

        if (!Nombre) {
            return res.status(400).json({ error: "El nombre del rol es obligatorio" });
        }

        const [result] = await db.query(
            "INSERT INTO roles (Nombre, Estado, IsActive) VALUES (?, ?, ?)",
            [Nombre, Estado || "Activo", IsActive === false ? 0 : 1]
        );

        await actualizarPermisosRol(result.insertId, Permisos);

        const rol = await obtenerRolBase(result.insertId);
        res.status(201).json({ mensaje: "Rol creado", rol: await mapRol(rol) });
    } catch (error) {
        res.status(500).json({ error: "Error al crear rol", detalle: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const rolId = Number(req.params.id);
        const rolActual = await obtenerRolBase(rolId);

        if (!rolActual) {
            return res.status(404).json({ error: "Rol no encontrado" });
        }

        const campos = [];
        const valores = [];

        if (req.body.Nombre !== undefined && req.body.Nombre !== "") {
            campos.push("Nombre = ?");
            valores.push(req.body.Nombre);
        }

        if (req.body.Estado !== undefined && req.body.Estado !== "") {
            campos.push("Estado = ?");
            valores.push(req.body.Estado);
        }

        if (req.body.IsActive !== undefined && req.body.IsActive !== "") {
            campos.push("IsActive = ?");
            valores.push(req.body.IsActive ? 1 : 0);
        }

        if (campos.length) {
            valores.push(rolId);
            await db.query(`UPDATE roles SET ${campos.join(", ")} WHERE IDRol = ?`, valores);
        }

        if (Array.isArray(req.body.Permisos)) {
            await actualizarPermisosRol(rolId, req.body.Permisos);
        }

        const rol = await obtenerRolBase(rolId);
        res.json({ mensaje: "Rol actualizado", rol: await mapRol(rol) });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar rol", detalle: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const rolId = Number(req.params.id);

        if ([1, 2].includes(rolId)) {
            return res.status(403).json({ error: "No se puede eliminar un rol protegido" });
        }

        await db.query("UPDATE roles SET IsActive = 0, Estado = 'Inactivo' WHERE IDRol = ?", [rolId]);
        res.json({ mensaje: "Rol desactivado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar rol", detalle: error.message });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const rolId = Number(req.params.id);
        const { isActive } = req.body;

        if ([1, 2].includes(rolId)) {
            return res.status(403).json({ error: "No se puede cambiar el estado de un rol protegido" });
        }

        if (typeof isActive !== "boolean") {
            return res.status(400).json({ error: "El campo isActive debe ser booleano" });
        }

        await db.query(
            "UPDATE roles SET IsActive = ?, Estado = ? WHERE IDRol = ?",
            [isActive ? 1 : 0, isActive ? "Activo" : "Inactivo", rolId]
        );

        const rol = await obtenerRolBase(rolId);
        res.json({ mensaje: "Estado del rol actualizado", rol: await mapRol(rol) });
    } catch (error) {
        res.status(500).json({ error: "Error al cambiar estado del rol", detalle: error.message });
    }
};

exports.search = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();

        if (!q) {
            return res.status(400).json({ error: "El término de búsqueda es obligatorio" });
        }

        const [rows] = await db.query(
            "SELECT * FROM roles WHERE Nombre LIKE ? ORDER BY IDRol ASC",
            [construirLike(q)]
        );
        const roles = await Promise.all(rows.map(async (rol) => mapRol(rol)));
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: "Error al buscar roles", detalle: error.message });
    }
};