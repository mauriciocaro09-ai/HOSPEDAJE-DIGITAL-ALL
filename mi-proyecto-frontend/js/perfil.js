// ============================================
// MÓDULO DE PERFIL DE USUARIO
// ============================================

const formatearValorPerfil = (valor) => {
    if (valor === null || valor === undefined) return '-';
    const texto = String(valor).trim();
    return texto ? texto : '-';
};

const mostrarMensajePerfil = (mensaje, tipo = 'info') => {
    const elemento = document.getElementById('perfil-mensaje');
    if (!elemento) return;

    if (!mensaje) {
        elemento.textContent = '';
        elemento.className = 'perfil-mensaje hidden';
        return;
    }

    elemento.textContent = mensaje;
    elemento.className = `perfil-mensaje ${tipo}`;
};

const rellenarPerfil = (perfil) => {
    const datos = perfil || {};
    const rol = datos.rol || {};
    const permisos = Array.isArray(datos.permisos) ? datos.permisos : [];

    // Llenar sección de LECTURA
    const asignacionesLectura = {
        'perfil-tipo-documento': datos.tipoDocumento,
        'perfil-numero-documento': datos.numeroDocumento,
        'perfil-nombre': datos.nombre,
        'perfil-apellido': datos.apellido,
        'perfil-telefono': datos.telefono,
        'perfil-pais': datos.pais,
        'perfil-direccion': datos.direccion,
        'perfil-email': datos.email,
        'perfil-rol-text': rol.nombre || datos.rolNombre || rol.id || datos.rol
    };

    Object.entries(asignacionesLectura).forEach(([id, value]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = formatearValorPerfil(value);
        }
    });

    // Llenar sección de EDICIÓN
    const asignacionesEdicion = {
        'perfil-edit-tipo-documento': datos.tipoDocumento,
        'perfil-edit-numero-documento': datos.numeroDocumento,
        'perfil-edit-nombre': datos.nombre,
        'perfil-edit-apellido': datos.apellido,
        'perfil-edit-telefono': datos.telefono,
        'perfil-edit-pais': datos.pais,
        'perfil-edit-direccion': datos.direccion,
        'perfil-edit-email': datos.email,
        'perfil-edit-rol-text': rol.nombre || datos.rolNombre || rol.id || datos.rol
    };

    Object.entries(asignacionesEdicion).forEach(([id, value]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            if (elemento.tagName === 'INPUT' || elemento.tagName === 'TEXTAREA' || elemento.tagName === 'SELECT') {
                elemento.value = value ?? '';
            } else {
                elemento.textContent = formatearValorPerfil(value);
            }
        }
    });

    // Llenar permisos (ambas secciones)
    const contenedorPermisosLectura = document.getElementById('perfil-permisos');
    const contenedorPermisosEdicion = document.getElementById('perfil-edit-permisos');

    const renderPermisos = (contenedor) => {
        if (!contenedor) return;
        if (!permisos.length) {
            contenedor.innerHTML = '<span class="perfil-permisos-vacio">Sin permisos asociados</span>';
        } else {
            contenedor.innerHTML = permisos
                .map((permiso) => `<span class="perfil-permiso-chip">${formatearValorPerfil(permiso.nombre || permiso.NombrePermisos)}</span>`)
                .join('');
        }
    };

    renderPermisos(contenedorPermisosLectura);
    renderPermisos(contenedorPermisosEdicion);
};

const rellenarFormularioPerfil = (perfil) => {
    // Ya manejado por rellenarPerfil(), esta función se mantiene por compatibilidad
    rellenarPerfil(perfil);
};

