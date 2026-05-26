(function () {
    const INTERVALO_MS = 60 * 1000;

    async function obtenerAlertas() {
        try {
            return await requestJson('/dashboard/alertas');
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

    function renderAlertas(data) {
        const lista = document.getElementById('notif-lista');
        if (!lista || !data) return;

        const items = [];

        if (data.pendientes > 0) {
            items.push({
                icono: 'fa-clock',
                clase: 'notif-item-rojo',
                texto: `${data.pendientes} reserva${data.pendientes !== 1 ? 's' : ''} pendiente${data.pendientes !== 1 ? 's' : ''}`,
                sub: 'Requieren confirmación',
                seccion: 'administrar-reservas'
            });
        }

        if (data.checkins > 0) {
            items.push({
                icono: 'fa-right-to-bracket',
                clase: 'notif-item-amarillo',
                texto: `${data.checkins} check-in${data.checkins !== 1 ? 's' : ''} hoy`,
                sub: 'Clientes que llegan hoy',
                seccion: 'administrar-reservas'
            });
        }

        if (data.checkouts > 0) {
            items.push({
                icono: 'fa-right-from-bracket',
                clase: 'notif-item-azul',
                texto: `${data.checkouts} check-out${data.checkouts !== 1 ? 's' : ''} hoy`,
                sub: 'Clientes que salen hoy',
                seccion: 'administrar-reservas'
            });
        }

        lista.innerHTML = items.length === 0
            ? '<div class="notif-empty"><i class="fa-solid fa-circle-check"></i> Todo al día</div>'
            : items.map(item => `
                <button class="notif-item ${item.clase}" data-seccion="${item.seccion}" type="button">
                    <span class="notif-item-icon"><i class="fa-solid ${item.icono}"></i></span>
                    <span class="notif-item-texto">
                        <strong>${item.texto}</strong>
                        <small>${item.sub}</small>
                    </span>
                    <i class="fa-solid fa-chevron-right notif-arrow"></i>
                </button>
            `).join('');
    }

    async function refrescar() {
        const data = await obtenerAlertas();
        if (!data) return;
        actualizarBadge(data.total);
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
        const lista = document.getElementById('notif-lista');
        if (!btn) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            panelAbierto() ? cerrarPanel() : abrirPanel();
        });

        lista?.addEventListener('click', (e) => {
            const item = e.target.closest('[data-seccion]');
            if (!item) return;
            cerrarPanel();
            if (typeof cargarSeccion === 'function') {
                cargarSeccion(item.dataset.seccion);
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
