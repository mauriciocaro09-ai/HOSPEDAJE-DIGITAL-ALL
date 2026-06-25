const db = require("../config/db");

const normalizarPaquete = (p) => {
    if (!p) return p;
    if (p.Imagen && p.Imagen.type === 'Buffer') {
        p.Imagen = Buffer.from(p.Imagen.data).toString('utf-8');
    }
    return p;
};

const Paquetes = {

    obtenerTodos: async (soloActivos = true) => {
        const where = soloActivos ? "WHERE p.Estado = 1" : "";
        const sql = `
            SELECT p.*, h.NombreHabitacion, h.Costo AS CostoHabitacion, h.ImagenHabitacion
            FROM paquete p
            LEFT JOIN habitacion h ON p.IDHabitacion = h.IDHabitacion
            ${where}
            ORDER BY p.IDPaquete
        `;
        const [rows] = await db.query(sql);
        return rows.map(normalizarPaquete);
    },

    obtenerPorId: async (id) => {
        const [rows] = await db.query(`
            SELECT p.*, h.NombreHabitacion, h.Costo AS CostoHabitacion, h.ImagenHabitacion
            FROM paquete p
            LEFT JOIN habitacion h ON p.IDHabitacion = h.IDHabitacion
            WHERE p.IDPaquete = ?
        `, [id]);
        return normalizarPaquete(rows[0]);
    },

    obtenerConServicios: async (id) => {
        const [paquete] = await db.query(`
            SELECT p.*, h.NombreHabitacion, h.Costo AS CostoHabitacion, h.ImagenHabitacion
            FROM paquete p
            LEFT JOIN habitacion h ON p.IDHabitacion = h.IDHabitacion
            WHERE p.IDPaquete = ?
        `, [id]);

        if (paquete.length === 0) return null;

        const [servicios] = await db.query(`
            SELECT
                ps.IDPaqueteServicio,
                ps.IDServicio,
                ps.Cantidad,
                ps.PrecioServicio,
                s.NombreServicio,
                s.Descripcion,
                s.Duracion,
                s.CantidadMaximaPersonas,
                s.Costo,
                s.Estado
            FROM paquete_servicios ps
            JOIN servicio s ON ps.IDServicio = s.IDServicio
            WHERE ps.IDPaquete = ?
        `, [id]);

        return {
            ...normalizarPaquete(paquete[0]),
            servicios
        };
    },

    crear: async (paquete) => {
        const {
            NombrePaquete,
            Descripcion,
            PrecioPaquete,
            DuracionNoches,
            IDHabitacion,
            Imagen,
            Estado
        } = paquete;

        const sql = `
            INSERT INTO paquete
            (NombrePaquete, Descripcion, PrecioPaquete, DuracionNoches, IDHabitacion, IncluirHabitacion, Imagen, Estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            NombrePaquete,
            Descripcion,
            PrecioPaquete,
            DuracionNoches || 1,
            IDHabitacion || null,
            IDHabitacion ? 1 : 0,
            Imagen || null,
            Estado !== undefined ? Estado : 1
        ]);

        return result;
    },

    actualizar: async (id, paquete) => {
        const {
            NombrePaquete,
            Descripcion,
            PrecioPaquete,
            DuracionNoches,
            IDHabitacion,
            Imagen,
            Estado
        } = paquete;

        const sql = `
            UPDATE paquete
            SET NombrePaquete=?, Descripcion=?, PrecioPaquete=?,
                DuracionNoches=?, IDHabitacion=?, IncluirHabitacion=?, Imagen=?, Estado=?
            WHERE IDPaquete=?
        `;

        const [result] = await db.query(sql, [
            NombrePaquete,
            Descripcion,
            PrecioPaquete,
            DuracionNoches,
            IDHabitacion || null,
            IDHabitacion ? 1 : 0,
            Imagen,
            Estado,
            id
        ]);

        return result;
    },

    inactivar: async (id) => {
        const [result] = await db.query(
            "UPDATE paquete SET Estado = 0 WHERE IDPaquete = ?",
            [id]
        );
        return result;
    },

    eliminar: async (id) => {
        await db.query("UPDATE detallereservapaquetes SET IDPaquete = NULL WHERE IDPaquete = ?", [id]);
        await db.query("DELETE FROM paquete_servicios WHERE IDPaquete = ?", [id]);
        const [result] = await db.query("DELETE FROM paquete WHERE IDPaquete = ?", [id]);
        return result;
    },

    agregarServicio: async (idPaquete, idServicio, cantidad = 1, precioServicio = null) => {
        const sql = `
            INSERT INTO paquete_servicios (IDPaquete, IDServicio, Cantidad, PrecioServicio)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [idPaquete, idServicio, cantidad, precioServicio]);
        return result;
    },

    eliminarServicio: async (idPaqueteServicio) => {
        const [result] = await db.query(
            "DELETE FROM paquete_servicios WHERE IDPaqueteServicio=?",
            [idPaqueteServicio]
        );
        return result;
    },

    obtenerServicios: async (idPaquete) => {
        const [rows] = await db.query(`
            SELECT
                ps.IDPaqueteServicio,
                ps.IDServicio,
                ps.Cantidad,
                ps.PrecioServicio,
                s.NombreServicio,
                s.Descripcion,
                s.Duracion,
                s.CantidadMaximaPersonas,
                s.Costo,
                s.Estado
            FROM paquete_servicios ps
            JOIN servicio s ON ps.IDServicio = s.IDServicio
            WHERE ps.IDPaquete = ?
        `, [idPaquete]);
        return rows;
    }

};

module.exports = Paquetes;
