const PaquetesService = require("../services/paquetes.service");
const db = require("../config/db");

/* ================= LISTAR TODOS ================= */

const getAll = async (req, res) => {
    try {
        const soloActivos = req.query.admin !== 'true';
        const paquetes = await PaquetesService.listar(soloActivos);
        res.json(paquetes);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo paquetes", detalle: error.message });
    }
};

/* ================= OBTENER POR ID ================= */

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const paquete = await PaquetesService.obtener(id);

        if (!paquete) {
            return res.status(404).json({ error: "Paquete no encontrado" });
        }

        res.json(paquete);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo paquete", detalle: error.message });
    }
};

/* ================= BUSCAR ================= */

const buscar = async (req, res) => {
    try {
        const q = (req.query.q || req.query.query || "").toString().trim();

        if (!q) {
            return res.status(400).json({ error: "Parámetro de búsqueda 'q' requerido" });
        }

        const paquetes = await PaquetesService.buscar(q);
        res.json(paquetes);
    } catch (error) {
        res.status(500).json({ error: "Error buscando paquetes", detalle: error.message });
    }
};

/* ================= VERIFICAR DISPONIBILIDAD DE HABITACIÓN DEL PAQUETE ================= */

const verificarDisponibilidad = async (req, res) => {
    try {
        const { id } = req.params;
        const { fechaInicio, fechaFin } = req.query;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ error: "Se requieren fechaInicio y fechaFin" });
        }

        const paquete = await PaquetesService.obtener(id);
        if (!paquete) {
            return res.status(404).json({ error: "Paquete no encontrado" });
        }

        if (!paquete.IDHabitacion) {
            return res.json({ disponible: true, mensaje: "Este paquete no tiene habitación asignada" });
        }

        // Verificar que no existan reservas activas que se solapen con las fechas
        const [conflictos] = await db.query(`
            SELECT r.IdReserva
            FROM reserva r
            JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
            WHERE r.IDHabitacion = ?
              AND LOWER(e.NombreEstadoReserva) NOT IN ('cancelada', 'completada', 'finalizada')
              AND r.FechaInicio < ?
              AND r.FechaFinalizacion > ?
        `, [paquete.IDHabitacion, fechaFin, fechaInicio]);

        if (conflictos.length > 0) {
            return res.json({
                disponible: false,
                mensaje: `La habitación "${paquete.NombreHabitacion}" no está disponible para las fechas seleccionadas`
            });
        }

        res.json({
            disponible: true,
            mensaje: `La habitación "${paquete.NombreHabitacion}" está disponible`,
            habitacion: {
                IDHabitacion: paquete.IDHabitacion,
                NombreHabitacion: paquete.NombreHabitacion,
                CostoHabitacion: paquete.CostoHabitacion
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Error verificando disponibilidad", detalle: error.message });
    }
};

/* ================= CREAR ================= */

const create = async (req, res) => {
    try {
        const {
            NombrePaquete,
            Descripcion,
            PrecioPaquete,
            DuracionNoches,
            IDHabitacion,
            Imagen,
            Estado
        } = req.body;

        if (!NombrePaquete || !PrecioPaquete) {
            return res.status(400).json({
                error: "Campos requeridos: NombrePaquete, PrecioPaquete"
            });
        }

        await PaquetesService.crear({
            NombrePaquete,
            Descripcion,
            PrecioPaquete,
            DuracionNoches: DuracionNoches || 1,
            IDHabitacion: IDHabitacion || null,
            Imagen,
            Estado: Estado !== undefined ? Estado : 1
        });

        res.status(201).json({ mensaje: "Paquete creado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error creando paquete", detalle: error.message });
    }
};

/* ================= ACTUALIZAR ================= */

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            NombrePaquete,
            Descripcion,
            PrecioPaquete,
            DuracionNoches,
            IDHabitacion,
            Imagen,
            Estado
        } = req.body;

        const paquete = await PaquetesService.obtener(id);
        if (!paquete) {
            return res.status(404).json({ error: "Paquete no encontrado" });
        }

        await PaquetesService.actualizar(id, {
            NombrePaquete:  NombrePaquete  || paquete.NombrePaquete,
            Descripcion:    Descripcion    || paquete.Descripcion,
            PrecioPaquete:  PrecioPaquete  || paquete.PrecioPaquete,
            DuracionNoches: DuracionNoches !== undefined ? DuracionNoches : paquete.DuracionNoches,
            IDHabitacion:   IDHabitacion   !== undefined ? (IDHabitacion || null) : paquete.IDHabitacion,
            Imagen:         Imagen         !== undefined ? Imagen : paquete.Imagen,
            Estado:         Estado         !== undefined ? Estado : paquete.Estado
        });

        res.json({ mensaje: "Paquete actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error actualizando paquete", detalle: error.message });
    }
};

