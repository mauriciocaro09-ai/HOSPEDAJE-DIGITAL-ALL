/**
 * Migración: agrega columna IDHabitacion a la tabla paquete.
 * Ejecutar: node scripts/agregar_habitacion_paquete.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT || 3306,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl:      process.env.DB_HOST && process.env.DB_HOST.includes('clever-cloud') ? { rejectUnauthorized: false } : undefined
    });

    try {
        // Verificar si la columna ya existe
        const [cols] = await conn.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'paquete'
              AND COLUMN_NAME = 'IDHabitacion'
        `);

        if (cols.length > 0) {
            console.log('✓ La columna IDHabitacion ya existe en la tabla paquete. Nada que hacer.');
            return;
        }

        // Agregar columna
        await conn.query(`
            ALTER TABLE paquete
            ADD COLUMN IDHabitacion INT NULL,
            ADD CONSTRAINT fk_paquete_habitacion
                FOREIGN KEY (IDHabitacion) REFERENCES habitacion(IDHabitacion)
                ON DELETE SET NULL ON UPDATE CASCADE
        `);

        console.log('✓ Columna IDHabitacion agregada correctamente a la tabla paquete.');

        // Mostrar estado actual de los paquetes
        const [paquetes] = await conn.query('SELECT IDPaquete, NombrePaquete, IDHabitacion FROM paquete');
        console.log('\nPaquetes actuales (IDHabitacion = NULL hasta que se asigne desde el admin):');
        paquetes.forEach(p => {
            console.log(`  #${p.IDPaquete} ${p.NombrePaquete} → IDHabitacion: ${p.IDHabitacion ?? 'NULL'}`);
        });

    } finally {
        await conn.end();
    }
}

main().catch(err => {
    console.error('Error en migración:', err.message);
    process.exit(1);
});
