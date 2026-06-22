(function () {
    const INTERVALO_MS = 5 * 60 * 1000;

    function getApiBase() {
        return (typeof API_URL !== 'undefined' && API_URL)
            ? API_URL
            : ((typeof CONFIG !== 'undefined' && CONFIG.API_URL)
                ? CONFIG.API_URL
                : 'http://localhost:3000/api');
    }

    function authH() {
        const t = sessionStorage.getItem('token') || localStorage.getItem('token');
        const h = { 'Content-Type': 'application/json' };
        if (t) h['Authorization'] = `Bearer ${t}`;
        return h;
    }

    function mismaFecha(f, ref) {
        if (!f) return false;
        const d = new Date(f);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === ref.getTime();
    }

    function fmtFecha(f) {
        if (!f) return '';
        return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    }

    async function calcularNotificaciones() {
        try {
            const base = getApiBase();
            const perfilRes = await fetch(`${base}/auth/me`, { headers: authH() });
            if (!perfilRes.ok) return null;
            const perfil = await perfilRes.json();
            const id = perfil.usuario?.id;
            if (!id) return null;

            const resRes = await fetch(`${base}/reservas/usuario/${id}`, { headers: authH() });
            if (!resRes.ok) return null;
            const reservas = await resRes.json();
            if (!Array.isArray(reservas)) return null;

            const HOY    = new Date(); HOY.setHours(0, 0, 0, 0);
            const MANANA = new Date(HOY); MANANA.setDate(HOY.getDate() + 1);

            const activas = reservas.filter(r => {
                const e = (r.NombreEstadoReserva || '').toLowerCase();
                return e !== 'cancelada' && e !== 'finalizada';
            });

            const pendientes     = activas.filter(r => (r.NombreEstadoReserva || '').toLowerCase() === 'pendiente');
            const checkinsHoy    = activas.filter(r => mismaFecha(r.FechaInicio, HOY)    && (r.NombreEstadoReserva || '').toLowerCase() === 'confirmada');
            const checkinsManana = activas.filter(r => mismaFecha(r.FechaInicio, MANANA) && (r.NombreEstadoReserva || '').toLowerCase() === 'confirmada');
            const checkoutsHoy   = activas.filter(r => mismaFecha(r.FechaFinalizacion, HOY) && (r.NombreEstadoReserva || '').toLowerCase() === 'confirmada');

            const total = pendientes.length + checkinsHoy.length + checkinsManana.length + checkoutsHoy.length;
            return { total, pendientes, checkinsHoy, checkinsManana, checkoutsHoy };
        } catch {
            return null;
        }
    }

    function renderSubitems(items) {
        return items.map(r => `
            <button class="cln-notif-subitem" type="button" data-id="${r.IdReserva || r.id || ''}">
                <span class="cln-notif-sub-id">#${r.IdReserva || r.id || '—'}</span>
                <span class="cln-notif-sub-info">
                    <span>${r.NombreHabitacion || '—'}</span>
                    <span>${fmtFecha(r.FechaInicio)} – ${fmtFecha(r.FechaFinalizacion)}</span>
                </span>
                <i class="fa-solid fa-arrow-right"></i>
            </button>`).join('');
    }

    function renderNotificaciones(data) {
        const lista = document.getElementById('cln-notif-lista');
        if (!lista) return;

        if (!data) {
            lista.innerHTML = '<div class="cln-notif-empty"><i class="fa-solid fa-circle-xmark"></i><span>Sin conexión con el servidor</span></div>';
            return;
        }

        const grupos = [];

        if (data.checkinsHoy.length) {
            grupos.push({
                clase: 'verde',
                icono: 'fa-right-to-bracket',
                texto: `Check-in hoy (${data.checkinsHoy.length})`,
                sub:   'Tu estancia comienza hoy',
                items: data.checkinsHoy
            });
        }
        if (data.checkoutsHoy.length) {
            grupos.push({
                clase: 'azul',
                icono: 'fa-right-from-bracket',
                texto: `Check-out hoy (${data.checkoutsHoy.length})`,
                sub:   'Tu estancia termina hoy',
                items: data.checkoutsHoy
            });
        }
        if (data.checkinsManana.length) {
            grupos.push({
                clase: 'amarillo',
                icono: 'fa-calendar-day',
                texto: `Check-in mañana (${data.checkinsManana.length})`,
                sub:   'Preparate — tu estancia comienza mañana',
                items: data.checkinsManana
            });
        }
        if (data.pendientes.length) {
            grupos.push({
                clase: 'rojo',
                icono: 'fa-clock',
                texto: `${data.pendientes.length} reserva${data.pendientes.length !== 1 ? 's' : ''} pendiente${data.pendientes.length !== 1 ? 's' : ''}`,
                sub:   'En espera de confirmación',
                items: data.pendientes
            });
        }

        if (!grupos.length) {
            lista.innerHTML = '<div class="cln-notif-empty"><i class="fa-solid fa-circle-check"></i><span>Todo al día</span></div>';
            return;
        }

        lista.innerHTML = grupos.map(g => `
            <div class="cln-notif-grupo">
                <div class="cln-notif-cabecera cln-notif-${g.clase}">
                    <i class="fa-solid ${g.icono}"></i>
                    <span class="cln-notif-cabecera-texto">
                        <strong>${g.texto}</strong>
                        <small>${g.sub}</small>
                    </span>
                </div>
                <div class="cln-notif-subitems">${renderSubitems(g.items)}</div>
            </div>`).join('');
    }

    function actualizarBadge(total) {
        const badge = document.getElementById('cln-notif-badge');
        if (!badge) return;
        if (total > 0) {
            badge.textContent = total > 9 ? '9+' : String(total);
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    function panelAbierto() {
        return !document.getElementById('cln-notif-panel')?.classList.contains('cln-panel-hidden');
    }

    function abrirPanel()  { document.getElementById('cln-notif-panel')?.classList.remove('cln-panel-hidden'); }
    function cerrarPanel() { document.getElementById('cln-notif-panel')?.classList.add('cln-panel-hidden');    }

    async function refrescar() {
        const data = await calcularNotificaciones();
        actualizarBadge(data ? data.total : 0);
        if (panelAbierto()) renderNotificaciones(data);
    }

    function iniciar() {
        const btn   = document.getElementById('cln-notif-btn');
        const lista = document.getElementById('cln-notif-lista');
        if (!btn || !lista) return;

        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (panelAbierto()) { cerrarPanel(); return; }

            abrirPanel();
            lista.innerHTML = '<div class="cln-notif-empty"><i class="fa-solid fa-spinner fa-spin"></i><span>Cargando...</span></div>';
            const data = await calcularNotificaciones();
            actualizarBadge(data ? data.total : 0);
            renderNotificaciones(data);
        });

        lista.addEventListener('click', (e) => {
            const item = e.target.closest('.cln-notif-subitem');
            if (!item || !item.dataset.id) return;
            const id = item.dataset.id;
            cerrarPanel();
            if (typeof mostrarSeccion === 'function') {
                mostrarSeccion('reservas', null);
                setTimeout(() => {
                    if (typeof verDetalleReserva === 'function') verDetalleReserva(id);
                }, 350);
            }
        });

        document.addEventListener('click', (e) => {
            const wrap = document.getElementById('cln-notif-wrap');
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

    window.refrescarNotificacionesCliente = refrescar;
})();
