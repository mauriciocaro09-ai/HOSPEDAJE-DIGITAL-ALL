-- ================================================================
-- HOSPEDAJE DIGITAL — Actualización imágenes y descripciones
-- Paquetes y Servicios
-- Ejecutar en phpMyAdmin sobre la base de datos hospedaje
-- ================================================================

-- ================================================================
-- PASO 1: Ver qué hay en cada tabla (ejecuta primero esto)
-- ================================================================
-- SELECT IDPaquete, NombrePaquete, Descripcion FROM paquete;
-- SELECT IDServicio, NombreServicio, Descripcion FROM servicio;

-- ================================================================
-- PAQUETES — Descripción completa + 4 imágenes
-- ================================================================

UPDATE paquete SET
    Descripcion = 'Dos noches en suite con decoración romántica, rosas frescas, pétalos en la cama, desayuno a la habitación, cena privada frente al mar con menú de 3 tiempos y botella de vino espumante incluida. La experiencia perfecta para celebrar en pareja.',
    Imagen = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267,https://images.unsplash.com/photo-1540518614846-7eded433c457,https://images.unsplash.com/photo-1568495248636-6432b97bd949,https://images.unsplash.com/photo-1631049307264-da0ec9d70304'
WHERE NombrePaquete LIKE '%Romantica%' OR NombrePaquete LIKE '%Romántica%';

UPDATE paquete SET
    Descripcion = 'Hospedaje para toda la familia con alojamiento para hasta 4 personas, tour completo por la zona cafetera con degustación, desayuno buffet cada mañana, actividades recreativas para niños y transporte incluido desde el hotel.',
    Imagen = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85,https://images.unsplash.com/photo-1581578731548-c64695cc6952,https://images.unsplash.com/photo-1566073771259-6a8506099945,https://images.unsplash.com/photo-1520250497591-112f2f40a3f4'
WHERE NombrePaquete LIKE '%Familiar%';

UPDATE paquete SET
    Descripcion = 'Programa de bienestar de fin de semana con sesiones diarias de yoga al amanecer, acceso ilimitado al spa y circuito de hidroterapia, alimentación saludable y orgánica, meditación guiada y masaje relajante de 60 minutos incluido.',
    Imagen = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874,https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b,https://images.unsplash.com/photo-1522338242992-e1a54906a8da,https://images.unsplash.com/photo-1540555700478-4be289fbecef'
WHERE NombrePaquete LIKE '%Wellness%';

UPDATE paquete SET
    Descripcion = 'Aventura de dos días con guía certificado por la Sierra Nevada, senderismo a miradores exclusivos, kit de snacks energéticos, transporte en 4x4 todo terreno, seguro de aventura y noche en cabaña ecológica con fogata.',
    Imagen = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e,https://images.unsplash.com/photo-1551632811-561732d1e306,https://images.unsplash.com/photo-1464822759023-fed622ff2c3b,https://images.unsplash.com/photo-1441974231531-c6227db76b6e'
WHERE NombrePaquete LIKE '%Aventura%';

UPDATE paquete SET
    Descripcion = 'Suite presidencial de lujo por 4 noches, amenidades premium de cortesía, masaje en pareja de 90 minutos, desayuno y cena incluidos cada día, late checkout hasta las 4 PM, decoración personalizada y servicio de mayordomo privado.',
    Imagen = 'https://images.unsplash.com/photo-1501117716987-c8e2a4c703df,https://images.unsplash.com/photo-1618773928121-c32242e63f39,https://images.unsplash.com/photo-1590490360182-c33d57733427,https://images.unsplash.com/photo-1631049552057-403cdb8f0658'
WHERE NombrePaquete LIKE '%Luna%' OR NombrePaquete LIKE '%Miel%';

UPDATE paquete SET
    Descripcion = 'Plan ejecutivo completo con alojamiento en habitación business, acceso a sala de reuniones con capacidad para 8 personas, transfer aeropuerto, desayuno buffet, WiFi de alta velocidad y servicio de lavandería express.',
    Imagen = 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a,https://images.unsplash.com/photo-1497366216548-37526070297c,https://images.unsplash.com/photo-1497366811353-6870744d04b2,https://images.unsplash.com/photo-1542744173-8e7e53415bb0'
