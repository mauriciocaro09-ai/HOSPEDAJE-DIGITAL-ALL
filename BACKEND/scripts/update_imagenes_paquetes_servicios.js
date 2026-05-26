/**
 * Script: update_imagenes_paquetes_servicios.js
 * Uso: Desde la carpeta BACKEND ejecuta:
 *      node scripts/update_imagenes_paquetes_servicios.js
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

// ── DATOS DE PAQUETES ─────────────────────────────────────────────────────────
const PAQUETES = [
    {
        match: ['Romantica', 'Romántica'],
        desc: 'Dos noches en suite con decoración romántica, rosas frescas, pétalos en la cama, desayuno a la habitación, cena privada con menú de 3 tiempos y botella de vino espumante incluida. La experiencia perfecta para celebrar en pareja.',
        imgs: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
            'https://images.unsplash.com/photo-1540518614846-7eded433c457',
            'https://images.unsplash.com/photo-1568495248636-6432b97bd949',
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304',
        ],
    },
    {
        match: ['Familiar'],
        desc: 'Hospedaje para toda la familia con alojamiento para hasta 4 personas, tour completo por la zona cafetera con degustación, desayuno buffet cada mañana, actividades recreativas para niños y transporte incluido desde el hotel.',
        imgs: [
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
            'https://images.unsplash.com/photo-1581578731548-c64695cc6952',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
        ],
    },
    {
        match: ['Wellness', 'Bienestar'],
        desc: 'Programa de bienestar de fin de semana con sesiones diarias de yoga al amanecer, acceso ilimitado al spa y circuito de hidroterapia, alimentación saludable y orgánica, meditación guiada y masaje relajante de 60 minutos incluido.',
        imgs: [
            'https://images.unsplash.com/photo-1544161515-4ab6ce6db874',
            'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b',
            'https://images.unsplash.com/photo-1522338242992-e1a54906a8da',
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
        ],
    },
    {
        match: ['Aventura', 'Sierra'],
        desc: 'Aventura de dos días con guía certificado, senderismo a miradores exclusivos, kit de snacks energéticos, transporte en 4x4 todo terreno, seguro de aventura y noche en cabaña ecológica con fogata incluida.',
        imgs: [
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            'https://images.unsplash.com/photo-1551632811-561732d1e306',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        ],
    },
    {
        match: ['Romantica', 'Romántica', 'Romantico', 'Romántico'],
        desc: 'Suite presidencial de lujo por 4 noches, amenidades premium de cortesía, masaje en pareja de 90 minutos, desayuno y cena incluidos cada día, late checkout hasta las 4 PM, decoración personalizada y servicio de mayordomo privado.',
        imgs: [
            'https://images.unsplash.com/photo-1501117716987-c8e2a4c703df',
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427',
            'https://images.unsplash.com/photo-1631049552057-403cdb8f0658',
        ],
    },
    {
        match: ['Corporativo', 'Express', 'Business', 'Ejecutivo'],
        desc: 'Plan ejecutivo completo con alojamiento en habitación business, acceso a sala de reuniones con capacidad para 8 personas, transfer aeropuerto, desayuno buffet, WiFi de alta velocidad y servicio de lavandería express.',
        imgs: [
            'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a',
            'https://images.unsplash.com/photo-1497366216548-37526070297c',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
        ],
    },
    {
        match: ['Gourmet', 'Gastro', 'Culinario'],
        desc: 'Experiencia culinaria de 2 noches con cata de gastronomía local de 6 tiempos, clase magistral de cocina colombiana, cena de autor con chef invitado y brunch dominical con maridaje de bebidas artesanales.',
        imgs: [
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
            'https://images.unsplash.com/photo-1600891964092-4316c288032e',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        ],
    },
    {
        match: ['Relax', 'Santa Marta', 'Mar', 'Caribe'],
        desc: 'Tres noches de puro relax frente al Caribe con vista al mar desde la habitación, circuito completo de hidroterapia, clase de respiración consciente, acceso al beach club y coctel de bienvenida incluido.',
        imgs: [
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
            'https://images.unsplash.com/photo-1506929562872-bb421503ef21',
            'https://images.unsplash.com/photo-1439066615861-d1af74d74000',
            'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f',
        ],
    },
    {
        match: ['Cultural', 'Popayan', 'Popayán', 'Patrimonio'],
        desc: 'Recorrido de 2 días por el patrimonio histórico de la ciudad blanca, experiencia culinaria con recetas tradicionales, visita a museos y capillas coloniales, alojamiento en hotel boutique con desayuno incluido.',
        imgs: [
            'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8',
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
            'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c',
            'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9',
        ],
    },
    {
        match: ['Todo Incluido', 'San Andres', 'Andrés', 'Playa'],
        desc: 'Plan todo incluido de 4 noches en el archipiélago con habitación frente al mar, snorkel, kayak y paddleboard, desayuno y cena incluidos, tour en lancha por los cayos y coctel de bienvenida.',
        imgs: [
            'https://images.unsplash.com/photo-1500375592092-40eb2168fd21',
            'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
            'https://images.unsplash.com/photo-1559827260-dc66d52bef19',
            'https://images.unsplash.com/photo-1519046904884-53103b34b206',
        ],
    },
    {
        // Fallback genérico para paquetes sin coincidencia (ej: "paquete max")
        match: ['max', 'premium', 'especial', 'vip', 'deluxe'],
        desc: 'Paquete premium todo incluido con alojamiento en habitación de lujo, desayuno y cena incluidos, acceso completo a todos los servicios del hotel, atención personalizada y late checkout hasta las 3 PM.',
        imgs: [
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39',
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
        ],
    },
];

// ── DATOS DE SERVICIOS ────────────────────────────────────────────────────────
const SERVICIOS = [
    {
        match: ['Spa', 'Wellness', 'Bienestar', 'Hidro'],
        desc: 'Circuito de bienestar completo con jacuzzi, sauna finlandés, baño turco, sala de relajación con aromaterapia y acceso a piscinas termales. Incluye bata, pantuflas, bebida detox de bienvenida y toallas premium.',
        imgs: [
            'https://images.unsplash.com/photo-1544161515-4ab6ce6db874',
            'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b',
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
            'https://images.unsplash.com/photo-1552693673-1bf958298935',
        ],
    },
    {
        match: ['Restaurante', 'Comida', 'Gastro', 'Alimentos'],
        desc: 'Restaurante gourmet con carta de desayunos, almuerzos y cenas. Cocina colombiana contemporánea con ingredientes locales y de temporada. Opciones vegetarianas, veganas y sin gluten disponibles.',
        imgs: [
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
            'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b',
        ],
    },
    {
        match: ['Masaje', 'Masoterapia', 'Terapia'],
        desc: 'Masaje relajante profesional con terapeutas certificados. Modalidades: sueco, piedras calientes, tejido profundo o aromaterapia. Sesiones de 60 o 90 minutos en sala privada con música ambiental y aceites esenciales naturales.',
        imgs: [
            'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2',
            'https://images.unsplash.com/photo-1519823551278-64ac92734fb1',
            'https://images.unsplash.com/photo-1515377905703-c4788e51af15',
            'https://images.unsplash.com/photo-1611073615830-9b89e7e7a2e0',
        ],
    },
    {
        match: ['Gimnasio', 'Gym', 'Fitness', 'Ejercicio'],
        desc: 'Gimnasio 24 horas con máquinas cardiovasculares, zona de pesas libres, área funcional y de estiramiento. Casilleros, duchas y dispensadores de toallas disponibles. Clases grupales de spinning y yoga.',
        imgs: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
            'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b',
            'https://images.unsplash.com/photo-1540497077202-7c8a3999166f',
            'https://images.unsplash.com/photo-1574680096145-d05b474e2155',
        ],
    },
    {
        match: ['Transporte', 'Transfer', 'Traslado', 'Vehiculo', 'Vehículo'],
        desc: 'Transporte privado en vehículo climatizado con conductor certificado. Cobertura: aeropuerto, terminal de buses y atractivos turísticos. Disponible 24 horas con reserva anticipada de mínimo 2 horas.',
        imgs: [
            'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d',
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
            'https://images.unsplash.com/photo-1570125909232-eb263c188f7e',
            'https://images.unsplash.com/photo-1494976388531-d1058494cdd8',
        ],
    },
    {
        match: ['Tour', 'Guia', 'Guía', 'Senderismo', 'Hiking', 'Excursion'],
        desc: 'Tour guiado con experto local por los atractivos de San Roque y alrededores. Visita quebradas, miradores naturales y zonas de avistamiento de aves. Incluye snacks y hidratación. Grupo máximo 8 personas.',
        imgs: [
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
        ],
    },
    {
        match: ['Piscina', 'Pool', 'Natacion', 'Natación'],
        desc: 'Piscina al aire libre con agua temperada, zona de tumbonas y sombrillas, bar de piscina con cocteles y refrescos, área exclusiva para niños y zona de adultos. Servicio de toallas incluido.',
        imgs: [
            'https://images.unsplash.com/photo-1540541338287-41700207dee6',
            'https://images.unsplash.com/photo-1566438480900-0609be27a4be',
            'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd',
            'https://images.unsplash.com/photo-1519046904884-53103b34b206',
        ],
    },
    {
        match: ['Lavand', 'Tintorer', 'Lavado'],
        desc: 'Servicio completo de lavandería y tintorería todos los días. Recogida en habitación, lavado, planchado y entrega en menos de 24 horas. Servicio exprés de 4 horas disponible. Tratamientos especiales para prendas delicadas.',
        imgs: [
            'https://images.unsplash.com/photo-1582735689369-4fe89db7114c',
            'https://images.unsplash.com/photo-1545173168-9f1947eebb7f',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
            'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1',
        ],
    },
];

// ── FUNCIÓN PARA ENCONTRAR COINCIDENCIA ───────────────────────────────────────
function encontrarConfig(nombre, lista) {
    const nombreUpper = nombre.toUpperCase();
    return lista.find(item =>
        item.match.some(keyword => nombreUpper.includes(keyword.toUpperCase()))
    );
}

// ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────────
async function main() {
    let conn;
    try {
        conn = await mysql.createConnection(DB);
        console.log('✅ Conectado a MySQL —', DB.database);

        // ── PAQUETES ──────────────────────────────────────────────
        console.log('\n📦 Actualizando PAQUETES...');
        const [paquetes] = await conn.query('SELECT IDPaquete, NombrePaquete FROM paquete');

        if (paquetes.length === 0) {
            console.log('   ⚠️  No hay paquetes en la base de datos.');
        }

        for (const p of paquetes) {
            const cfg = encontrarConfig(p.NombrePaquete, PAQUETES);
            if (!cfg) {
                console.log(`   ⏭️  Sin coincidencia: "${p.NombrePaquete}" — se deja sin cambios`);
                continue;
            }
            const imagen = cfg.imgs.join(',');
            await conn.query(
                'UPDATE paquete SET Descripcion = ?, Imagen = ? WHERE IDPaquete = ?',
                [cfg.desc, imagen, p.IDPaquete]
            );
            console.log(`   ✅ Paquete #${p.IDPaquete} "${p.NombrePaquete}" → 4 imágenes + descripción`);
        }

        // ── SERVICIOS ─────────────────────────────────────────────
        console.log('\n🛎️  Actualizando SERVICIOS...');
        const [servicios] = await conn.query('SELECT IDServicio, NombreServicio FROM servicio');

        if (servicios.length === 0) {
            console.log('   ⚠️  No hay servicios en la base de datos.');
        }

        for (const s of servicios) {
            const cfg = encontrarConfig(s.NombreServicio, SERVICIOS);
            if (!cfg) {
                console.log(`   ⏭️  Sin coincidencia: "${s.NombreServicio}" — se deja sin cambios`);
                continue;
            }
            const imagen = cfg.imgs.join(',');
            await conn.query(
                'UPDATE servicio SET Descripcion = ?, Imagen = ? WHERE IDServicio = ?',
                [cfg.desc, imagen, s.IDServicio]
            );
            console.log(`   ✅ Servicio #${s.IDServicio} "${s.NombreServicio}" → 4 imágenes + descripción`);
        }

        // ── RESUMEN ───────────────────────────────────────────────
        console.log('\n🎉 ¡Listo! Recarga la landing page para ver los cambios.');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    } finally {
        if (conn) await conn.end();
    }
}

main();
