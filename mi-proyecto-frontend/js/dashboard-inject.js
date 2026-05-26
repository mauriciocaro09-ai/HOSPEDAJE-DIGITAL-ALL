// ============================================
// DASHBOARD HTML INJECTION
// ============================================

(function injectDashboardSection() {
    if (document.getElementById('seccion-dashboard')) return;

    const dashboardHTML = `
    <section id="seccion-dashboard" class="dashboard-section hidden">
        <div class="dashboard-container">

            <!-- Header -->
            <div class="dashboard-header">
                <h2><i class="fa-solid fa-chart-line"></i> Panel de Control</h2>
                <p class="dashboard-date" id="dashboard-date"></p>
            </div>

            <!-- Cards de Resumen -->
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon" style="background:#f97316;">
                        <i class="fa-solid fa-calendar-check"></i>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">TOTAL RESERVAS</p>
                        <h3 id="stat-total-reservas" class="stat-value">0</h3>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background:#16a34a;">
                        <i class="fa-solid fa-dollar-sign"></i>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">INGRESOS TOTALES</p>
                        <h3 id="stat-ingresos-totales" class="stat-value">$0</h3>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background:#6366f1;">
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">CLIENTES</p>
                        <h3 id="stat-clientes" class="stat-value">0</h3>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background:#8b5cf6;">
                        <i class="fa-solid fa-bed"></i>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">HABITACIONES</p>
                        <h3 id="stat-habitaciones" class="stat-value">0</h3>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background:#0d9488;">
                        <i class="fa-solid fa-box"></i>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">PAQUETES</p>
                        <h3 id="stat-paquetes" class="stat-value">0</h3>
                    </div>
                </div>
            </div>

            <!-- Fila 1: Reservas por Mes + Estado -->
            <div class="dashboard-charts">
                <div class="chart-container">
                    <h3><i class="fa-solid fa-chart-bar"></i> Reservas e Ingresos por Mes</h3>
                    <canvas id="chartReservasMes"></canvas>
                </div>
                <div class="chart-container">
                    <h3><i class="fa-solid fa-chart-pie"></i> Reservas por Estado</h3>
                    <canvas id="chartEstados"></canvas>
                </div>
            </div>

            <!-- Fila 2: Ingresos semanales + Habitaciones más solicitadas -->
            <div class="dashboard-charts">
                <div class="chart-container">
                    <h3><i class="fa-solid fa-chart-line"></i> Ingresos por Semana</h3>
                    <canvas id="chartIngresosSemana"></canvas>
                </div>
                <div class="chart-container">
                    <h3><i class="fa-solid fa-bed"></i> Habitaciones más solicitadas</h3>
                    <canvas id="chartHabitaciones"></canvas>
                </div>
            </div>

            <!-- Fila 3: Paquetes + Servicios más vendidos -->
            <div class="dashboard-charts">
                <div class="chart-container">
                    <h3><i class="fa-solid fa-box"></i> Paquetes más vendidos</h3>
                    <canvas id="chartPaquetes"></canvas>
                </div>
                <div class="chart-container">
                    <h3><i class="fa-solid fa-spa"></i> Servicios más vendidos</h3>
                    <canvas id="chartServicios"></canvas>
                </div>
            </div>

        </div>
    </section>
    `;

    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.insertAdjacentHTML('afterend', dashboardHTML);
    } else {
        const main = document.querySelector('main');
        if (main) main.insertAdjacentHTML('afterbegin', dashboardHTML);
    }
})();
