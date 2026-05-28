const db = require("../config/db");
const bcrypt = require('bcryptjs');

const mapUsuario = (usuario) => {
    if (!usuario) return null;
    return {
        ...usuario,
        rol: usuario.IDRol ? {
            id: usuario.IDRol,
            nombre: usuario.NombreRol || null,
            estado: usuario.EstadoRol || null,
            activo: usuario.RolActivo ?? null,
        } : null,
    };
};

const obtenerUsuarioBase = async (id) => {
    const [rows] = await db.query(
        `SELECT u.*, r.Nombre AS NombreRol, r.Estado AS EstadoRol, r.IsActive AS RolActivo
         FROM usuarios u
         LEFT JOIN roles r ON r.IDRol = u.IDRol
         WHERE u.IDUsuario = ?
         LIMIT 1`,
        [id]
    );
    return rows[0] || null;
};

const construirFiltroBusqueda = (q) => `%${String(q || "").trim()}%`;

exports.list = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();
        let sql = `
            SELECT u.*, r.Nombre AS NombreRol, r.Estado AS EstadoRol, r.IsActive AS RolActivo
            FROM usuarios u
            LEFT JOIN roles r ON r.IDRol = u.IDRol
        `;
        const params = [];
        if (q) {
            sql += `
                WHERE u.NombreUsuario LIKE ?
                   OR u.Apellido LIKE ?
                   OR u.Email LIKE ?
                   OR u.NumeroDocumento LIKE ?
            `;
            const like = construirFiltroBusqueda(q);
            params.push(like, like, like, like);
        }
        sql += " ORDER BY u.IDUsuario DESC";
        const [rows] = await db.query(sql, params);
        res.json(rows.map(mapUsuario));
    } catch (error) {
        res.status(500).json({ error: "Error al listar usuarios", detalle: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const usuario = await obtenerUsuarioBase(req.params.id);
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(mapUsuario(usuario));
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuario", detalle: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const {
            NombreUsuario,
            Apellido,
            Email,
            Contrasena,
            TipoDocumento,
            NumeroDocumento,
            Telefono,
            Pais,
            Direccion,
            IDRol,
            IsActive,
        } = req.body;

        if (!NombreUsuario || !Email || !Contrasena) {
            return res.status(400).json({ error: "NombreUsuario, Email y Contrasena son obligatorios" });
        }

        const contrasenaHash = await bcrypt.hash(String(Contrasena), 10);

        const [result] = await db.query(
            `INSERT INTO usuarios
                (NombreUsuario, Apellido, Email, Contrasena, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, IsActive)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                NombreUsuario,
                Apellido || null,
                Email,
                contrasenaHash,
                TipoDocumento || '',
                NumeroDocumento || null,
                Telefono || null,
                Pais || null,
                Direccion || null,
                IDRol || 2,
                IsActive === false ? 0 : 1,
            ]
        );

        // Sincronizar con tabla cliente si hay numero de documento y no existe ya
        if (NumeroDocumento) {
            try {
                const nroStr = String(NumeroDocumento);
                const [[existente]] = await db.query(
                    'SELECT NroDocumento FROM cliente WHERE NroDocumento = ? OR Email = ? LIMIT 1',
                    [nroStr, Email]
                );
                if (!existente) {
                    await db.query(
                        `INSERT INTO cliente (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Password, Estado, IDRol)
                         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
                        [nroStr, NombreUsuario || null, Apellido || null, Direccion || null, Email, Telefono || null, IsActive === false ? 0 : 1, IDRol || 2]
                    );
                }
            } catch (syncErr) {
                console.error('Advertencia: no se pudo sincronizar usuario a cliente:', syncErr.message);
            }
        }

        const usuario = await obtenerUsuarioBase(result.insertId);
        res.status(201).json({ mensaje: "Usuario creado", usuario: mapUsuario(usuario) });
    } catch (error) {
        console.error('ERROR al crear usuario:', error.message, '| Code:', error.code);
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(409).json({ error: 'Ya existe un usuario con ese email o numero de documento.' });
        }
        res.status(500).json({ error: "Error al crear usuario", detalle: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const usuarioId = Number(req.params.id);
        if (usuarioId === 1) {
            return res.status(403).json({ error: "No se puede modificar al Super Usuario" });
        }
        const camposPermitidos = [
            "NombreUsuario", "Apellido", "Email", "Contrasena",
            "TipoDocumento", "NumeroDocumento", "Telefono",
            "Pais", "Direccion", "IDRol", "IsActive",
        ];
        const asignaciones = [];
        const valores = [];
        camposPermitidos.forEach((campo) => {
            if (req.body[campo] !== undefined && req.body[campo] !== null && req.body[campo] !== "") {
                asignaciones.push(`${campo} = ?`);
                valores.push(req.body[campo]);
            }
        });
        if (!asignaciones.length) {
            return res.status(400).json({ error: "No hay datos para actualizar" });
        }
        valores.push(usuarioId);
        await db.query(`UPDATE usuarios SET ${asignaciones.join(", ")} WHERE IDUsuario = ?`, valores);
        const usuario = await obtenerUsuarioBase(usuarioId);
        res.json({ mensaje: "Usuario actualizado", usuario: mapUsuario(usuario) });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar usuario", detalle: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const usuarioId = Number(req.params.id);
        if (usuarioId === 1) {
            return res.status(403).json({ error: "No se puede eliminar al Super Usuario" });
        }
        await db.query("DELETE FROM usuarios WHERE IDUsuario = ?", [usuarioId]);
        res.json({ mensaje: "Usuario eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar usuario", detalle: error.message });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const usuarioId = Number(req.params.id);
        const { isActive } = req.body;
        if (usuarioId === 1) {
            return res.status(403).json({ error: "No se puede cambiar el estado del Super Usuario" });
        }
        if (typeof isActive !== "boolean") {
            return res.status(400).json({ error: "El campo isActive debe ser booleano" });
        }
        await db.query("UPDATE usuarios SET IsActive = ? WHERE IDUsuario = ?", [isActive ? 1 : 0, usuarioId]);
        const usuario = await obtenerUsuarioBase(usuarioId);
        res.json({ mensaje: "Estado actualizado", usuario: mapUsuario(usuario) });
    } catch (error) {
        res.status(500).json({ error: "Error al cambiar estado del usuario", detalle: error.message });
    }
};

exports.search = async (req, res) => {
    try {
        const q = String(req.query.q || "").trim();
        if (!q) {
            return res.status(400).json({ error: "El termino de busqueda es obligatorio" });
        }
        const like = construirFiltroBusqueda(q);
        const [rows] = await db.query(
            `SELECT u.*, r.Nombre AS NombreRol, r.Estado AS EstadoRol, r.IsActive AS RolActivo
             FROM usuarios u
             LEFT JOIN roles r ON r.IDRol = u.IDRol
             WHERE u.NombreUsuario LIKE ?
                OR u.Apellido LIKE ?
                OR u.Email LIKE ?
                OR u.NumeroDocumento LIKE ?
             ORDER BY u.IDUsuario DESC`,
            [like, like, like, like]
        );
        res.json(rows.map(mapUsuario));
    } catch (error) {
        res.status(500).json({ error: "Error al buscar usuarios", detalle: error.message });
    }
};
