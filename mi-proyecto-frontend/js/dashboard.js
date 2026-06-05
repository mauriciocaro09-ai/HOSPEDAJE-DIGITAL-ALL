// ============================================
// DASHBOARD FUNCTIONS
// ============================================

let chartReservasMes    = null;
let chartEstados        = null;
let chartIngresosSemana = null;
let chartHabitaciones   = null;
let chartPaquetes       = null;
let chartServicios      = null;

const API_BASE = (typeof window !== 'undefined' && window.API_URL)
    ? window.API_URL
    : ((typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : 'http://localhost:3000/api');

// ── Helpers ──────────────────────────────────────────────────────────────────

function apiFetch(path) {
    if (typeof requestJson === 'function') return requestJson(path);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    return fetch(`${API_BASE}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
    });
}

function asArray(val) {
    return Array.isArray(val) ? val : [];
}

function fmtMoney(v) {
    return `$${Number(v || 0).toLocaleString('es-CO')}`;
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO');
}

function renderHorizontalBar(canvasId, chartRef, labels, data, color, label) {
    const el = document.getElementById(canvasId);
    if (!el) return chartRef;
    const ctx = el.getContext('2d');
    if (chartRef) chartRef.destroy();
    if (!labels.length) {
        el.parentElement.insertAdjacentHTML('beforeend',
            '<p class="empty-state" style="margin-top:1rem">Sin datos suficientes</p>');
        return null;
    }
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label,
                data,
                backgroundColor: color,
                borderRadius: 6,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function initDashboard() {
    const hoy = new Date();
    document.getElementById('dashboard-date').textContent =
        hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const useMock = (typeof CONFIG !== 'undefined' && CONFIG.USE_MOCK_DATA);
    if (useMock) {
        ['stat-total-reservas','stat-clientes','stat-habitaciones','stat-paquetes']
            .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = 0; });
        const si = document.getElementById('stat-ingresos-totales');
        if (si) si.textContent = '$0';
        return;
    }

    await cargarEstadisticasDashboard();
    await cargarGraficos();
    await cargarIngresosSemanales();
    await cargarHabitacionesMasVendidas();
    await cargarPaquetesMasVendidos();
    await cargarServiciosMasVendidos();
}

// ── Stats cards ───────────────────────────────────────────────────────────────

async function cargarEstadisticasDashboard() {
    try {
        const [reservas, clientes, habitaciones, paquetes] = (await Promise.all([
            apiFetch('/reservas').catch(() => []),
            apiFetch('/clientes').catch(() => []),
            apiFetch('/habitaciones').catch(() => []),
            apiFetch('/paquetes').catch(() => []),
        ])).map(asArray);

        const totalIngresos = reservas.reduce((s, r) => s + (Number(r.Monto_Total) || 0), 0);

        document.getElementById('stat-total-reservas').textContent  = reservas.length;
        document.getElementById('stat-ingresos-totales').textContent = fmtMoney(totalIngresos);
        document.getElementById('stat-clientes').textContent         = clientes.length;
        document.getElementById('stat-habitaciones').textContent      = habitaciones.length;
        document.getElementById('stat-paquetes').textContent          = paquetes.length;
    } catch (e) {
        console.error('Error estadísticas:', e);
    }
}

// ── Gráfico 1: Reservas e Ingresos por Mes (bar doble) ───────────────────────

async function cargarGraficos() {
    try {
        const reservas = asArray(await apiFetch('/reservas'));

        const datosMes = {};
        reservas.forEach(r => {
            const f = r.FechaInicio || r.FechaReserva;
            if (!f) return;
            const d = new Date(f);
            if (isNaN(d)) return;
            const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            if (!datosMes[k]) datosMes[k] = { count: 0, ingresos: 0 };
            datosMes[k].count++;
            datosMes[k].ingresos += Number(r.Monto_Total) || 0;
        });

        const meses   = Object.keys(datosMes).sort().slice(-6);
        const labels  = meses.map(m => {
            const [y, mo] = m.split('-');
            return new Date(y, mo-1).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        });

        const ctx1 = document.getElementById('chartReservasMes').getContext('2d');
        if (chartReservasMes) chartReservasMes.destroy();
        chartReservasMes = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Reservas', data: meses.map(m => datosMes[m].count),
                      backgroundColor: '#f97316', borderRadius: 6, borderSkipped: false },
                    { label: 'Ingresos ($)', data: meses.map(m => datosMes[m].ingresos),
                      backgroundColor: '#0d9488', borderRadius: 6, borderSkipped: false, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: true, position: 'top' } },
                scales: {
                    y:  { type: 'linear', position: 'left',  title: { display: true, text: 'Reservas' } },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: 'Ingresos ($)' }, grid: { drawOnChartArea: false } }
                }
            }
        });

        // Gráfico 2: Donut por estado
        const estadosCount = {};
        reservas.forEach(r => {
            const e = r.NombreEstadoReserva || 'Sin estado';
            estadosCount[e] = (estadosCount[e] || 0) + 1;
        });

        const ctx2 = document.getElementById('chartEstados').getContext('2d');
        if (chartEstados) chartEstados.destroy();
        chartEstados = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(estadosCount),
                datasets: [{ data: Object.values(estadosCount),
                    backgroundColor: ['#10b981','#f97316','#ef4444','#6366f1','#0d9488'],
                    borderColor: '#fff', borderWidth: 2 }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: { legend: { display: true, position: 'bottom' } }
            }
        });

    } catch (e) {
        console.error('Error gráficos principales:', e);
    }
}

// ── Gráfico 3: Ingresos por Semana (línea, últimas 8 semanas) ────────────────

async function cargarIngresosSemanales() {
    try {
        const reservas = asArray(await apiFetch('/reservas'));

        // Calcular inicio de semana (lunes) para una fecha
        function semanaKey(fecha) {
            const d = new Date(fecha);
            if (isNaN(d)) return null;
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const lunes = new Date(d.setDate(diff));
            return `${lunes.getFullYear()}-${String(lunes.getMonth()+1).padStart(2,'0')}-${String(lunes.getDate()).padStart(2,'0')}`;
        }

        const datosS = {};
        reservas.forEach(r => {
            const k = semanaKey(r.FechaInicio || r.FechaReserva);
            if (!k) return;
            datosS[k] = (datosS[k] || 0) + (Number(r.Monto_Total) || 0);
        });

        const semanas = Object.keys(datosS).sort().slice(-8);
        const labels  = semanas.map(k => {
            const [y, m, d] = k.split('-');
            return `${d}/${m}`;
        });
        const data = semanas.map(k => datosS[k]);

        const el = document.getElementById('chartIngresosSemana');
        if (!el) return;
        const ctx = el.getContext('2d');
        if (chartIngresosSemana) chartIngresosSemana.destroy();

        if (!semanas.length) {
            el.parentElement.insertAdjacentHTML('beforeend',
                '<p class="empty-state" style="margin-top:1rem">Sin datos suficientes</p>');
            return;
        }

        chartIngresosSemana = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Ingresos ($)',
                    data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.12)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 5,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true,
                         ticks: { callback: v => `$${Number(v).toLocaleString('es-CO')}` } }
                }
            }
        });

    } catch (e) {
        console.error('Error ingresos semanales:', e);
    }
}

// ── Gráfico 4: Habitaciones más solicitadas ───────────────────────────────────

async function cargarHabitacionesMasVendidas() {
    try {
        const data = await apiFetch('/dashboard/estadisticas');
        const top = asArray(data.habitacionesMasReservadas);
        chartHabitaciones = renderHorizontalBar(
            'chartHabitaciones', chartHabitaciones,
            top.map(r => r.NombreHabitacion), top.map(r => Number(r.total)),
            '#3b82f6', 'Reservas'
        );
    } catch (e) {
        console.error('Error habitaciones más solicitadas:', e);
    }
}

// ── Gráfico 5: Paquetes más vendidos ─────────────────────────────────────────

async function cargarPaquetesMasVendidos() {
    try {
        const data = await apiFetch('/dashboard/estadisticas');
        const top = asArray(data.paquetesMasVendidos);
        chartPaquetes = renderHorizontalBar(
            'chartPaquetes', chartPaquetes,
            top.map(r => r.NombrePaquete), top.map(r => Number(r.total)),
            '#f97316', 'Veces'
        );
    } catch (e) {
        console.error('Error paquetes más vendidos:', e);
    }
}

// ── Gráfico 6: Servicios más vendidos ────────────────────────────────────────

async function cargarServiciosMasVendidos() {
    try {
        const data = await apiFetch('/dashboard/estadisticas');
        const top = asArray(data.serviciosMasVendidos);
        chartServicios = renderHorizontalBar(
            'chartServicios', chartServicios,
            top.map(r => r.NombreServicio), top.map(r => Number(r.total)),
            '#0d9488', 'Veces'
        );
    } catch (e) {
        console.error('Error servicios más vendidos:', e);
    }
}

// ── Exponer funciones globalmente ────────────────────────────────────────────
async function cargarDashboard() {
    await initDashboard();
}

window.cargarDashboard = cargarDashboard;
window.initDashboard   = initDashboard;
