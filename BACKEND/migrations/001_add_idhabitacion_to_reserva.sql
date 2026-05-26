-- Migración: Añadir columna IDHabitacion a reserva y configurar FK
-- Ejecutar una vez. Compatible con MySQL 8+ (ADD COLUMN IF NOT EXISTS)

ALTER TABLE reserva
  ADD COLUMN IF NOT EXISTS IDHabitacion INT NULL;

-- Intentar crear la FK sólo si no existe (si falla, revisar manualmente)
SET @db := DATABASE();
SELECT COUNT(*) INTO @exists FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = @db
   AND TABLE_NAME = 'reserva'
   AND COLUMN_NAME = 'IDHabitacion'
   AND REFERENCED_TABLE_NAME = 'habitacion';

-- Si no existe, crear la constraint
-- Nota: ejecutar la línea siguiente solo si @exists = 0
ALTER TABLE reserva
  ADD CONSTRAINT fk_reserva_habitacion FOREIGN KEY (IDHabitacion) REFERENCES habitacion(IDHabitacion);

-- Fin de migración
