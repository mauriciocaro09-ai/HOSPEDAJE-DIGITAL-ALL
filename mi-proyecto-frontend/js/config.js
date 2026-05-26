// ============================================
// CONFIGURACIÓN DE LA API
// ============================================

const apiUrlPorDefecto = (() => {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
        if (window.location.origin.includes('localhost:3000')) {
            return '/api';
        }
    }
    return 'http://localhost:3000/api';
})();

const CONFIG = {
    // URL base del backend
    API_URL: apiUrlPorDefecto,
    
    // Timeout para peticiones fetch (en milisegundos)
    FETCH_TIMEOUT: 10000,
    
    // Habilitar logs en consola
    ENABLE_LOGS: true,
    
    // Usar datos mock (true = evita redirecciones y facilita pruebas locales)
    // Cambiado a false para probar integración con backend local
    USE_MOCK_DATA: false,
    
    // Configuración de la aplicación
    APP_NAME: 'Hospedaje Digital',
    VERSION: '1.0.0'
};

// Exportar configuración (para uso en módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
