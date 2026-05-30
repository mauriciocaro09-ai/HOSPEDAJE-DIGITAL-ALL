// ============================================
// VARIABLES GLOBALES
// ============================================

let paquetesCargados = [];
let serviciosPaquetesCargados = [];
let paqueteEnEdicion = null;
let paginaPaquetesActual = 1;
const paquetesPorPagina = 10;
let terminoBusquedaPaquetes = '';
let filtroEstadoPaquetes = 'all';

const placeholderImagenPaquete = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400';
const primerUrlPaquete = (valor) => valor ? valor.split(',')[0].trim() : null;

// ============================================
// NORMALIZADORES Y HELPERS
// ============================================

const normalizarEstadoPaquete = (estado) => {
    const activo = Number(estado) === 1 || estado === true || ['activo', 'active', 'true', '1', 'si', 'sí'].includes(normalizarTexto(estado));
    return {
        activo,
        texto: activo ? 'Activo' : 'Inactivo',
        clase: activo ? 'activo' : 'inactivo'
    };
};

const obtenerIdPaquete = (paquete) => paquete?.IDPaquete || paquete?.id || '';

const obtenerPaquetesFiltrados = () => {
    const termino = normalizarTexto(terminoBusquedaPaquetes);

    return paquetesCargados.filter((paquete) => {
        const estado = normalizarEstadoPaquete(paquete.Estado);
        const coincideBusqueda = !termino
            || normalizarTexto(paquete.NombrePaquete).includes(termino)
            || normalizarTexto(paquete.Descripcion).includes(termino);

        const coincideEstado = filtroEstadoPaquetes === 'all'
            || (filtroEstadoPaquetes === 'active' && estado.activo)
            || (filtroEstadoPaquetes === 'inactive' && !estado.activo);

        return coincideBusqueda && coincideEstado;
    });
};

const renderizarPaginacionPaquetes = (totalResultados) => {
    const contenedor = document.getElementById('paginacion-paquetes');
    if (!contenedor) return;

    const totalPaginas = Math.max(1, Math.ceil(totalResultados / paquetesPorPagina));
    paginaPaquetesActual = Math.min(paginaPaquetesActual, totalPaginas);

    if (totalResultados === 0) {
        contenedor.innerHTML = '';
        contenedor.classList.add('hidden');
        return;
    }

    const paginaAnterior = Math.max(1, paginaPaquetesActual - 1);
    const paginaSiguiente = Math.min(totalPaginas, paginaPaquetesActual + 1);

    contenedor.classList.remove('hidden');
    contenedor.innerHTML = `
        <button type="button" class="pagination-btn" data-accion-paquetes="anterior" ${paginaPaquetesActual === 1 ? 'disabled' : ''} aria-label="Ir a la página anterior">Anterior</button>
        <span class="pagination-info">Página ${paginaPaquetesActual} de ${totalPaginas} (${totalResultados} registros)</span>
        <button type="button" class="pagination-btn" data-accion-paquetes="siguiente" ${paginaPaquetesActual === totalPaginas ? 'disabled' : ''} aria-label="Ir a la página siguiente">Siguiente</button>
    `;

    // Remover listeners antiguos clonando elementos
    const btnAnterior = contenedor.querySelector('[data-accion-paquetes="anterior"]');
    const btnSiguiente = contenedor.querySelector('[data-accion-paquetes="siguiente"]');

    if (btnAnterior) {
        const newBtnAnterior = btnAnterior.cloneNode(true);
        btnAnterior.parentNode.replaceChild(newBtnAnterior, btnAnterior);
        newBtnAnterior.addEventListener('click', () => {
            paginaPaquetesActual = paginaAnterior;
            renderizarTablapaquetes();
        });
    }

    if (btnSiguiente) {
        const newBtnSiguiente = btnSiguiente.cloneNode(true);
        btnSiguiente.parentNode.replaceChild(newBtnSiguiente, btnSiguiente);
        newBtnSiguiente.addEventListener('click', () => {
            paginaPaquetesActual = paginaSiguiente;
            renderizarTablapaquetes();
        });
    }
};

