/**
 * Script: ampliar_columnas_habitacion.js
 * Amplía NombreHabitacion VARCHAR(30→100) y Descripcion VARCHAR(255→TEXT)
 * Uso: Desde la carpeta BACKEND ejecuta:
 *      node scripts/ampliar_columnas_habitacion.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const DB = {
    host:     process.env.DB_HOST     || '127.0.0.1',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'hospedaje',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
};

async function main() {
    let conn;
    try {
        conn = await mysql.createConnection(DB);
        console.log('✅ Conectado a MySQL —', DB.database);

        // Mostrar columnas actuales
        const [cols] = await conn.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'habitacion'
            AND COLUMN_NAME IN ('NombreHabitacion', 'Descripcion')
            ORDER BY COLUMN_NAME
        `, [DB.database]);

        console.log('\n📋 Columnas actuales:');
        cols.forEach(c => console.log(`   ${c.COLUMN_NAME}: ${c.COLUMN_TYPE} (nullable: ${c.IS_NULLABLE})`));

        // ALTER TABLE
        console.log('\n🔧 Ejecutando ALTER TABLE...');
        await conn.query(`
            ALTER TABLE habitacion
                MODIFY COLUMN NombreHabitacion VARCHAR(100) NOT NULL,
                MODIFY COLUMN Descripcion TEXT NOT NULL
        `);
        console.log('   ✅ NombreHabitacion: VARCHAR(30) → VARCHAR(100)');
        console.log('   ✅ Descripcion:      VARCHAR(255) → TEXT');

        // Verificar resultado
        const [after] = await conn.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'habitacion'
            AND COLUMN_NAME IN ('NombreHabitacion', 'Descripcion')
            ORDER BY COLUMN_NAME
        `, [DB.database]);

        console.log('\n✅ Columnas después del cambio:');
        after.forEach(c => console.log(`   ${c.COLUMN_NAME}: ${c.COLUMN_TYPE}`));

        console.log('\n🎉 Listo. Los formularios del admin ya pueden aceptar nombres largos y descripciones completas.');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

main();
