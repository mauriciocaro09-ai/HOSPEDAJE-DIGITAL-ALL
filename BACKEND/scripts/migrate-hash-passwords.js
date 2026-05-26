/**
 * Migración one-time: hashear contraseñas de usuarios en texto plano.
 * Ejecutar UNA sola vez: node scripts/migrate-hash-passwords.js
 */
const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function run() {
    const [usuarios] = await db.query('SELECT IDUsuario, Contrasena FROM usuarios');

    let migrados = 0;
    let omitidos = 0;

    for (const u of usuarios) {
        // Si ya es un hash bcrypt (empieza con $2b$ o $2a$), omitir
        if (u.Contrasena && (u.Contrasena.startsWith('$2b$') || u.Contrasena.startsWith('$2a$'))) {
            omitidos++;
            continue;
        }

        if (!u.Contrasena) {
            console.warn(`Usuario ${u.IDUsuario} sin contraseña — omitido`);
            omitidos++;
            continue;
        }

        const hash = await bcrypt.hash(String(u.Contrasena), 10);
        await db.query('UPDATE usuarios SET Contrasena = ? WHERE IDUsuario = ?', [hash, u.IDUsuario]);
        console.log(`Usuario ${u.IDUsuario} migrado`);
        migrados++;
    }

    console.log(`\nListo: ${migrados} migrados, ${omitidos} ya hasheados u omitidos.`);
    process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
