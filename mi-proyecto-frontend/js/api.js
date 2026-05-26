// ============================================
// FUNCIONES DE API - SOLO BACKEND REAL
// ============================================

const API_BASE_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
    ? CONFIG.API_URL
    : 'http://localhost:3000/api';

const API_TIMEOUT_MS = (typeof CONFIG !== 'undefined' && CONFIG.FETCH_TIMEOUT)
    ? CONFIG.FETCH_TIMEOUT
    : 10000;

const apiLogger = {
    log: (...args) => {
        if (typeof CONFIG !== 'undefined' && CONFIG.ENABLE_LOGS) {
            console.log('[API]', ...args);
        }
    },
    error: (...args) => {
        console.error('[API ERROR]', ...args);
    }
};

const apiRuntimeState = {
    lastError: null
};

function setApiLastError(message) {
    apiRuntimeState.lastError = message;
}

function clearApiLastError() {
    apiRuntimeState.lastError = null;
}

function getApiLastError() {
    return apiRuntimeState.lastError;
}

async function extraerMensajeErrorRespuesta(response) {
    const contentType = response.headers.get('content-type') || '';

    try {
        if (contentType.includes('application/json')) {
            const data = await response.json();

            if (typeof data === 'string' && data.trim()) {
                return data.trim();
            }

            if (data && typeof data === 'object') {
                return data.message || data.mensaje || data.error || data.detail || null;
            }
        }

        const text = await response.text();
        return text?.trim() || null;
    } catch {
        return null;
    }
}

if (typeof window !== 'undefined') {
    window.getApiLastError = getApiLastError;
}