const alternarModoEdicionPerfil = (editando) => {
    const form = document.getElementById('perfil-form');
    const lectura = document.getElementById('perfil-lectura');
    const botonEditar = document.getElementById('btn-editar-perfil');
    const botonGuardar = document.getElementById('btn-guardar-perfil');
    const botonCancelar = document.getElementById('btn-cancelar-edicion-perfil');

    // Mostrar/ocultar secciones
    if (lectura) lectura.classList.toggle('hidden', editando);
    if (form) form.classList.toggle('hidden', !editando);

    // Alternar botones
    botonEditar?.classList.toggle('hidden', editando);
    botonGuardar?.classList.toggle('hidden', !editando);
    botonCancelar?.classList.toggle('hidden', !editando);

    // Habilitar inputs de edición
    form?.querySelectorAll('input').forEach((input) => {
        if (input.id.startsWith('perfil-edit-')) {
            input.readOnly = !editando;
            input.classList.toggle('perfil-readonly', !editando);
        }
    });

    // Habilitar select de tipo documento
    form?.querySelectorAll('select').forEach((select) => {
        if (select.id.startsWith('perfil-edit-')) {
            select.disabled = !editando;
            select.classList.toggle('perfil-readonly', !editando);
        }
    });

    // Limpiar campos de contraseña al salir del modo edición
    if (!editando) {
        ['perfil-edit-contrasena-actual', 'perfil-edit-contrasena-nueva', 'perfil-edit-contrasena-confirmar'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    const modal = document.getElementById('modal-perfil');
    if (modal) {
        modal.dataset.editando = editando ? '1' : '0';
    }
};

const obtenerPerfilFormulario = () => {
    // Compatibilidad: buscar primero los IDs del modal (`perfil-edit-...`) y caer en los de la página (`edit-...`)
    const getVal = (ids) => {
        for (const id of ids) {
            const el = document.getElementById(id);
            if (!el) continue;
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                return (el.value || '').trim();
            }
            return (el.textContent || '').trim();
        }
        return '';
    };

    return {
        TipoDocumento: getVal(['perfil-edit-tipo-documento', 'edit-tipo']),
        NumeroDocumento: getVal(['perfil-edit-numero-documento', 'edit-numero']),
        NombreUsuario: getVal(['perfil-edit-nombre', 'edit-nombre']),
        Apellido: getVal(['perfil-edit-apellido', 'edit-apellido']),
        Telefono: getVal(['perfil-edit-telefono', 'edit-telefono']),
        Pais: getVal(['perfil-edit-pais', 'edit-pais']),
        Direccion: getVal(['perfil-edit-direccion', 'edit-direccion']),
        Email: getVal(['perfil-edit-email', 'edit-email'])
    };
};

const guardarPerfilUsuario = async (event) => {
    if (event) {
        event.preventDefault();
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
        mostrarMensajePerfil('Tu sesión no está activa. Por favor inicia sesión.', 'error');
        try { window.location.href = 'login.html'; } catch (e) {}
        return;
    }

    const datos = obtenerPerfilFormulario();

    if (!datos.NombreUsuario || !datos.Email) {
        mostrarMensajePerfil('Nombre y email son obligatorios.', 'error');
        return;
    }

    // Leer campos de contraseña
    const contrasenaActual   = (document.getElementById('perfil-edit-contrasena-actual')?.value   || '').trim();
    const contrasenaNueva    = (document.getElementById('perfil-edit-contrasena-nueva')?.value    || '').trim();
    const contrasenaConfirmar = (document.getElementById('perfil-edit-contrasena-confirmar')?.value || '').trim();

    const quiereCambiarContrasena = contrasenaActual || contrasenaNueva || contrasenaConfirmar;
    if (quiereCambiarContrasena) {
        if (!contrasenaActual || !contrasenaNueva || !contrasenaConfirmar) {
            mostrarMensajePerfil('Para cambiar la contraseña completa los tres campos.', 'error');
            return;
        }
        if (contrasenaNueva !== contrasenaConfirmar) {
            mostrarMensajePerfil('La nueva contraseña y su confirmación no coinciden.', 'error');
            return;
        }
        if (contrasenaNueva.length < 4) {
            mostrarMensajePerfil('La nueva contraseña debe tener al menos 4 caracteres.', 'error');
            return;
        }
    }

    const btnGuardar = document.getElementById('btn-guardar-perfil');
    const textoOriginal = btnGuardar?.textContent || 'Guardar Cambios';
    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Guardando...'; }

    try {
        mostrarMensajePerfil('Guardando cambios...');

        const respuesta = await requestJson('/auth/me', {
            method: 'PUT',
            body: datos
        });

        const usuario = respuesta?.usuario || null;
        if (usuario) {
            sessionStorage.setItem('usuario', JSON.stringify(usuario));
            rellenarPerfil(usuario);
            rellenarFormularioPerfil(usuario);
        }

        if (quiereCambiarContrasena) {
            await requestJson('/auth/change-password', {
                method: 'POST',
                body: { contrasenaActual, nuevaContrasena: contrasenaNueva }
            });
        }

        alternarModoEdicionPerfil(false);
        mostrarMensajePerfil(
            quiereCambiarContrasena
                ? 'Perfil y contraseña actualizados correctamente.'
                : 'Perfil actualizado correctamente.',
            'success'
        );
    } catch (error) {
        console.error('Error guardando perfil:', error);
        const msg = error?.message || 'No se pudo guardar el perfil. Intenta de nuevo.';
        mostrarMensajePerfil(msg, 'error');
    } finally {
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = textoOriginal; }
    }
};

