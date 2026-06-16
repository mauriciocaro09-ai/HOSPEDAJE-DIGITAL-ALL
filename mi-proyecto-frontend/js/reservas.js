// Encapsular en IIFE para evitar contaminar el scope global
(function(){
    'use strict';

    // ============================================
    // VARIABLES LOCALES AL MÓDULO
    // ============================================

    let reservasAdminCargadas = [];
    let clientesCargados = [];
    let estadosReservasCargados = [];
    let metodosPagoCargados = [];
    let reservaEnEdicion = null;

// ============================================
// NORMALIZADORES Y HELPERS
// ============================================

const normalizarEstadoReserva = (estado) => {
    const estadoNormalizado = normalizarTexto(estado || '');
    const mapeaEstados = {
        'confirmada': { texto: 'Confirmada', clase: 'confirmada' },
        'pendiente': { texto: 'Pendiente', clase: 'pendiente' },
        'cancelada': { texto: 'Cancelada', clase: 'cancelada' },
        'completada': { texto: 'Completada', clase: 'completada' }
    };
    return mapeaEstados[estadoNormalizado] || { texto: estado || 'Desconocido', clase: 'desconocido' };
};

const obtenerIdReserva = (reserva) => reserva?.IdReserva || reserva?.id || '';

const resolverUsuarioActual = () => {
    try {
        const cache = sessionStorage.getItem('usuario');
        if (!cache) return 1;
        const usuario = JSON.parse(cache);
        return Number(usuario?.IDUsuario || usuario?.id || 1);
    } catch {
        return 1;
    }
};

const mostrarVistaTabla = () => {
    document.getElementById('reservas-admin-tabla-wrap')?.classList.remove('hidden');
    document.getElementById('reservas-admin-busqueda')?.classList.remove('hidden');
    document.getElementById('form-reserva-admin')?.classList.add('hidden');
    const titulo = document.getElementById('reserva-admin-form-title');
    if (titulo) titulo.textContent = 'Gestión de Reservas';
    const btnNuevo = document.getElementById('btn-nuevo-reserva-admin');
    if (btnNuevo) btnNuevo.style.display = '';
    document.body.classList.remove('reserva-form-activa');
};

const mostrarVistaFormulario = () => {
    document.getElementById('reservas-admin-tabla-wrap')?.classList.add('hidden');
    document.getElementById('reservas-admin-busqueda')?.classList.add('hidden');
    document.getElementById('form-reserva-admin')?.classList.remove('hidden');
    const btnNuevo = document.getElementById('btn-nuevo-reserva-admin');
    if (btnNuevo) btnNuevo.style.display = 'none';

    // Calcular dimensiones reales para el dashboard fullscreen
    const header = document.querySelector('header');
    const headerH = header ? Math.round(header.getBoundingClientRect().height) : 64;
    const mainWrapper = document.getElementById('main-wrapper');
    const sidebarW = mainWrapper?.classList.contains('sidebar-open') ? 280 : 80;
    document.documentElement.style.setProperty('--reserva-form-top', headerH + 'px');
    document.documentElement.style.setProperty('--reserva-form-left', sidebarW + 'px');

    document.body.classList.add('reserva-form-activa');
};

const mostrarMensajeReservaAdmin = (mensaje = '', tipo = 'info') => {
    const elemento = document.getElementById('mensaje-reserva-admin');
    if (!elemento) return;
    
    if (!mensaje) {
        elemento.textContent = '';
        elemento.className = 'crud-clientes-mensaje';
        return;
    }

    elemento.textContent = mensaje;
    elemento.className = `crud-clientes-mensaje ${tipo}`;
};

const mostrarErrorInline = (idCampo, mensaje) => {
    const campo = document.getElementById(idCampo);
    const errorId = `${idCampo}-error`;
    const error = document.getElementById(errorId);

    if (campo) {
        campo.classList.add('input-error');
        campo.setAttribute('aria-invalid', 'true');
    }

    if (error) {
        error.textContent = mensaje;
        error.classList.remove('hidden');
    }
};

const limpiarErrorInline = (idCampo) => {
    const campo = document.getElementById(idCampo);
    const error = document.getElementById(`${idCampo}-error`);

    if (campo) {
        campo.classList.remove('input-error');
        campo.removeAttribute('aria-invalid');
    }

    if (error) {
        error.textContent = '';
        error.classList.add('hidden');
    }
};

const limpiarErroresInlineReserva = () => {
    [
        'reserva-admin-tipo-documento',
        'reserva-admin-cliente',
            'reserva-admin-contacto',
            'reserva-admin-email',
            'reserva-admin-pais',
            'reserva-admin-paquetes',
            'reserva-admin-fecha-reserva',
            'reserva-admin-monto-total',
        'reserva-admin-habitacion',
        'reserva-admin-fecha-inicio',
        'reserva-admin-fecha-fin',
        'reserva-admin-subtotal',
        'reserva-admin-descuento',
        'reserva-admin-metodo-pago',
        'reserva-admin-estado'
    ].forEach(limpiarErrorInline);
};

const hayCruceDeFechasConReservas = (habitacionId, fechaInicio, fechaFin, ignorarIdReserva = null) => {
    if (!habitacionId || !fechaInicio || !fechaFin) return false;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    return reservasAdminCargadas.some((reserva) => {
        if (ignorarIdReserva && String(obtenerIdReserva(reserva)) === String(ignorarIdReserva)) {
            return false;
        }

        if ((reserva.NombreEstadoReserva || '').toLowerCase().includes('cancelad')) return false;

        if (String(reserva.IDHabitacion || '') !== String(habitacionId)) return false;

        const inicioReserva = reserva.FechaInicio ? new Date(reserva.FechaInicio) : null;
        const finReserva = reserva.FechaFinalizacion ? new Date(reserva.FechaFinalizacion) : null;

        if (!inicioReserva || !finReserva) return false;

        return inicio <= finReserva && fin >= inicioReserva;
    });
};

// ============================================
// FUNCIONES DE CARGA
// ============================================

const cargarReservasAdmin = async () => {
    const contenedor = document.getElementById('reservas-admin-tbody');
    if (!contenedor) return;

    try {
        mostrarMensajeReservaAdmin('Cargando reservas...', 'info');
        reservasAdminCargadas = await obtenerReservas();
        clientesCargados = await obtenerClientes();
        estadosReservasCargados = await obtenerEstadosReservas();
        metodosPagoCargados = await obtenerMetodosPago();
        // inicializar datepickers ahora que tenemos las reservas cargadas
        inicializarDatepickers();
        inicializarReservasAdmin();

        resetPagination('reservasAdmin');
        renderizarReservasAdmin();
        actualizarResumenReservasAdmin();
        mostrarMensajeReservaAdmin('');
    } catch (error) {
        console.error('Error al cargar reservas:', error);
        mostrarMensajeReservaAdmin('Error al cargar reservas', 'error');
    }
};

const obtenerReservas = async () => {
    try {
        return await requestJson('/reservas');
    } catch (error) {
        console.error('Error en obtenerReservas:', error);
        throw error;
    }
};

const obtenerClientes = async () => {
    try {
        return await requestJson('/clientes');
    } catch (error) {
        console.error('Error en obtenerClientes:', error);
        return [];
    }
};

const obtenerEstadosReservas = async () => {
    try {
        return await requestJson('/reservas/estados');
    } catch (error) {
        console.error('Error en obtenerEstadosReservas:', error);
        return [];
    }
};

const obtenerMetodosPago = async () => {
    try {
        return await requestJson('/reservas/metodos-pago');
    } catch (error) {
        console.error('Error en obtenerMetodosPago:', error);
        return [];
    }
};

// ============================================
// Datepicker (flatpickr) + bloqueo por disponibilidad
// ============================================
let fpInicio = null;
let fpFin = null;

const fechaEnRangosReservados = (date) => {
    if (!Array.isArray(reservasAdminCargadas) || !reservasAdminCargadas.length) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const selectHab = document.getElementById('reserva-admin-habitacion');
    const seleccionado = selectHab ? selectHab.value : '';
    const idEditando = reservaEnEdicion ? String(obtenerIdReserva(reservaEnEdicion)) : null;
    return reservasAdminCargadas.some(r => {
        // ignorar la reserva que se está editando
        if (idEditando && String(obtenerIdReserva(r)) === idEditando) return false;
        // ignorar reservas canceladas
        if ((r.NombreEstadoReserva || '').toLowerCase().includes('cancelad')) return false;
        // si hay habitación seleccionada, sólo considerar reservas de esa habitación
        if (seleccionado && String(r.IDHabitacion || '') !== String(seleccionado)) return false;
        try {
            const inicio = r.FechaInicio ? new Date(r.FechaInicio) : null;
            const fin = r.FechaFinalizacion ? new Date(r.FechaFinalizacion) : null;
            if (!inicio || !fin) return false;
            const si = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
            const sf = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
            return d >= si && d <= sf;
        } catch { return false; }
    });
};

const actualizarOpcionesHabitacion = (fechaInicio, fechaFin) => {
    const selectHab = document.getElementById('reserva-admin-habitacion');
    if (!selectHab || !_habitacionesCache.length) return;

    const valorActual = selectHab.value;
    const ignorarId = reservaEnEdicion ? obtenerIdReserva(reservaEnEdicion) : null;

    const habs = (fechaInicio && fechaFin)
        ? _habitacionesCache.filter(h => !hayCruceDeFechasConReservas(h.IDHabitacion, fechaInicio, fechaFin, ignorarId))
        : _habitacionesCache;

    selectHab.innerHTML = ['<option value="" disabled selected hidden>-- Selecciona habitación --</option>']
        .concat(habs.map(h =>
            `<option value="${escaparHtml(String(h.IDHabitacion))}">${escaparHtml(h.NombreHabitacion || h.Nombre || 'Habitación')}</option>`
        ))
        .join('');

    if (valorActual && habs.some(h => String(h.IDHabitacion) === valorActual)) {
        selectHab.value = valorActual;
    }
};

const inicializarDatepickers = () => {
    if (typeof flatpickr === 'undefined') return;

    // destruir instancias previas
    if (fpInicio) fpInicio.destroy();
    if (fpFin) fpFin.destroy();

    fpInicio = flatpickr('#reserva-admin-fecha-inicio', {
        dateFormat: 'Y-m-d',
        disable: [fechaEnRangosReservados],
        onChange: function(selectedDates, dateStr) {
            if (selectedDates.length) {
                const min = selectedDates[0];
                if (fpFin) fpFin.set('minDate', min);
            }
            const fin = document.getElementById('reserva-admin-fecha-fin')?.value || '';
            actualizarOpcionesHabitacion(dateStr || '', fin);
            actualizarSidebarResumen();
        }
    });

    fpFin = flatpickr('#reserva-admin-fecha-fin', {
        dateFormat: 'Y-m-d',
        disable: [fechaEnRangosReservados],
        onChange: function(selectedDates, dateStr) {
            const inicio = document.getElementById('reserva-admin-fecha-inicio')?.value || '';
            actualizarOpcionesHabitacion(inicio, dateStr || '');
            actualizarSidebarResumen();
        }
    });
};

// ============================================
// FILTRADO Y BÚSQUEDA
// ============================================

const obtenerFiltrosReservasAdmin = () => ({
    termino: normalizarTexto(document.getElementById('busqueda-reservas-admin')?.value),
    estado: document.getElementById('filtro-estado-reservas-admin')?.value || 'all'
});

const reservasAdminCoinciden = (reserva, filtros) => {
    const cliente = reserva.NombreCliente || '';
    const textoBusqueda = [
        cliente,
        reserva.NroDocumentoCliente,
        reserva.FechaInicio,
        reserva.FechaFinalizacion,
        reserva.Monto_Total
    ].filter(Boolean).join(' ').toLowerCase();

    const coincideTexto = !filtros.termino || textoBusqueda.includes(filtros.termino);

    if (filtros.estado !== 'all') {
        const estadoNormalizado = normalizarTexto(reserva.NombreEstadoReserva || '');
        if (filtros.estado === 'confirmada' && estadoNormalizado !== 'confirmada') return false;
        if (filtros.estado === 'pendiente' && estadoNormalizado !== 'pendiente') return false;
        if (filtros.estado === 'cancelada' && estadoNormalizado !== 'cancelada') return false;
    }

    return coincideTexto;
};

// ============================================
// RENDERIZAR TABLA
// ============================================

const actualizarResumenReservasAdmin = (reservas) => {
    const lista = Array.isArray(reservas || reservasAdminCargadas) ? (reservas || reservasAdminCargadas) : [];
    const total = document.getElementById('reservas-admin-total');
    const confirmadas = document.getElementById('reservas-admin-confirmadas');
    const pendientes = document.getElementById('reservas-admin-pendientes');

    if (total) total.textContent = lista.length;
    if (confirmadas) confirmadas.textContent = lista.filter(r => normalizarTexto(r.NombreEstadoReserva || '') === 'confirmada').length;
    if (pendientes) pendientes.textContent = lista.filter(r => normalizarTexto(r.NombreEstadoReserva || '') === 'pendiente').length;
};

const renderizarReservasAdmin = () => {
    const contenedor = document.getElementById('reservas-admin-tbody');
    if (!contenedor) return;

    const filtros = obtenerFiltrosReservasAdmin();
    const reservasFiltradas = reservasAdminCargadas.filter(r => reservasAdminCoinciden(r, filtros));
    actualizarResumenReservasAdmin(reservasAdminCargadas);

    const paginacion = getPaginatedItems(reservasFiltradas, 'reservasAdmin');
    const tablaWrap = contenedor.closest('.crud-clientes-tabla-wrap') || contenedor;
    renderPaginationControls('reservasAdmin', tablaWrap, paginacion.totalItems, paginacion.totalPages, paginacion.currentPage, renderizarReservasAdmin);

    if (!paginacion.items.length) {
        contenedor.innerHTML = '<tr><td colspan="7" class="mensaje-vacio">No hay reservas que coincidan con el filtro actual.</td></tr>';
        return;
    }

    contenedor.innerHTML = paginacion.items.map(reserva => {
        const cliente = reserva.NombreCliente || '—';
        const estado = normalizarEstadoReserva(reserva.NombreEstadoReserva);
        const idReserva = obtenerIdReserva(reserva);
        const montoFormato = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(reserva.Monto_Total || 0);
        const nro = reserva.NroDocumentoCliente || '—';
        const tipo = reserva.TipoDocumentoCliente || reserva.TipoDocumento || '';
        const documento = tipo ? `${tipo} - ${nro}` : nro;

        return `
            <tr>
                <td><strong>${escaparHtml(cliente)}</strong></td>
                <td>${escaparHtml(documento)}</td>
                <td>${escaparHtml(fmtFecha(reserva.FechaInicio))}</td>
                <td>${escaparHtml(fmtFecha(reserva.FechaFinalizacion))}</td>
                <td>${montoFormato}</td>
                <td><span class="estado-reserva estado-${estado.clase}">${estado.texto}</span></td>
                <td>
                    <div class="crud-clientes-acciones">
                        ${!['cancelada','completada'].includes(estado.clase) ? `
                        <button type="button" class="btn-mini btn-mini-icon btn-mini-editar" data-accion-reserva="editar" data-id="${escaparHtml(idReserva)}" title="Editar">
                            <i class="fa-solid fa-pencil"></i>
                        </button>` : ''}
                        <button type="button" class="btn-mini btn-mini-icon" data-accion-reserva="estado" data-id="${escaparHtml(idReserva)}" title="Cambiar estado" style="background:#6c757d;color:#fff;border-color:#6c757d;">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                        <button type="button" class="btn-mini btn-mini-icon btn-mini-ver" data-accion-reserva="ver" data-id="${escaparHtml(idReserva)}" title="Ver detalles">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        ${['pendiente','confirmada'].includes(estado.clase) ? `
                        <button type="button" class="btn-mini btn-mini-icon" data-accion-reserva="cancelar" data-id="${escaparHtml(idReserva)}" title="Anular reserva" style="background:#ef4444;color:#fff;border-color:#ef4444;">
                            <i class="fa-solid fa-ban"></i>
                        </button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

// ============================================
// BUSQUEDA Y FILTROS
// ============================================

const buscarReservasAdmin = () => {
    resetPagination('reservasAdmin');
    renderizarReservasAdmin();
};

const filtrarReservasAdmin = () => {
    resetPagination('reservasAdmin');
    renderizarReservasAdmin();
};

// ============================================
// CRUD OPERATIONS
// ============================================

const abrirModalNuevaReserva = async () => {
    cerrarModalesCRUD();
    reservaEnEdicion = null;
    _seleccionadosAdmin = {};

    const titulo = document.getElementById('reserva-admin-form-title');
    if (titulo) titulo.textContent = 'Crear nueva reserva';

    const btnGuardar = document.getElementById('wizard-submit');
    if (btnGuardar) btnGuardar.textContent = 'Guardar reserva';

    const formulario = document.getElementById('form-reserva-admin');
    if (formulario) formulario.reset();
    const habLabel = document.getElementById('hab-selected-label');
    if (habLabel) habLabel.textContent = '-- Selecciona habitación --';
    document.querySelectorAll('.hab-option').forEach(o => o.classList.remove('selected'));
    limpiarErroresInlineReserva();
    mostrarMensajeReservaAdmin('');

    mostrarVistaFormulario();

    mostrarPasoWizard(1);
    try { await poblarSelectsReserva(); } catch {}
    try { inicializarDatepickers(); } catch {}

    const seccion = document.getElementById('seccion-administrar-reservas');
    if (seccion) seccion.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============================================
// WIZARD: navegación entre pasos
// ============================================
let reservaWizardStep = 1;
const MAX_WIZARD_STEP = 3;

const mostrarPasoWizard = (step) => {
    reservaWizardStep = Math.max(1, Math.min(MAX_WIZARD_STEP, step));
    const indicador = document.getElementById('wizard-step-indicator');
    if (indicador) {
        indicador.textContent = reservaWizardStep;
    }
    const pasos = document.querySelectorAll('.wizard-step');
    const hayPasosWizard = pasos.length > 0;
    pasos.forEach(p => {
        const isCurrent = Number(p.getAttribute('data-step')) === reservaWizardStep;
        // keep using .hidden for compatibility but add .wizard-active to trigger animations
        if (isCurrent) {
            p.classList.remove('hidden');
            p.classList.add('wizard-active');
            p.setAttribute('aria-hidden', 'false');
        } else {
            p.classList.add('hidden');
            p.classList.remove('wizard-active');
            p.setAttribute('aria-hidden', 'true');
        }
    });

    // mostrar/ocultar botones
    const prev = document.getElementById('wizard-prev');
    const next = document.getElementById('wizard-next');
    const submit = document.getElementById('wizard-submit');
    if (hayPasosWizard) {
        if (prev) prev.style.display = reservaWizardStep === 1 ? 'none' : '';
        if (next) next.style.display = reservaWizardStep === MAX_WIZARD_STEP ? 'none' : '';
        if (submit) submit.classList.toggle('hidden', reservaWizardStep !== MAX_WIZARD_STEP);
    } else if (submit) {
        submit.classList.remove('hidden');
    }

    // Si estamos en el paso 3, construir resumen
    if (hayPasosWizard && reservaWizardStep === MAX_WIZARD_STEP) construirResumenWizard();

    // actualizar barra de progreso
    const progressBar = document.querySelector('.wizard-progress > i');
    if (hayPasosWizard && progressBar) {
        const pct = Math.round((reservaWizardStep - 1) / (MAX_WIZARD_STEP - 1) * 100);
        progressBar.style.width = `${pct}%`;
    }
};

const construirResumenWizard = () => {
    const resumen = document.getElementById('wizard-resumen');
    if (!resumen) return;
    const tipo = document.getElementById('reserva-admin-tipo-documento')?.value || '';
    const cliente = document.getElementById('reserva-admin-cliente')?.value || '—';
    const contacto = document.getElementById('reserva-admin-contacto')?.value || '—';
    const email = document.getElementById('reserva-admin-email')?.value || '—';
    const pais = document.getElementById('reserva-admin-pais')?.value || '—';
    const inicio = document.getElementById('reserva-admin-fecha-inicio')?.value || '—';
    const fin = document.getElementById('reserva-admin-fecha-fin')?.value || '—';
    const subtotal = Number(document.getElementById('reserva-admin-subtotal')?.value || 0);
    const descuento = Number(document.getElementById('reserva-admin-descuento')?.value || 0);
    const metodo = document.getElementById('reserva-admin-metodo-pago')?.selectedOptions[0]?.text || '—';
    const IVA = subtotal > 0 ? subtotal * 0.19 : 0;
    const total = (subtotal - descuento) + IVA;

    resumen.innerHTML = `
        <p><strong>Cliente:</strong> ${escaparHtml(cliente)}</p>
        <p><strong>Tipo Documento:</strong> ${escaparHtml(tipo || '—')}</p>
        <p><strong>Fecha inicio:</strong> ${escaparHtml(inicio)}</p>
        <p><strong>Fecha fin:</strong> ${escaparHtml(fin)}</p>
        <p><strong>Contacto:</strong> ${escaparHtml(contacto)}</p>
        <p><strong>Correo:</strong> ${escaparHtml(email)}</p>
        <p><strong>País:</strong> ${escaparHtml(pais)}</p>
        <p><strong>Subtotal:</strong> ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(subtotal)}</p>
        <p><strong>Descuento:</strong> ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(descuento)}</p>
        <p><strong>Total estimado:</strong> ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(total)}</p>
        <p><strong>Método de pago:</strong> ${escaparHtml(metodo)}</p>
    `;
    // actualizar campo de monto total si existe
    const montoField = document.getElementById('reserva-admin-monto-total');
    if (montoField) montoField.value = Math.round(total * 100) / 100;
};

// Mover al siguiente paso (valida el paso actual)
const siguientePasoWizard = () => {
    if (!validarPasoWizard(reservaWizardStep)) return false;
    mostrarPasoWizard(reservaWizardStep + 1);
    return true;
};

const anteriorPasoWizard = () => {
    mostrarPasoWizard(reservaWizardStep - 1);
};

const validarPasoWizard = (step) => {
    mostrarMensajeReservaAdmin('');

    // Validaciones básicas por paso
    if (step === 1) {
        limpiarErrorInline('reserva-admin-tipo-documento');
        limpiarErrorInline('reserva-admin-cliente');
        limpiarErrorInline('reserva-admin-habitacion');
        limpiarErrorInline('reserva-admin-fecha-inicio');
        limpiarErrorInline('reserva-admin-fecha-fin');

        const tipoDocumento = document.getElementById('reserva-admin-tipo-documento')?.value?.trim();
        const cliente = document.getElementById('reserva-admin-cliente')?.value?.trim();
        const habitacion = document.getElementById('reserva-admin-habitacion')?.value?.trim();
        const inicio = document.getElementById('reserva-admin-fecha-inicio')?.value;
        const fin = document.getElementById('reserva-admin-fecha-fin')?.value;

        if (!tipoDocumento) {
            mostrarErrorInline('reserva-admin-tipo-documento', 'Selecciona el tipo de documento.');
            return false;
        }

        if (!cliente) {
            mostrarErrorInline('reserva-admin-cliente', 'El documento del cliente es obligatorio.');
            return false;
        }

        const tienePaquete = !!document.getElementById('reserva-admin-paquetes')?.value;
        if (!habitacion && !tienePaquete) {
            mostrarErrorInline('reserva-admin-habitacion', 'Selecciona una habitación o un paquete.');
            return false;
        }

        if (!inicio) {
            mostrarErrorInline('reserva-admin-fecha-inicio', 'Selecciona la fecha de inicio.');
            return false;
        }

        if (!fin) {
            mostrarErrorInline('reserva-admin-fecha-fin', 'Selecciona la fecha de fin.');
            return false;
        }

        if (new Date(fin) < new Date(inicio)) {
            mostrarErrorInline('reserva-admin-fecha-fin', 'La fecha fin debe ser posterior a la fecha inicio.');
            return false;
        }

        if (hayCruceDeFechasConReservas(habitacion, inicio, fin, reservaEnEdicion ? obtenerIdReserva(reservaEnEdicion) : null)) {
            mostrarErrorInline('reserva-admin-fecha-fin', 'La habitación ya tiene una reserva en ese rango.');
            return false;
        }
    }

    if (step === 2) {
        limpiarErrorInline('reserva-admin-subtotal');
        limpiarErrorInline('reserva-admin-descuento');
        limpiarErrorInline('reserva-admin-metodo-pago');
        limpiarErrorInline('reserva-admin-estado');

        // Recalcular por si las fechas/habitación se seleccionaron y el sidebar no actualizó
        actualizarSidebarResumen();

        const subtotal = Number(document.getElementById('reserva-admin-subtotal')?.value);
        const descuento = Number(document.getElementById('reserva-admin-descuento')?.value || 0);
        const metodoPago = document.getElementById('reserva-admin-metodo-pago')?.value;
        const estado = document.getElementById('reserva-admin-estado')?.value;

        if (!Number.isFinite(subtotal) || subtotal <= 0) {
            mostrarErrorInline('reserva-admin-subtotal', 'Ingresa un subtotal mayor a cero.');
            return false;
        }

        if (!Number.isFinite(descuento) || descuento < 0) {
            mostrarErrorInline('reserva-admin-descuento', 'El descuento no puede ser negativo.');
            return false;
        }

        if (descuento > subtotal) {
            mostrarErrorInline('reserva-admin-descuento', 'El descuento no puede ser mayor al subtotal.');
            return false;
        }

        if (!metodoPago) {
            mostrarErrorInline('reserva-admin-metodo-pago', 'Selecciona un método de pago.');
            return false;
        }

        if (!estado) {
            mostrarErrorInline('reserva-admin-estado', 'Selecciona el estado de la reserva.');
            return false;
        }
    }

    // limpiar mensajes al pasar
    if (step === 1) {
        limpiarErrorInline('reserva-admin-tipo-documento');
        limpiarErrorInline('reserva-admin-cliente');
        limpiarErrorInline('reserva-admin-habitacion');
        limpiarErrorInline('reserva-admin-fecha-inicio');
        limpiarErrorInline('reserva-admin-fecha-fin');
    }
    if (step === 2) {
        limpiarErrorInline('reserva-admin-subtotal');
        limpiarErrorInline('reserva-admin-descuento');
        limpiarErrorInline('reserva-admin-metodo-pago');
        limpiarErrorInline('reserva-admin-estado');
    }
    return true;
};


const poblarSelectsReserva = async () => {
    const selectMetodo = document.getElementById('reserva-admin-metodo-pago');
    const selectEstado = document.getElementById('reserva-admin-estado');
    const selectPaquetes = document.getElementById('reserva-admin-paquetes');

    if (selectMetodo) {
        const actual = selectMetodo.value;
        const metodosPermitidos = metodosPagoCargados.filter(
            (m) => (m.NombreMetodoPago || m.NomMetodoPago || '').toLowerCase().includes('efectivo') ||
                   (m.NombreMetodoPago || m.NomMetodoPago || '').toLowerCase().includes('transferencia')
        );
        selectMetodo.innerHTML = ['<option value="" disabled selected hidden>Selecciona método</option>']
            .concat(
                metodosPermitidos.map((metodo) => `
                    <option value="${escaparHtml(metodo.IdMetodoPago)}">${escaparHtml(metodo.NombreMetodoPago || metodo.NomMetodoPago || 'Método')}</option>
                `)
            )
            .join('');
        if (actual) selectMetodo.value = String(actual);
    }

    if (selectEstado) {
        const actual = selectEstado.value;
        selectEstado.innerHTML = ['<option value="" disabled selected hidden>Selecciona estado</option>']
            .concat(
                estadosReservasCargados.map((estado) => `
                    <option value="${escaparHtml(estado.IdEstadoReserva)}">${escaparHtml(estado.NombreEstadoReserva || 'Estado')}</option>
                `)
            )
            .join('');
        if (actual) selectEstado.value = String(actual);
    }

    // poblar paquetes
    if (selectPaquetes) {
        try {
            let paq = await requestJson('/paquetes');
            if (!Array.isArray(paq)) paq = [];
            paq = paq.filter(p => p.Estado == 1 || p.Estado === '1');
            _paquetesCache = paq;
            const opciones = paq.map(p => { const pIva = Math.round(Number(p.PrecioPaquete || 0) * 1.19); return `<option value="${escaparHtml(p.IDPaquete)}" data-precio="${pIva}">${escaparHtml(p.NombrePaquete || 'Paquete')}</option>`; });
            selectPaquetes.innerHTML = '<option value="">Sin paquete</option>' + opciones.join('');
            construirDropdownCustomPaquetes(paq);
        } catch (err) {
            console.error('No se pudieron cargar paquetes:', err);
            selectPaquetes.innerHTML = '<option value="">No disponible</option>';
        }
    }

    // poblar habitaciones (esperar a que termine)
    const selectHab = document.getElementById('reserva-admin-habitacion');
    if (selectHab) {
        try {
            let habs = await requestJson('/habitaciones/disponibles');
            if (!Array.isArray(habs)) habs = [];
            _habitacionesCache = habs;
            const opciones = ['<option value="" disabled selected hidden>-- Selecciona habitación --</option>']
                .concat(habs.map(h => `<option value="${escaparHtml(h.IDHabitacion)}">${escaparHtml(h.NombreHabitacion || h.Nombre || 'Habitación')}</option>`));
            selectHab.innerHTML = opciones.join('');
            selectHab.addEventListener('change', () => {
                try { if (fpInicio) fpInicio.redraw(); } catch{};
                try { if (fpFin) fpFin.redraw(); } catch{};
                actualizarSidebarResumen();
            });
            construirDropdownCustomHabitaciones(habs);
        } catch (err) {
            console.error('No se pudieron cargar habitaciones:', err);
            selectHab.innerHTML = '<option value="">No disponible</option>';
        }
    }

    // cargar paquetes y servicios visuales
    await Promise.allSettled([cargarPaquetesVisuales(), cargarServiciosVisuales()]);
    // set default fecha reserva when opening
    const fechaReservaInput = document.getElementById('reserva-admin-fecha-reserva');
    if (fechaReservaInput && !fechaReservaInput.value) {
        const ahora = new Date();
        const tzOffset = ahora.getTimezoneOffset() * 60000;
        const localISO = new Date(ahora - tzOffset).toISOString().slice(0,16);
        fechaReservaInput.value = localISO;
    }
    return Promise.resolve();
};

const editarReservaAdmin = async (idReserva) => {
    try {
        const reserva = reservasAdminCargadas.find(r => String(obtenerIdReserva(r)) === String(idReserva));
        if (!reserva) {
            mostrarMensajeReservaAdmin('Reserva no encontrada', 'error');
            return;
        }
        const estadoNombre = (reserva.NombreEstadoReserva || '').toLowerCase();
        if (estadoNombre.includes('cancelad') || estadoNombre.includes('complet')) {
            mostrarMensajeReservaAdmin('No se puede editar una reserva cancelada o completada.', 'error');
            return;
        }

        await poblarSelectsReserva();
        reservaEnEdicion = reserva;
        
        const formulario = document.getElementById('form-reserva-admin');
        if (formulario) {
            document.getElementById('reserva-admin-id').value = obtenerIdReserva(reserva);
            const tipoDocumento = document.getElementById('reserva-admin-tipo-documento');
            if (tipoDocumento) tipoDocumento.value = reserva.TipoDocumentoCliente || reserva.TipoDocumento || '';
            document.getElementById('reserva-admin-cliente').value = escaparHtml(reserva.NroDocumentoCliente || '');
                document.getElementById('reserva-admin-contacto').value = reserva.ContactoCliente || reserva.Telefono || '';
                document.getElementById('reserva-admin-email').value = reserva.EmailCliente || reserva.Email || '';
                document.getElementById('reserva-admin-pais').value = reserva.PaisCliente || '';
            document.getElementById('reserva-admin-fecha-inicio').value = (reserva.FechaInicio || '').split('T')[0];
            document.getElementById('reserva-admin-fecha-fin').value = (reserva.FechaFinalizacion || '').split('T')[0];
            document.getElementById('reserva-admin-subtotal').value = reserva.Sub_Total || '';
            document.getElementById('reserva-admin-descuento').value = reserva.Descuento || '0';
            document.getElementById('reserva-admin-metodo-pago').value = reserva.MetodoPago || '';
            document.getElementById('reserva-admin-estado').value = reserva.IdEstadoReserva || '';
                // seleccionar habitación si está presente
                const selectHab = document.getElementById('reserva-admin-habitacion');
                if (selectHab) {
                    selectHab.value = reserva.IDHabitacion || '';
                    if (reserva.IDHabitacion) window.sincronizarLabelHabDropdown && window.sincronizarLabelHabDropdown(reserva.IDHabitacion);
                }
                // seleccionar paquetes si vienen en la reserva
                const selectPaq = document.getElementById('reserva-admin-paquetes');
                if (selectPaq && Array.isArray(reserva.paquetes) && reserva.paquetes.length) {
                    selectPaq.value = String(reserva.paquetes[0].IDPaquete || reserva.paquetes[0].ID || '');
                }
                // FechaReserva y Monto_Total
                const fr = document.getElementById('reserva-admin-fecha-reserva');
                if (fr) fr.value = reserva.FechaReserva ? new Date(reserva.FechaReserva).toISOString().slice(0,16) : '';
                const mt = document.getElementById('reserva-admin-monto-total');
                if (mt) mt.value = reserva.Monto_Total || '';
        }

        actualizarSidebarResumen();

        const titulo = document.getElementById('reserva-admin-form-title');
        if (titulo) titulo.textContent = 'Editar reserva';
        const btnGuardar = document.getElementById('wizard-submit');
        if (btnGuardar) btnGuardar.textContent = 'Actualizar reserva';

        mostrarVistaFormulario();

        const seccion = document.getElementById('seccion-administrar-reservas');
        if (seccion) seccion.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error al editar reserva:', error);
        mostrarMensajeReservaAdmin('Error al cargar la reserva', 'error');
    }
};

const guardarReservaAdmin = async (event) => {
    if (event?.preventDefault) event.preventDefault();

    if (!validarPasoWizard(1)) {
        Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Completa los datos del cliente, habitación y fechas.', confirmButtonColor: '#1a2744' });
        return;
    }

    if (!validarPasoWizard(2)) {
        Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Verifica el método de pago y el estado de la reserva.', confirmButtonColor: '#1a2744' });
        return;
    }

    const btn = document.getElementById('wizard-submit');
    const btnOrig = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'; }

    const idReserva = document.getElementById('reserva-admin-id')?.value;
    const tipoDocumento = document.getElementById('reserva-admin-tipo-documento')?.value?.trim();
    const nroDocumento = document.getElementById('reserva-admin-cliente')?.value?.trim();
    const contacto = document.getElementById('reserva-admin-contacto')?.value?.trim();
    const email = document.getElementById('reserva-admin-email')?.value?.trim();
    const pais = document.getElementById('reserva-admin-pais')?.value?.trim();
    const fechaInicio = document.getElementById('reserva-admin-fecha-inicio')?.value;
    const fechaFin = document.getElementById('reserva-admin-fecha-fin')?.value;
    const fechaReserva = document.getElementById('reserva-admin-fecha-reserva')?.value;
    const subtotal = document.getElementById('reserva-admin-subtotal')?.value;
    const descuento = document.getElementById('reserva-admin-descuento')?.value || '0';
    const metodoPago = document.getElementById('reserva-admin-metodo-pago')?.value;
    const estado = document.getElementById('reserva-admin-estado')?.value;

    try {
        const payload = {
            TipoDocumentoCliente: tipoDocumento,
            NroDocumentoCliente: nroDocumento,
            ContactoCliente: contacto || null,
            EmailCliente: email || null,
            PaisCliente: pais || null,
            FechaReserva: fechaReserva || null,
            IDHabitacion: Number(document.getElementById('reserva-admin-habitacion')?.value) || null,
            FechaInicio: fechaInicio,
            FechaFinalizacion: fechaFin,
            Sub_Total: parseFloat(subtotal),
            Descuento: parseFloat(descuento),
            Monto_Total: parseFloat(document.getElementById('reserva-admin-monto-total')?.value) || null,
            MetodoPago: metodoPago ? Number(metodoPago) : null,
            IdEstadoReserva: Number(estado),
            id_usuario: resolverUsuarioActual()
        };

        // paquete seleccionado
        const paquetesSelect = document.getElementById('reserva-admin-paquetes');
        if (paquetesSelect && paquetesSelect.value) {
            payload.paquetes = [{ IDPaquete: Number(paquetesSelect.value), cantidad: 1 }];
        }

        // servicios seleccionados con su cantidad — leer del DOM
        const serviciosSeleccionados = [];
        const listaServGuardar = document.getElementById('servicios-visual-list');
        if (listaServGuardar) {
            listaServGuardar.querySelectorAll('.admin-srv-card.seleccionado').forEach(card => {
                const id = Number(card.dataset.id);
                const cantidad = parseInt(card.dataset.cantidad) || 1;
                if (id) serviciosSeleccionados.push({ IDServicio: id, cantidad });
            });
        }
        if (serviciosSeleccionados.length) {
            payload.servicios = serviciosSeleccionados;
        }

        const resultado = idReserva
            ? await requestJson(`/reservas/${idReserva}`, { method: 'PUT', body: payload })
            : await requestJson('/reservas', { method: 'POST', body: payload });

        cerrarModalReservaAdmin();
        await cargarReservasAdmin();
        Swal.fire({
            icon: 'success',
            title: idReserva ? '¡Reserva actualizada!' : '¡Reserva creada!',
            text: resultado?.message || (idReserva ? 'La reserva fue actualizada correctamente.' : 'La reserva fue creada correctamente.'),
            confirmButtonColor: '#1a2744',
            timer: 3000,
            timerProgressBar: true
        });
    } catch (error) {
        console.error('Error al guardar reserva:', error);
        if (btn) { btn.disabled = false; btn.innerHTML = btnOrig; }
        const esPendiente = (error?.message || '').toLowerCase().includes('pendiente de confirmacion');
        Swal.fire({
            icon: esPendiente ? 'warning' : 'error',
            title: esPendiente ? 'No disponible temporalmente' : 'Error al guardar',
            text: error?.message || 'Ocurrió un error al guardar la reserva. Revisá los datos e intentá de nuevo.',
            confirmButtonColor: '#1a2744'
        });
    }
};

const eliminarReservaAdmin = async (idReserva) => {
    const resultadoConfirm = await Swal.fire({
        title: '¿Eliminar reserva?',
        text: '¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    if (!resultadoConfirm.isConfirmed) return;

    try {
        const resultado = await requestJson(`/reservas/${idReserva}`, { method: 'DELETE' });
        mostrarMensajeReservaAdmin(resultado?.message || 'Reserva eliminada correctamente.', 'ok');
        cargarReservasAdmin();
    } catch (error) {
        console.error('Error al eliminar reserva:', error);
        mostrarMensajeReservaAdmin('Error al eliminar la reserva', 'error');
    }
};

const cancelarReservaAdmin = async (idReserva) => {
    const resultado = await Swal.fire({
        title: 'Anular reserva',
        html: `
            <p style="margin-bottom:12px;color:#374151;font-size:14px;">
                La reserva pasará a estado <strong>Cancelada</strong>. Esta acción no se puede deshacer.
            </p>
            <textarea id="swal-motivo-cancelacion"
                placeholder="Escribe el motivo de la cancelación (opcional)"
                rows="3"
                style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;resize:vertical;font-family:inherit;box-sizing:border-box;"></textarea>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, anular',
        cancelButtonText: 'No',
        preConfirm: () => {
            return document.getElementById('swal-motivo-cancelacion')?.value?.trim() || null;
        }
    });
    if (!resultado.isConfirmed) return;

    try {
        await requestJson(`/reservas/${idReserva}/cancelar`, {
            method: 'PUT',
            body: { motivo: resultado.value || null }
        });
        mostrarMensajeReservaAdmin('Reserva anulada correctamente.', 'ok');
        cargarReservasAdmin();
        window.refrescarAlertas?.();
    } catch (error) {
        mostrarMensajeReservaAdmin('Error al anular la reserva', 'error');
    }
};

const cerrarModalReservaAdmin = () => {
    const formulario = document.getElementById('form-reserva-admin');
    if (formulario) formulario.reset();
    const reservaId = document.getElementById('reserva-admin-id');
    if (reservaId) reservaId.value = '';
    const btnGuardar = document.getElementById('wizard-submit');
    if (btnGuardar) btnGuardar.textContent = 'Guardar reserva';
    reservaEnEdicion = null;
    mostrarVistaTabla();
    mostrarPasoWizard(1);
    limpiarErroresInlineReserva();
    mostrarMensajeReservaAdmin('');
};

// ============================================
// MODAL: DETALLE DE RESERVA
// ============================================

const fmt = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(v || 0);
const fmtFecha = (f) => f ? f.toString().slice(0, 10) : '—';

const renderCargosAdicionalesSection = async (idReserva, estadoNombreOriginal) => {
    const container = document.getElementById('cargos-adicionales-container');
    if (!container) return;

    const puedeAgregar = ['confirmada', 'pendiente'].includes(
        normalizarTexto(estadoNombreOriginal || '')
    );

    const metodosPermitidos = metodosPagoCargados.filter(m =>
        (m.NombreMetodoPago || m.NomMetodoPago || '').toLowerCase().includes('efectivo') ||
        (m.NombreMetodoPago || m.NomMetodoPago || '').toLowerCase().includes('transferencia')
    );
    const opcionesMetodo = metodosPermitidos.map(m =>
        `<option value="${escaparHtml(String(m.IdMetodoPago))}">${escaparHtml(m.NombreMetodoPago || m.NomMetodoPago)}</option>`
    ).join('');

    try {
        const cargos = await requestJson(`/cargos/reserva/${idReserva}`);
        const badgeColor = { pendiente: '#f59e0b', pagado: '#10b981', cancelado: '#9ca3af' };

        let html = '';

        if (!cargos || !cargos.length) {
            html = '<p style="font-size:13px;color:#9ca3af;margin:0 0 10px;">Sin cargos adicionales</p>';
        } else {
            html = cargos.map(c => {
                let acciones = '';
                if (c.Estado === 'pendiente') {
                    acciones = `
                        <div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                            <select id="metodo-cargo-${c.IDCargo}" style="font-size:11px;padding:3px 6px;border:1px solid #d1d5db;border-radius:4px;">
                                <option value="">Método de pago...</option>
                                ${opcionesMetodo}
                            </select>
                            <button onclick="pagarCargoAdicional(${idReserva}, ${c.IDCargo}, '${escaparHtml(estadoNombreOriginal)}')" style="font-size:11px;padding:3px 10px;background:#10b981;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Pagar</button>
                            <button onclick="cancelarCargoAdicional(${idReserva}, ${c.IDCargo}, '${escaparHtml(estadoNombreOriginal)}')" style="font-size:11px;padding:3px 10px;background:#ef4444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Cancelar</button>
                        </div>`;
                }
                return `
                    <div style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <span style="font-size:13px;font-weight:600;">${escaparHtml(c.NombreServicio || '')} x${c.Cantidad}</span>
                                <span style="font-size:11px;color:#6b7280;margin-left:6px;">${c.NomMetodoPago ? '· ' + escaparHtml(c.NomMetodoPago) : ''}</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;">
                                <strong style="font-size:13px;">${fmt(c.PrecioTotal)}</strong>
                                <span style="background:${badgeColor[c.Estado] || '#9ca3af'}20;color:${badgeColor[c.Estado] || '#9ca3af'};border-radius:20px;padding:2px 8px;font-size:11px;font-weight:600;">${c.Estado}</span>
                            </div>
                        </div>
                        ${acciones}
                    </div>`;
            }).join('');

            const totalPagado = cargos.filter(c => c.Estado === 'pagado').reduce((s, c) => s + Number(c.PrecioTotal), 0);
            if (totalPagado > 0) {
                html += `<p style="text-align:right;font-size:12px;margin-top:6px;color:#6b7280;">Total pagado en extras: <strong>${fmt(totalPagado)}</strong></p>`;
            }
        }

        if (puedeAgregar) {
            let serviciosOptions = '<option value="">Seleccionar servicio...</option>';
            try {
                const servicios = await requestJson('/servicios?soloActivos=true');
                serviciosOptions += (Array.isArray(servicios) ? servicios : []).map(s => {
                    const costoIva = Math.round(Number(s.Costo || 0) * 1.19);
                    const maxP = s.CantidadMaximaPersonas ? ` · máx. ${s.CantidadMaximaPersonas} pers.` : '';
                    return `<option value="${escaparHtml(String(s.IDServicio))}"
                        data-maxp="${escaparHtml(String(s.CantidadMaximaPersonas || ''))}"
                        data-dur="${escaparHtml(String(s.Duracion || ''))}"
                        data-hor="${escaparHtml(s.Horario || '')}">${escaparHtml(s.NombreServicio)} — ${fmt(costoIva)} IVA incl.${maxP}</option>`;
                }).join('');
            } catch(e) {}

            html += `
                <div style="margin-top:12px;padding-top:12px;border-top:2px dashed #e5e7eb;">
                    <p style="font-size:12px;font-weight:600;color:#374151;margin:0 0 8px;"><i class="fa-solid fa-plus-circle" style="color:#3b82f6;margin-right:5px;"></i>Agregar servicio extra</p>
                    <select id="nuevo-cargo-servicio" onchange="mostrarInfoCargo(this)"
                        style="width:100%;font-size:12px;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;margin-bottom:6px;">
                        ${serviciosOptions}
                    </select>
                    <div id="info-cargo-extra" style="display:none;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:6px 10px;margin-bottom:8px;"></div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <div style="display:flex;align-items:center;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;background:#fff;">
                            <button type="button" onclick="ajustarCantidadCargo(-1)"
                                style="padding:4px 11px;background:none;border:none;font-size:16px;cursor:pointer;color:#374151;font-weight:700;line-height:1;">−</button>
                            <span id="nuevo-cargo-display" style="min-width:28px;text-align:center;font-size:13px;font-weight:700;color:#1a2744;padding:0 2px;">1</span>
                            <button type="button" onclick="ajustarCantidadCargo(1)"
                                style="padding:4px 11px;background:none;border:none;font-size:16px;cursor:pointer;color:#374151;font-weight:700;line-height:1;">+</button>
                        </div>
                        <input id="nuevo-cargo-cantidad" type="hidden" value="1">
                        <button onclick="agregarCargoAdicional(${idReserva}, '${escaparHtml(estadoNombreOriginal)}')"
                            style="flex:1;font-size:12px;padding:6px 14px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;">
                            <i class="fa-solid fa-plus" style="margin-right:5px;"></i>Agregar</button>
                    </div>
                </div>`;
        }

        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = '<p style="font-size:12px;color:#ef4444;margin:0;">Error cargando cargos.</p>';
    }
};

const verDetalleReserva = async (idReserva) => {
    const modal = document.getElementById('modal-detalle-reserva');
    const contenido = document.getElementById('detalle-reserva-contenido');
    if (!modal || !contenido) return;

    contenido.innerHTML = '<p style="text-align:center;padding:20px;">Cargando...</p>';
    modal.classList.remove('hidden');

    try {
        const r = await requestJson(`/reservas/${idReserva}`);
        const estado = normalizarEstadoReserva(r.NombreEstadoReserva);

        contenido.innerHTML = `
            <div class="detalle-reserva-seccion">
                <h5>Reserva #${escaparHtml(String(r.IdReserva || ''))}</h5>
                <span class="estado-reserva estado-${estado.clase}" style="margin-bottom:8px;display:inline-block;">${estado.texto}</span>
                ${r.MotivoCancelacion ? `<p style="margin-top:6px;font-size:12px;color:#6b7280;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:6px 10px;"><i class="fa-solid fa-circle-info" style="color:#ef4444;margin-right:5px;"></i><strong>Motivo:</strong> ${escaparHtml(r.MotivoCancelacion)}</p>` : ''}
            </div>
            <div class="detalle-reserva-seccion">
                <p class="detalle-label">Cliente</p>
                <p class="detalle-valor">${escaparHtml((r.NombreCliente || '') + ' ' + (r.ApellidoCliente || ''))}</p>
                <p class="detalle-valor muted">${escaparHtml(r.EmailCliente || r.Email || '—')}</p>
                <p class="detalle-valor muted">${escaparHtml(r.TelefonoCliente || r.Telefono || '—')}</p>
            </div>
            <div class="detalle-reserva-seccion">
                <p class="detalle-label">Habitación</p>
                <p class="detalle-valor">${escaparHtml(r.NombreHabitacion || '—')}</p>
            </div>
            <div class="detalle-reserva-seccion">
                <p class="detalle-label">Fechas</p>
                <p class="detalle-valor">${fmtFecha(r.FechaInicio)} → ${fmtFecha(r.FechaFinalizacion)}</p>
            </div>
            <div class="detalle-reserva-seccion">
                <p class="detalle-label">Pago reserva</p>
                <p class="detalle-valor">Método: ${escaparHtml(r.NomMetodoPago || '—')}</p>
                <p class="detalle-valor">Subtotal: ${fmt(r.Sub_Total || r.SubTotal)}</p>
                <p class="detalle-valor">Descuento: ${fmt(r.Descuento)}</p>
                <p class="detalle-valor"><strong>Total: ${fmt(r.Monto_Total || r.MontoTotal)}</strong></p>
                ${r.ComprobanteTransferencia ? `
                <p class="detalle-label" style="margin-top:10px;">Comprobante de transferencia</p>
                ${r.ComprobanteTransferencia.startsWith('data:image')
                    ? `<img src="${r.ComprobanteTransferencia}" style="max-width:100%;max-height:220px;border-radius:8px;border:1px solid #e2e8f0;margin-top:4px;cursor:zoom-in;" onclick="this.style.maxHeight=this.style.maxHeight==='none'?'220px':'none'">`
                    : `<a href="${r.ComprobanteTransferencia}" download="comprobante_reserva_${r.IdReserva || ''}.pdf" class="detalle-valor" style="color:#1a2744;font-weight:600;"><i class="fa-solid fa-file-pdf" style="color:#ef4444;margin-right:5px;"></i>Descargar PDF</a>`
                }
                ${estado.clase === 'pendiente' ? `
                <div style="display:flex;gap:10px;margin-top:14px;">
                    <button id="btn-aprobar-comprobante" type="button"
                        style="flex:1;background:#16a34a;color:#fff;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;">
                        <i class="fa-solid fa-circle-check" style="margin-right:6px;"></i>Aprobar pago
                    </button>
                    <button id="btn-rechazar-comprobante" type="button"
                        style="flex:1;background:#ef4444;color:#fff;border:none;border-radius:8px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;">
                        <i class="fa-solid fa-circle-xmark" style="margin-right:6px;"></i>Rechazar
                    </button>
                </div>` : ''}
                ` : ''}
            </div>
            <div class="detalle-reserva-seccion">
                <p class="detalle-label" style="color:#f59e0b;">Cargos adicionales</p>
                <div id="cargos-adicionales-container"><p style="text-align:center;font-size:12px;color:#9ca3af;margin:0;">Cargando...</p></div>
            </div>
        `;

        renderCargosAdicionalesSection(r.IdReserva, r.NombreEstadoReserva);

        const btnAprobar = document.getElementById('btn-aprobar-comprobante');
        if (btnAprobar) btnAprobar.onclick = () => aprobarComprobanteAdmin(idReserva);

        const btnRechazar = document.getElementById('btn-rechazar-comprobante');
        if (btnRechazar) btnRechazar.onclick = () => rechazarComprobanteAdmin(idReserva);

        const btnEditar = document.getElementById('btn-detalle-editar');
        if (btnEditar) {
            btnEditar.onclick = () => {
                cerrarDetalleReserva();
                editarReservaAdmin(idReserva);
            };
        }
    } catch (err) {
        console.error('Error al cargar detalle:', err);
        contenido.innerHTML = '<p style="color:red;padding:16px;">No se pudo cargar el detalle.</p>';
    }
};

const aprobarComprobanteAdmin = async (idReserva) => {
    const confirm = await Swal.fire({
        title: '¿Aprobar comprobante?',
        text: 'El pago será verificado y la reserva pasará a estado Confirmada. Se notificará al cliente por email.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, aprobar',
        cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;
    try {
        await requestJson(`/reservas/${idReserva}/aprobar`, { method: 'PUT' });
        cerrarDetalleReserva();
        cargarReservasAdmin();
        window.refrescarAlertas?.();
        Swal.fire({ icon: 'success', title: '¡Pago aprobado!', text: 'Reserva confirmada. Se notificó al cliente.', timer: 3000, timerProgressBar: true, confirmButtonColor: '#1a2744' });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err?.message || 'No se pudo aprobar el comprobante.', confirmButtonColor: '#1a2744' });
    }
};

const rechazarComprobanteAdmin = async (idReserva) => {
    const result = await Swal.fire({
        title: 'Rechazar comprobante',
        html: `<textarea id="swal-motivo-rechazo" placeholder="Escribí el motivo del rechazo (obligatorio)" rows="3"
            style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;resize:vertical;font-family:inherit;box-sizing:border-box;"></textarea>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Rechazar y notificar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const motivo = document.getElementById('swal-motivo-rechazo')?.value?.trim();
            if (!motivo) { Swal.showValidationMessage('El motivo es obligatorio'); return false; }
            return motivo;
        }
    });
    if (!result.isConfirmed) return;
    try {
        await requestJson(`/reservas/${idReserva}/rechazar`, { method: 'PUT', body: { motivo: result.value } });
        cerrarDetalleReserva();
        cargarReservasAdmin();
        window.refrescarAlertas?.();
        Swal.fire({ icon: 'info', title: 'Comprobante rechazado', text: 'Se notificó al cliente con el motivo de rechazo. La reserva sigue Pendiente.', timer: 3500, timerProgressBar: true, confirmButtonColor: '#1a2744' });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err?.message || 'No se pudo rechazar el comprobante.', confirmButtonColor: '#1a2744' });
    }
};

const cerrarDetalleReserva = () => {
    const modal = document.getElementById('modal-detalle-reserva');
    if (modal) modal.classList.add('hidden');
};

// ============================================
// MODAL: CAMBIO RÁPIDO DE ESTADO
// ============================================

const abrirModalCambioEstado = (idReserva) => {
    const modal = document.getElementById('modal-cambio-estado-reserva');
    const selectEstado = document.getElementById('cambio-estado-select');
    const hiddenId = document.getElementById('cambio-estado-reserva-id');
    const msg = document.getElementById('mensaje-cambio-estado');
    if (!modal || !selectEstado || !hiddenId) return;

    hiddenId.value = idReserva;
    if (msg) { msg.textContent = ''; msg.className = 'crud-clientes-mensaje'; }

    const reservaActual = reservasAdminCargadas.find(r => String(obtenerIdReserva(r)) === String(idReserva));
    selectEstado.innerHTML = estadosReservasCargados.map(e =>
        `<option value="${escaparHtml(String(e.IdEstadoReserva))}" ${reservaActual && String(reservaActual.IdEstadoReserva) === String(e.IdEstadoReserva) ? 'selected' : ''}>${escaparHtml(e.NombreEstadoReserva)}</option>`
    ).join('');

    modal.classList.remove('hidden');
};

const cerrarModalCambioEstado = () => {
    const modal = document.getElementById('modal-cambio-estado-reserva');
    if (modal) modal.classList.add('hidden');
};

const confirmarCambioEstado = async () => {
    const idReserva = document.getElementById('cambio-estado-reserva-id')?.value;
    const nuevoEstado = document.getElementById('cambio-estado-select')?.value;
    const msg = document.getElementById('mensaje-cambio-estado');

    if (!idReserva || !nuevoEstado) return;

    // Si el estado elegido es "Cancelada", redirigir al flujo con política de cancelación
    const selectEl = document.getElementById('cambio-estado-select');
    const textoEstadoElegido = (selectEl?.options[selectEl?.selectedIndex]?.text || '').toLowerCase();
    if (textoEstadoElegido.includes('cancelad')) {
        cerrarModalCambioEstado();
        await cancelarConPoliticaAdmin(idReserva);
        return;
    }

    try {
        await requestJson(`/reservas/${idReserva}/estado`, {
            method: 'PUT',
            body: { IdEstadoReserva: Number(nuevoEstado) }
        });
        if (msg) { msg.textContent = 'Estado actualizado.'; msg.className = 'crud-clientes-mensaje ok'; }
        setTimeout(() => {
            cerrarModalCambioEstado();
            cargarReservasAdmin();
        }, 800);
    } catch (err) {
        console.error('Error al cambiar estado:', err);
        if (msg) { msg.textContent = 'Error al cambiar el estado.'; msg.className = 'crud-clientes-mensaje error'; }
    }
};

const cancelarConPoliticaAdmin = async (idReserva) => {
    const reserva = reservasAdminCargadas.find(r => String(obtenerIdReserva(r)) === String(idReserva));
    if (!reserva) return;

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const entrada = new Date(reserva.FechaInicio); entrada.setHours(0, 0, 0, 0);
    const dias = Math.ceil((entrada - hoy) / (1000 * 60 * 60 * 24));
    const monto = Number(reserva.Monto_Total || 0);
    const tienesPaquetes = Array.isArray(reserva.paquetes) && reserva.paquetes.length > 0;
    const diasCorte = tienesPaquetes ? 8 : 5;

    let retencion, colorTexto, iconoTexto, mensajePolicy;
    if (dias > diasCorte) {
        retencion    = 0;
        colorTexto   = '#16a34a';
        iconoTexto   = '✓';
        mensajePolicy = `Cancelación gratuita — más de ${diasCorte} días de anticipación`;
    } else if (dias >= 1) {
        retencion    = Math.round(monto * 0.5);
        colorTexto   = '#ea580c';
        iconoTexto   = '⚠';
        mensajePolicy = 'Retención del 50% — entre 1 y ' + diasCorte + ' días antes';
    } else {
        retencion    = monto;
        colorTexto   = '#dc2626';
        iconoTexto   = '✗';
        mensajePolicy = 'Sin reembolso — menos de 24 horas o fecha ya pasada';
    }
    const reembolso = monto - retencion;

    const resultado = await Swal.fire({
        title: 'Cancelar reserva',
        html: `
            <div style="text-align:left;font-size:13px;">
                <p style="margin-bottom:12px;font-weight:600;color:${colorTexto};">${iconoTexto} ${escaparHtml(mensajePolicy)}</p>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:14px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="color:#6b7280;">Monto total</span>
                        <strong>${fmt(monto)}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="color:#6b7280;">Retención del hotel</span>
                        <strong style="color:#ef4444;">${fmt(retencion)}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:6px;">
                        <span style="color:#6b7280;">Reembolso al cliente</span>
                        <strong style="color:#16a34a;">${fmt(reembolso)}</strong>
                    </div>
                </div>
                <textarea id="swal-motivo-cancelacion"
                    placeholder="Motivo de cancelación (opcional)"
                    rows="2"
                    style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;resize:vertical;font-family:inherit;box-sizing:border-box;"></textarea>
            </div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Confirmar cancelación',
        cancelButtonText: 'No cancelar',
        preConfirm: () => document.getElementById('swal-motivo-cancelacion')?.value?.trim() || null
    });

    if (!resultado.isConfirmed) return;

    try {
        await requestJson(`/reservas/${idReserva}/cancelar`, {
            method: 'PUT',
            body: { motivo: resultado.value || null }
        });
        mostrarMensajeReservaAdmin('Reserva cancelada. Se notificó al cliente por email.', 'ok');
        cargarReservasAdmin();
        window.refrescarAlertas?.();
    } catch (err) {
        mostrarMensajeReservaAdmin('Error al cancelar la reserva', 'error');
    }
};

// ============================================
// SIDEBAR DE RESUMEN (habitación + fechas)
// ============================================

let _habitacionesCache = [];
let _paquetesCache = [];

const actualizarSidebarResumen = () => {
    const habSelect = document.getElementById('reserva-admin-habitacion');
    const fechaIn = document.getElementById('reserva-admin-fecha-inicio')?.value;
    const fechaOut = document.getElementById('reserva-admin-fecha-fin')?.value;
    const descuento = Number(document.getElementById('reserva-admin-descuento')?.value || 0);

    const sumIn = document.getElementById('reserva-summary-in');
    const sumOut = document.getElementById('reserva-summary-out');
    const sumNights = document.getElementById('reserva-summary-nights');
    const sumHab = document.getElementById('reserva-summary-hab');
    const sumPaq = document.getElementById('reserva-summary-paq');
    const sumServ = document.getElementById('reserva-summary-serv');
    const sumIva = document.getElementById('reserva-summary-iva');
    const montoDisplay = document.getElementById('reserva-admin-monto-total-display');
    const montoHidden = document.getElementById('reserva-admin-monto-total');
    const subtotalHidden = document.getElementById('reserva-admin-subtotal');

    if (sumIn) sumIn.textContent = fechaIn || '--';
    if (sumOut) sumOut.textContent = fechaOut || '--';

    let noches = 0;
    if (fechaIn && fechaOut) {
        const diff = new Date(fechaOut) - new Date(fechaIn);
        noches = Math.max(0, Math.round(diff / 86400000));
    }
    if (sumNights) sumNights.textContent = noches > 0 ? `${noches} noche${noches > 1 ? 's' : ''}` : '--';

    const habId = habSelect?.value;
    const hab = _habitacionesCache.find(h => String(h.IDHabitacion) === String(habId));
    const costoHabIva = hab ? Math.round(Number(hab.Costo || 0) * 1.19) : 0;
    const totalHab = costoHabIva * noches;

    let totalPaq = 0;
    const paqSel = document.getElementById('reserva-admin-paquetes');
    if (paqSel && paqSel.value) {
        const opt = paqSel.options[paqSel.selectedIndex];
        totalPaq = Number(opt?.dataset?.precio || 0);
    }

    // sumar servicios seleccionados directo del DOM (fuente de verdad visual)
    let totalServ = 0;
    const listaServSidebar = document.getElementById('servicios-visual-list');
    if (listaServSidebar) {
        listaServSidebar.querySelectorAll('.admin-srv-card.seleccionado').forEach(card => {
            totalServ += Number(card.dataset.precio || 0) * (parseInt(card.dataset.cantidad) || 1);
        });
    }

    const total    = totalHab + totalPaq + totalServ - descuento;
    const subtotal = Math.round(total / 1.19);
    const iva      = total - subtotal;

    if (sumHab) sumHab.textContent = fmt(totalHab);
    if (sumPaq) sumPaq.textContent = fmt(totalPaq);
    if (sumServ) sumServ.textContent = fmt(totalServ);
    if (sumIva) sumIva.textContent = 'Incluido';
    if (montoDisplay) montoDisplay.textContent = fmt(total);
    if (montoHidden) montoHidden.value = Math.round(total * 100) / 100;
    if (subtotalHidden) subtotalHidden.value = subtotal;
};

// ============================================
// PAQUETES Y SERVICIOS VISUALES
// ============================================

const cargarPaquetesVisuales = async () => {
    const lista = document.getElementById('paquetes-visual-list');
    const selectOculto = document.getElementById('reserva-admin-paquetes');
    if (!lista) return;

    try {
        let paquetes = await requestJson('/paquetes');
        if (!Array.isArray(paquetes)) paquetes = [];
        paquetes = paquetes.filter(p => p.Estado == 1 || p.Estado === '1');

        if (!paquetes.length) {
            lista.innerHTML = '<p class="empty-state-text">No hay paquetes activos.</p>';
            return;
        }

        lista.innerHTML = paquetes.map(p => `
            <span class="paquete-tag" data-id="${escaparHtml(String(p.IDPaquete))}" data-precio="${Number(p.PrecioPaquete || p.Precio || 0)}" title="${escaparHtml(p.NombrePaquete || '')}">
                ${escaparHtml(p.NombrePaquete || 'Paquete')}
                <small>$ ${fmt(p.PrecioPaquete || p.Precio || 0)}</small>
                ${p.Descripcion ? `<span class="paquete-tag-desc">${escaparHtml(p.Descripcion)}</span>` : ''}
            </span>
        `).join('');

        lista.querySelectorAll('.paquete-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('seleccionado');
                // sincronizar select oculto
                if (selectOculto) {
                    const id = tag.dataset.id;
                    const opt = selectOculto.querySelector(`option[value="${id}"]`);
                    if (opt) opt.selected = tag.classList.contains('seleccionado');
                }
                actualizarSidebarResumen();
            });
        });
    } catch (err) {
        console.error('Error cargando paquetes visuales:', err);
        lista.innerHTML = '<p class="empty-state-text">Error al cargar paquetes.</p>';
    }
};

let _serviciosAdminCache = [];
let _seleccionadosAdmin = {}; // { IDServicio: { precio, cantidad } }

// Extrae URLs de imagen separadas por coma, espacio o salto de línea
const _extraerImgsSrv = (valor) => {
    if (!valor) return [];
    return String(valor).split(/[,\n]|(?=https?:\/\/)/).map(s => s.trim()).filter(s => s.startsWith('http'));
};

const cargarServiciosVisuales = async () => {
    const lista = document.getElementById('servicios-visual-list');
    if (!lista) return;

    try {
        let servicios = await requestJson('/servicios?soloActivos=true');
        if (!Array.isArray(servicios)) servicios = [];
        _serviciosAdminCache = servicios;

        if (!servicios.length) {
            lista.innerHTML = '<p class="empty-state-text">No hay servicios activos.</p>';
            return;
        }

        lista.innerHTML = servicios.map(s => {
            const costoIva = Math.round(Number(s.Costo || 0) * 1.19);
            const imgUrl = _extraerImgsSrv(s.Imagen)[0] || '';
            const maxP = s.CantidadMaximaPersonas ? Number(s.CantidadMaximaPersonas) : '';
            return `
            <div class="admin-srv-card servicio-tag"
                 data-id="${escaparHtml(String(s.IDServicio))}"
                 data-precio="${costoIva}"
                 data-cantidad="1"
                 data-maxpersonas="${maxP}">
                ${imgUrl
                    ? `<img src="${imgUrl}" alt="${escaparHtml(s.NombreServicio || '')}" class="admin-srv-img" onerror="this.outerHTML='<span class=\\'admin-srv-img-ph\\'><i class=\\'fa-solid fa-concierge-bell\\'></i></span>'">`
                    : `<span class="admin-srv-img-ph"><i class="fa-solid fa-concierge-bell"></i></span>`
                }
                <div class="admin-srv-info">
                    <div class="admin-srv-name">${escaparHtml(s.NombreServicio || '')}</div>
                    ${s.Descripcion ? `<div class="admin-srv-desc">${escaparHtml(s.Descripcion)}</div>` : ''}
                    <div class="admin-srv-chips">
                        ${s.Duracion ? `<span class="admin-srv-dur"><i class="fa-regular fa-clock"></i> ${escaparHtml(String(s.Duracion))} min</span>` : ''}
                        ${maxP ? `<span class="admin-srv-maxp"><i class="fa-solid fa-users"></i> Máx. ${maxP}</span>` : ''}
                    </div>
                </div>
                <div class="admin-srv-right">
                    <div class="admin-srv-qty">
                        <button type="button" class="admin-srv-qty-btn" onclick="event.stopPropagation();cambiarCantidadSrvAdmin(this,-1)">−</button>
                        <span class="admin-srv-qty-display">1</span>
                        <button type="button" class="admin-srv-qty-btn" onclick="event.stopPropagation();cambiarCantidadSrvAdmin(this,1)">+</button>
                    </div>
                    <div style="display:flex;align-items:center;gap:5px;">
                        <span class="admin-srv-precio">${fmt(costoIva)}</span>
                        <button class="admin-srv-ojo" type="button" title="Ver detalle" onclick="event.stopPropagation();abrirDetalleServicioAdmin(${s.IDServicio})">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');

        lista.querySelectorAll('.admin-srv-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const precio = Number(card.dataset.precio || 0);
                const cantidad = parseInt(card.dataset.cantidad || '1');
                if (card.classList.toggle('seleccionado')) {
                    _seleccionadosAdmin[id] = { precio, cantidad };
                } else {
                    delete _seleccionadosAdmin[id];
                }
                actualizarSidebarResumen();
            });
        });

        // Restaurar estado visual si hay servicios ya seleccionados (por doble render)
        lista.querySelectorAll('.admin-srv-card').forEach(card => {
            const entry = _seleccionadosAdmin[card.dataset.id];
            if (entry) {
                card.classList.add('seleccionado');
                card.dataset.cantidad = entry.cantidad;
                const display = card.querySelector('.admin-srv-qty-display');
                if (display) display.textContent = entry.cantidad;
            }
        });
        if (Object.keys(_seleccionadosAdmin).length) actualizarSidebarResumen();
    } catch (err) {
        console.error('Error cargando servicios visuales:', err);
        lista.innerHTML = '<p class="empty-state-text">Error al cargar servicios.</p>';
    }
};

const abrirDetalleServicioAdmin = (idServicio) => {
    const s = _serviciosAdminCache.find(x => String(x.IDServicio) === String(idServicio));
    if (!s) return;
    const imgs = _extraerImgsSrv(s.Imagen);
    const costoIva = Math.round(Number(s.Costo || 0) * 1.19);
    const modal = document.getElementById('srv-detalle-modal-admin');
    const contenido = document.getElementById('srv-detalle-contenido-admin');
    if (!modal || !contenido) return;

    const sliderHtml = imgs.length > 0 ? `
        <div class="srv-slider-admin">
            <div class="srv-slides-admin">
                ${imgs.map((u, i) => `<img src="${u}" class="srv-slide-img-admin${i === 0 ? ' active' : ''}" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400'">`).join('')}
            </div>
            ${imgs.length > 1 ? `
            <button class="srv-slide-btn-admin prev" onclick="slideSrvAdmin(-1)" type="button"><i class="fa-solid fa-chevron-left"></i></button>
            <button class="srv-slide-btn-admin next" onclick="slideSrvAdmin(1)" type="button"><i class="fa-solid fa-chevron-right"></i></button>
            <div class="srv-dots-admin">${imgs.map((_, i) => `<span class="srv-dot-admin${i === 0 ? ' active' : ''}" onclick="goSrvAdmin(${i})"></span>`).join('')}</div>
            ` : ''}
        </div>` : '';

    contenido.innerHTML = `
        ${sliderHtml}
        <div style="padding:${imgs.length ? '0' : '0'} 0 4px;">
            <h3 style="font-size:17px;font-weight:700;color:#1a2744;margin:16px 0 6px;">${escaparHtml(s.NombreServicio || '')}</h3>
            ${s.Descripcion ? `<p style="font-size:13px;color:#4b5563;line-height:1.6;margin-bottom:12px;">${escaparHtml(s.Descripcion)}</p>` : ''}
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
                ${s.Duracion ? `<span style="background:#e0f2fe;color:#1a2744;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;"><i class="fa-regular fa-clock" style="margin-right:4px;"></i>${escaparHtml(String(s.Duracion))} min</span>` : ''}
                ${s.CantidadMaximaPersonas ? `<span style="background:#f0fdf4;color:#166534;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;"><i class="fa-solid fa-users" style="margin-right:4px;"></i>Máx. ${s.CantidadMaximaPersonas} personas</span>` : ''}
                ${s.Horario ? `<span style="background:#fef3c7;color:#92400e;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:600;"><i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${escaparHtml(s.Horario)}</span>` : ''}
            </div>
            <div style="font-size:16px;font-weight:700;color:#1a2744;">${fmt(costoIva)} <span style="font-size:12px;font-weight:400;color:#6b7280;">IVA incl.</span></div>
        </div>`;

    window._srvSlideIdxAdmin = 0;
    modal.classList.remove('hidden');
};

window.slideSrvAdmin = (dir) => {
    const imgs = document.querySelectorAll('.srv-slide-img-admin');
    const dots = document.querySelectorAll('.srv-dot-admin');
    if (!imgs.length) return;
    imgs[window._srvSlideIdxAdmin].classList.remove('active');
    dots[window._srvSlideIdxAdmin]?.classList.remove('active');
    window._srvSlideIdxAdmin = (window._srvSlideIdxAdmin + dir + imgs.length) % imgs.length;
    imgs[window._srvSlideIdxAdmin].classList.add('active');
    dots[window._srvSlideIdxAdmin]?.classList.add('active');
};

window.goSrvAdmin = (i) => {
    const imgs = document.querySelectorAll('.srv-slide-img-admin');
    const dots = document.querySelectorAll('.srv-dot-admin');
    if (!imgs.length) return;
    imgs[window._srvSlideIdxAdmin]?.classList.remove('active');
    dots[window._srvSlideIdxAdmin]?.classList.remove('active');
    window._srvSlideIdxAdmin = i;
    imgs[i]?.classList.add('active');
    dots[i]?.classList.add('active');
};

window.abrirDetalleServicioAdmin = abrirDetalleServicioAdmin;

// ============================================
// EVENT LISTENERS
// ============================================

function inicializarReservasAdmin() {
    if (window.__reservasAdminListenersReady) {
        return;
    }
    window.__reservasAdminListenersReady = true;

    // Botón crear
    const btnCrear = document.getElementById('btn-nuevo-reserva-admin');
    if (btnCrear) btnCrear.addEventListener('click', abrirModalNuevaReserva);

    // Búsqueda y filtros
    const inputBusqueda = document.getElementById('busqueda-reservas-admin');
    if (inputBusqueda) inputBusqueda.addEventListener('input', buscarReservasAdmin);

    const selectFiltro = document.getElementById('filtro-estado-reservas-admin');
    if (selectFiltro) selectFiltro.addEventListener('change', filtrarReservasAdmin);

    // Formulario
    const formulario = document.getElementById('form-reserva-admin');
    if (formulario) formulario.addEventListener('submit', guardarReservaAdmin);

    // Cerrar modal
    const btnCerrar = document.getElementById('btn-cerrar-modal-reserva');
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalReservaAdmin);

    const btnLimpiar = document.getElementById('btn-reserva-admin-limpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            document.getElementById('form-reserva-admin')?.reset();
            document.getElementById('reserva-admin-id').value = '';
            const titulo = document.getElementById('reserva-admin-form-title');
            if (titulo) titulo.textContent = 'Crear reserva';
            const btnGuardar = document.getElementById('wizard-submit');
            if (btnGuardar) btnGuardar.textContent = 'Guardar reserva';
            mostrarPasoWizard(1); // Reiniciar al primer paso
            const tipoDocumento = document.getElementById('reserva-admin-tipo-documento');
            if (tipoDocumento) tipoDocumento.value = '';
            limpiarErroresInlineReserva();
            mostrarMensajeReservaAdmin('');
            poblarSelectsReserva();
        });
    }

    // ── Autocomplete buscador de clientes ──────────────────────────
    const searchInput = document.getElementById('reserva-admin-search-cliente');
    if (searchInput) {
        // Crear dropdown dinámico
        const dropdown = document.createElement('div');
        dropdown.id = 'reserva-cliente-dropdown';
        dropdown.style.cssText = 'position:absolute;z-index:9999;background:#fff;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;width:100%;display:none;';
        searchInput.parentElement.style.position = 'relative';
        searchInput.parentElement.appendChild(dropdown);

        const llenarClienteEnForm = (c) => {
            const tipoDoc = document.getElementById('reserva-admin-tipo-documento');
            const docInput = document.getElementById('reserva-admin-cliente');
            const contacto = document.getElementById('reserva-admin-contacto');
            const email    = document.getElementById('reserva-admin-email');
            const pais     = document.getElementById('reserva-admin-pais');

            searchInput.value = `${c.Nombre || ''} ${c.Apellido || ''}`.trim() + ` (${c.NroDocumento})`;
            if (tipoDoc) tipoDoc.value = 'CC';
            if (docInput) docInput.value = c.NroDocumento || '';
            if (contacto) contacto.value = c.Telefono || '';
            if (email)    email.value    = c.Email    || '';
            if (pais)     pais.value     = c.Pais     || '';

            // Abrir el details si está cerrado
            const details = document.querySelector('.reserva-extra-fields');
            if (details && !details.open) details.open = true;

            dropdown.style.display = 'none';
            limpiarErrorInline('reserva-admin-cliente');
        };

        searchInput.addEventListener('input', () => {
            const q = normalizarTexto(searchInput.value.trim());
            dropdown.innerHTML = '';
            if (!q || q.length < 2) { dropdown.style.display = 'none'; return; }

            const resultados = clientesCargados.filter(c =>
                normalizarTexto(c.NroDocumento || '').includes(q) ||
                normalizarTexto(c.Nombre || '').includes(q) ||
                normalizarTexto(c.Apellido || '').includes(q)
            ).slice(0, 8);

            if (!resultados.length) {
                dropdown.innerHTML = '<div style="padding:10px 14px;color:#94a3b8;font-size:13px;">Sin resultados</div>';
                dropdown.style.display = 'block';
                return;
            }

            resultados.forEach(c => {
                const item = document.createElement('div');
                item.style.cssText = 'padding:9px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid #f1f5f9;';
                item.innerHTML = `<strong>${escaparHtml(c.NroDocumento)}</strong> — ${escaparHtml(c.Nombre || '')} ${escaparHtml(c.Apellido || '')}`;
                item.addEventListener('mousedown', (e) => { e.preventDefault(); llenarClienteEnForm(c); });
                item.addEventListener('mouseover', () => item.style.background = '#f0f9ff');
                item.addEventListener('mouseout',  () => item.style.background = '#fff');
                dropdown.appendChild(item);
            });
            dropdown.style.display = 'block';
        });

        searchInput.addEventListener('blur', () => setTimeout(() => { dropdown.style.display = 'none'; }, 150));
        document.addEventListener('click', (e) => { if (!dropdown.contains(e.target) && e.target !== searchInput) dropdown.style.display = 'none'; });
    }

    // actualizar monto total cuando subtotal/descuento cambian
    const actualizarMontoTotal = () => {
        const subtotal = Number(document.getElementById('reserva-admin-subtotal')?.value || 0);
        const descuento = Number(document.getElementById('reserva-admin-descuento')?.value || 0);
        const iva = subtotal > 0 ? subtotal * 0.19 : 0;
        const total = (subtotal - descuento) + iva;
        const mt = document.getElementById('reserva-admin-monto-total');
        if (mt) mt.value = Math.round(total * 100) / 100;
    };
    const subField = document.getElementById('reserva-admin-subtotal');
    const descField = document.getElementById('reserva-admin-descuento');
    if (subField) { subField.addEventListener('input', actualizarMontoTotal); subField.addEventListener('change', actualizarMontoTotal); }
    if (descField) { descField.addEventListener('input', actualizarMontoTotal); descField.addEventListener('change', actualizarMontoTotal); }

    // Wizard buttons
    const btnNext = document.getElementById('wizard-next');
    if (btnNext) btnNext.addEventListener('click', (e) => { e.preventDefault(); siguientePasoWizard(); });

    const btnPrev = document.getElementById('wizard-prev');
    if (btnPrev) btnPrev.addEventListener('click', (e) => { e.preventDefault(); anteriorPasoWizard(); });

    // Modal detalle
    const btnCerrarDetalle = document.getElementById('btn-cerrar-detalle-reserva');
    if (btnCerrarDetalle) btnCerrarDetalle.addEventListener('click', cerrarDetalleReserva);
    const btnDetalleCerrar = document.getElementById('btn-detalle-cerrar');
    if (btnDetalleCerrar) btnDetalleCerrar.addEventListener('click', cerrarDetalleReserva);

    // Modal cambio de estado
    const btnCerrarCambioEstado = document.getElementById('btn-cerrar-cambio-estado');
    if (btnCerrarCambioEstado) btnCerrarCambioEstado.addEventListener('click', cerrarModalCambioEstado);
    const btnCancelarCambioEstado = document.getElementById('btn-cancelar-cambio-estado');
    if (btnCancelarCambioEstado) btnCancelarCambioEstado.addEventListener('click', cerrarModalCambioEstado);
    const btnConfirmarCambioEstado = document.getElementById('btn-confirmar-cambio-estado');
    if (btnConfirmarCambioEstado) btnConfirmarCambioEstado.addEventListener('click', confirmarCambioEstado);

    // Sidebar: actualizar al cambiar habitación o fechas
    const habSel = document.getElementById('reserva-admin-habitacion');
    const fIn = document.getElementById('reserva-admin-fecha-inicio');
    const fOut = document.getElementById('reserva-admin-fecha-fin');
    const descEl = document.getElementById('reserva-admin-descuento');
    [habSel, fIn, fOut, descEl].forEach(el => {
        if (el) {
            el.addEventListener('change', actualizarSidebarResumen);
            el.addEventListener('input', actualizarSidebarResumen);
        }
    });

    // Tabla - acciones dinámicas
    document.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('[data-accion-reserva="editar"]');
        const btnEliminar = e.target.closest('[data-accion-reserva="eliminar"]');
        const btnVer = e.target.closest('[data-accion-reserva="ver"]');
        const btnCancelar = e.target.closest('[data-accion-reserva="cancelar"]');

        if (btnEditar) editarReservaAdmin(btnEditar.dataset.id);
        if (btnEliminar) eliminarReservaAdmin(btnEliminar.dataset.id);
        if (btnVer && btnVer.dataset.id) verDetalleReserva(btnVer.dataset.id);
        if (btnCancelar && btnCancelar.dataset.id) cancelarReservaAdmin(btnCancelar.dataset.id);

        const btnEstado = e.target.closest('[data-accion-reserva="estado"]');
        if (btnEstado && btnEstado.dataset.id) abrirModalCambioEstado(btnEstado.dataset.id);
    });

    const camposAValidarEnVivo = [
        'reserva-admin-tipo-documento',
        'reserva-admin-cliente',
        'reserva-admin-contacto',
        'reserva-admin-email',
        'reserva-admin-pais',
        'reserva-admin-paquetes',
        'reserva-admin-habitacion',
        'reserva-admin-fecha-inicio',
        'reserva-admin-fecha-fin',
        'reserva-admin-subtotal',
        'reserva-admin-descuento',
        'reserva-admin-metodo-pago',
        'reserva-admin-estado'
    ];

    camposAValidarEnVivo.forEach((idCampo) => {
        const campo = document.getElementById(idCampo);
        if (!campo || campo.dataset.inlineValidacion === 'true') return;

        const limpiar = () => limpiarErrorInline(idCampo);
        campo.addEventListener('input', limpiar);
        campo.addEventListener('change', limpiar);
        campo.dataset.inlineValidacion = 'true';
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Esperar a que app.js esté listo
        const initInterval = setInterval(() => {
            if (typeof cargarSeccion === 'function') {
                clearInterval(initInterval);
                // Inicializar cuando se cargue la sección de reservas
            }
        }, 100);
    });
}

    // Acciones de cargos adicionales (llamadas desde onclick inline del modal)
    window.cambiarCantidadSrvAdmin = (btn, delta) => {
        const card = btn.closest('.admin-srv-card');
        if (!card) return;
        const display = card.querySelector('.admin-srv-qty-display');
        const maxP = parseInt(card.dataset.maxpersonas) || 20;
        let val = parseInt(card.dataset.cantidad || '1') + delta;
        if (val > maxP) val = maxP;

        if (val < 1) {
            // − en cantidad 1 → quitar servicio del total
            val = 1;
            card.classList.remove('seleccionado');
        } else {
            // + → auto-seleccionar; − por encima de 1 → mantener seleccionado
            if (delta > 0) card.classList.add('seleccionado');
        }

        card.dataset.cantidad = val;
        if (display) display.textContent = val;
        actualizarSidebarResumen();
    };

    window.mostrarInfoCargo = (sel) => {
        const infoDiv = document.getElementById('info-cargo-extra');
        if (!infoDiv) return;
        const opt = sel.options[sel.selectedIndex];
        if (!opt || !opt.value) { infoDiv.style.display = 'none'; return; }
        const maxP = opt.dataset.maxp;
        const dur  = opt.dataset.dur;
        const hor  = opt.dataset.hor;
        if (!maxP && !dur && !hor) { infoDiv.style.display = 'none'; return; }
        let chips = '';
        if (dur)  chips += `<span style="display:inline-flex;align-items:center;gap:4px;background:#e0f2fe;color:#1a2744;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:600;"><i class="fa-regular fa-clock"></i>${dur} min</span>`;
        if (maxP) chips += `<span style="display:inline-flex;align-items:center;gap:4px;background:#d1fae5;color:#065f46;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:600;"><i class="fa-solid fa-users"></i>Máx. ${maxP} personas</span>`;
        if (hor)  chips += `<span style="display:inline-flex;align-items:center;gap:4px;background:#fef3c7;color:#92400e;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:600;"><i class="fa-regular fa-calendar"></i>${hor}</span>`;
        infoDiv.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;">${chips}</div>`;
        infoDiv.style.display = '';
    };

    window.ajustarCantidadCargo = (delta) => {
        const display = document.getElementById('nuevo-cargo-display');
        const input   = document.getElementById('nuevo-cargo-cantidad');
        if (!display || !input) return;
        let val = parseInt(input.value || '1') + delta;
        if (val < 1) val = 1;
        if (val > 20) val = 20;
        input.value = val;
        display.textContent = val;
    };

    window.agregarCargoAdicional = async (idReserva, estadoNombre) => {
        const selectSrv = document.getElementById('nuevo-cargo-servicio');
        const inputCantidad = document.getElementById('nuevo-cargo-cantidad');
        if (!selectSrv || !inputCantidad) return;
        const idServicio = selectSrv.value;
        const cantidad = parseInt(inputCantidad.value) || 1;
        if (!idServicio) return Swal.fire('Atención', 'Seleccioná un servicio', 'warning');
        try {
            await requestJson(`/cargos/reserva/${idReserva}`, { method: 'POST', body: { servicios: [{ IDServicio: idServicio, cantidad }] } });
            await renderCargosAdicionalesSection(idReserva, estadoNombre);
        } catch(e) {
            Swal.fire('Error', 'No se pudo agregar el cargo', 'error');
        }
    };

    window.pagarCargoAdicional = async (idReserva, idCargo, estadoNombre) => {
        const select = document.getElementById(`metodo-cargo-${idCargo}`);
        const idMetodoPago = select ? select.value : '';
        if (!idMetodoPago) return Swal.fire('Atención', 'Seleccioná un método de pago', 'warning');
        try {
            await requestJson(`/cargos/${idCargo}/pagar`, { method: 'PUT', body: { IDMetodoPago: idMetodoPago } });
            await renderCargosAdicionalesSection(idReserva, estadoNombre);
        } catch(e) {
            Swal.fire('Error', 'No se pudo registrar el pago', 'error');
        }
    };

    window.cancelarCargoAdicional = async (idReserva, idCargo, estadoNombre) => {
        const result = await Swal.fire({
            title: '¿Cancelar cargo?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No'
        });
        if (!result.isConfirmed) return;
        try {
            await requestJson(`/cargos/${idCargo}`, { method: 'DELETE' });
            await renderCargosAdicionalesSection(idReserva, estadoNombre);
        } catch(e) {
            Swal.fire('Error', 'No se pudo cancelar el cargo', 'error');
        }
    };

    // exportar las funciones necesarias al scope global
    window.cargarReservasAdmin = cargarReservasAdmin;
    window.inicializarReservasAdmin = inicializarReservasAdmin;
    window.abrirModalNuevaReserva = abrirModalNuevaReserva;
    window.cerrarModalReservaAdmin = cerrarModalReservaAdmin;
    window.guardarReservaAdmin = guardarReservaAdmin;
    window.verDetalleReserva = verDetalleReserva;

    // onchange del select de paquetes — muestra detalle inline automáticamente
    window.adminPaqueteOnChange = async (val) => {
        const det = document.getElementById('admin-paquete-detalle');
        const selectHab = document.getElementById('reserva-admin-habitacion');
        const hint = document.getElementById('hab-paquete-hint');

        const habTrigger = document.getElementById('hab-custom-trigger');
        const habLabel   = document.getElementById('hab-selected-label');

        if (!val) {
            if (det) { det.classList.add('hidden'); det.innerHTML = ''; }
            if (selectHab) { selectHab.disabled = false; selectHab.style.opacity = ''; selectHab.title = ''; }
            if (habTrigger) { habTrigger.style.opacity = ''; habTrigger.style.pointerEvents = ''; habTrigger.title = ''; }
            if (habLabel && habLabel.textContent === '— incluida en el paquete —') habLabel.textContent = '-- Selecciona habitación --';
            if (hint) hint.style.display = 'none';
            actualizarSidebarResumen();
            return;
        }

        // Bloquear habitación porque el paquete incluye alojamiento
        if (selectHab) {
            selectHab.value = '';
            selectHab.disabled = true;
            selectHab.style.opacity = '0.45';
            selectHab.title = 'El paquete ya incluye habitación';
            limpiarErrorInline('reserva-admin-habitacion');
        }
        if (habTrigger) { habTrigger.style.opacity = '0.45'; habTrigger.style.pointerEvents = 'none'; habTrigger.title = 'El paquete ya incluye habitación'; }
        if (habLabel) habLabel.textContent = '— incluida en el paquete —';
        if (hint) hint.style.display = '';

        // Cargar detalle del paquete automáticamente
        if (det) {
            det.innerHTML = '<div class="admin-pdi-body" style="color:#64748b;font-size:12px;">Cargando...</div>';
            det.classList.remove('hidden');
            try {
                const p = await requestJson(`/paquetes/${val}`);
                const servicios = p.servicios && p.servicios.length
                    ? p.servicios.map(s => `<span>${escaparHtml(s.NombreServicio)}</span>`).join('')
                    : '<span>Sin servicios adicionales</span>';
                det.innerHTML = `
                    <div class="admin-pdi-body">
                        <div class="admin-pdi-nombre">${escaparHtml(p.NombrePaquete)}</div>
                        <div class="admin-pdi-desc">${escaparHtml(p.Descripcion || 'Sin descripción')}</div>
                        <div class="admin-pdi-meta">
                            <span class="admin-pdi-badge">$${fmt(p.PrecioPaquete)}</span>
                            <span class="admin-pdi-badge">${p.DuracionNoches} noche${p.DuracionNoches !== 1 ? 's' : ''}</span>
                            ${p.IncluirHabitacion ? '<span class="admin-pdi-badge">Incluye alojamiento</span>' : ''}
                        </div>
                        <div class="admin-pdi-servicios"><strong>Servicios incluidos:</strong><br>${servicios}</div>
                    </div>`;
            } catch(e) {
                det.innerHTML = '<div class="admin-pdi-body" style="color:#64748b">No se pudo cargar el detalle.</div>';
            }
        }

        actualizarSidebarResumen();
    };

    // ── Dropdown custom con preview al hover ──────────────────────────────
    const construirDropdownCustomHabitaciones = (habs) => {
        const trigger  = document.getElementById('hab-custom-trigger');
        const list     = document.getElementById('hab-options-list');
        const label    = document.getElementById('hab-selected-label');
        const selectHab = document.getElementById('reserva-admin-habitacion');
        const preview  = document.getElementById('hab-preview-card');
        if (!trigger || !list || !selectHab) return;

        // Mover preview al body para que position:fixed no sea afectado
        // por el transform:translateY del .reserva-card:hover
        if (preview && preview.parentElement !== document.body) {
            document.body.appendChild(preview);
        }

        let sliderTimer = null;

        const cerrar = () => {
            list.classList.remove('open');
            trigger.classList.remove('open');
            if (preview) preview.style.display = 'none';
        };

        const sincronizarConSelect = (idHab, nombre) => {
            selectHab.value = idHab;
            label.textContent = nombre;
            selectHab.dispatchEvent(new Event('change'));
            list.querySelectorAll('.hab-option').forEach(o => {
                o.classList.toggle('selected', o.dataset.id === String(idHab));
            });
        };

        const mostrarPreview = (hab, targetEl) => {
            if (!preview) return;
            const imgs = (hab.ImagenHabitacion || '').split(',').map(s => s.trim()).filter(Boolean);
            const precio = fmt(Math.round(Number(hab.Costo || 0) * 1.19));
            const desc = hab.Descripcion || 'Sin descripción';
            const nombre = escaparHtml(hab.NombreHabitacion || hab.Nombre || '');

            const dotsHtml = imgs.length > 1
                ? imgs.map((_, i) => `<div class="hab-preview-dot${i === 0 ? ' active' : ''}"></div>`).join('')
                : '';

            preview.innerHTML = `
                <div class="hab-preview-header">${nombre}</div>
                <div class="hab-preview-slider">
                    ${imgs.length
                        ? imgs.map((u, i) => `<img src="${u}" class="${i === 0 ? 'active' : ''}" onerror="this.style.display='none'" alt="">`).join('')
                        : `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#9ca3af;"><i class="fa-solid fa-image" style="font-size:36px;"></i></div>`
                    }
                    ${dotsHtml ? `<div class="hab-preview-dots">${dotsHtml}</div>` : ''}
                </div>
                <div class="hab-preview-body">
                    <div class="hab-preview-desc">${escaparHtml(desc)}</div>
                    <div class="hab-preview-footer">
                        <div class="hab-preview-precio">${precio} <span>/ noche</span></div>
                        <span class="hab-preview-badge">Disponible</span>
                    </div>
                </div>`;

            // auto-slide si hay varias imágenes
            clearInterval(sliderTimer);
            if (imgs.length > 1) {
                let idx = 0;
                sliderTimer = setInterval(() => {
                    idx = (idx + 1) % imgs.length;
                    preview.querySelectorAll('.hab-preview-slider img').forEach((img, i) => img.classList.toggle('active', i === idx));
                    preview.querySelectorAll('.hab-preview-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
                }, 1800);
            }

            // Anclar al borde derecho del viewport, alineado verticalmente con el item
            const rect = targetEl.getBoundingClientRect();
            const cardW = 368;
            const cardH = 430;
            const left = Math.max(8, window.innerWidth - cardW - 8);
            const top  = Math.max(8, Math.min(rect.top - 60, window.innerHeight - cardH - 8));
            preview.style.left = left + 'px';
            preview.style.top  = top + 'px';
            preview.style.display = 'block';
        };

        // Construir opciones
        list.innerHTML = habs.map(h => `
            <div class="hab-option" data-id="${h.IDHabitacion}">
                <div class="hab-option-dot"></div>
                <span>${escaparHtml(h.NombreHabitacion || h.Nombre || 'Habitación')}</span>
                <span class="hab-option-price">${fmt(Math.round(Number(h.Costo || 0) * 1.19))}</span>
            </div>`).join('');

        // Eventos hover en opciones
        list.querySelectorAll('.hab-option').forEach(opt => {
            const hab = habs.find(h => String(h.IDHabitacion) === opt.dataset.id);
            opt.addEventListener('mouseenter', () => { if (hab) mostrarPreview(hab, opt); });
            opt.addEventListener('mouseleave', () => {
                clearInterval(sliderTimer);
                if (preview) preview.style.display = 'none';
            });
            opt.addEventListener('click', () => {
                sincronizarConSelect(opt.dataset.id, opt.querySelector('span:not(.hab-option-price)').textContent);
                cerrar();
            });
        });

        // Solo adjuntar listeners de trigger y documento UNA vez
        if (!trigger.dataset.habDropdownInit) {
            trigger.dataset.habDropdownInit = '1';

            trigger.addEventListener('click', () => {
                const abierto = list.classList.contains('open');
                if (abierto) { cerrar(); } else {
                    list.classList.add('open');
                    trigger.classList.add('open');
                }
            });

            document.addEventListener('click', (e) => {
                if (!trigger.contains(e.target) && !list.contains(e.target) && e.target !== selectHab) cerrar();
            }, true);
        }
    };

    // Re-sincronizar label del dropdown custom cuando se cargue una reserva para editar
    const construirDropdownCustomPaquetes = (paq) => {
        const trigger    = document.getElementById('paq-custom-trigger');
        const list       = document.getElementById('paq-options-list');
        const labelSpan  = document.getElementById('paq-selected-label');
        const selectPaq  = document.getElementById('reserva-admin-paquetes');
        const preview    = document.getElementById('paq-preview-card');
        if (!trigger || !list || !selectPaq) return;

        if (preview && preview.parentElement !== document.body) document.body.appendChild(preview);

        let sliderTimer = null;

        const cerrar = () => {
            list.classList.remove('open');
            trigger.classList.remove('open');
            if (preview) preview.style.display = 'none';
        };

        const sincronizar = (val, nombre) => {
            selectPaq.value = val;
            if (labelSpan) labelSpan.textContent = nombre || 'Sin paquete';
            selectPaq.dispatchEvent(new Event('change'));
            list.querySelectorAll('.hab-option').forEach(o => o.classList.toggle('selected', o.dataset.id === String(val)));
        };

        const mostrarPreview = (p, targetEl) => {
            if (!preview) return;
            const imgs = (p.Imagen || '').split(',').map(s => s.trim()).filter(Boolean);
            const precio = fmt(Math.round(Number(p.PrecioPaquete || 0) * 1.19));
            const desc = p.Descripcion || 'Sin descripción';
            const noches = p.DuracionNoches || 0;

            const dotsHtml = imgs.length > 1
                ? imgs.map((_, i) => `<div class="hab-preview-dot${i === 0 ? ' active' : ''}"></div>`).join('')
                : '';

            preview.innerHTML = `
                <div class="hab-preview-header">${escaparHtml(p.NombrePaquete || '')}</div>
                <div class="hab-preview-slider">
                    ${imgs.length
                        ? imgs.map((u, i) => `<img src="${u}" class="${i === 0 ? 'active' : ''}" onerror="this.style.display='none'" alt="">`).join('')
                        : `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#9ca3af;"><i class="fa-solid fa-box-open" style="font-size:36px;"></i></div>`
                    }
                    ${dotsHtml ? `<div class="hab-preview-dots">${dotsHtml}</div>` : ''}
                </div>
                <div class="hab-preview-body">
                    <div class="hab-preview-desc">${escaparHtml(desc)}</div>
                    <div class="hab-preview-footer">
                        <div class="hab-preview-precio">$${precio} <span>/ paquete</span></div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;">
                            ${noches ? `<span class="hab-preview-badge">${noches} noche${noches !== 1 ? 's' : ''}</span>` : ''}
                            ${p.IncluirHabitacion ? '<span class="hab-preview-badge" style="background:#dbeafe;color:#1e40af;">Alojamiento incl.</span>' : ''}
                        </div>
                    </div>
                </div>`;

            clearInterval(sliderTimer);
            if (imgs.length > 1) {
                let idx = 0;
                sliderTimer = setInterval(() => {
                    idx = (idx + 1) % imgs.length;
                    preview.querySelectorAll('.hab-preview-slider img').forEach((img, i) => img.classList.toggle('active', i === idx));
                    preview.querySelectorAll('.hab-preview-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
                }, 1800);
            }

            const rect = targetEl.getBoundingClientRect();
            const cardW = 368, cardH = 430;
            const left = Math.max(8, window.innerWidth - cardW - 8);
            const top  = Math.max(8, Math.min(rect.top - 60, window.innerHeight - cardH - 8));
            preview.style.left = left + 'px';
            preview.style.top  = top + 'px';
            preview.style.display = 'block';
        };

        // Construir opciones
        list.innerHTML = '<div class="hab-option" data-id="">' +
            '<span style="color:#9ca3af;">Sin paquete</span></div>' +
            paq.map(p => `
                <div class="hab-option" data-id="${p.IDPaquete}">
                    <div class="hab-option-dot" style="background:#f59e0b;"></div>
                    <span>${escaparHtml(p.NombrePaquete || 'Paquete')}</span>
                    <span class="hab-option-price">$${fmt(Math.round(Number(p.PrecioPaquete || 0) * 1.19))}</span>
                </div>`).join('');

        list.querySelectorAll('.hab-option').forEach(opt => {
            const p = paq.find(x => String(x.IDPaquete) === opt.dataset.id);
            if (p) {
                opt.addEventListener('mouseenter', () => mostrarPreview(p, opt));
                opt.addEventListener('mouseleave', () => { clearInterval(sliderTimer); if (preview) preview.style.display = 'none'; });
            }
            opt.addEventListener('click', () => {
                const nombre = opt.querySelector('span:not(.hab-option-price)').textContent;
                sincronizar(opt.dataset.id, opt.dataset.id ? nombre : '');
                cerrar();
            });
        });

        if (!trigger.dataset.paqDropdownInit) {
            trigger.dataset.paqDropdownInit = '1';
            trigger.addEventListener('click', () => {
                const abierto = list.classList.contains('open');
                if (abierto) { cerrar(); } else { list.classList.add('open'); trigger.classList.add('open'); }
            });
            document.addEventListener('click', (e) => {
                if (!trigger.contains(e.target) && !list.contains(e.target) && e.target !== selectPaq) cerrar();
            }, true);
        }

        // Re-sincronizar label si hay valor guardado (modo edición)
        if (selectPaq.value) {
            const opt = list.querySelector(`.hab-option[data-id="${selectPaq.value}"]`);
            if (opt && labelSpan) labelSpan.textContent = opt.querySelector('span:not(.hab-option-price)').textContent;
        }
    };

    window.sincronizarLabelHabDropdown = (idHab) => {
        const label = document.getElementById('hab-selected-label');
        const list  = document.getElementById('hab-options-list');
        if (!label || !list) return;
        const opt = list.querySelector(`.hab-option[data-id="${idHab}"]`);
        if (opt) {
            label.textContent = opt.querySelector('span:not(.hab-option-price)').textContent;
            list.querySelectorAll('.hab-option').forEach(o => o.classList.toggle('selected', o.dataset.id === String(idHab)));
        }
    };

})();