async function requestJson(endpoint, options = {}) {
    const {
        method = 'GET',
        body,
        allowNoContent = false
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const headers = {};
        if (body) headers['Content-Type'] = 'application/json';
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            signal: controller.signal,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
            if (response.status === 401) {
                sessionStorage.removeItem('token');
                localStorage.removeItem('token');
                const loginPath = window.location.pathname.includes('pages/')
                    ? '../login.html'
                    : 'login.html';
                if (!window.location.pathname.endsWith('login.html')) {
                    window.location.href = loginPath;
                }
            }
            const mensajeBackend = await extraerMensajeErrorRespuesta(response);
            const mensajeError = mensajeBackend
                ? mensajeBackend
                : `${method} ${endpoint} -> ${response.status} ${response.statusText}`;

            throw new Error(mensajeError);
        }

        if (allowNoContent && response.status === 204) {
            return { success: true };
        }

        try {
            const data = await response.json();
            clearApiLastError();
            return data;
        } catch {
            clearApiLastError();
            return allowNoContent ? { success: true } : null;
        }
    } catch (error) {
        setApiLastError(error.message || 'Error de conexión con el backend');
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function obtenerHabitaciones() {
    apiLogger.log('Obteniendo habitaciones...');
    try {
        const data = await requestJson('/habitaciones');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener habitaciones:', error.message);
        return [];
    }
}

async function obtenerHabitacionPorId(id) {
    apiLogger.log('Obteniendo habitaci�n por ID:', id);
    try {
        return await requestJson(`/habitaciones/${id}`);
    } catch (error) {
        apiLogger.error('Error al obtener habitaci�n:', error.message);
        return null;
    }
}

async function crearHabitacion(habitacion) {
    apiLogger.log('Creando habitaci�n:', habitacion);
    try {
        return await requestJson('/habitaciones', { method: 'POST', body: habitacion });
    } catch (error) {
        apiLogger.error('Error al crear habitaci�n:', error.message);
        return null;
    }
}

async function actualizarHabitacion(id, habitacion) {
    apiLogger.log('Actualizando habitaci�n:', id, habitacion);
    try {
        return await requestJson(`/habitaciones/${id}`, { method: 'PUT', body: habitacion });
    } catch (error) {
        apiLogger.error('Error al actualizar habitaci�n:', error.message);
        return null;
    }
}

async function eliminarHabitacion(id) {
    apiLogger.log('Eliminando habitaci�n:', id);
    try {
        return await requestJson(`/habitaciones/${id}`, { method: 'DELETE', allowNoContent: true });
    } catch (error) {
        apiLogger.error('Error al eliminar habitaci�n:', error.message);
        return null;
    }
}




async function obtenerServicios() {
    apiLogger.log('Obteniendo servicios...');
    try {
        const data = await requestJson('/servicios');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener servicios:', error.message);
        return [];
    }
}

async function obtenerServicioPorId(id) {
    apiLogger.log('Obteniendo servicio por ID:', id);
    try {
        return await requestJson(`/servicios/${id}`);
    } catch (error) {
        apiLogger.error('Error al obtener servicio:', error.message);
        return null;
    }
}

async function crearServicio(servicio) {
    apiLogger.log('Creando servicio:', servicio);
    try {
        return await requestJson('/servicios', { method: 'POST', body: servicio });
    } catch (error) {
        apiLogger.error('Error al crear servicio:', error.message);
        return null;
    }
}

async function actualizarServicio(id, servicio) {
    apiLogger.log('Actualizando servicio:', id, servicio);
    try {
        return await requestJson(`/servicios/${id}`, { method: 'PUT', body: servicio });
    } catch (error) {
        apiLogger.error('Error al actualizar servicio:', error.message);
        return null;
    }
}

async function eliminarServicio(id) {
    apiLogger.log('Eliminando servicio:', id);
    try {
        return await requestJson(`/servicios/${id}`, { method: 'DELETE', allowNoContent: true });
    } catch (error) {
        apiLogger.error('Error al eliminar servicio:', error.message);
        return null;
    }
}

async function obtenerClientes() {
    apiLogger.log('Obteniendo clientes...');
    try {
        const data = await requestJson('/clientes');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener clientes:', error.message);
        return [];
    }
}

async function obtenerClientePorId(id) {
    apiLogger.log('Obteniendo cliente por ID:', id);
    try {
        return await requestJson(`/clientes/${id}`);
    } catch (error) {
        apiLogger.error('Error al obtener cliente:', error.message);
        return null;
    }
}

async function crearCliente(cliente) {
    apiLogger.log('Creando cliente:', cliente);
    try {
        return await requestJson('/clientes', { method: 'POST', body: cliente });
    } catch (error) {
        apiLogger.error('Error al crear cliente:', error.message);
        return null;
    }
}

async function actualizarCliente(id, cliente) {
    apiLogger.log('Actualizando cliente:', id, cliente);
    try {
        return await requestJson(`/clientes/${id}`, { method: 'PUT', body: cliente });
    } catch (error) {
        apiLogger.error('Error al actualizar cliente:', error.message);
        return null;
    }
}

async function eliminarCliente(id) {
    apiLogger.log('Eliminando cliente:', id);
    try {
        return await requestJson(`/clientes/${id}`, { method: 'DELETE' });
    } catch (error) {
        apiLogger.error('Error al eliminar cliente:', error.message);
        return null;
    }
}

// ── Usuarios ─────────────────────────────────────────────────────────────────

async function obtenerUsuarios() {
    try {
        const data = await requestJson('/usuarios');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener usuarios:', error.message);
        throw error;
    }
}

async function crearUsuario(usuario) {
    try {
        return await requestJson('/usuarios', { method: 'POST', body: usuario });
    } catch (error) {
        apiLogger.error('Error al crear usuario:', error.message);
        throw error;
    }
}

async function actualizarUsuario(id, usuario) {
    try {
        return await requestJson(`/usuarios/${id}`, { method: 'PUT', body: usuario });
    } catch (error) {
        apiLogger.error('Error al actualizar usuario:', error.message);
        throw error;
    }
}

async function eliminarUsuario(id) {
    try {
        return await requestJson(`/usuarios/${id}`, { method: 'DELETE', allowNoContent: true });
    } catch (error) {
        apiLogger.error('Error al eliminar usuario:', error.message);
        throw error;
    }
}

async function cambiarEstadoUsuario(id, activo) {
    try {
        return await requestJson(`/usuarios/${id}/status`, { method: 'PATCH', body: { IsActive: activo ? 1 : 0 } });
    } catch (error) {
        apiLogger.error('Error al cambiar estado del usuario:', error.message);
        throw error;
    }
}

// ── Roles ─────────────────────────────────────────────────────────────────────

async function obtenerRoles() {
    try {
        const data = await requestJson('/roles');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener roles:', error.message);
        return [];
    }
}

async function crearRol(rol) {
    try {
        return await requestJson('/roles', { method: 'POST', body: rol });
    } catch (error) {
        apiLogger.error('Error al crear rol:', error.message);
        throw error;
    }
}

async function actualizarRol(id, rol) {
    try {
        return await requestJson(`/roles/${id}`, { method: 'PUT', body: rol });
    } catch (error) {
        apiLogger.error('Error al actualizar rol:', error.message);
        throw error;
    }
}

async function eliminarRol(id) {
    try {
        return await requestJson(`/roles/${id}`, { method: 'DELETE', allowNoContent: true });
    } catch (error) {
        apiLogger.error('Error al eliminar rol:', error.message);
        throw error;
    }
}

async function cambiarEstadoRol(id, activo) {
    try {
        return await requestJson(`/roles/${id}/status`, { method: 'PATCH', body: { Estado: activo ? 'activo' : 'inactivo' } });
    } catch (error) {
        apiLogger.error('Error al cambiar estado del rol:', error.message);
        throw error;
    }
}

// ── Permisos ──────────────────────────────────────────────────────────────────

async function obtenerPermisos() {
    try {
        const data = await requestJson('/permisos');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        apiLogger.error('Error al obtener permisos:', error.message);
        return [];
    }
}

async function crearPermiso(permiso) {
    try {
        return await requestJson('/permisos', { method: 'POST', body: permiso });
    } catch (error) {
        apiLogger.error('Error al crear permiso:', error.message);
        throw error;
    }
}

async function actualizarPermiso(id, permiso) {
    try {
        return await requestJson(`/permisos/${id}`, { method: 'PUT', body: permiso });
    } catch (error) {
        apiLogger.error('Error al actualizar permiso:', error.message);
        throw error;
    }
}

async function eliminarPermiso(id) {
    try {
        return await requestJson(`/permisos/${id}`, { method: 'DELETE', allowNoContent: true });
    } catch (error) {
        apiLogger.error('Error al eliminar permiso:', error.message);
        throw error;
    }
}

async function cambiarEstadoPermiso(id, activo) {
    try {
        return await requestJson(`/permisos/${id}/status`, { method: 'PATCH', body: { EstadoPermisos: activo ? 'activo' : 'inactivo' } });
    } catch (error) {
        apiLogger.error('Error al cambiar estado del permiso:', error.message);
        throw error;
    }
}

