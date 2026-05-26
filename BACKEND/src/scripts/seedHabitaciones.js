const db = require("../config/db");

async function getColumns(table) {
  const [rows] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
  return rows.map((r) => r.Field);
}

function pickInsertData(columns, room) {
  const data = {};
  if (columns.includes("NombreHabitacion")) data.NombreHabitacion = room.NombreHabitacion;
  if (columns.includes("Costo")) data.Costo = room.Costo;

  if (columns.includes("Descripcion")) data.Descripcion = room.Descripcion ?? "Habitación creada por seed";
  if (columns.includes("Capacidad")) data.Capacidad = room.Capacidad ?? 2;
  if (columns.includes("TipoHabitacion")) data.TipoHabitacion = room.TipoHabitacion ?? "Premium";
  if (columns.includes("Estado")) data.Estado = room.Estado ?? 1;

  return data;
}

async function existsByName(nombre) {
  const [rows] = await db.query(
    "SELECT IDHabitacion FROM Habitaciones WHERE NombreHabitacion = ? LIMIT 1",
    [nombre]
  );
  return rows.length > 0;
}

async function insertRow(table, data) {
  const keys = Object.keys(data);
  if (!keys.length) throw new Error("No hay columnas compatibles para insertar en Habitaciones.");

  const cols = keys.map((k) => `\`${k}\``).join(", ");
  const placeholders = keys.map(() => "?").join(", ");
  const values = keys.map((k) => data[k]);

  await db.query(`INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`, values);
}

async function main() {
  const table = "Habitaciones";
  const columns = await getColumns(table);

  const rooms = [
    { NombreHabitacion: "Suite Premium Azul", Costo: 180000, Capacidad: 2, TipoHabitacion: "Suite", Descripcion: "Suite premium con vista" },
    { NombreHabitacion: "Cabaña Bosque", Costo: 140000, Capacidad: 4, TipoHabitacion: "Cabaña", Descripcion: "Ideal para familia" },
    { NombreHabitacion: "Habitación Estándar", Costo: 90000, Capacidad: 2, TipoHabitacion: "Estándar", Descripcion: "Cómoda y funcional" },
    { NombreHabitacion: "Glamping Deluxe", Costo: 220000, Capacidad: 2, TipoHabitacion: "Glamping", Descripcion: "Experiencia glamping premium" },
  ];

  let created = 0;

  for (const r of rooms) {
    if (!r.NombreHabitacion || typeof r.Costo === "undefined") continue;
    if (await existsByName(r.NombreHabitacion)) continue;

    await insertRow(table, pickInsertData(columns, r));
    created += 1;
  }

  console.log(`✅ Seed Habitaciones listo. Creadas: ${created}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed Habitaciones falló:", err);
  process.exit(1);
});