const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

function stripComments(sql) {
  const noBlock = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  return noBlock
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}

async function run() {
  const sqlPath = path.join(__dirname, '..', 'src', 'database', 'seed_paquetes_reales.sql');
  const raw = fs.readFileSync(sqlPath, 'utf8');
  const cleaned = stripComments(raw);
  const statements = cleaned
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Ejecutando ${statements.length} sentencias de seed...`);

  for (let i = 0; i < statements.length; i += 1) {
    const stmt = statements[i];
    await db.query(stmt);
    const preview = stmt.replace(/\s+/g, ' ').slice(0, 90);
    console.log(`[${i + 1}/${statements.length}] OK: ${preview}${stmt.length > 90 ? '...' : ''}`);
  }

  const [rows] = await db.query('SELECT COUNT(*) AS total FROM paquete WHERE IDPaquete BETWEEN 101 AND 110');
  console.log(`Seed completado. Paquetes realistas activos: ${rows[0].total}`);
}

run()
  .catch((err) => {
    console.error('Error al cargar seed de paquetes reales:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
