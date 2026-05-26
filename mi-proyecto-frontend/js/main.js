/**
 * Script principal de Hospedaje Digital
 * Lógica compartida entre páginas
 */

window.API_URL = window.API_URL || ((typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : 'http://localhost:3000/api');

function getAppBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
}

function getModuleHref(modulePageName) {
    const isInsidePagesFolder = window.location.pathname.includes('/pages/');
    return isInsidePagesFolder ? modulePageName : `pages/${modulePageName}`;
}

function getStoredSession() {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const user = sessionStorage.getItem('usuario') || localStorage.getItem('user') || localStorage.getItem('usuario');

    if (!token || !user) {
        return null;
    }

    try {
        return {
            token,
            usuario: JSON.parse(user),
        };
    } catch (error) {
        return null;
    }
}

function getRoleName(rolId) {
    const rolesById = {
        1: 'Administrador',
        2: 'Cliente',
        3: 'Gerente',
        4: 'Recepcionista',
    };

    if (rolId === null || rolId === undefined) return 'Desconocido';

    if (typeof rolId === 'object') {
        rolId = rolId.IDRol ?? rolId.rol ?? rolId.id ?? rolId.Nombre;
    }

    const asNumber = Number(rolId);
    if (Number.isFinite(asNumber) && rolesById[asNumber]) {
        return rolesById[asNumber];
    }

    if (typeof rolId === 'string') {
        const trimmed = rolId.trim();
        const normalized = trimmed.toLowerCase();
        const rolesByName = {
            administrador: 'Administrador',
            admin: 'Administrador',
            cliente: 'Cliente',
            usuario: 'Usuario',
            gerente: 'Gerente',
            recepcionista: 'Recepcionista',
        };

        if (rolesByName[normalized]) return rolesByName[normalized];

        if (trimmed && !Number.isFinite(Number(trimmed))) return trimmed;
    }

    return 'Desconocido';
}

async function loadSidebarComponent(containerId = 'sidebar-placeholder') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('Contenedor para sidebar no encontrado:', containerId);
        return null;
    }

    try {
        const basePath = getAppBasePath();
        const sidebarUrl = `${basePath}components/sidebar.html`;
        const response = await fetch(sidebarUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        while (tempDiv.firstChild) {
            container.parentNode.insertBefore(tempDiv.firstChild, container);
        }
        container.remove();
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) throw new Error('Sidebar element not found after insertion');
        initSidebarControls();
        return sidebar;
    } catch (error) {
        console.error('Error al cargar el sidebar:', error);
        return null;
    }
}