const mostrarMensajePaquete = (mensaje = '', tipo = 'info') => {
        const elemento = document.getElementById('mensaje-paquete');
        if (!elemento) return;

        if (!mensaje) {
            elemento.textContent = '';
            elemento.className = 'crud-paquetes-mensaje';
            return;
        }

        elemento.textContent = mensaje;
        elemento.className = `crud-paquetes-mensaje ${tipo}`;
};

// ============================================
// CARGAR SERVICIOS DISPONIBLES
// ============================================

const cargarServiciosPaquetes = async () => {
    try {
        serviciosPaquetesCargados = await obtenerServiciosPaquetes() || [];
    } catch (error) {
        console.error('Error cargando servicios:', error);
        serviciosPaquetesCargados = [];
    }
};

const obtenerServiciosPaquetes = async () => {
    try {
        const response = await requestJson('/servicios');
        return response || [];
    } catch (error) {
        console.error('Error en obtenerServiciosPaquetes:', error);
        return [];
    }
};

// ============================================
// RENDERIZAR LISTA DE SERVICIOS EN MODAL
// ============================================

const renderizarServiciosPaquete = (serviciosSeleccionados = []) => {
    const contenedor = document.getElementById('lista-servicios-paquete');
    if (!contenedor) return;

    const idsSeleccionados = serviciosSeleccionados.map(s => s.IDServicio || s.id);

    contenedor.innerHTML = serviciosPaquetesCargados.length ? serviciosPaquetesCargados.map(servicio => `
        <div class="servicio-item ${idsSeleccionados.includes(servicio.IDServicio) ? 'selected' : ''}">
            <label>
                <input 
                    type="checkbox" 
                    class="servicio-checkbox"
                    value="${escaparHtml(servicio.IDServicio)}"
                    data-nombre="${escaparHtml(servicio.NombreServicio)}"
                    ${idsSeleccionados.includes(servicio.IDServicio) ? 'checked' : ''}
                >
                <strong>${escaparHtml(servicio.NombreServicio)}</strong>
                <br>
                <small>${escaparHtml(servicio.Descripcion || '')}</small>
                ${servicio.Costo ? `<br><small>$${Number(servicio.Costo).toLocaleString()}</small>` : ''}
            </label>
        </div>
    `).join('') : '<p>No hay servicios disponibles</p>';

    // Agregar event listeners a checkboxes
    contenedor.querySelectorAll('.servicio-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            e.target.closest('.servicio-item').classList.toggle('selected');
        });
    });
};

// ============================================
// OBTENER SERVICIOS SELECCIONADOS
// ============================================

const obtenerServiciosSeleccionados = () => {
    const checkboxes = document.querySelectorAll('#lista-servicios-paquete .servicio-checkbox:checked');
    return Array.from(checkboxes).map(cb => ({
        IDServicio: Number(cb.value),
        NombreServicio: cb.dataset.nombre
    }));
};

// ============================================
// CARGAR PAQUETES
// ============================================

const cargarPaquetes = async () => {
    try {
        mostrarMensajePaquete('Cargando paquetes...', 'info');
        paquetesCargados = await obtenerPaquetes() || [];
        paginaPaquetesActual = 1;
        renderizarTablapaquetes();
        actualizarResumenPaquetes();
        mostrarMensajePaquete('');
    } catch (error) {
        mostrarMensajePaquete('Error al cargar paquetes', 'error');
        console.error('Error:', error);
    }
};

const obtenerPaquetes = async () => {
    try {
        const esAdmin = !!document.getElementById('seccion-administrar-paquetes');
        return await requestJson(esAdmin ? '/paquetes?admin=true' : '/paquetes');
    } catch (error) {
        console.error('Error en obtenerPaquetes:', error);
        throw error;
    }
};

// ============================================
// ACTUALIZAR RESUMEN
// ============================================

const actualizarResumenPaquetes = () => {
    const total = document.getElementById('paquetes-total');
    const activos = document.getElementById('paquetes-activos');
    const inactivos = document.getElementById('paquetes-inactivos');

    if (total) total.textContent = paquetesCargados.length;
    if (activos) activos.textContent = paquetesCargados.filter(p => normalizarEstadoPaquete(p.Estado).activo).length;
    if (inactivos) inactivos.textContent = paquetesCargados.filter(p => !normalizarEstadoPaquete(p.Estado).activo).length;
};
// ============================================
// RENDERIZAR TABLA
// ============================================