/* ================= ELIMINAR ================= */

const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const paquete = await PaquetesService.obtener(id);
        if (!paquete) {
            return res.status(404).json({ error: "Paquete no encontrado" });
        }

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total
             FROM detallereservapaquetes drp
             JOIN reserva r ON drp.IDReserva = r.IdReserva
             JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
             WHERE drp.IDPaquete = ?
               AND LOWER(e.NombreEstadoReserva) NOT IN ('cancelada', 'completada')
               AND r.FechaFinalizacion >= CURDATE()`,
            [id]
        );
        if (Number(total) > 0) {
            return res.status(409).json({
                error: `No se puede eliminar "${paquete.NombrePaquete}" porque está incluido en ${total} reserva(s) activa(s) o futura(s). Cancelalas primero.`,
            });
        }

        await PaquetesService.eliminar(id);
        res.json({ mensaje: "Paquete eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error eliminando paquete" });
    }
};

/* ================= AGREGAR SERVICIO ================= */

const agregarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const { IDServicio, Cantidad = 1, PrecioServicio = null } = req.body;

        if (!IDServicio) {
            return res.status(400).json({ error: "IDServicio requerido" });
        }

        const paquete = await PaquetesService.obtener(id);
        if (!paquete) {
            return res.status(404).json({ error: "Paquete no encontrado" });
        }

        await PaquetesService.agregarServicio(id, IDServicio, Cantidad, PrecioServicio);
        res.status(201).json({ mensaje: "Servicio agregado al paquete" });
    } catch (error) {
        res.status(500).json({ error: "Error agregando servicio", detalle: error.message });
    }
};

/* ================= ELIMINAR SERVICIO ================= */

const eliminarServicio = async (req, res) => {
    try {
        const { idPaqueteServicio } = req.params;

        await PaquetesService.eliminarServicio(idPaqueteServicio);
        res.json({ mensaje: "Servicio eliminado del paquete" });
    } catch (error) {
        res.status(500).json({ error: "Error eliminando servicio", detalle: error.message });
    }
};

/* ================= OBTENER SERVICIOS ================= */

const obtenerServicios = async (req, res) => {
    try {
        const { id } = req.params;

        const paquete = await PaquetesService.obtener(id);
        if (!paquete) {
            return res.status(404).json({ error: "Paquete no encontrado" });
        }

        const servicios = await PaquetesService.obtenerServicios(id);
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ error: "Error obteniendo servicios", detalle: error.message });
    }
};

/* ================= SUBIR IMAGEN ================= */

const uploadImagen = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo o el formato no es válido" });
    }
    const url = `${req.protocol}://${req.get("host")}/img/paquetes/${req.file.filename}`;
    res.json({ url });
};

module.exports = {
    getAll,
    getById,
    buscar,
    verificarDisponibilidad,
    create,
    update,
    remove,
    agregarServicio,
    eliminarServicio,
    obtenerServicios,
    uploadImagen
};
