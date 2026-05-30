let rolesAdminCargados = [];
let permisosRolesCargados = [];

const normalizarEstadoRolAdmin = (estado) => {
    const activo = Number(estado) === 1 || estado === true || ['activo', 'active', 'true', '1'].includes(normalizarTexto(estado));
    return {
        activo,
        texto: activo ? 'Activo' : 'Inactivo',
        clase: activo ? 'activo' : 'inactivo'
    };
};

const mostrarMensajeRolAdmin = (mensaje = '', tipo = 'info') => {
    const barra = document.getElementById('mensaje-rol-admin');
    const modal = document.getElementById('mensaje-rol-admin-modal');

    [barra, modal].forEach((elemento) => {
        if (!elemento) return;
        if (!mensaje) {
            elemento.textContent = '';
            elemento.className = 'crud-clientes-mensaje';
            return;
        }

        elemento.textContent = mensaje;
        elemento.className = `crud-clientes-mensaje ${tipo}`;
    });
};

const obtenerIdRolAdmin = (rol) => rol?.IDRol || rol?.id || '';

const rolEsProtegido = (_rol) => false;

const cargarPermisosEnFormularioRol = async () => {
    try {
        permisosRolesCargados = await obtenerPermisos();
    } catch {
        permisosRolesCargados = [];
    }

    const contenedor = document.getElementById('rol-admin-permisos');
    if (!contenedor) return;

    contenedor.innerHTML = permisosRolesCargados.length
        ? permisosRolesCargados.map((permiso) => `
            <label class="crud-roles-permiso">
                <input type="checkbox" value="${escaparHtml(permiso.IDPermiso || permiso.id)}" data-permiso-role>
                <span>
                    <strong>${escaparHtml(permiso.NombrePermisos || permiso.nombre || 'Permiso')}</strong>
                    <small>${escaparHtml(permiso.Descripcion || 'Sin descripción')}</small>
                </span>
            </label>
        `).join('')
        : '<p class="mensaje-vacio">No hay permisos disponibles.</p>';
};

const obtenerPermisosSeleccionadosRol = () => Array.from(document.querySelectorAll('[data-permiso-role]:checked')).map((input) => Number(input.value)).filter(Number.isFinite);

const cargarPermisosRolSeleccionado = (permisos = []) => {
    const seleccionados = new Set((Array.isArray(permisos) ? permisos : []).map((permiso) => Number(permiso.id || permiso.IDPermiso || permiso)));
    document.querySelectorAll('[data-permiso-role]').forEach((input) => {
        input.checked = seleccionados.has(Number(input.value));
    });
};

const abrirModalRolAdmin = () => {
    cerrarModalesCRUD();
    const modal = document.getElementById('modal-rol-admin');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
};

const cerrarModalRolAdmin = () => {
    const modal = document.getElementById('modal-rol-admin');
    if (!modal) return;
    modal.classList.add('hidden');
    if (!document.querySelector('.crud-modal:not(.hidden)')) {
        document.body.classList.remove('modal-open');
    }
};

const obtenerFiltrosRolesAdmin = () => ({
    termino: normalizarTexto(document.getElementById('busqueda-roles-admin')?.value),
    estado: document.getElementById('filtro-estado-roles-admin')?.value || 'all'
});

const rolesAdminCoinciden = (rol, filtros) => {
    const permisosTexto = Array.isArray(rol.permisos) ? rol.permisos.map((permiso) => permiso.nombre).join(' ') : '';
    const textoBusqueda = [rol.Nombre, rol.Estado, permisosTexto].filter(Boolean).join(' ').toLowerCase();
    const estado = normalizarEstadoRolAdmin(rol.IsActive);

    if (filtros.estado === 'active' && !estado.activo) return false;
    if (filtros.estado === 'inactive' && estado.activo) return false;

    return !filtros.termino || textoBusqueda.includes(filtros.termino);
};

const actualizarResumenRolesAdmin = (roles) => {
    const lista = Array.isArray(roles) ? roles : [];
    const total = document.getElementById('roles-admin-total');
    const activos = document.getElementById('roles-admin-activos');
    const inactivos = document.getElementById('roles-admin-inactivos');
    if (total) total.textContent = lista.length;
    if (activos) activos.textContent = lista.filter((rol) => normalizarEstadoRolAdmin(rol.IsActive).activo).length;
    if (inactivos) inactivos.textContent = lista.filter((rol) => !normalizarEstadoRolAdmin(rol.IsActive).activo).length;
};

