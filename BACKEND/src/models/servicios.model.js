const db = require("../config/db");

const normalizarServicio = (s) => {
    if (!s) return s;
    if (s.Imagen && s.Imagen.type === 'Buffer') {
        s.Imagen = Buffer.from(s.Imagen.data).toString('utf-8');
    }
    return s;
};

const Servicios = {

    obtenerTodos: async ({ soloActivos = false } = {}) => {

        const sql = soloActivos
            ? "SELECT * FROM servicio WHERE Estado = 1"
            : "SELECT * FROM servicio";
        const [rows] = await db.query(sql);
        return rows.map(normalizarServicio);

    },

    obtenerPorId: async (id) => {

        const [rows] = await db.query(
            "SELECT * FROM servicio WHERE IDServicio = ?",
            [id]
        );

        return normalizarServicio(rows[0]);

    },

    crear: async (servicio) => {

        const {
            NombreServicio,
            Descripcion,
            Duracion,
            CantidadMaximaPersonas,
            Costo,
            Estado,
            Imagen,
            Horario
        } = servicio;

        const sql = `
            INSERT INTO servicio
            (NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado, Imagen, Horario)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            NombreServicio,
            Descripcion,
            Duracion,
            CantidadMaximaPersonas,
            Costo,
            Estado,
            Imagen || null,
            Horario || null
        ]);

        return result;

    },

    actualizar: async (id, servicio) => {

        const {
            NombreServicio,
            Descripcion,
            Duracion,
            CantidadMaximaPersonas,
            Costo,
            Estado,
            Imagen,
            Horario
        } = servicio;

        const sql = `
            UPDATE servicio
            SET NombreServicio=?, Descripcion=?, Duracion=?, CantidadMaximaPersonas=?, Costo=?, Estado=?, Imagen=?, Horario=?
            WHERE IDServicio=?
        `;

        const [result] = await db.query(sql, [
            NombreServicio,
            Descripcion,
            Duracion,
            CantidadMaximaPersonas,
            Costo,
            Estado,
            Imagen !== undefined ? Imagen : null,
            Horario !== undefined ? Horario : null,
            id
        ]);

        return result;

    },

    eliminar: async (id) => {

        const [result] = await db.query(
            "DELETE FROM servicio WHERE IDServicio=?",
            [id]
        );

        return result;

    },

    toggleEstado: async (id, estado) => {

        const [result] = await db.query(
            "UPDATE servicio SET Estado=? WHERE IDServicio=?",
            [estado, id]
        );

        return result;

    }

};

module.exports = Servicios;