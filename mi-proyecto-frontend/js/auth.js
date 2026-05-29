/**
 * Módulo de Autenticación
 * Maneja login, registro y recuperación de contraseña
 */

// Login
async function loginUsuario(email, contrasena) {
    try {
        const apiUrl = window.API_URL || (typeof CONFIG !== 'undefined' && CONFIG.API_URL) || 'http://localhost:3000/api';
        const timeout = (typeof CONFIG !== 'undefined' && CONFIG.FETCH_TIMEOUT) || 60000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                Email: email,
                Contrasena: contrasena,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (response.ok) {
            sessionStorage.setItem("token", data.token);
            localStorage.setItem("token", data.token);
            if (data.usuario) {
                sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
                localStorage.setItem("user", JSON.stringify(data.usuario));
            }
            return { success: true, data };
        } else {
            return { success: false, message: data.message || data.error || "Error al iniciar sesión" };
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        if (error.name === 'AbortError') {
            return { success: false, message: "El servidor tardó demasiado. Intentá de nuevo en unos segundos." };
        }
        return { success: false, message: "No se pudo conectar con el servidor" };
    }
}

// Registro
async function registrarUsuario(userData) {
    try {
        const apiUrl = window.API_URL || (typeof CONFIG !== 'undefined' && CONFIG.API_URL) || 'http://localhost:3000/api';
        const timeout = (typeof CONFIG !== 'undefined' && CONFIG.FETCH_TIMEOUT) || 60000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(`${apiUrl}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, message: data.error || data.message || "Error al registrar usuario" };
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        if (error.name === 'AbortError') {
            return { success: false, message: "El servidor tardó demasiado. Intentá de nuevo en unos segundos." };
        }
        return { success: false, message: "Error de conexión con el servidor" };
    }
}
