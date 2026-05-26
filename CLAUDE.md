# CLAUDE.md — Hospedaje Digital

> Leé este archivo COMPLETO al inicio de cada sesión antes de tocar cualquier código.

---

## Descripción del proyecto

Sistema de gestión hotelera "Hospedaje Digital".
- **Backend**: Node.js + Express + MySQL (mysql2) — carpeta `BACKEND/`
- **Frontend**: HTML/CSS/JS vanilla — carpeta `mi-proyecto-frontend/`
- **DB**: MySQL corriendo en XAMPP (Windows), puerto 3306
- **Puerto backend**: 3000

---

## Comandos importantes

```bash
# Arrancar backend (desde carpeta BACKEND/)
cd BACKEND && npm start

# Verificar sintaxis de un archivo JS
node --check archivo.js

# Verificar TODOS los archivos del backend
for f in BACKEND/src/controllers/*.js BACKEND/src/routes/*.js BACKEND/src/services/*.js BACKEND/src/models/*.js BACKEND/src/app.js BACKEND/index.js; do node --check "$f" && echo "OK: $f" || echo "ERROR: $f"; done
```

---

## Estructura del backend

```
BACKEND/
├── index.js                    # Punto de entrada
├── .env                        # Variables de entorno (NO subir a git)
├── scripts/
│   ├── poblar_habitaciones.js              # Pobla habitaciones vacías en la BD
│   ├── ampliar_columnas_habitacion.js      # ALTER TABLE habitacion (VARCHAR→TEXT)
│   └── update_imagenes_paquetes_servicios.js  # Pobla imgs+desc de paquetes y servicios
├── src/
│   ├── app.js                  # Express app + rutas montadas
│   ├── config/db.js            # Conexión MySQL (mysql2) con typeCast utf8
│   ├── middlewares/
│   │   └── auth.middleware.js  # verificarToken (JWT)
│   ├── controllers/            # Lógica de cada endpoint
│   ├── routes/                 # Definición de rutas
│   ├── services/               # Capa de negocio
│   └── models/                 # Queries a la BD
```

### Rutas API montadas en app.js

| Ruta | Auth requerida |
|------|---------------|
| `/api/auth` | No |
| `/api/habitaciones` | No (lectura), Sí (escritura) |
| `/api/servicios` | No (lectura), Sí (escritura) |
| `/api/paquetes` | No (lectura), Sí (escritura) |
| `/api/contacto` | No |
| `/api/dashboard` | Sí |
| `/api/clientes` | Sí |
| `/api/reservas` | Sí |
| `/api/usuarios` | Sí |
| `/api/roles` | Sí |
| `/api/permisos` | Sí |

### Endpoints importantes de habitaciones
- `GET /api/habitaciones` — todas (sin filtro, para admin CRUD)
- `GET /api/habitaciones/disponibles` — solo Estado=1 (para landing page y formulario de reservas)

---

## Estructura del frontend

```
mi-proyecto-frontend/
├── index.html                  # Admin panel principal
├── login.html
├── pages/
│   ├── landingpage.html        # Landing pública
│   ├── paquetes.html           # Vista standalone paquetes
│   ├── perfil.html
│   └── register.html
├── js/
│   ├── app.js                  # Lógica principal del admin (~2755 líneas)
│   ├── api.js                  # requestJson(), BASE_URL + CRUD usuarios/roles/permisos
│   ├── paquetes.js             # CRUD paquetes admin
│   ├── reservas.js             # CRUD reservas admin (IIFE)
│   ├── usuarios.js             # CRUD usuarios admin
│   ├── roles.js                # CRUD roles admin
│   ├── dashboard.js            # Panel de estadísticas
│   ├── dashboard-inject.js     # Inyecta HTML del dashboard
│   ├── auth.js                 # Login/logout
│   ├── login.js                # Maneja form de login (redirige siempre a dashboard)
│   ├── validation.js           # Validaciones de formularios
│   └── toast.js                # Toasts de éxito/error
└── css/
```

> **NOTA**: El módulo `permisos.js` existe en el archivo pero fue eliminado del sidebar y su sección de index.html — no se usa en el admin.

---

## Flujo de navegación del admin (index.html)

`cargarSeccion(nombre)` en `app.js` controla qué sección se muestra.

| Sección | Función llamada |
|---------|----------------|
| `administrar-habitaciones` | `cargarHabitacionesAdmin()` |
| `administrar-servicios` | `cargarServiciosAdmin()` |
| `administrar-clientes` | `cargarClientesAdmin()` |
| `administrar-paquetes` | `initPaquetes()` (de paquetes.js) |
| `administrar-reservas` | `inicializarReservasAdmin()` (de reservas.js) |
| `administrar-usuarios` | `cargarUsuariosAdmin()` (de usuarios.js) |
| `administrar-roles` | `cargarRolesAdmin()` (de roles.js) |
| `dashboard` | `cargarDashboard()` (de dashboard.js) |

**IMPORTANTE**: Las funciones de cada módulo se exponen en `window.X` al final de cada archivo JS (porque los `onclick` del HTML las necesitan globales).

---

## Landing page (landingpage.html)