async function filterSidebarByPermissions() {
    try {
        const session = getStoredSession();
        if (!session) return;
        const user = session.usuario;
        if (!user || !user.IDRol) return;
        const apiUrl = window.API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/roles/${user.IDRol}`, {
            headers: { 'Authorization': `Bearer ${session.token}` }
        });
        if (!response.ok) return;
        const rol = await response.json();
        let permisos = [];
        if (rol.Permisos) permisos = typeof rol.Permisos === 'string' ? JSON.parse(rol.Permisos) : rol.Permisos;
        if (permisos && Array.isArray(permisos) && permisos.length > 0) {
            const sidebarItems = document.querySelectorAll('.sidebar-item[data-module]');
            sidebarItems.forEach(item => {
                const module = item.getAttribute('data-module');
                if (module && !permisos.includes(module)) {
                    item.style.display = 'none';
                }
            });
        }
    } catch (error) {
        console.warn('No se pudo filtrar el sidebar:', error);
    }
}

function cargarSeccion(seccion, event) {
    if (event) event.preventDefault();
    if (seccion === 'dashboard') {
        mostrarSeccion('seccion-dashboard');
        initDashboard();
        return;
    }
    const seccionesLocales = {
        'habitaciones': 'seccion-administrar-habitaciones',
        'administrar-habitaciones': 'seccion-administrar-habitaciones',
        'servicios': 'seccion-administrar-servicios',
        'administrar-servicios': 'seccion-administrar-servicios',
        'paquetes': 'seccion-administrar-paquetes',
        'administrar-paquetes': 'seccion-administrar-paquetes',
        'clientes': 'seccion-administrar-clientes',
        'administrar-clientes': 'seccion-administrar-clientes',
        'reservas': 'seccion-administrar-reservas',
        'administrar-reservas': 'seccion-administrar-reservas',
        'usuarios': 'seccion-administrar-usuarios',
        'administrar-usuarios': 'seccion-administrar-usuarios',
        'roles': 'seccion-administrar-roles',
        'administrar-roles': 'seccion-administrar-roles',
        'permisos': 'seccion-administrar-permisos',
        'administrar-permisos': 'seccion-administrar-permisos',
    };

    const idSeccion = seccionesLocales[seccion];
    if (idSeccion) {
        mostrarSeccion(idSeccion);
        return;
    }

    if (seccion === 'perfil') { window.location.href = getModuleHref('perfil.html'); return; }
}

async function apiRequest(endpoint, options = {}) {
    const session = getStoredSession();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}), };
    if (session?.token) headers.Authorization = `Bearer ${session.token}`;
    const response = await fetch(`${window.API_URL}${endpoint}`, { ...options, headers, });
    let payload = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) payload = await response.json(); else payload = await response.text();
    if (!response.ok) { const message = payload?.message || payload?.error || payload?.mensaje || 'Error en la solicitud'; throw new Error(message); }
    return payload;
}

function verificarSesion() { return getStoredSession(); }
function cerrarSesion() { if (confirm('¿Estás seguro de que deseas cerrar sesión?')) { sessionStorage.removeItem('token'); sessionStorage.removeItem('usuario'); localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('usuario'); const isInsidePagesFolder = window.location.pathname.includes('/pages/'); window.location.href = isInsidePagesFolder ? '../login.html' : 'login.html'; } }
async function apiCall(endpoint, method = 'GET', data = null) {
    const sesion = verificarSesion();
    const token = sesion ? sesion.token : null;
    const options = { method, headers: { 'Content-Type': 'application/json', }, };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) options.body = JSON.stringify(data);
    try {
        const response = await fetch(`${window.API_URL}${endpoint}`, options);
        if (!response.ok) { const error = await response.json(); throw { status: response.status, message: error.error || error.message || 'Error en la solicitud', }; }
        return await response.json();
    } catch (error) { console.error('Error en API:', error); throw error; }
}

async function fillUserInfoInSidebar() {
    try {
        const session = getStoredSession();
        if (!session || !session.usuario) return;
        const user = session.usuario;
        const emailElement = document.getElementById('sidebar-user-email');
        const roleElement = document.getElementById('sidebar-user-role');
        if (emailElement) { emailElement.textContent = user.Email || user.email || '-'; }
        if (roleElement) {
            let roleName = 'Rol: ';
            const nombreRol = user.NombreRol;
            if (nombreRol && typeof nombreRol === 'string' && nombreRol.trim() !== '' && !/^\d+$/.test(nombreRol)) { roleName += nombreRol;
            } else if (user.IDRol) {
                const mappedRole = getRoleName(user.IDRol);
                if (mappedRole !== 'Desconocido') { roleName += mappedRole; } else { try { const apiUrl = window.API_URL || 'http://localhost:3000/api'; const response = await fetch(`${apiUrl}/roles/${user.IDRol}`, { headers: { 'Authorization': `Bearer ${session.token}` } }); if (response.ok) { const rolData = await response.json(); roleName += rolData.Nombre || `Rol #${user.IDRol}`; } else { roleName += `Rol #${user.IDRol}`; } } catch (apiError) { console.warn('Error al consultar rol:', apiError); roleName += `Rol #${user.IDRol}`; } }
            } else { roleName += 'Desconocido'; }
            roleElement.textContent = roleName;
        }
    } catch (error) { console.warn('No se pudo llenar la información del usuario:', error); }
}

async function initSidebarControls() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const closeBtn = document.getElementById('sidebar-close');
    const overlay = document.getElementById('sidebar-overlay');
    const mainWrapper = document.getElementById('main-wrapper');
    if (!sidebar || !toggle) return;
    if (sidebar.dataset.initialized === 'true') return;
    sidebar.dataset.initialized = 'true';
    await fillUserInfoInSidebar();
    await filterSidebarByPermissions();
    function openSidebar() { sidebar.classList.add('open'); overlay?.classList.add('active'); mainWrapper?.classList.add('sidebar-open'); }
    function closeSidebar() { sidebar.classList.remove('open'); overlay?.classList.remove('active'); mainWrapper?.classList.remove('sidebar-open'); }
    toggle.addEventListener('click', () => { sidebar.classList.contains('open') ? closeSidebar() : openSidebar(); });
    overlay?.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sidebar.classList.contains('open')) { closeSidebar(); } });
}

window.getAppBasePath = getAppBasePath;
window.getStoredSession = getStoredSession;
window.getRoleName = getRoleName;
window.loadSidebarComponent = loadSidebarComponent;
window.filterSidebarByPermissions = filterSidebarByPermissions;
window.fillUserInfoInSidebar = fillUserInfoInSidebar;
window.apiRequest = apiRequest;
window.verificarSesion = verificarSesion;
window.cerrarSesion = cerrarSesion;
window.cargarSeccion = cargarSeccion;
window.initSidebarControls = initSidebarControls;

// Función para mostrar una sección y ocultar las demás
function mostrarSeccion(idSeccion) {
    // Ocultar todas las secciones con clase específica
    const secciones = document.querySelectorAll('main > .hero, main > section[id]');
    secciones.forEach(sec => {
        if (sec.id !== idSeccion && sec.className !== 'hero') {
            sec.classList.add('hidden');
        } else if (sec.id === idSeccion) {
            sec.classList.remove('hidden');
        } else if (sec.className === 'hero') {
            sec.classList.add('hidden');
        }
    });
    
    // Mostrar la sección solicitada
    const seccion = document.getElementById(idSeccion);
    if (seccion) {
        seccion.classList.remove('hidden');
    }
}

window.mostrarSeccion = mostrarSeccion;
