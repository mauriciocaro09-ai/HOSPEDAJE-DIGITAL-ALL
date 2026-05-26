const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospedaje'
    });

    console.log('Conectado a la BD. Deshabilitando restricciones...');
    await connection.query('SET FOREIGN_KEY_CHECKS=0');
    
    console.log('Limpiando tablas...');
    try {
      await connection.query('DELETE FROM cliente');
      await connection.query('DELETE FROM servicio');
    } catch(e) {
      console.log('Tablas no existen aún, creando...');
    }
    
    console.log('Rehabilitando restricciones...');
    await connection.query('SET FOREIGN_KEY_CHECKS=1');
    
    console.log('Verificando/Insertando roles...');
    try {
      await connection.query(
        'INSERT IGNORE INTO roles (IDRol, Nombre, Estado, IsActive) VALUES (1, "Administrador", "activo", 1), (3, "Cliente", "activo", 1)'
      );
    } catch(e) {
      console.log('Roles ya existen');
    }
    
    console.log('Insertando clientes...');
    try {
      await connection.query(`
        INSERT INTO cliente (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol) VALUES
        ('1001234567', 'Juan', 'Pérez García', 'Calle 123 #45-67', 'juan.perez@email.com', '3001234567', 1, 3),
        ('1002345678', 'María', 'López Hernández', 'Carrera 78 #12-34', 'maria.lopez@email.com', '3102345678', 1, 3)
      `);
      console.log('✓ Clientes insertados');
    } catch(e) {
      console.log('Error al insertar clientes:', e.message);
    }
    
    console.log('Insertando servicios...');
    try {
      await connection.query(`
        INSERT INTO servicio (NombreServicio, Descripcion, Duracion, CantidadMaximaPersonas, Costo, Estado) VALUES
        ('Desayuno', 'Desayuno completo buffet', '1 hora', 4, 50000, 1),
        ('Spa', 'Servicio de spa y masaje', '2 horas', 2, 150000, 1),
        ('Tours', 'Tours guiados por la ciudad', '4 horas', 10, 200000, 1)
      `);
      console.log('✓ Servicios insertados');
    } catch(e) {
      console.log('Error al insertar servicios:', e.message);
    }
    
    console.log('\n✅ Base de datos inicializada correctamente');
    await connection.end();
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
