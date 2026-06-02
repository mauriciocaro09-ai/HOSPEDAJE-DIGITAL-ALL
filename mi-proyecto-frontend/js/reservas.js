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
    return reservasAdminCargadas.some(r => {
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

    selectHab.innerHTML = ['<option value="">Selecciona habitación</option>']
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
                        <button type="button" class="btn-mini btn-mini-icon btn-mini-editar" data-accion-reserva="editar" data-id="${escaparHtml(idReserva)}" title="Editar">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button type="button" class="btn-mini btn-mini-icon" data-accion-reserva="estado" data-id="${escaparHtml(idReserva)}" title="Cambiar estado" style="background:#6c757d;color:#fff;border-color:#6c757d;">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                        <button type="button" class="btn-mini btn-mini-icon btn-mini-ver" data-accion-reserva="ver" data-id="${escaparHtml(idReserva)}" title="Ver detalles">
                            <i class="fa-solid fa-eye"></i>
                        </button>
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

    const titulo = document.getElementById('reserva-admin-form-title');
    if (titulo) titulo.textContent = 'Crear nueva reserva';

    const btnGuardar = document.getElementById('wizard-submit');
    if (btnGuardar) btnGuardar.textContent = 'Guardar reserva';

    const formulario = document.getElementById('form-reserva-admin');
    if (formulario) formulario.reset();
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

        if (!habitacion) {
            mostrarErrorInline('reserva-admin-habitacion', 'Selecciona una habitación.');
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
        selectMetodo.innerHTML = ['<option value="">Selecciona método</option>']
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
        selectEstado.innerHTML = ['<option value="">Selecciona estado</option>']
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
            const opciones = paq.map(p => `<option value="${escaparHtml(p.IDPaquete)}" data-precio="${Number(p.PrecioPaquete || 0)}">${escaparHtml(p.NombrePaquete || 'Paquete')} — $${fmt(p.PrecioPaquete || 0)}</option>`);
            selectPaquetes.innerHTML = '<option value="">Sin paquete</option>' + opciones.join('');
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
            const opciones = ['<option value="">Selecciona habitación</option>']
                .concat(habs.map(h => `<option value="${escaparHtml(h.IDHabitacion)}">${escaparHtml(h.NombreHabitacion || h.Nombre || 'Habitación')}</option>`));
            selectHab.innerHTML = opciones.join('');
            // redibujar datepickers cuando cambie la habitación seleccionada
            selectHab.addEventListener('change', () => {
                try { if (fpInicio) fpInicio.redraw(); } catch{};
                try { if (fpFin) fpFin.redraw(); } catch{};
                actualizarSidebarResumen();
            });
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
                if (selectHab) selectHab.value = reserva.IDHabitacion || '';
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
    event.preventDefault();

    if (!validarPasoWizard(1)) {
        mostrarPasoWizard(1);
        return;
    }

    if (!validarPasoWizard(2)) {
        mostrarPasoWizard(2);
        return;
    }

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

        const resultado = idReserva
            ? await requestJson(`/reservas/${idReserva}`, { method: 'PUT', body: payload })
            : await requestJson('/reservas', { method: 'POST', body: payload });

        mostrarMensajeReservaAdmin(resultado?.message || 'Reserva guardada correctamente.', 'ok');
        cerrarModalReservaAdmin();
        cargarReservasAdmin();
    } catch (error) {
        console.error('Error al guardar reserva:', error);
        mostrarMensajeReservaAdmin('Error al guardar la reserva', 'error');
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
                <p class="detalle-label">Pago</p>
                <p class="detalle-valor">Método: ${escaparHtml(r.NomMetodoPago || '—')}</p>
                <p class="detalle-valor">Subtotal: ${fmt(r.Sub_Total || r.SubTotal)}</p>
                <p class="detalle-valor">Descuento: ${fmt(r.Descuento)}</p>
                <p class="detalle-valor"><strong>Total: ${fmt(r.Monto_Total || r.MontoTotal)}</strong></p>
            </div>
        `;

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

// ============================================
// SIDEBAR DE RESUMEN (habitación + fechas)
// ============================================

let _habitacionesCache = [];

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
    const costoHab = hab ? Number(hab.Costo || 0) : 0;
    const totalHab = costoHab * noches;

    let totalPaq = 0;
    const paqSel = document.getElementById('reserva-admin-paquetes');
    if (paqSel && paqSel.value) {
        const opt = paqSel.options[paqSel.selectedIndex];
        totalPaq = Number(opt?.dataset?.precio || 0);
    }

    // sumar servicios seleccionados
    let totalServ = 0;
    document.querySelectorAll('.servicio-tag.seleccionado').forEach(tag => {
        totalServ += Number(tag.dataset.precio || 0);
    });

    const subtotal = totalHab + totalPaq + totalServ;
    const iva = subtotal * 0.19;
    const total = subtotal - descuento + iva;

    if (sumHab) sumHab.textContent = fmt(totalHab);
    if (sumPaq) sumPaq.textContent = fmt(totalPaq);
    if (sumServ) sumServ.textContent = fmt(totalServ);
    if (sumIva) sumIva.textContent = fmt(iva);
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

const cargarServiciosVisuales = async () => {
    const lista = document.getElementById('servicios-visual-list');
    if (!lista) return;

    try {
        let servicios = await requestJson('/servicios?soloActivos=true');
        if (!Array.isArray(servicios)) servicios = [];

        if (!servicios.length) {
            lista.innerHTML = '<p class="empty-state-text">No hay servicios activos.</p>';
            return;
        }

        lista.innerHTML = servicios.map(s => `
            <span class="servicio-tag" data-id="${escaparHtml(String(s.IDServicio))}" data-precio="${Number(s.Costo || 0)}" title="${escaparHtml(s.NombreServicio || '')}">
                ${escaparHtml(s.NombreServicio || 'Servicio')}
                <small>${fmt(s.Costo || 0)}</small>
            </span>
        `).join('');

        lista.querySelectorAll('.servicio-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('seleccionado');
                actualizarSidebarResumen();
            });
        });
    } catch (err) {
        console.error('Error cargando servicios visuales:', err);
        lista.innerHTML = '<p class="empty-state-text">Error al cargar servicios.</p>';
    }
};

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

    // Asegurar que datepickers estén inicializados cuando se abra el modal
    const btnAbrir = document.getElementById('btn-nuevo-reserva-admin');
    if (btnAbrir) btnAbrir.addEventListener('click', () => {
        poblarSelectsReserva();
        inicializarDatepickers();
    });

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

        if (btnEditar) editarReservaAdmin(btnEditar.dataset.id);
        if (btnEliminar) eliminarReservaAdmin(btnEliminar.dataset.id);
        if (btnVer && btnVer.dataset.id) verDetalleReserva(btnVer.dataset.id);

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

    // exportar las funciones necesarias al scope global
    window.cargarReservasAdmin = cargarReservasAdmin;
    window.inicializarReservasAdmin = inicializarReservasAdmin;
    window.abrirModalNuevaReserva = abrirModalNuevaReserva;
    window.cerrarModalReservaAdmin = cerrarModalReservaAdmin;

    // Funciones globales para onchange/onclick inline del select de paquetes
    window.adminPaqueteOnChange = (val) => {
        const btn = document.getElementById('admin-paquete-ver-btn');
        const det = document.getElementById('admin-paquete-detalle');
        if (!btn) return;
        if (val) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
            if (det) { det.classList.add('hidden'); det.innerHTML = ''; }
        }
        actualizarSidebarResumen();
    };

    window.adminVerDetallePaquete = async () => {
        const sel = document.getElementById('reserva-admin-paquetes');
        const det = document.getElementById('admin-paquete-detalle');
        const id = sel?.value;
        if (!id || !det) return;
        try {
            const p = await requestJson(`/paquetes/${id}`);
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
            det.classList.remove('hidden');
        } catch(e) {
            det.innerHTML = '<div class="admin-pdi-body" style="color:#64748b">No se pudo cargar el detalle.</div>';
            det.classList.remove('hidden');
        }
    };

})();