async function cargarPerfilUsuario() {
    try {
        const perfil = await obtenerMiPerfil();

        if (!perfil) {
            const cache = sessionStorage.getItem('usuario');
            if (cache) {
                try {
                    const usuarioCache = JSON.parse(cache);
                    rellenarPerfil(usuarioCache);
                    mostrarMensajePerfil('Mostrando la información guardada de tu sesión.', 'info');
                    return usuarioCache;
                } catch {
                    // Ignore cache parsing errors and continue with fallback state.
                }
            }

            rellenarPerfil({});
            mostrarMensajePerfil('No se pudo cargar el perfil. Verifica tu sesión.', 'error');
            return null;
        }

        rellenarPerfil(perfil);
        rellenarFormularioPerfil(perfil);
        mostrarMensajePerfil('', 'info');
        sessionStorage.setItem('usuario', JSON.stringify(perfil));
        return perfil;
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        rellenarPerfil({});
        rellenarFormularioPerfil({});
        mostrarMensajePerfil('No se pudo cargar el perfil. Inicia sesión nuevamente.', 'error');
        return null;
    }
}

const abrirModalPerfil = async (event) => {
    if (event) {
        event.preventDefault();
    }

    // Permite abrir el perfil aunque la función de cierre de CRUD no exista aún.
    if (typeof cerrarModalesCRUD === 'function') {
        cerrarModalesCRUD();
    }

    // Cerrar el sidebar automáticamente
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mainWrapper = document.getElementById('main-wrapper');
    
    if (sidebar) sidebar.classList.remove('open');
    if (mainWrapper) mainWrapper.classList.remove('sidebar-open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    localStorage.setItem('hospedaje_sidebar_open', '0');

    const modal = document.getElementById('modal-perfil');
    if (!modal) return;

    modal.classList.remove('hidden');
    alternarModoEdicionPerfil(false);
    document.body.classList.add('modal-open');
    mostrarMensajePerfil('Cargando tu información...');
    await cargarPerfilUsuario();
};

const cerrarModalPerfil = () => {
    const modal = document.getElementById('modal-perfil');
    if (!modal) return;

    modal.classList.add('hidden');
    mostrarMensajePerfil('', 'info');

    if (
        document.getElementById('modal-habitacion-admin')?.classList.contains('hidden')
        && document.getElementById('modal-servicio-admin')?.classList.contains('hidden')
        && document.getElementById('modal-detalle-admin')?.classList.contains('hidden')
    ) {
        document.body.classList.remove('modal-open');
    }
};

const cerrarSesion = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    window.location.href = 'login.html';
};