WHERE NombrePaquete LIKE '%Corporativo%' OR NombrePaquete LIKE '%Express%';

UPDATE paquete SET
    Descripcion = 'Experiencia culinaria de 2 noches que incluye cata de gastronomía local con 6 tiempos, clase magistral de cocina colombiana, cena de autor con chef invitado y brunch dominical con maridaje de bebidas artesanales.',
    Imagen = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5,https://images.unsplash.com/photo-1414235077428-338989a2e8c0,https://images.unsplash.com/photo-1600891964092-4316c288032e,https://images.unsplash.com/photo-1504674900247-0877df9cc836'
WHERE NombrePaquete LIKE '%Gourmet%';

UPDATE paquete SET
    Descripcion = 'Tres noches de puro relax frente al Caribe con vista al mar desde tu habitación, circuito completo de hidroterapia, clase de respiración consciente y pranayama, acceso al beach club y coctel de bienvenida.',
    Imagen = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e,https://images.unsplash.com/photo-1506929562872-bb421503ef21,https://images.unsplash.com/photo-1439066615861-d1af74d74000,https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f'
WHERE NombrePaquete LIKE '%Relax%' OR NombrePaquete LIKE '%Santa Marta%';

UPDATE paquete SET
    Descripcion = 'Recorrido de 2 días por el patrimonio histórico y arquitectónico de la ciudad blanca, experiencia culinaria con recetas tradicionales, visita a museos y capillas coloniales, alojamiento en hotel boutique con desayuno incluido.',
    Imagen = 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8,https://images.unsplash.com/photo-1502602898657-3e91760cbb34,https://images.unsplash.com/photo-1519750157634-b6d493a0f77c,https://images.unsplash.com/photo-1523906834658-6e24ef2386f9'
WHERE NombrePaquete LIKE '%Cultural%' OR NombrePaquete LIKE '%Popayan%' OR NombrePaquete LIKE '%Popayán%';

UPDATE paquete SET
    Descripcion = 'Plan todo incluido de 4 noches en el archipiélago con habitación frente al mar, actividades náuticas (snorkel, kayak, paddleboard), desayuno y cena incluidos, tour en lancha por los cayos y coctel de bienvenida.',
    Imagen = 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21,https://images.unsplash.com/photo-1544551763-46a013bb70d5,https://images.unsplash.com/photo-1559827260-dc66d52bef19,https://images.unsplash.com/photo-1519046904884-53103b34b206'
WHERE NombrePaquete LIKE '%Todo%' OR NombrePaquete LIKE '%San Andres%' OR NombrePaquete LIKE '%Andrés%';

-- ================================================================
-- SERVICIOS — Descripción completa + 4 imágenes
-- ================================================================

UPDATE servicio SET
    Descripcion = 'Circuito de bienestar completo con jacuzzi, sauna finlandés, baño turco, sala de relajación con aromaterapia y acceso a zona de piscinas termales. Incluye bata y pantuflas, bebida detox de bienvenida y toallas premium.',
    Imagen = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874,https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b,https://images.unsplash.com/photo-1540555700478-4be289fbecef,https://images.unsplash.com/photo-1552693673-1bf958298935'
WHERE NombreServicio LIKE '%Spa%' OR NombreServicio LIKE '%Wellness%' OR NombreServicio LIKE '%Bienestar%';

UPDATE servicio SET
    Descripcion = 'Restaurante gourmet con carta de desayunos, almuerzos y cenas. Cocina colombiana contemporánea con ingredientes locales y de temporada. Ambiente acogedor, servicio de mesa personalizado y opciones vegetarianas, veganas y sin gluten disponibles.',
    Imagen = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0,https://images.unsplash.com/photo-1555396273-367ea4eb4db5,https://images.unsplash.com/photo-1504674900247-0877df9cc836,https://images.unsplash.com/photo-1424847651672-bf20a4b0982b'
WHERE NombreServicio LIKE '%Restaurante%' OR NombreServicio LIKE '%Comida%' OR NombreServicio LIKE '%Gastro%';

