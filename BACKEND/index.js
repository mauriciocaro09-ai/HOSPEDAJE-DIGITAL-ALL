/**
 * Servidor principal de la aplicación HOSPEDAJE_DIGITAL
 * API REST con Express
 */

require('dotenv').config();

const app = require('./src/app');
const db = require('./src/config/db');
const port = process.env.PORT || 3000;

let server;

const shutdown = (signal) => {
    console.log(`\n${signal} recibido. Cerrando servidor...`);

    if (!server) {
        process.exit(0);
        return;
    }

    server.close((error) => {
        if (error) {
            console.error('Error al cerrar el servidor:', error.message);
            process.exit(1);
            return;
        }

        console.log('Servidor detenido correctamente.');
        process.exit(0);
    });
};

const normalizarEstadosDB = async () => {
    try {
        await db.query(
            `UPDATE habitacion SET Estado = 1 WHERE CAST(Estado AS CHAR) IN ('disponible', 'Disponible', 'activo', 'Activo', 'true', 'si', 'sí', 'yes')`
        );
        await db.query(
            `UPDATE habitacion SET Estado = 0 WHERE CAST(Estado AS CHAR) IN ('inactivo', 'Inactivo', 'inhabilitado', 'no disponible', 'false', 'no')`
        );
        console.log('Estados de habitaciones normalizados.');
    } catch (err) {
        console.warn('Normalización de estados omitida (ya son numéricos):', err.message);
    }
};

const crearTablasDetalle = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS detallereservaservicio (
                IDDetalleReservaServicio INT AUTO_INCREMENT PRIMARY KEY,
                IDReserva INT,
                IDServicio INT,
                Cantidad INT DEFAULT 1,
                Precio FLOAT DEFAULT 0,
                Estado TINYINT(1) DEFAULT 1
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS detallereservapaquetes (
                IDDetalleReservaPaquetes INT AUTO_INCREMENT PRIMARY KEY,
                IDReserva INT,
                IDPaquete INT,
                Cantidad INT DEFAULT 1,
                Precio FLOAT DEFAULT 0,
                Estado TINYINT(1) DEFAULT 1
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS cargo_adicional (
                IDCargo INT AUTO_INCREMENT PRIMARY KEY,
                IDReserva INT NOT NULL,
                IDServicio INT NOT NULL,
                Cantidad INT NOT NULL DEFAULT 1,
                PrecioUnitario DECIMAL(10,2) NOT NULL DEFAULT 0,
                PrecioTotal DECIMAL(10,2) NOT NULL DEFAULT 0,
                Estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
                IDMetodoPago INT NULL,
                FechaCreacion DATETIME DEFAULT NOW(),
                FechaPago DATETIME NULL
            )
        `);
        // Agregar columnas nuevas si no existen (compatible MySQL 5.7)
        const agregarColumna = async (columna, definicion) => {
            const [cols] = await db.query(`SHOW COLUMNS FROM reserva LIKE '${columna}'`);
            if (cols.length === 0) {
                await db.query(`ALTER TABLE reserva ADD COLUMN ${columna} ${definicion}`);
                console.log(`Columna ${columna} agregada.`);
            }
        };
        await agregarColumna('MotivoCancelacion', 'TEXT NULL DEFAULT NULL');
        await agregarColumna('ComprobanteTransferencia', 'MEDIUMTEXT NULL DEFAULT NULL');
        await agregarColumna('FechaCreacion', 'DATETIME DEFAULT NOW()');
        console.log('Tablas de detalle verificadas.');
    } catch (err) {
        console.warn('No se pudieron crear tablas de detalle:', err.message);
    }
};

const startServer = async () => {
    try {
        await db.query('SELECT 1');
        console.log('Conexión a base de datos verificada.');

        await normalizarEstadosDB();
        await crearTablasDetalle();

        server = app.listen(port, () => {
            console.log(`Servidor corriendo en http://localhost:${port}`);
        });

        // Auto-cancelar reservas con comprobante vencido cada 5 minutos
        const ReservasService = require('./src/services/reservas.service');
        setInterval(() => {
            ReservasService.autoCancelarVencidas().catch(e => console.error('Error auto-cancelacion:', e.message));
        }, 5 * 60 * 1000);
        // Ejecutar inmediatamente al arrancar
        ReservasService.autoCancelarVencidas().catch(e => console.error('Error auto-cancelacion inicial:', e.message));

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`No se pudo iniciar: el puerto ${port} ya está en uso.`);
            } else {
                console.error('Error del servidor:', error.message);
            }
            process.exit(1);
        });
    } catch (error) {
        const detail = error && (error.message || error.code) ? (error.message || error.code) : String(error);
        console.error('No se pudo iniciar el backend:', detail);
        process.exit(1);
    }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
    console.error('Excepción no controlada:', error.message);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    console.error('Promesa rechazada no controlada:', message);
    process.exit(1);
});

startServer();