const renderizarRolesAdmin = () => {
    const contenedor = document.getElementById('roles-admin-tbody');
    if (!contenedor) return;

    const filtros = obtenerFiltrosRolesAdmin();
    const rolesFiltrados = rolesAdminCargados.filter((rol) => rolesAdminCoinciden(rol, filtros));
    actualizarResumenRolesAdmin(rolesAdminCargados);

    const paginacion = getPaginatedItems(rolesFiltrados, 'rolesAdmin');
    const tablaWrap = contenedor.closest('.crud-clientes-tabla-wrap') || contenedor;
    renderPaginationControls('rolesAdmin', tablaWrap, paginacion.totalItems, paginacion.totalPages, paginacion.currentPage, renderizarRolesAdmin);

    if (!paginacion.items.length) {
        contenedor.innerHTML = '<tr><td colspan="4" class="mensaje-vacio">No hay roles que coincidan con el filtro actual.</td></tr>';
        return;
    }

    contenedor.innerHTML = paginacion.items.map((rol) => {
        const estado = normalizarEstadoRolAdmin(rol.IsActive);
        const idRol = obtenerIdRolAdmin(rol);
        const protegido = rolEsProtegido(rol);
        const permisos = Array.isArray(rol.permisos) ? rol.permisos : [];

        return `
            <tr>
                <td><strong>${escaparHtml(rol.Nombre || '—')}</strong></td>
                <td>
                    <div class="perfil-permisos">
                        ${permisos.length ? permisos.map((permiso) => `<span class="perfil-permiso-chip">${escaparHtml(permiso.nombre)}</span>`).join('') : '<span class="perfil-permisos-vacio">Sin permisos</span>'}
                    </div>
                </td>
                <td>
                    <label class="switch-estado" ${protegido ? 'style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                        <input type="checkbox" ${estado.activo ? 'checked' : ''} data-accion-rol="cambiar-estado" data-id="${escaparHtml(idRol)}" ${protegido ? 'disabled' : ''} class="switch-input-estado">
                        <span class="switch-slider-estado"></span>
                    </label>
                </td>
                <td>
                    <div class="crud-clientes-acciones">
                        <button type="button" class="btn-mini btn-mini-icon btn-mini-editar" data-accion-rol="editar" data-id="${escaparHtml(idRol)}" ${protegido ? 'disabled' : ''} title="Editar">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button type="button" class="btn-mini btn-mini-icon btn-mini-eliminar" data-accion-rol="eliminar" data-id="${escaparHtml(idRol)}" ${protegido ? 'disabled' : ''} title="Eliminar">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

const limpiarFormularioRolAdmin = (mostrarAviso = true) => {
    document.getElementById('form-rol-admin')?.reset();
    document.querySelectorAll('[data-permiso-role]').forEach((input) => { input.checked = false; });
    document.getElementById('rol-admin-id').value = '';
    document.getElementById('rol-admin-form-title').textContent = 'Crear rol';
    document.getElementById('btn-rol-admin-guardar').textContent = 'Guardar rol';
    if (mostrarAviso) mostrarMensajeRolAdmin('Formulario listo para crear un rol.');
};

const cargarRolEnFormularioAdmin = (rol) => {
    if (!rol) return;

    document.getElementById('rol-admin-id').value = obtenerIdRolAdmin(rol);
    document.getElementById('rol-admin-nombre').value = rol.Nombre || '';
    document.getElementById('rol-admin-estado').value = normalizarEstadoRolAdmin(rol.IsActive).activo ? '1' : '0';
    cargarPermisosRolSeleccionado(rol.permisos || []);
    document.getElementById('rol-admin-form-title').textContent = `Editar rol ${rol.Nombre || obtenerIdRolAdmin(rol)}`;
    document.getElementById('btn-rol-admin-guardar').textContent = 'Actualizar rol';
    abrirModalRolAdmin();
};

const construirPayloadRol = () => ({
    Nombre: document.getElementById('rol-admin-nombre')?.value?.trim() || '',
    Estado: document.getElementById('rol-admin-estado')?.value === '1' ? 'Activo' : 'Inactivo',
    IsActive: document.getElementById('rol-admin-estado')?.value === '1',
    Permisos: obtenerPermisosSeleccionadosRol()
});

async function cargarRolesAdmin() {
    const contenedor = document.getElementById('roles-admin-tbody');
    if (!contenedor) return;

    try {
        rolesAdminCargados = await obtenerRoles();
        resetPagination('rolesAdmin');
        renderizarRolesAdmin();
    } catch (error) {
        console.error('Error cargando roles:', error);
        contenedor.innerHTML = '<tr><td colspan="4" class="mensaje-vacio">Error al cargar roles</td></tr>';
        mostrarMensajeRolAdmin('No se pudieron cargar los roles.', 'error');
    }
}

async function guardarRolAdmin(evento) {
    evento.preventDefault();
    const id = document.getElementById('rol-admin-id')?.value?.trim();
    const payload = construirPayloadRol();

    if (!payload.Nombre) {
        Swal.fire({ title: 'Campo requerido', text: 'El nombre del rol es obligatorio.', icon: 'warning', confirmButtonColor: '#1a2744' });
        return;
    }

    try {
        if (id) {
            await actualizarRol(id, payload);
            mostrarMensajeRolAdmin('Rol actualizado correctamente.', 'ok');
        } else {
            await crearRol(payload);
            mostrarMensajeRolAdmin('Rol creado correctamente.', 'ok');
        }

        await cargarRolesAdmin();
        cerrarModalRolAdmin();
    } catch (error) {
        console.error('Error guardando rol:', error);
        Swal.fire({ title: 'Error', text: error.message || 'No se pudo guardar el rol.', icon: 'error', confirmButtonColor: '#1a2744' });
    }
}
async function cambiarEstadoRolAdmin(id) {
    const rol = rolesAdminCargados.find((item) => String(obtenerIdRolAdmin(item)) === String(id));
    if (!rol) return;

    const estado = normalizarEstadoRolAdmin(rol.IsActive);
    const nuevoEstado = !estado.activo;

    try {
        await cambiarEstadoRol(id, nuevoEstado);
        await cargarRolesAdmin();
        const textoEstado = nuevoEstado ? 'activado' : 'desactivado';
        mostrarMensajeRolAdmin(`Rol ${textoEstado} correctamente.`, 'ok');
    } catch (error) {
        console.error('Error al cambiar estado del rol:', error);
        mostrarMensajeRolAdmin(error.message || 'No se pudo cambiar el estado del rol');
    }
}
async function eliminarRolAdmin(id) {
    const rol = rolesAdminCargados.find((item) => String(obtenerIdRolAdmin(item)) === String(id));
    if (!rol) return;
    const resultadoRol = await Swal.fire({
        title: '¿Eliminar rol?',
        text: `Se eliminará el rol "${rol.Nombre || id}". Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    if (!resultadoRol.isConfirmed) return;

    try {
        await eliminarRol(id);
        await cargarRolesAdmin();
        mostrarMensajeRolAdmin('Rol eliminado correctamente.', 'ok');
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        Swal.fire({ title: 'Error', text: error.message || 'No se pudo eliminar el rol', icon: 'error', confirmButtonColor: '#e53e3e' });
    }
}

const configurarRolesAdmin = () => {
    document.getElementById('form-rol-admin')?.addEventListener('submit', guardarRolAdmin);
    document.getElementById('btn-nuevo-rol-admin')?.addEventListener('click', async () => {
        limpiarFormularioRolAdmin(false);
        await cargarPermisosEnFormularioRol();
        abrirModalRolAdmin();
    });
    document.getElementById('btn-rol-admin-limpiar')?.addEventListener('click', () => limpiarFormularioRolAdmin());
    document.getElementById('btn-cerrar-modal-rol')?.addEventListener('click', cerrarModalRolAdmin);
    document.getElementById('roles-admin-tbody')?.addEventListener('change', (evento) => {
        const checkbox = evento.target.closest('input[data-accion-rol="cambiar-estado"]');
        if (checkbox) {
            cambiarEstadoRolAdmin(checkbox.dataset.id);
        }
    });

    document.getElementById('roles-admin-tbody')?.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button[data-accion-rol]');
        if (!boton) return;

        const accion = boton.dataset.accionRol;
        const id = boton.dataset.id;
        const rol = rolesAdminCargados.find((item) => String(obtenerIdRolAdmin(item)) === String(id));

        if (accion === 'editar' && rol) {
            cargarPermisosEnFormularioRol().then(() => cargarRolEnFormularioAdmin(rol));
        }

        if (accion === 'eliminar') {
            eliminarRolAdmin(id);
        }
    });

    document.getElementById('busqueda-roles-admin')?.addEventListener('input', () => { resetPagination('rolesAdmin'); renderizarRolesAdmin(); });
    document.getElementById('filtro-estado-roles-admin')?.addEventListener('change', () => { resetPagination('rolesAdmin'); renderizarRolesAdmin(); });
};

window.cargarRolesAdmin = cargarRolesAdmin;
window.guardarRolAdmin = guardarRolAdmin;