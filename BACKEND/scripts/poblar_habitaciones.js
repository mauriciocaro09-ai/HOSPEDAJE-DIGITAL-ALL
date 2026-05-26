/**
 * Pobla nombre, descripción y costo de habitaciones que tienen esos campos vacíos.
 * Ejecutar: node scripts/poblar_habitaciones.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const habitaciones = [
    {
        id: 1,
        nombre: 'Habitación Estándar',
        descripcion: 'Habitación confortable con cama queen, baño privado, TV LCD, aire acondicionado y vista al jardín. Perfecta para viajeros individuales o parejas.',
        costo: 180000
    },
    {
        id: 3,
        nombre: 'Habitación Doble',
        descripcion: 'Amplia habitación con cama doble, baño privado, TV, minibar y balcón con vista al jardín exterior. Ideal para parejas o viajeros que buscan comodidad.',
        costo: 220000
    },
    {
        id: 4,
        nombre: 'Suite Junior',
        descripcion: 'Suite con sala de estar integrada, cama king size, baño con ducha y tina, escritorio, minibar y vista panorámica al entorno natural del hospedaje.',
        costo: 350000
    },
    {
        id: 31,
        nombre: 'Habitación Familiar',
        descripcion: 'Habitación espaciosa para familias con cama matrimonial y dos camas individuales, baño completo, TV, minibar y zona de descanso adicional para niños.',
        costo: 300000
    },
    {
        id: 32,
        nombre: 'Habitación Deluxe',
        descripcion: 'Habitación premium con cama king size, baño de lujo con ducha tipo lluvia, terraza privada, minibar completo, caja fuerte y servicio de mayordomía.',
        costo: 500000
    }
];

async function main() {
    const conn = await mysql.createConnection({
        host:     process.env.DB_HOST     || 'localhost',
        user:     process.env.DB_USER     || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME     || 'hospedaje',
        port:     parseInt(process.env.DB_PORT || '3306', 10)
    });

    console.log('Conectado a la base de datos.');

    for (const hab of habitaciones) {
        const [result] = await conn.execute(
            `UPDATE habitacion
             SET NombreHabitacion = ?, Descripcion = ?, Costo = ?
             WHERE IDHabitacion = ? AND (NombreHabitacion = '' OR NombreHabitacion IS NULL)`,
            [hab.nombre, hab.descripcion, hab.costo, hab.id]
        );
        if (result.affectedRows > 0) {
            console.log(`✅ ID ${hab.id} actualizada: "${hab.nombre}"`);
        } else {
            console.log(`⚠️  ID ${hab.id} omitida (ya tiene nombre o no existe)`);
        }
    }

    await conn.end();
    console.log('\nListo.');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