- Muestra **TODAS** las habitaciones/paquetes/servicios activos (sin límite de 6).
- Filtro por Estado:
  - Habitaciones: endpoint `/habitaciones/disponibles` (Estado=1)
  - Paquetes: endpoint `/paquetes` (soloActivos=true por defecto en backend)
  - Servicios: endpoint `/servicios?soloActivos=true`
- Modales de detalle con carrusel para habitaciones, paquetes y servicios.
  - **Habitaciones**: función `abrirDetalleHab(btn)`, datos en `window._habDetalleData[]`
  - **Paquetes**: función `abrirDetallePaq(btn)`, datos en `window._paqDetalleData[]`
  - **Servicios**: función `abrirDetalleSrv(btn)`, datos en `window._srvDetalleData[]`
- Registro de nuevos clientes usa **SweetAlert2** para todos los feedbacks (campos incompletos, contraseñas distintas, éxito, error servidor, sin conexión).
- Fallback de imágenes: `onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400'"`

---

## Regla de visibilidad activo/inactivo

| Vista | Habitaciones | Paquetes | Servicios |
|-------|-------------|----------|-----------|
| Landing page | Solo Estado=1 | Solo Estado=1 | Solo Estado=1 |
| Admin CRUD | Todos (para gestionar) | Todos (`admin=true`) | Todos |
| Formulario nueva reserva (selector) | Solo Estado=1 | Solo Estado=1 | Solo Estado=1 |
| Admin reservas — listado visual | Solo Estado=1 | Solo Estado=1 | Solo Estado=1 |

**Habitaciones "reservadas"**: el sistema valida cruce de fechas en el formulario de reservas (función `hayCruceDeFechasConReservas`) y el datepicker bloquea fechas ocupadas. Las habitaciones con reserva activa siguen apareciendo en el listado (pueden estar disponibles en otras fechas).

---

## Configuración crítica del backend

### db.js — typeCast obligatorio
mysql2 devuelve columnas TEXT/VARCHAR como Buffer en ciertas configuraciones. **SIEMPRE** debe tener este typeCast en el pool:

```javascript
typeCast(field, next) {
    if (field.type === 'BLOB' || field.type === 'VAR_STRING' || field.type === 'STRING') {
        const val = field.string('utf8');  // 'utf8' NO 'utf8mb4' — ese último no es válido en Node.js
        return val === null ? null : val;
    }
    return next();
}
```

Si se elimina este bloque, los campos de texto vuelven como objetos `{type:"Buffer",data:[...]}` y todo el frontend se rompe con 500.

---

## SweetAlert2 — confirmaciones de eliminación

Todos los módulos del admin usan `Swal.fire()` para confirmar eliminaciones:
- `eliminarHabitacionAdmin` — app.js
- `eliminarServicioAdmin` — app.js
- `eliminarClienteAdmin` — app.js
- `eliminarReservaAdmin` — reservas.js
- `eliminarPaquete` — paquetes.js
- `eliminarRol` — roles.js
- `eliminarUsuario` — usuarios.js

SweetAlert2 está cargado en `index.html` vía CDN (línea ~1011).

---

## Sidebar del admin

- **Colapsado**: iconos centrados con `display: none` en `.text` (NO `visibility: hidden` — ese ocupa espacio y desalinea)
- **Tooltip al hover**: implementado con div `#sidebar-nav-tip` posicionado FUERA del sidebar (evita el clip de `overflow-x: hidden`)
- **Permisos**: eliminado del sidebar y de index.html (no requerido por el proyecto)
- **Al hacer login**: siempre redirige al dashboard (login.js setea `hospedaje_ultima_seccion = 'dashboard'`)

---

## Imágenes

- **Formato en BD**: URLs de Unsplash separadas por coma en el campo `ImagenHabitacion` (ej: `url1,url2,url3,url4`)
- **Parsing**: función `obtenerImagenesDetalleHabitacion(valor)` en app.js maneja formato JSON array Y formato separado por comas
- **Fallback onerror**: `this.onerror=null;this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400'`
- **`assets/images/default.svg` NO EXISTE** — nunca usar esa ruta como fallback
- Al asignar fotos de Unsplash, verificar que el photo ID sea válido con `curl -o /dev/null -w "%{http_code}" URL` antes de guardarlo

---

## Archivos más propensos a corromperse

> **ADVERTENCIA**: GitHub Copilot y otros AIs han truncado estos archivos en el pasado.
> Siempre verificar con `node --check` antes y después de editar.

| Archivo | Riesgo | Solución si se corrompe |
|---------|--------|------------------------|
| `mi-proyecto-frontend/js/app.js` | Alto | Restaurar desde git y re-agregar funciones nuevas |
| `mi-proyecto-frontend/js/paquetes.js` | Alto | Reescribir con Python |
| `BACKEND/src/controllers/paquetes.controller.js` | Alto | Reescribir con Python `open(filepath, 'w', newline='\r\n')` |
| `BACKEND/src/controllers/habitaciones.controller.js` | Medio | Reescribir con Python |
| `BACKEND/src/controllers/reservas.controller.js` | Medio | Reescribir con Python |

