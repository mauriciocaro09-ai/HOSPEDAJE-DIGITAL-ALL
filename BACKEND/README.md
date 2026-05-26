# 🏨 HOSPEDAJE_DIGITAL

API REST para la gestión de un sistema de hospedaje digital. Permite administrar habitaciones y clientes de un hotel o establecimiento de alojamiento.

## 📋 Descripción

HOSPEDAJE_DIGITAL es una aplicación backend desarrollada con Node.js y Express que proporciona una interfaz de programación RESTful para gestionar las operaciones básicas de un negocio de hospedaje. La API permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre habitaciones y clientes.

## 🛠️ Tecnologías

- **Runtime:** Node.js
- **Framework:** Express.js
- **Base de Datos:** MySQL
- **Driver de MySQL:** mysql2
- **CORS:** Habilitado para permitir peticiones desde frontend separado

## 📁 Estructura del Proyecto

```
HOSPEDAJE_DIGITAL/
├── index.js                  # Punto de entrada del servidor
├── package.json              # Configuración de dependencias
├── src/
│   ├── app.js               # Configuración principal de Express
│   ├── database/
│   │   └── connection.js    # Conexión a MySQL
│   ├── controllers/
│   │   ├── Clientecontroller.js
│   │   └── habitaciones.controller.js
│   ├── models/
│   │   ├── Cliente.js
│   │   └── habitaciones.js
│   ├── routes/
│   │   ├── ClienteRoutes.js
│   │   └── habitaciones.routes.js
│   └── services/
│       ├── ClienteServices.js
│       └── habitacionesService.js
└── test/
```

## 🚀 Instalación

1. Clona el repositorio o descarga los archivos
2. Instala las dependencias:

```bash
npm install
```

3. Configura la base de datos MySQL en `src/database/connection.js`:

```javascript
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'tu_contraseña',
    database: 'hospedaje'
});
```

4. Asegúrate de tener creada la base de datos `hospedaje` con las tablas necesarias:
   - `habitacion`
   - `cliente`

## ▶️ Ejecución

### Modo desarrollo (con reinicio automático):

```bash
npm run dev
```

### Modo desarrollo con verificación previa de salud:

```bash
npm run dev:health
```

### Modo producción:

```bash
npm start
```

El servidor se ejecutará en: `http://localhost:3000`

## 📡 Endpoints de la API

### Habitaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/habitaciones` | Obtener todas las habitaciones |
| GET | `/api/habitaciones/:id` | Obtener una habitación por ID |
| POST | `/api/habitaciones` | Crear una nueva habitación |
| PUT | `/api/habitaciones/:id` | Actualizar una habitación |
| DELETE | `/api/habitaciones/:id` | Eliminar una habitación |

#### Estructura de datos - Habitación

```json
{
    "NombreHabitacion": "string",
    "ImagenHabitacion": "string",
    "Descripcion": "string",
    "Costo": "number",
    "Estado": "string"
}
```

### Clientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/clientes` | Obtener todos los clientes |
| GET | `/api/clientes/:id` | Obtener un cliente por ID |
| POST | `/api/clientes` | Crear un nuevo cliente |
| PUT | `/api/clientes/:id` | Actualizar un cliente |
| DELETE | `/api/clientes/:id` | Eliminar un cliente |

#### Estructura de datos - Cliente

```json
{
    "Nombre": "string",
    "Apellido": "string",
    "CorreoElectronico": "string",
    "Telefono": "string",
    "Direccion": "string",
    "NumeroDocumento": "string",
    "TipoDocumento": "string"
}
```

## 🧪 Pruebas

Puedes probar los endpoints usando herramientas como Postman o curl:

```bash
# Obtener todas las habitaciones
curl http://localhost:3000/api/habitaciones

# Obtener todos los clientes
curl http://localhost:3000/api/clientes
```

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia el servidor en modo producción |
| `npm run dev` | Inicia el servidor en modo desarrollo con nodemon |
| `npm run health` | Ejecuta validaciones de backend, DB e integración con frontend |
| `npm run dev:health` | Corre health check y luego inicia el backend en modo desarrollo |
| `npm run stop:port` | Libera el puerto 3000 cerrando procesos en escucha |
| `npm run start:clean` | Libera puerto 3000 y arranca backend en modo producción |
| `npm run dev:clean` | Libera puerto 3000 y arranca backend en modo desarrollo |
| `npm run dev:health:clean` | Libera puerto 3000, valida health y arranca en desarrollo |
| `npm test` | Ejecuta las pruebas (no configuradas) |

## ✅ Flujo recomendado local

1. Levantar backend con `npm run dev:health:clean`.
2. Confirmar que `Overall status: HEALTHY` aparezca en la salida.
3. Abrir frontend y validar que consuma `http://localhost:3000/api`.
4. Si algo falla, ejecutar `npm run health` para diagnostico rapido.

## 🌐 Conectar con Frontend

Este backend está configurado con **CORS** para permitir peticiones desde un frontend separado. 

### 📖 Guía Completa
Lee el archivo [`FRONTEND_EJEMPLO.md`](FRONTEND_EJEMPLO.md) para ver:
- ✅ Cómo estructurar carpetas separadas (frontend/backend)
- ✅ Ejemplos de código para consumir la API
- ✅ Ejemplos con JavaScript Vanilla, React, y más
- ✅ Solución de problemas comunes
- ✅ Configuración para producción

### 🚀 Inicio Rápido

**Desde tu frontend (JavaScript):**
```javascript
const API_URL = 'http://localhost:3000/api';

// Obtener habitaciones
fetch(`${API_URL}/habitaciones`)
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
```

**Desde tu frontend (React):**
```javascript
useEffect(() => {
    fetch('http://localhost:3000/api/habitaciones')
        .then(res => res.json())
        .then(data => setHabitaciones(data));
}, []);
```

## 📄 Licencia

ISC

## 👤 Autor

Proyecto desarrollado como parte del aprendizaje en Node.js y Express.