const configurarModalPerfil = () => {
    const modal = document.getElementById('modal-perfil');
    const cerrar = document.getElementById('btn-cerrar-modal-perfil');
    const cerrarSesionBtn = document.getElementById('btn-cerrar-sesion');
    const editarBtn = document.getElementById('btn-editar-perfil');

    if (cerrar && !cerrar.dataset.perfilInicializado) {
        cerrar.addEventListener('click', cerrarModalPerfil);
        cerrar.dataset.perfilInicializado = 'true';
    }

    if (modal && !modal.dataset.perfilInicializado) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                cerrarModalPerfil();
            }
        });
        modal.dataset.perfilInicializado = 'true';
    }

    if (cerrarSesionBtn && !cerrarSesionBtn.dataset.perfilInicializado) {
        cerrarSesionBtn.addEventListener('click', cerrarSesion);
        cerrarSesionBtn.dataset.perfilInicializado = 'true';
    }

    if (editarBtn && !editarBtn.dataset.perfilInicializado) {
        editarBtn.addEventListener('click', () => {
            alternarModoEdicionPerfil(true);
            mostrarMensajePerfil('Edita tus datos y guarda los cambios.', 'info');
        });
        editarBtn.dataset.perfilInicializado = 'true';
    }

    const cancelarEdicion = document.getElementById('btn-cancelar-edicion-perfil');
    if (cancelarEdicion && !cancelarEdicion.dataset.perfilInicializado) {
        cancelarEdicion.addEventListener('click', async () => {
            await cargarPerfilUsuario();
            alternarModoEdicionPerfil(false);
            mostrarMensajePerfil('', 'info');
        });
        cancelarEdicion.dataset.perfilInicializado = 'true';
    }

    const formPerfil = document.getElementById('perfil-form');
    if (formPerfil && !formPerfil.dataset.perfilInicializado) {
        formPerfil.addEventListener('submit', guardarPerfilUsuario);
        formPerfil.dataset.perfilInicializado = 'true';
    }
};

// Exponer funciones globalmente para eventos onclick
if (typeof window !== 'undefined') {
    window.abrirModalPerfil = abrirModalPerfil;
    window.cerrarModalPerfil = cerrarModalPerfil;
    window.cerrarSesion = cerrarSesion;
    window.configurarModalPerfil = configurarModalPerfil;
    
    // FUNCIÓN DE DEBUGGING - Para diagnóstico
    window.debugModalPerfil = () => {
        console.group('🔍 DEBUG MODAL PERFIL');
        
        console.log('1️⃣ FUNCIONES GLOBALES:');
        console.log('  - abrirModalPerfil:', typeof abrirModalPerfil);
        console.log('  - cerrarModalPerfil:', typeof cerrarModalPerfil);
        console.log('  - configurarModalPerfil:', typeof configurarModalPerfil);
        
        console.log('\n2️⃣ ELEMENTOS DEL DOM:');
        const elementos = [
            'modal-perfil',
            'perfil-lectura',
            'perfil-form',
            'btn-editar-perfil',
            'btn-cerrar-modal-perfil',
            'perfil-mensaje'
        ];
        elementos.forEach(id => {
            const el = document.getElementById(id);
            console.log(`  - #${id}:`, el ? '✓ Existe' : '✗ FALTA');
            if (el && id === 'modal-perfil') {
                console.log(`    - Clase "hidden": ${el.classList.contains('hidden') ? 'SÍ (oculto)' : 'NO (visible)'}`);
            }
        });
        
        console.log('\n3️⃣ SESIÓN:');
        console.log('  - Token:', sessionStorage.getItem('token') ? '✓' : '✗');
        const usuario = sessionStorage.getItem('usuario');
        console.log('  - Usuario en cache:', usuario ? '✓' : '✗');
        if (usuario) {
            try {
                const datos = JSON.parse(usuario);
                console.log('  - Datos usuario:', datos);
            } catch (e) {
                console.error('  - Error al parsear usuario:', e);
            }
        }
        
        console.log('\n4️⃣ API:');
        console.log('  - API_BASE_URL:', typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'NO DEFINIDA');
        console.log('  - requestJson:', typeof requestJson === 'function' ? '✓' : '✗');
        console.log('  - obtenerMiPerfil:', typeof obtenerMiPerfil === 'function' ? '✓' : '✗');
        
        console.log('\n5️⃣ ONCLICK:');
        const link = document.getElementById('sidebar-link-perfil');
        console.log('  - sidebar-link-perfil onclick:', link?.getAttribute('onclick'));
        
        console.groupEnd();
        
        console.log('\n💡 PARA PROBAR MANUALMENTE:');
        console.log('  - Abre el modal: abrirModalPerfil()');
        console.log('  - Carga perfil: await obtenerMiPerfil()');
        console.log('  - Test completo: testPerfilCompleto()');
    };
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        configurarModalPerfil();
    });
}
