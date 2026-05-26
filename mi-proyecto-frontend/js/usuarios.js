let usuariosAdminCargados = [];
let rolesUsuariosCargados = [];

const normalizarEstadoUsuario = (estado) => {
    const activo = Number(estado) === 1 || estado === true || ['activo', 'active', 'true', '1', 'si', 'sí'].includes(normalizarTexto(estado));
    return {
        activo,
        texto: activo ? 'Activo' : 'Inactivo',
        clase: activo ? 'activo' : 'inactivo'
    };
};

const obtenerIdUsuario = (usuario) => usuario?.IDUsuario || usuario?.id || '';

const obtenerNombreRolUsuario = (usuario) => usuario?.NombreRol || usuario?.rol?.nombre || usuario?.rol?.Nombre || 'Sin rol';

const mostrarMensajeUsuarioAdmin = (mensaje = '', tipo = 'info') => {
    const barra = document.getElementById('mensaje-usuario-admin');
    const modal = document.getElementById('mensaje-usuario-admin-modal');

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

const cargarRolesEnFormularioUsuario = async () => {
    try {
        rolesUsuariosCargados = await obtenerRoles();
    } catch {
        rolesUsuariosCargados = [];
    }

    const selectRol = document.getElementById('usuario-admin-idrol');
    if (!selectRol) return;

    selectRol.innerHTML = rolesUsuariosCargados.length
        ? rolesUsuariosCargados.map((rol) => `<option value="${escaparHtml(rol.IDRol || rol.id)}">${escaparHtml(rol.Nombre || rol.NombreRol || 'Rol')}</option>`).join('')
        : '<option value="">Sin roles disponibles</option>';
};

const abrirModalUsuarioAdmin = () => {
    cerrarModalesCRUD();
    const modal = document.getElementById('modal-usuario-admin');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
};

const cerrarModalUsuarioAdmin = () => {
    const modal = document.getElementById('modal-usuario-admin');
    if (!modal) return;
    modal.classList.add('hidden');
    if (!document.querySelector('.crud-modal:not(.hidden)')) {
        document.body.classList.remove('modal-open');
    }
};

const obtenerFiltrosUsuariosAdmin = () => ({
    termino: normalizarTexto(document.getElementById('busqueda-usuarios-admin')?.value),
    estado: document.getElementById('filtro-estado-usuarios-admin')?.value || 'all'
});

const usuariosAdminCoinciden = (usuario, filtros) => {
    const textoBusqueda = [
        usuario.NombreUsuario,
        usuario.Apellido,
        usuario.Email,
        usuario.TipoDocumento,
        usuario.NumeroDocumento,
        usuario.Telefono,
        usuario.Pais,
        usuario.Direccion,
        obtenerNombreRolUsuario(usuario)
    ].filter(Boolean).join(' ').toLowerCase();

    const coincideTexto = !filtros.termino || textoBusqueda.includes(filtros.termino);
    const estado = normalizarEstadoUsuario(usuario.IsActive);

    if (filtros.estado === 'active' && !estado.activo) return false;
    if (filtros.estado === 'inactive' && estado.activo) return false;

    return coincideTexto;
};

const actualizarResumenUsuariosAdmin = (usuarios) => {
    const lista = Array.isArray(usuarios) ? usuarios : [];
    const total = document.getElementById('usuarios-admin-total');
    const activos = document.getElementById('usuarios-admin-activos');
    const inactivos = document.getElementById('usuarios-admin-inactivos');

    if (total) total.textContent = lista.length;
    if (activos) activos.textContent = lista.filter((usuario) => normalizarEstadoUsuario(usuario.IsActive).activo).length;
    if (inactivos) inactivos.textContent = lista.filter((usuario) => !normalizarEstadoUsuario(usuario.IsActive).activo).length;
};

const renderizarUsuariosAdmin = () => {
    const contenedor = document.getElementById('usuarios-admin-tbody');
    if (!contenedor) return;

    const filtros = obtenerFiltrosUsuariosAdmin();
    const usuariosFiltrados = usuariosAdminCargados.filter((usuario) => usuariosAdminCoinciden(usuario, filtros));
    actualizarResumenUsuariosAdmin(usuariosAdminCargados);

    const paginacion = getPaginatedItems(usuariosFiltrados, 'usuariosAdmin');
    const tablaWrap = contenedor.closest('.crud-clientes-tabla-wrap') || contenedor;
    renderPaginationControls('usuariosAdmin', tablaWrap, paginacion.totalItems, paginacion.totalPages, paginacion.currentPage, renderizarUsuariosAdmin);

    if (!paginacion.items.length) {
        contenedor.innerHTML = '<tr><td colspan="6" class="mensaje-vacio">No hay usuarios que coincidan con el filtro actual.</td></tr>';
        return;
    }

    contenedor.innerHTML = paginacion.items.map((usuario) => {
        const estado = normalizarEstadoUsuario(usuario.IsActive);
        const idUsuario = obtenerIdUsuario(usuario);
        const protegido = Number(idUsuario) === 1;

        return `
            <tr>
                <td><strong>${escaparHtml(usuario.NumeroDocumento || usuario.TipoDocumento || '—')}</strong></td>
                <td>${escaparHtml(usuario.NombreUsuario || '—')} ${escaparHtml(usuario.Apellido || '')}</td>
                <td>${escaparHtml(usuario.Email || '—')}</td>
                <td>${escaparHtml(obtenerNombreRolUsuario(usuario))}</td>
                <td>
                    <label class="switch-estado" ${protegido ? 'style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                        <input type="checkbox" ${estado.activo ? 'checked' : ''} data-accion-usuario="cambiar-estado" data-id="${escaparHtml(idUsuario)}" ${protegido ? 'disabled' : ''} class="switch-input-estado">
                        <span class="switch-slider-estado"></span>
                    </label>
                </td>
                <td>
                    <div class="crud-clientes-acciones">
                        <button type="button" class="btn-mini btn-mini-icon btn-mini-editar" data-accion-usuario="editar" data-id="${escaparHtml(idUsuario)}" ${protegido ? 'disabled' : ''} title="Editar">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button type="button" class="btn-mini btn-mini-icon btn-mini-eliminar" data-accion-usuario="eliminar" data-id="${escaparHtml(idUsuario)}" ${protegido ? 'disabled' : ''} title="Eliminar">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

const limpiarFormularioUsuarioAdmin = (mostrarAviso = true) => {
    const formulario = document.getElementById('form-usuario-admin');
    const titulo = document.getElementById('usuario-admin-form-title');
    const boton = document.getElementById('btn-usuario-admin-guardar');

    formulario?.reset();
    if (titulo) titulo.textContent = 'Crear usuario';
    if (boton) boton.textContent = 'Guardar usuario';
    if (mostrarAviso) mostrarMensajeUsuarioAdmin('Formulario listo para crear un usuario.');
};

const cargarUsuarioEnFormularioAdmin = (usuario) => {
    if (!usuario) return;

    document.getElementById('usuario-admin-id').value = obtenerIdUsuario(usuario);
    document.getElementById('usuario-admin-nombre').value = usuario.NombreUsuario || '';
    document.getElementById('usuario-admin-apellido').value = usuario.Apellido || '';
    document.getElementById('usuario-admin-email').value = usuario.Email || '';
    document.getElementById('usuario-admin-contrasena').value = '';
    document.getElementById('usuario-admin-documento').value = usuario.TipoDocumento || '';
    document.getElementById('usuario-admin-numero-documento').value = usuario.NumeroDocumento || '';
    document.getElementById('usuario-admin-telefono').value = usuario.Telefono || '';
    document.getElementById('usuario-admin-pais').value = usuario.Pais || '';
    document.getElementById('usuario-admin-direccion').value = usuario.Direccion || '';
    document.getElementById('usuario-admin-idrol').value = usuario.IDRol || '';
    document.getElementById('usuario-admin-estado').value = normalizarEstadoUsuario(usuario.IsActive).activo ? '1' : '0';

    const titulo = document.getElementById('usuario-admin-form-title');
    const boton = document.getElementById('btn-usuario-admin-guardar');
    if (titulo) titulo.textContent = `Editar usuario ${usuario.NombreUsuario || obtenerIdUsuario(usuario)}`;
    if (boton) boton.textContent = 'Actualizar usuario';

    abrirModalUsuarioAdmin();
};

const construirPayloadUsuario = () => ({
    NombreUsuario: document.getElementById('usuario-admin-nombre')?.value?.trim() || '',
    Apellido: document.getElementById('usuario-admin-apellido')?.value?.trim() || '',
    Email: document.getElementById('usuario-admin-email')?.value?.trim() || '',
    Contrasena: document.getElementById('usuario-admin-contrasena')?.value?.trim() || '',
    TipoDocumento: document.getElementById('usuario-admin-documento')?.value?.trim() || '',
    NumeroDocumento: document.getElementById('usuario-admin-numero-documento')?.value?.trim() || '',
    Telefono: document.getElementById('usuario-admin-telefono')?.value?.trim() || '',
    Pais: document.getElementById('usuario-admin-pais')?.value?.trim() || '',
    Direccion: document.getElementById('usuario-admin-direccion')?.value?.trim() || '',
    IDRol: Number(document.getElementById('usuario-admin-idrol')?.value || 0) || 2,
    IsActive: document.getElementById('usuario-admin-estado')?.value === '1'
});

async function cargarUsuariosAdmin() {
    const contenedor = document.getElementById('usuarios-admin-tbody');
    if (!contenedor) return;

    try {
        usuariosAdminCargados = await obtenerUsuarios();
        resetPagination('usuariosAdmin');
        renderizarUsuariosAdmin();
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        usuariosAdminCargados = [];
        contenedor.innerHTML = '<tr><td colspan="6" class="mensaje-vacio">Error al cargar usuarios</td></tr>';
        mostrarMensajeUsuarioAdmin('No se pudieron cargar los usuarios.', 'error');
    }
}

async function guardarUsuarioAdmin(evento) {
    evento.preventDefault();

    const formulario = document.getElementById('form-usuario-admin');
    const id = document.getElementById('usuario-admin-id')?.value?.trim();
    const payload = construirPayloadUsuario();

    if (!payload.NombreUsuario || !payload.Email) {
        mostrarMensajeUsuarioAdmin('Nombre y email son obligatorios.');
        return;
    }

    if (!id && !payload.Contrasena) {
        mostrarMensajeUsuarioAdmin('La contraseña es obligatoria para crear un usuario.');
        return;
    }

    try {
        if (id) {
            const data = { ...payload };
            if (!data.Contrasena) delete data.Contrasena;
            await actualizarUsuario(id, data);
            mostrarMensajeUsuarioAdmin('Usuario actualizado correctamente.', 'ok');
        } else {
            await crearUsuario(payload);
            mostrarMensajeUsuarioAdmin('Usuario creado correctamente.', 'ok');
        }

        formulario?.reset();
        await cargarUsuariosAdmin();
        cerrarModalUsuarioAdmin();
    } catch (error) {
        console.error('Error guardando usuario:', error);
        mostrarMensajeUsuarioAdmin(error.message || 'No se pudo guardar el usuario');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo guardar el usuario',
                text: error.message || 'Ocurrió un error inesperado.',
                confirmButtonColor: '#e74c3c'
            });
        }
    }
}

async function cambiarEstadoUsuarioAdmin(id) {
    const usuario = usuariosAdminCargados.find((item) => String(obtenerIdUsuario(item)) === String(id));
    if (!usuario) return;

    const estado = normalizarEstadoUsuario(usuario.IsActive);
    const nuevoEstado = !estado.activo;

    try {
        await cambiarEstadoUsuario(id, nuevoEstado);
        await cargarUsuariosAdmin();
        const textoEstado = nuevoEstado ? 'activado' : 'desactivado';
        mostrarMensajeUsuarioAdmin(`Usuario ${textoEstado} correctamente.`, 'ok');
    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        mostrarMensajeUsuarioAdmin(error.message || 'No se pudo cambiar el estado del usuario');
    }
}

async function eliminarUsuarioAdmin(id) {
    const usuario = usuariosAdminCargados.find((item) => String(obtenerIdUsuario(item)) === String(id));
    if (!usuario) return;

    const resultadoUsr = await Swal.fire({
        title: '¿Eliminar usuario?',
        text: `Se eliminará el usuario "${usuario.NombreUsuario || id}". Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    if (!resultadoUsr.isConfirmed) return;

    try {
        await eliminarUsuario(id);
        await cargarUsuariosAdmin();
        mostrarMensajeUsuarioAdmin('Usuario eliminado correctamente.', 'ok');
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        mostrarMensajeUsuarioAdmin(error.message || 'No se pudo eliminar el usuario');
    }
}

const configurarUsuariosAdmin = () => {
    const formulario = document.getElementById('form-usuario-admin');
    const botonNuevo = document.getElementById('btn-nuevo-usuario-admin');
    const botonLimpiar = document.getElementById('btn-usuario-admin-limpiar');
    const botonCerrar = document.getElementById('btn-cerrar-modal-usuario');
    const tabla = document.getElementById('usuarios-admin-tbody');
    const buscador = document.getElementById('busqueda-usuarios-admin');
    const filtroEstado = document.getElementById('filtro-estado-usuarios-admin');

    formulario?.addEventListener('submit', guardarUsuarioAdmin);
    botonNuevo?.addEventListener('click', () => {
        limpiarFormularioUsuarioAdmin(false);
        cargarRolesEnFormularioUsuario();
        abrirModalUsuarioAdmin();
    });
    botonLimpiar?.addEventListener('click', () => limpiarFormularioUsuarioAdmin());
    botonCerrar?.addEventListener('click', cerrarModalUsuarioAdmin);

    tabla?.addEventListener('change', (evento) => {
        const checkbox = evento.target.closest('input[data-accion-usuario="cambiar-estado"]');
        if (checkbox) {
            cambiarEstadoUsuarioAdmin(checkbox.dataset.id);
        }
    });

    tabla?.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button[data-accion-usuario]');
        if (!boton) return;

        const accion = boton.dataset.accionUsuario;
        const id = boton.dataset.id;
        const usuario = usuariosAdminCargados.find((item) => String(obtenerIdUsuario(item)) === String(id));

        if (accion === 'editar' && usuario) {
            cargarRolesEnFormularioUsuario();
            cargarUsuarioEnFormularioAdmin(usuario);
        }

        if (accion === 'eliminar') {
            eliminarUsuarioAdmin(id);
        }
    });

    buscador?.addEventListener('input', () => { resetPagination('usuariosAdmin'); renderizarUsuariosAdmin(); });
    filtroEstado?.addEventListener('change', () => { resetPagination('usuariosAdmin'); renderizarUsuariosAdmin(); });
};

window.cargarUsuariosAdmin = cargarUsuariosAdmin;
window.guardarUsuarioAdmin = guardarUsuarioAdmin;