const renderizarTablapaquetes = () => {
    const tbody = document.getElementById('tbody-paquetes');
    const paquetesFiltrados = obtenerPaquetesFiltrados();
    const totalResultados = paquetesFiltrados.length;
    const totalPaginas = Math.max(1, Math.ceil(totalResultados / paquetesPorPagina));

    if (paginaPaquetesActual > totalPaginas) {
        paginaPaquetesActual = totalPaginas;
    }

    const inicio = (paginaPaquetesActual - 1) * paquetesPorPagina;
    const paquetesPagina = paquetesFiltrados.slice(inicio, inicio + paquetesPorPagina);

    if (!totalResultados) {
        tbody.innerHTML = '<tr><td colspan="7" class="mensaje-vacio">No hay paquetes registrados</td></tr>';
        renderizarPaginacionPaquetes(0);
        return;
    }

    tbody.innerHTML = paquetesPagina.map(paquete => {
        const estado = normalizarEstadoPaquete(paquete.Estado);
        const precioFormato = Number(paquete.PrecioPaquete).toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        return `
            <tr>
                <td class="td-imagen">
                    <div class="crud-habitaciones-imagen">
                        <img src="${escaparHtml(primerUrlPaquete(paquete.Imagen) || placeholderImagenPaquete)}" alt="${escaparHtml(paquete.NombrePaquete || 'Paquete')}" onerror="this.onerror=null;this.src='${placeholderImagenPaquete}'">
                    </div>
                </td>
                <td class="td-nombre"><strong class="paquete-nombre">${escaparHtml(paquete.NombrePaquete || 'Sin nombre')}</strong></td>
                <td class="td-descripcion paquete-descripcion">${escaparHtml((paquete.Descripcion || '').substring(0, 120))}${paquete.Descripcion && paquete.Descripcion.length > 120 ? '...' : ''}</td>
                <td class="td-costo"><strong>$${precioFormato}</strong></td>
                <td class="td-duracion">${paquete.DuracionNoches} noche${paquete.DuracionNoches !== 1 ? 's' : ''}</td>
                <td class="td-estado">
                    <label class="switch" title="Estado del paquete">
                        <input type="checkbox" class="paquete-switch" data-id="${paquete.IDPaquete}" ${estado.activo ? 'checked' : ''} aria-label="Activar paquete ${escaparHtml(paquete.NombrePaquete)}">
                        <span class="slider"></span>
                    </label>
                </td>
                <td class="td-acciones">
                    <div class="acciones-group">
                        <button class="action-btn action-view" onclick="cargarDetallesPaquete(${paquete.IDPaquete})" title="Ver detalles" aria-label="Ver detalles del paquete ${escaparHtml(paquete.NombrePaquete)}">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="action-btn action-edit" onclick="abrirModalEditar(${paquete.IDPaquete})" title="Editar" aria-label="Editar paquete ${escaparHtml(paquete.NombrePaquete)}">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-btn action-delete" onclick="eliminarPaquete(${paquete.IDPaquete})" title="Eliminar" aria-label="Eliminar paquete ${escaparHtml(paquete.NombrePaquete)}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderizarPaginacionPaquetes(totalResultados);

    // Agregar manejadores al switch de estado
    // Primero remover listeners antiguos clonando y reemplazando elementos
    document.querySelectorAll('.paquete-switch').forEach(el => {
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
    });

    // Ahora agregar listeners a los elementos nuevos
    document.querySelectorAll('.paquete-switch').forEach(el => {
        el.addEventListener('change', async (e) => {
            const checkbox = e.target;
            const id = checkbox.dataset.id;
            const nuevoEstado = checkbox.checked ? 1 : 0;

            try {
                mostrarMensajePaquete('Actualizando estado...', 'info');
                await requestJson(`/paquetes/${id}`, {
                    method: 'PUT',
                    body: { Estado: nuevoEstado }
                });
                mostrarMensajePaquete('Estado actualizado', 'exito');
                cargarPaquetes();
            } catch (error) {
                mostrarMensajePaquete('Error actualizando estado', 'error');
                console.error('Error actualizando estado de paquete:', error);
                checkbox.checked = !checkbox.checked;
            }
        });
    });
};

// ============================================
// ABRIR MODAL - CREAR
// ============================================

const abrirModalCrear = () => {
    cerrarModalesPaquete();
    paqueteEnEdicion = null;
    
    const modal = document.getElementById('modal-paquete');
    const titulo = document.getElementById('modal-paquete-titulo');
    const formulario = document.getElementById('formulario-paquete');

    if (formulario) formulario.reset();

    const preview = document.getElementById('paquete-imagen-preview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }

    renderizarServiciosPaquete([]);
    
    titulo.textContent = 'Crear nuevo paquete';
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
};

// ============================================
// ABRIR MODAL - EDITAR
// ============================================

const abrirModalEditar = async (id) => {
    try {
        cerrarModalesPaquete();
        mostrarMensajePaquete('Cargando detalles...', 'info');

        const paquete = await requestJson(`/paquetes/${id}`);
        if (!paquete) {
            mostrarMensajePaquete('Paquete no encontrado', 'error');
            return;
        }

        paqueteEnEdicion = paquete;

        const modal = document.getElementById('modal-paquete');
        const titulo = document.getElementById('modal-paquete-titulo');
        const formulario = document.getElementById('formulario-paquete');

        // Llenar formulario
        document.getElementById('paquete-nombre').value = paquete.NombrePaquete || '';
        document.getElementById('paquete-descripcion').value = paquete.Descripcion || '';
        document.getElementById('paquete-precio').value = paquete.PrecioPaquete || '';
        document.getElementById('paquete-duracion').value = paquete.DuracionNoches || 1;
        const elIncluir = document.getElementById('paquete-incluir-habitacion');
        if (elIncluir) elIncluir.checked = Boolean(paquete.IncluirHabitacion);
        document.getElementById('paquete-imagen').value = paquete.Imagen || '';

        const preview = document.getElementById('paquete-imagen-preview');
        if (preview && paquete.Imagen) {
            preview.src = primerUrlPaquete(paquete.Imagen);
            preview.style.display = 'block';
            preview.onerror = () => { preview.style.display = 'none'; };
        } else if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }

        document.getElementById('paquete-estado').value = paquete.Estado || 1;

        // Renderizar servicios seleccionados
        renderizarServiciosPaquete(paquete.servicios || []);

        titulo.textContent = 'Editar paquete';
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        mostrarMensajePaquete('');
    } catch (error) {
        mostrarMensajePaquete('Error cargando paquete', 'error');
        console.error('Error:', error);
    }
};

// ============================================
// CARGAR DETALLES Y SERVICIOS
// ============================================

const cargarDetallesPaquete = async (id) => {
    try {
        cerrarModalesPaquete();
        mostrarMensajePaquete('Cargando detalles...', 'info');

        const paquete = await requestJson(`/paquetes/${id}`);
        if (!paquete) {
            mostrarMensajePaquete('Paquete no encontrado', 'error');
            return;
        }

        // Llenar modal de detalles
        document.getElementById('detalles-nombre').textContent = paquete.NombrePaquete;
        document.getElementById('detalles-descripcion').textContent = paquete.Descripcion || 'Sin descripción';
        document.getElementById('detalles-precio').textContent = `$${Number(paquete.PrecioPaquete).toLocaleString('es-CO')}`;
        document.getElementById('detalles-duracion').textContent = `${paquete.DuracionNoches} noche${paquete.DuracionNoches !== 1 ? 's' : ''}`;
        
        const imgEl = document.getElementById('detalles-imagen');
        if (imgEl) {
            imgEl.src = primerUrlPaquete(paquete.Imagen) || placeholderImagenPaquete;
            imgEl.onerror = function() { this.onerror = null; this.src = placeholderImagenPaquete; };
        }

        // Llenar servicios
        const contenedorServicios = document.getElementById('detalles-servicios');
        if (paquete.servicios && paquete.servicios.length) {
            contenedorServicios.innerHTML = paquete.servicios.map(servicio => `
                <div class="servicio-detalle">
                    <strong>${escaparHtml(servicio.NombreServicio)}</strong>
                    <p>${escaparHtml(servicio.Descripcion || '')}</p>
                    <small>Duración: ${escaparHtml(servicio.Duracion || 'N/A')}</small>
                </div>
            `).join('');
        } else {
            contenedorServicios.innerHTML = '<p>Este paquete no incluye servicios adicionales.</p>';
        }

        const modal = document.getElementById('modal-paquete-detalles');
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        mostrarMensajePaquete('');
    } catch (error) {
        mostrarMensajePaquete('Error cargando detalles', 'error');
        console.error('Error:', error);
    }
};

// ============================================
// GUARDAR PAQUETE
// ============================================

const guardarPaquete = async (e) => {
    e.preventDefault();

    const formulario = document.getElementById('formulario-paquete');
    const datos = new FormData(formulario);
    
    const payload = {
        NombrePaquete: datos.get('NombrePaquete').trim(),
        Descripcion: datos.get('Descripcion').trim(),
        PrecioPaquete: Number(datos.get('PrecioPaquete')),
        DuracionNoches: Number(datos.get('DuracionNoches')),
        IncluirHabitacion: document.getElementById('paquete-incluir-habitacion')?.checked ? 1 : 1,
        Imagen: document.getElementById('paquete-imagen').value.trim() || null,
        Estado: Number(datos.get('Estado'))
    };

    // Validaciones
    if (payload.Imagen && payload.Imagen.startsWith('data:')) {
        mostrarMensajePaquete('⚠️ La URL de imagen no es válida. Debes pegar la DIRECCIÓN de la imagen (https://...), no la imagen en sí. Haz clic derecho sobre la imagen → "Copiar dirección de imagen".', 'error');
        return;
    }

    if (!payload.NombrePaquete) {
        mostrarMensajePaquete('El nombre es obligatorio', 'error');
        return;
    }

    if (payload.PrecioPaquete <= 0) {
        mostrarMensajePaquete('El precio debe ser mayor a 0', 'error');
        return;
    }

    try {
        mostrarMensajePaquete('Guardando...', 'info');

        const url = paqueteEnEdicion ? `/paquetes/${paqueteEnEdicion.IDPaquete}` : '/paquetes';
        const metodo = paqueteEnEdicion ? 'PUT' : 'POST';

        const response = await requestJson(url, {
            method: metodo,
            body: payload
        });

        mostrarMensajePaquete(
            paqueteEnEdicion ? 'Paquete actualizado' : 'Paquete creado',
            'exito'
        );

        cerrarModalPaquete();
        cargarPaquetes();
    } catch (error) {
        mostrarMensajePaquete('Error al guardar', 'error');
        console.error('Error:', error);
    }
};

// ============================================
// ELIMINAR PAQUETE
// ============================================

const eliminarPaquete = async (id) => {
    const resultadoPaq = await Swal.fire({
        title: '¿Eliminar paquete?',
        text: 'Se eliminará este paquete permanentemente. Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#718096',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    if (!resultadoPaq.isConfirmed) return;

    try {
        mostrarMensajePaquete('Eliminando...', 'info');

        await requestJson(`/paquetes/${id}`, {
            method: 'DELETE'
        });

        mostrarMensajePaquete('Paquete eliminado', 'exito');
        cargarPaquetes();
    } catch (error) {
        // error.message trae el mensaje real del backend (ej: "Paquete en uso en reservas activas")
        const msg = error.message || 'Error al eliminar el paquete';
        mostrarMensajePaquete(msg, 'error');
        if (typeof showToast === 'function') showToast(msg, 'error');
        console.error('Error:', error);
    }
};

// ============================================
// CERRAR MODALES
// ============================================

const cerrarModalPaquete = () => {
    const modal = document.getElementById('modal-paquete');
    if (modal) modal.classList.add('hidden');
    if (!document.querySelector('.crud-modal:not(.hidden)')) {
        document.body.classList.remove('modal-open');
    }
};

const cerrarModalesPaquete = () => {
    document.querySelectorAll('.crud-modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    document.body.classList.remove('modal-open');
};

// ============================================
// BÚSQUEDA Y FILTROS
// ============================================

const buscarPaquetes = async () => {
    const termino = document.getElementById('busqueda-paquetes')?.value.trim();
    terminoBusquedaPaquetes = termino || '';
    paginaPaquetesActual = 1;
    renderizarTablapaquetes();
};

const filtrarPaquetes = async () => {
    const filtro = document.getElementById('filtro-estado-paquetes')?.value || 'all';
    filtroEstadoPaquetes = filtro;
    paginaPaquetesActual = 1;
    renderizarTablapaquetes();
};
// ============================================
// EVENT LISTENERS
// ============================================

const initImagenUrlPreview = () => {
    const urlInput = document.getElementById('paquete-imagen');
    if (!urlInput || urlInput._previewListenerAdded) return;
    urlInput._previewListenerAdded = true;

    const mostrarPreview = (url) => {
        const preview = document.getElementById('paquete-imagen-preview');
        if (!preview) return;
        if (url && url.startsWith('data:')) {
            preview.src = '';
            preview.style.display = 'none';
            mostrarMensajePaquete('Eso no es una URL. Haz clic derecho sobre la imagen en internet → "Copiar dirección de imagen" → pega la URL https://...', 'error');
            return;
        }
        if (url) {
            preview.src = url;
            preview.style.display = 'block';
            preview.onerror = () => { preview.style.display = 'none'; };
        } else {
            preview.src = '';
            preview.style.display = 'none';
        }
    };

    urlInput.addEventListener('input', () => mostrarPreview(urlInput.value.trim()));
    urlInput.addEventListener('paste', () => setTimeout(() => mostrarPreview(urlInput.value.trim()), 100));
};

const initPaquetesListeners = () => {
    // Botón crear
    const btnCrear = document.getElementById('btn-nuevo-paquete');
    if (btnCrear && !btnCrear._eventListenersPaquetesAdded) {
        btnCrear.addEventListener('click', abrirModalCrear);
        btnCrear._eventListenersPaquetesAdded = true;
    }

    // Formulario
    const formulario = document.getElementById('formulario-paquete');
    if (formulario && !formulario._eventListenersPaquetesAdded) {
        formulario.addEventListener('submit', guardarPaquete);
        formulario._eventListenersPaquetesAdded = true;
    }

    // Búsqueda
    const inputBusqueda = document.getElementById('busqueda-paquetes');
    if (inputBusqueda && !inputBusqueda._eventListenersPaquetesAdded) {
        inputBusqueda.addEventListener('input', buscarPaquetes);
        inputBusqueda._eventListenersPaquetesAdded = true;
    }

    // Filtro estado
    const selectFiltro = document.getElementById('filtro-estado-paquetes');
    if (selectFiltro && !selectFiltro._eventListenersPaquetesAdded) {
        selectFiltro.addEventListener('change', filtrarPaquetes);
        selectFiltro._eventListenersPaquetesAdded = true;
    }

    // Preview de imagen por URL
    initImagenUrlPreview();

    // Cerrar modales
    document.querySelectorAll('.crud-modal-close, #btn-cancelar-paquete, #btn-cerrar-detalles, #btn-cerrar-detalles-btn').forEach(btn => {
        if (!btn._eventListenersPaquetesAdded) {
            btn.addEventListener('click', cerrarModalesPaquete);
            btn._eventListenersPaquetesAdded = true;
        }
    });

    // Cerrar modales al hacer click en overlay
    document.querySelectorAll('.crud-modal').forEach(modal => {
        if (!modal._eventListenersPaquetesAdded) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cerrarModalesPaquete();
                }
            });
            modal._eventListenersPaquetesAdded = true;
        }
    });
};

async function initPaquetes() {
    // Cargar datos iniciales
    await cargarServiciosPaquetes();
    await cargarPaquetes();

    // Inicializar event listeners
    initPaquetesListeners();
}

// ============================================
// EXPONER FUNCIONES AL SCOPE GLOBAL (onclick en HTML)
// ============================================

window.eliminarPaquete       = eliminarPaquete;
window.abrirModalEditar      = abrirModalEditar;
window.cargarDetallesPaquete = cargarDetallesPaquete;
window.abrirModalCrear       = abrirModalCrear;
window.cerrarModalesPaquete  = cerrarModalesPaquete;
window.buscarPaquetes        = buscarPaquetes;
window.filtrarPaquetes       = filtrarPaquetes;

// ============================================
// INICIALIZACIÓN
// ============================================

// En paquetes.html corre solo; en index.html lo llama app.js via cargarSeccion
if (!document.getElementById('seccion-administrar-paquetes')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPaquetes);
    } else {
        initPaquetes();
    }
}