UPDATE servicio SET
    Descripcion = 'Masaje relajante profesional a cargo de terapeutas certificados. Disponible en modalidad sueco, piedras calientes, tejido profundo o aromaterapia. Sesiones de 60 o 90 minutos en sala privada con música ambiental y aceites esenciales naturales.',
    Imagen = 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2,https://images.unsplash.com/photo-1519823551278-64ac92734fb1,https://images.unsplash.com/photo-1515377905703-c4788e51af15,https://images.unsplash.com/photo-1611073615830-9b89e7e7a2e0'
WHERE NombreServicio LIKE '%Masaje%' OR NombreServicio LIKE '%Masoterapia%';

UPDATE servicio SET
    Descripcion = 'Gimnasio completamente equipado disponible las 24 horas con máquinas cardiovasculares, zona de pesas libres, área de funcional y estiramiento. Incluye casilleros, duchas y dispensadores de toallas. Clases grupales de spinning y yoga disponibles.',
    Imagen = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48,https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b,https://images.unsplash.com/photo-1540497077202-7c8a3999166f,https://images.unsplash.com/photo-1574680096145-d05b474e2155'
WHERE NombreServicio LIKE '%Gimnasio%' OR NombreServicio LIKE '%Gym%' OR NombreServicio LIKE '%Fitness%';

UPDATE servicio SET
    Descripcion = 'Servicio de transporte privado en vehículo climatizado con conductor certificado. Cobertura: aeropuerto, terminal de buses, centros comerciales y atractivos turísticos del municipio. Disponible las 24 horas con reserva anticipada de mínimo 2 horas.',
    Imagen = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d,https://images.unsplash.com/photo-1544620347-c4fd4a3d5957,https://images.unsplash.com/photo-1570125909232-eb263c188f7e,https://images.unsplash.com/photo-1494976388531-d1058494cdd8'
WHERE NombreServicio LIKE '%Transporte%' OR NombreServicio LIKE '%Transfer%' OR NombreServicio LIKE '%Traslado%';

UPDATE servicio SET
    Descripcion = 'Tour guiado con experto local por los principales atractivos del municipio de San Roque y sus alrededores. Incluye visita a quebradas, miradores naturales, zonas de avistamiento de aves y experiencias con comunidades locales. Grupo máximo 8 personas.',
    Imagen = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e,https://images.unsplash.com/photo-1464822759023-fed622ff2c3b,https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1,https://images.unsplash.com/photo-1504280390367-361c6d9f38f4'
WHERE NombreServicio LIKE '%Tour%' OR NombreServicio LIKE '%Guia%' OR NombreServicio LIKE '%Guía%' OR NombreServicio LIKE '%Senderismo%' OR NombreServicio LIKE '%Hiking%';

UPDATE servicio SET
    Descripcion = 'Piscina al aire libre con agua temperada, zona de tumbonas y sombrillas, bar de piscina con cocteles y refrescos, zona exclusiva para niños y área de adultos. Servicio de toallas y productos de protección solar disponibles.',
    Imagen = 'https://images.unsplash.com/photo-1540541338287-41700207dee6,https://images.unsplash.com/photo-1566438480900-0609be27a4be,https://images.unsplash.com/photo-1575429198097-0414ec08e8cd,https://images.unsplash.com/photo-1519046904884-53103b34b206'
WHERE NombreServicio LIKE '%Piscina%' OR NombreServicio LIKE '%Pool%';

UPDATE servicio SET
    Descripcion = 'Servicio completo de lavandería y tintorería disponible todos los días. Recogida en habitación, lavado, planchado y entrega en menos de 24 horas. Disponible también servicio exprés de 4 horas. Tratamientos especiales para prendas delicadas.',
    Imagen = 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c,https://images.unsplash.com/photo-1545173168-9f1947eebb7f,https://images.unsplash.com/photo-1558618666-fcd25c85cd64,https://images.unsplash.com/photo-1604335399105-a0c585fd81a1'
WHERE NombreServicio LIKE '%Lavand%' OR NombreServicio LIKE '%Tintorer%';

-- ================================================================
-- Verificar resultados
-- ================================================================
SELECT IDPaquete, NombrePaquete, LEFT(Descripcion,60) AS Desc_Preview, LEFT(Imagen,80) AS Imagen_Preview FROM paquete;
SELECT IDServicio, NombreServicio, LEFT(Descripcion,60) AS Desc_Preview, LEFT(Imagen,80) AS Imagen_Preview FROM servicio;