**REGLA CRÍTICA**: Siempre usar Python para escribir archivos largos en Windows:
```python
with open(filepath, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)
```
Nunca usar el tool `Edit` para archivos largos en Windows — puede truncar.

---

## Estado de funcionalidades (al 25/05/2026)

### ✅ Funcionando
- Login y autenticación JWT — al hacer login siempre arranca en el dashboard
- CRUD habitaciones (admin): crear, editar, eliminar con SweetAlert2, toggle estado, imagen
- CRUD servicios (admin): crear, editar, eliminar con SweetAlert2, toggle estado, imagen
- CRUD clientes (admin): crear, editar, eliminar con SweetAlert2
- CRUD paquetes (admin): crear, editar, eliminar con SweetAlert2, toggle estado, subir imagen
- CRUD reservas (admin): ver, crear, actualizar estado, cancelar, eliminar con SweetAlert2
- CRUD usuarios y roles (admin) con SweetAlert2
- Landing page: todas las hab/paquetes/servicios activos con modales detalle + carrusel
- Landing page: registro de clientes con SweetAlert2
- Landing page: sin límite de 6 items — muestra todos los activos
- Sidebar colapsado: iconos alineados, tooltip al hover
- Permisos eliminado del sidebar y del panel
- Filtro activo/inactivo aplicado en todas las vistas correctamente
- Imágenes de habitaciones cargan correctamente (typeCast + fallback válido)
- mysql2 typeCast corregido (encoding 'utf8', no 'utf8mb4')
- Habitaciones en BD: todas con nombre, descripción, costo e imágenes
- Paquetes y servicios en BD: todos con imágenes Unsplash (4 por ítem) y descripciones completas
- `maxlength` corregido en todos los formularios (index.html, landingpage.html, register.html)
- `autocomplete` agregado en campos de email y contraseña (landingpage, register, index, login)
- MySQL: `habitacion.NombreHabitacion` ampliado de VARCHAR(30) a VARCHAR(100)
- MySQL: `habitacion.Descripcion` ampliado de VARCHAR(255) a TEXT

### 🔧 Pendiente
- (ninguno — todo funcional al 25/05/2026)

---

## Base de datos MySQL

- Motor: MySQL vía XAMPP
- Puerto: 3306
- DB name: `hospedaje` (minúsculas en .env, MySQL en Windows es case-insensitive)
- Tablas principales: `habitacion`, `servicio`, `paquete`, `reserva`, `clientes`, `usuarios`, `estadosreserva`, `metodopago`, `detallereservapaquetes`

### Columnas importantes
- `habitacion`: `IDHabitacion`, `NombreHabitacion` (VARCHAR 100), `Descripcion` (TEXT), `Costo`, `Estado`, `ImagenHabitacion`
- `paquete`: `IDPaquete`, `NombrePaquete`, `Descripcion`, `PrecioPaquete`, `DuracionNoches`, `IncluirHabitacion`, `Imagen`, `Estado`
- `servicio`: `IDServicio`, `NombreServicio`, `Descripcion`, `Costo`, `Imagen`, `Estado`
- `reserva`: `IdReserva`, `IDCliente`/`IdCliente`, `IDHabitacion`, `FechaInicio`, `FechaFinalizacion`, `IdEstadoReserva`, `MontoTotal`

### Script útil para poblar habitaciones vacías
```bash
node BACKEND/scripts/poblar_habitaciones.js
```

---

## Historial de problemas recurrentes

1. **`TypeError: argument handler must be a function`** en routes: una ruta referencia una función que no existe en el controller. Revisar que todas las funciones en las rutas estén exportadas en el controller.

2. **Archivos truncados**: el tool `Edit` en Windows con archivos CRLF puede truncar archivos. Siempre verificar con `node --check` después de editar. Usar Python para reescribir si está truncado.

3. **`MODULE_NOT_FOUND`**: un controller/service hace `require` de un archivo que no existe. Verificar que el archivo referenciado exista en `services/` o `models/`.

4. **mysql2 devuelve Buffers en vez de strings**: ocurre cuando la columna MySQL tiene charset problemático. Solución: typeCast en db.js con `field.string('utf8')`. Si se ve `{type:'Buffer',data:[...]}` en el JSON → falta el typeCast o fue eliminado.

5. **Imágenes no cargan**: verificar (a) que el typeCast esté en db.js, (b) que la URL del onerror sea válida (no `assets/images/default.svg`), (c) que los photo IDs de Unsplash sean reales (testear con curl antes de guardar).

6. **`const` no accesible desde `onclick`**: funciones declaradas como `const` en scripts no son propiedades de `window`. Siempre agregar `window.nombreFuncion = nombreFuncion` al final del script.

7. **Tooltip del sidebar clipeado**: NO usar `position: absolute` con `::after` — el `overflow-x: hidden` del sidebar lo corta. Usar el div `#sidebar-nav-tip` con `position: fixed` fuera del sidebar en el DOM.

8. **URLs Unsplash inválidas**: al asignar fotos nuevas, verificar con `curl -s -o /dev/null -w "%{http_code}" URL`. Códigos 404 = photo ID inválido → imagen rota.
