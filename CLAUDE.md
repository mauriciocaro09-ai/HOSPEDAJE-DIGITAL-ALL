# CLAUDE.md — Hospedaje Digital

> Leé este archivo COMPLETO al inicio de cada sesión antes de tocar cualquier código.

---

## Descripción del proyecto

Sistema de gestión hotelera "Hospedaje Digital".
- **Backend**: Node.js + Express + MySQL (mysql2) — carpeta `BACKEND/`
- **Frontend**: HTML/CSS/JS vanilla — carpeta `mi-proyecto-frontend/`
- **DB local (desarrollo)**: MySQL vía XAMPP, puerto 3306
- **Puerto backend local**: 3000

## Arquitectura en producción (cloud)

| Componente | Servicio | URL |
|---|---|---|
| Frontend | Vercel | `hospedaje-digital-all.vercel.app` |
| Backend | Render (free, Node.js) | `hospedaje-digital-all.onrender.com` |
| Base de datos | Clever Cloud (MySQL) | `b7e34wumurbndvqprjto-mysql.services.clever-cloud.com` |
| Emails | Brevo API | — |

**Netlify reemplazado por Vercel** el 29/05/2026 (cuenta suspendida).
**Cold start de Render**: hasta 50s en instancia free — el frontend tiene `FETCH_TIMEOUT: 30000ms`.

### Variables de entorno en Render
- `CORS_ORIGIN`: `https://hospedaje-digital-all.vercel.app`
- `FRONTEND_URL`: `https://hospedaje-digital-all.vercel.app` (links en emails de reset password)
- `DB_HOST`: Clever Cloud
- `BREVO_API_KEY`, `BREVO_USER`, `BREVO_PASS`: configurados

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

## Estado de funcionalidades (al 30/05/2026)

### ✅ Funcionando — Admin
- Login y autenticación JWT — al hacer login siempre arranca en el dashboard
- CRUD habitaciones, servicios, clientes, paquetes, reservas, usuarios, roles con SweetAlert2
- Dashboard admin con estadísticas
- Landing page: registro, modales detalle + carrusel, sin límite de items
- Sidebar colapsado con tooltip, permisos eliminado del panel

### ✅ Funcionando — Portal cliente (cliente.html)
- Registro desde landing + correo de bienvenida (Brevo)
- Login con redirección por rol (rol=1 → admin, resto → cliente.html)
- Panel de Control: estadísticas de reservas del usuario
- Mis Reservas: listado, detalle en modal (con servicios y paquetes), cancelar
- Nueva Reserva: habitación, fechas, método de pago, servicios, paquetes, IVA, total
- Correo de confirmación de reserva con monto total correcto
- Mi Perfil: ver datos + editar (nombre, apellido, email, teléfono, país) + cambiar contraseña
- Reset password: link apunta a Vercel, token JWT 30min

### ✅ Infraestructura
- Frontend en Vercel (reemplazó Netlify el 29/05/2026)
- Backend en Render con auto-deploy desde GitHub
- BD en Clever Cloud (MySQL)
- Tablas `detallereservaservicio` y `detallereservapaquetes` se crean automáticamente al iniciar

### 🔧 Pendiente
- (ninguno — todo funcional al 30/05/2026)

---

## Base de datos MySQL

- **Local**: MySQL vía XAMPP, puerto 3306, DB: `hospedaje`
- **Producción**: Clever Cloud MySQL (ver `DB_HOST` en Render → Environment)
- Tablas principales: `habitacion`, `servicio`, `paquete`, `reserva`, `cliente`, `usuarios`, `estadosreserva`, `metodopago`, `detallereservapaquetes`, `detallereservaservicio`

### Columnas importantes — tabla `reserva` (Clever Cloud)
| Columna real | Nota |
|---|---|
| `NroDocumentoCliente` | FK a `cliente.NroDocumento` |
| `Sub_Total` | Subtotal sin IVA (con guión bajo) |
| `Monto_Total` | Total con IVA (con guión bajo) |
| `id_usuario` | FK a `usuarios.IDUsuario` |
| `MetodoPago` | FK a `metodopago.IdMetodoPago` |

> **CRÍTICO**: El modelo `reservas.model.js` usa `SHOW COLUMNS` dinámico. Los nombres de columna son case-sensitive. `Sub_Total` ≠ `SubTotal`.

### Otras columnas importantes
- `habitacion`: `IDHabitacion`, `NombreHabitacion` (VARCHAR 100), `Descripcion` (TEXT), `Costo`, `Estado`, `ImagenHabitacion`
- `paquete` (sin s): `IDPaquete`, `NombrePaquete`, `Descripcion`, `PrecioPaquete`, `DuracionNoches`, `IncluirHabitacion`, `Imagen`, `Estado`
- `servicio` (sin s): `IDServicio`, `NombreServicio`, `Descripcion`, `Costo`, `Imagen`, `Estado`

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

9. **`FRONTEND_URL` con salto de línea invisible**: Render puede agregar `\n` al copiar/pegar env vars. El email service tiene `.trim()` para prevenirlo. Si los links del correo rompen, verificar que `FRONTEND_URL` no tenga caracteres invisibles.

10. **`actualizarPerfil` con campos undefined**: mysql2 lanza error si recibe `undefined` como parámetro SQL. El controller usa UPDATE dinámico — solo actualiza campos presentes en el body.

11. **Tabla `paquete` vs `paquetes`**: la tabla real con datos es `paquete` (sin s). Existe también `paquetes` (con s) del schema.sql pero con estructura diferente. Siempre hacer JOIN con `paquete` en queries de detalle de reserva.
