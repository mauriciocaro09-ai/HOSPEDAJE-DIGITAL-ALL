let permisosAdminCargados = [];

const normalizarEstadoPermiso = (estado) => {
    const activo = ['activo', 'active', 'true', '1'].includes(normalizarTexto(estado));
    return {
        activo,
        texto: activo ? 'Activo' : 'Inactivo',
        clase: activo ? 'activo' : 'inactivo'
    };
};

const mostrarMensajePermisoAdmin = (mensaje = '', tipo = 'info') => {
    const barra = document.getElementById('mensaje-permiso-admin');
    const modal = document.getElementById('mensaje-permiso-admin-modal');

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

const obtenerIdPermisoAdmin = (permiso) => permiso?.IDPermiso || permiso?.id || '';

const obtenerFiltrosPermisosAdmin = () => ({
    termino: normalizarTexto(document.getElementById('busqueda-permisos-admin')?.value),
    estado: document.getElementById('filtro-estado-permisos-admin')?.value || 'all'
});

const permisosAdminCoinciden = (permiso, filtros) => {
    const textoBusqueda = [permiso.NombrePermisos, permiso.Descripcion, permiso.EstadoPermisos].filter(Boolean).join(' ').toLowerCase();
    const estado = normalizarEstadoPermiso(permiso.EstadoPermisos);

    if (filtros.estado === 'active' && !estado.activo) return false;
    if (filtros.estado === 'inactive' && estado.activo) return false;

    return !filtros.termino || textoBusqueda.includes(filtros.termino);
};

const actualizarResumenPermisosAdmin = (permisos) => {
    const lista = Array.isArray(permisos) ? permisos : [];
    const total = document.getElementById('permisos-admin-total');
    const activos = document.getElementById('permisos-admin-activos');
    const inactivos = document.getElementById('permisos-admin-inactivos');
    if (total) total.textContent = lista.length;
    if (activos) activos.textContent = lista.filter((permiso) => normalizarEstadoPermiso(permiso.EstadoPermisos).activo).length;
    if (inactivos) inactivos.textContent = lista.filter((permiso) => !normalizarEstadoPermiso(permiso.EstadoPermisos).activo).length;
};

const abrirModalPermisoAdmin = () => {
    cerrarModalesCRUD();
    const modal = document.getElementById('modal-permiso-admin');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
};

const cerrarModalPermisoAdmin = () => {
    const modal = document.getElementById('modal-permiso-admin');
    if (!modal) return;
    modal.classList.add('hidden');
    if (!document.querySelector('.crud-modal:not(.hidden)')) {
        document.body.classList.remove('modal-open');
    }
};

const renderizarPermisosAdmin = () => {
    const contenedor = document.getElementById('permisos-admin-tbody');
    if (!contenedor) return;

    const filtros = obtenerFiltrosPermisosAdmin();
    const permisosFiltrados = permisosAdminCargados.filter((permiso) => permisosAdminCoinciden(permiso, filtros));
    actualizarResumenPermisosAdmin(permisosAdminCargados);

    const paginacion = getPaginatedItems(permisosFiltrados, 'permisosAdmin');
    const tablaWrap = contenedor.closest('.crud-clientes-tabla-wrap') || contenedor;
    renderPaginationControls('permisosAdmin', tablaWrap, paginacion.totalItems, paginacion.totalPages, paginacion.currentPage, renderizarPermisosAdmin);

    if (!paginacion.items.length) {
        contenedor.innerHTML = '<tr><td colspan="4" class="mensaje-vacio">No hay permisos que coincidan con el filtro actual.</td></tr>';
        return;
    }

    contenedor.innerHTML = paginacion.items.map((permiso) => {
        const estado = normalizarEstadoPermiso(permiso.EstadoPermisos);
        const idPermiso = obtenerIdPermisoAdmin(permiso);

        return `
            <tr>
                <td><strong>${escaparHtml(permiso.NombrePermisos || '—')}</strong></td>
                <td>${escaparHtml(permiso.Descripcion || '—')}</td>
                <td>
                    <label class="switch-estado">
                        <input type="checkbox" ${estado.activo ? 'checked' : ''} data-accion-permiso="cambiar-estado" data-id="${escaparHtml(idPermiso)}" class="switch-input-estado">
                        <span class="switch-slider-estado"></span>
                    </label>
                </td>
                <td>
                    <div class="crud-clientes-acciones">
                        <button type="button" class="btn-mini btn-mini-icon btn-mini-editar" data-accion-permiso="editar" data-id="${escaparHtml(idPermiso)}" title="Editar">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button type="button" class="btn-mini btn-mini-icon btn-mini-eliminar" data-accion-permiso="eliminar" data-id="${escaparHtml(idPermiso)}" title="Eliminar">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

const limpiarFormularioPermisoAdmin = (mostrarAviso = true) => {
    document.getElementById('form-permiso-admin')?.reset();
    document.getElementById('permiso-admin-id').value = '';
    document.getElementById('permiso-admin-form-title').textContent = 'Crear permiso';
    document.getElementById('btn-permiso-admin-guardar').textContent = 'Guardar permiso';
    if (mostrarAviso) alert('Formulario listo para crear un permiso.');
};

const cargarPermisoEnFormularioAdmin = (permiso) => {
    if (!permiso) return;

    document.getElementById('permiso-admin-id').value = obtenerIdPermisoAdmin(permiso);
    document.getElementById('permiso-admin-nombre').value = permiso.NombrePermisos || '';
    document.getElementById('permiso-admin-descripcion').value = permiso.Descripcion || '';
    document.getElementById('permiso-admin-estado').value = normalizarEstadoPermiso(permiso.EstadoPermisos).activo ? '1' : '0';
    document.getElementById('permiso-admin-form-title').textContent = `Editar permiso ${permiso.NombrePermisos || obtenerIdPermisoAdmin(permiso)}`;
    document.getElementById('btn-permiso-admin-guardar').textContent = 'Actualizar permiso';
    abrirModalPermisoAdmin();
};

const construirPayloadPermiso = () => ({
    NombrePermisos: document.getElementById('permiso-admin-nombre')?.value?.trim() || '',
    Descripcion: document.getElementById('permiso-admin-descripcion')?.value?.trim() || '',
    EstadoPermisos: document.getElementById('permiso-admin-estado')?.value === '1' ? 'Activo' : 'Inactivo'
});

async function cargarPermisosAdmin() {
    const contenedor = document.getElementById('permisos-admin-tbody');
    if (!contenedor) return;

    try {
        permisosAdminCargados = await obtenerPermisos();
        resetPagination('permisosAdmin');
        renderizarPermisosAdmin();
    } catch (error) {
        console.error('Error cargando permisos:', error);
        contenedor.innerHTML = '<tr><td colspan="4" class="mensaje-vacio">Error al cargar permisos</td></tr>';
        mostrarMensajePermisoAdmin('No se pudieron cargar los permisos.', 'error');
    }
}

async function guardarPermisoAdmin(evento) {
    evento.preventDefault();
    const id = document.getElementById('permiso-admin-id')?.value?.trim();
    const payload = construirPayloadPermiso();

    if (!payload.NombrePermisos) {
        alert('El nombre del permiso es obligatorio.');
        return;
    }

    try {
        if (id) {
            await actualizarPermiso(id, payload);
            mostrarMensajePermisoAdmin('Permiso actualizado correctamente.', 'ok');
        } else {
            await crearPermiso(payload);
            mostrarMensajePermisoAdmin('Permiso creado correctamente.', 'ok');
        }

        await cargarPermisosAdmin();
        cerrarModalPermisoAdmin();
    } catch (error) {
        console.error('Error guardando permiso:', error);
        alert(error.message || 'No se pudo guardar el permiso');
    }
}
async function cambiarEstadoPermisoAdmin(id) {
    const permiso = permisosAdminCargados.find((item) => String(obtenerIdPermisoAdmin(item)) === String(id));
    if (!permiso) return;

    const estado = normalizarEstadoPermiso(permiso.EstadoPermisos);
    const nuevoEstado = !estado.activo;

    try {
        await cambiarEstadoPermiso(id, nuevoEstado);
        await cargarPermisosAdmin();
        const textoEstado = nuevoEstado ? 'activado' : 'desactivado';
        mostrarMensajePermisoAdmin(`Permiso ${textoEstado} correctamente.`, 'ok');
    } catch (error) {
        console.error('Error al cambiar estado del permiso:', error);
        mostrarMensajePermisoAdmin(error.message || 'No se pudo cambiar el estado del permiso');
    }
}
async function eliminarPermisoAdmin(id) {
    const permiso = permisosAdminCargados.find((item) => String(obtenerIdPermisoAdmin(item)) === String(id));
    if (!permiso) return;
    const resultadoPer = await Swal.fire({
        title: '¿Eliminar permiso?',
        text: `Se eliminará el permiso "${permiso.NombrePermisos || id}". Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    if (!resultadoPer.isConfirmed) return;

    try {
        await eliminarPermiso(id);
        await cargarPermisosAdmin();
        mostrarMensajePermisoAdmin('Permiso eliminado correctamente.', 'ok');
    } catch (error) {
        console.error('Error al eliminar permiso:', error);
        Swal.fire({ title: 'Error', text: error.message || 'No se pudo eliminar el permiso', icon: 'error', confirmButtonColor: '#e53e3e' });
    }
}

const configurarPermisosAdmin = () => {
    document.getElementById('form-permiso-admin')?.addEventListener('submit', guardarPermisoAdmin);
    document.getElementById('btn-nuevo-permiso-admin')?.addEventListener('click', () => {
        limpiarFormularioPermisoAdmin(false);
        abrirModalPermisoAdmin();
    });
    document.getElementById('btn-permiso-admin-limpiar')?.addEventListener('click', () => limpiarFormularioPermisoAdmin());
    document.getElementById('btn-cerrar-modal-permiso')?.addEventListener('click', cerrarModalPermisoAdmin);
    document.getElementById('permisos-admin-tbody')?.addEventListener('change', (evento) => {
        const checkbox = evento.target.closest('input[data-accion-permiso="cambiar-estado"]');
        if (checkbox) {
            cambiarEstadoPermisoAdmin(checkbox.dataset.id);
        }
    });

    document.getElementById('permisos-admin-tbody')?.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button[data-accion-permiso]');
        if (!boton) return;

        const accion = boton.dataset.accionPermiso;
        const id = boton.dataset.id;
        const permiso = permisosAdminCargados.find((item) => String(obtenerIdPermisoAdmin(item)) === String(id));

        if (accion === 'editar' && permiso) {
            cargarPermisoEnFormularioAdmin(permiso);
        }

        if (accion === 'eliminar') {
            eliminarPermisoAdmin(id);
        }
    });

    document.getElementById('busqueda-permisos-admin')?.addEventListener('input', () => { resetPagination('permisosAdmin'); renderizarPermisosAdmin(); });
    document.getElementById('filtro-estado-permisos-admin')?.addEventListener('change', () => { resetPagination('permisosAdmin'); renderizarPermisosAdmin(); });
};

window.cargarPermisosAdmin = cargarPermisosAdmin;
window.guardarPermisoAdmin = guardarPermisoAdmin;