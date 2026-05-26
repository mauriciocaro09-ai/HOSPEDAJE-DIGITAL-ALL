USE hospedaje;

/*
  Seed realista para tabla paquete.
  - Usa IDs fijos para ser idempotente.
  - No elimina tablas ni datos existentes.
*/

INSERT INTO paquete (
  IDPaquete,
  NombrePaquete,
  Descripcion,
  PrecioPaquete,
  DuracionNoches,
  IncluirHabitacion,
  Imagen,
  Estado
) VALUES
(101, 'Escapada Romantica Cartagena', 'Suite con decoracion romantica, desayuno a la habitacion y cena frente al mar.', 1280000, 2, 1, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop', 1),
(102, 'Plan Familiar Eje Cafetero', 'Hospedaje para 4 personas con tour cafetero y desayuno buffet incluido.', 1760000, 3, 1, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=800&fit=crop', 1),
(103, 'Fin de Semana Wellness', 'Programa de bienestar con yoga, spa y alimentacion saludable.', 1490000, 2, 1, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&h=800&fit=crop', 1),
(104, 'Aventura Sierra Nevada', 'Incluye guianza de senderismo, snacks y transporte local.', 1320000, 2, 1, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop', 1),
(105, 'Luna de Miel Premium', 'Suite premium, amenidades de lujo, masaje en pareja y late checkout.', 2890000, 4, 1, 'https://images.unsplash.com/photo-1501117716987-c8e2a4c703df?w=1200&h=800&fit=crop', 1),
(106, 'Corporativo Express Bogota', 'Alojamiento ejecutivo con sala de reuniones y transfer aeropuerto.', 1120000, 2, 1, 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=1200&h=800&fit=crop', 1),
(107, 'Experiencia Gourmet Medellin', 'Cata gastronomica local, cena de autor y brunch dominical.', 1650000, 2, 1, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=800&fit=crop', 1),
(108, 'Relax Total Santa Marta', 'Vista al mar, circuito de hidroterapia y clase de respiracion consciente.', 1580000, 3, 1, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop', 1),
(109, 'Escapada Cultural Popayan', 'Recorrido patrimonial, experiencia culinaria y hospedaje boutique.', 1210000, 2, 1, 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=1200&h=800&fit=crop', 1),
(110, 'Todo Incluido San Andres', 'Plan de playa con actividades nauticas, desayuno y cena incluidos.', 2450000, 4, 1, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&h=800&fit=crop', 1)
ON DUPLICATE KEY UPDATE
  NombrePaquete = VALUES(NombrePaquete),
  Descripcion = VALUES(Descripcion),
  PrecioPaquete = VALUES(PrecioPaquete),
  DuracionNoches = VALUES(DuracionNoches),
  IncluirHabitacion = VALUES(IncluirHabitacion),
  Imagen = VALUES(Imagen),
  Estado = VALUES(Estado);

ALTER TABLE paquete AUTO_INCREMENT = 111;
