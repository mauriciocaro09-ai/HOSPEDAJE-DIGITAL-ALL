(function () {
    const INTERVALO_MS = 60 * 1000;

    function getApiBase() {
        return (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
            ? CONFIG.API_URL
            : 'http://localhost:3000/api';
    }

    async function obtenerAlertas() {
        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const resp = await fetch(`${getApiBase()}/dashboard/alertas`, { headers });
            if (!resp.ok) return null;
            return await resp.json();
        } catch {
            return null;
        }
    }

    function actualizarBadge(total) {
        const badge = document.getElementById('notif-badge');
        if (!badge) return;
        if (total > 0) {
            badge.textContent = total > 99 ? '99+' : total;
            badge.classList.remove('notif-badge-hidden');
        } else {
            badge.classList.add('notif-badge-hidden');
        }
    }

    function fmtFecha(f) {
        if (!f) return '';
        const d = new Date(f);
        if (isNaN(d)) return '';
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    }

    function renderSubitems(lista, tipo) {
        if (!lista || !lista.length) return '';
        const items = lista.map(r => `
            <button class="notif-subitem" type="button"
                    data-reserva-id="${r.IDReserva}"
                    title="Ver reserva #${r.IDReserva}">
                <span class="notif-sub-id">#${r.IDReserva}</span>
                <span class="notif-sub-info">
                    <span class="notif-sub-nombre">${r.NombreCliente}</span>
                    <span class="notif-sub-hab">${r.NombreHabitacion} &nbsp;·&nbsp; ${fmtFecha(r.FechaInicio)} – ${fmtFecha(r.FechaFinalizacion)}</span>
                </span>
                <i class="fa-solid fa-arrow-right notif-sub-arrow"></i>
            </button>
        `).join('');
        return `<div class="notif-subitems" id="notif-sub-${tipo}">${items}</div>`;
    }

    function renderAlertas(data) {
        const lista = document.getElementById('notif-lista');
        if (!lista) return;

        if (!data) {
            lista.innerHTML = '<div class="notif-empty"><i class="fa-solid fa-circle-xmark"></i> Sin conexión con el servidor</div>';
            return;
        }

        const grupos = [];

        if (data.pendientes > 0) {
            grupos.push({
                tipo:  'pendientes',
                icono: 'fa-clock',
                clase: 'notif-item-rojo',
                texto: `${data.pendientes} reserva${data.pendientes !== 1 ? 's' : ''} pendiente${data.pendientes !== 1 ? 's' : ''}`,
                sub:   'Requieren confirmación',
                lista: data.listaPendientes || []
            });
        }

        if (data.checkins > 0) {
            grupos.push({
                tipo:  'checkins',
                icono: 'fa-right-to-bracket',
                clase: 'notif-item-amarillo',
                texto: `${data.checkins} check-in${data.checkins !== 1 ? 's' : ''} hoy`,
                sub:   'Clientes que llegan hoy',
                lista: data.listaCheckins || []
            });
        }

        if (data.checkouts > 0) {
            grupos.push({
                tipo:  'checkouts',
                icono: 'fa-right-from-bracket',
                clase: 'notif-item-azul',
                texto: `${data.checkouts} check-out${data.checkouts !== 1 ? 's' : ''} hoy`,
                sub:   'Clientes que salen hoy',
                lista: data.listaCheckouts || []
            });
        }

        if (grupos.length === 0) {
            lista.innerHTML = '<div class="notif-empty"><i class="fa-solid fa-circle-check"></i> Todo al día</div>';
            return;
        }

        lista.innerHTML = grupos.map(g => `
            <div class="notif-grupo">
                <button class="notif-item ${g.clase}" data-tipo="${g.tipo}" type="button">
                    <span class="notif-item-icon"><i class="fa-solid ${g.icono}"></i></span>
                    <span class="notif-item-texto">
                        <strong>${g.texto}</strong>
                        <small>${g.sub}</small>
                    </span>
                    <i class="fa-solid fa-chevron-down notif-arrow" id="notif-arrow-${g.tipo}"></i>
                </button>
                ${renderSubitems(g.lista, g.tipo)}
            </div>
        `).join('');
    }

    function toggleGrupo(tipo) {
        const sub   = document.getElementById(`notif-sub-${tipo}`);
        const arrow = document.getElementById(`notif-arrow-${tipo}`);
        if (!sub) return;
        const abierto = sub.classList.contains('notif-sub-abierto');
        // cerrar todos
        document.querySelectorAll('.notif-subitems').forEach(el => el.classList.remove('notif-sub-abierto'));
        document.querySelectorAll('.notif-arrow').forEach(el => el.classList.remove('notif-arrow-open'));
        // abrir el actual si estaba cerrado
        if (!abierto) {
            sub.classList.add('notif-sub-abierto');
            if (arrow) arrow.classList.add('notif-arrow-open');
        }
    }

    async function navegarAReserva(idReserva) {
        cerrarPanel();
        if (typeof cargarSeccion === 'function') {
            await cargarSeccion('administrar-reservas');
            setTimeout(() => {
                if (typeof window.verDetalleReserva === 'function') {
                    window.verDetalleReserva(idReserva);
                }
            }, 400);
        }
    }

    async function refrescar() {
        const data = await obtenerAlertas();
        actualizarBadge(data ? data.total : 0);
        renderAlertas(data);
    }

    function cerrarPanel() {
        document.getElementById('notif-panel')?.classList.add('notif-panel-hidden');
    }

    function abrirPanel() {
        document.getElementById('notif-panel')?.classList.remove('notif-panel-hidden');
    }

    function panelAbierto() {
        return !document.getElementById('notif-panel')?.classList.contains('notif-panel-hidden');
    }

    function iniciar() {
        const btn = document.getElementById('notif-btn');
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (panelAbierto()) {
                cerrarPanel();
            } else {
                abrirPanel();
                refrescar();
            }
        });

        document.getElementById('notif-lista')?.addEventListener('click', (e) => {
            // clic en subitem (reserva individual)
            const subitem = e.target.closest('[data-reserva-id]');
            if (subitem) {
                navegarAReserva(Number(subitem.dataset.reservaId));
                return;
            }
            // clic en cabecera de grupo → toggle
            const grupo = e.target.closest('[data-tipo]');
            if (grupo) {
                toggleGrupo(grupo.dataset.tipo);
            }
        });

        document.addEventListener('click', (e) => {
            const wrap = document.getElementById('notif-wrap');
            if (wrap && !wrap.contains(e.target)) cerrarPanel();
        });

        refrescar();
        setInterval(refrescar, INTERVALO_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    window.refrescarAlertas = refrescar;
})();
