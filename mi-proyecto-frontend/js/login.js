const LOGIN_REDIRECT_ADMIN  = 'index.html';
const LOGIN_REDIRECT_CLIENTE = 'cliente.html';

function obtenerBaseApi() {
    if (typeof CONFIG !== 'undefined' && CONFIG.API_URL) {
        return CONFIG.API_URL;
    }

    return 'http://localhost:3000/api';
}

async function iniciarSesion(event) {
    if (event) {
        event.preventDefault();
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorElement = document.getElementById('error');
    const loginButton = document.getElementById('btn-login');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
        if (errorElement) {
            errorElement.textContent = 'Debe ingresar email y contraseña';
        }
        return;
    }

    if (loginButton) {
        loginButton.disabled = true;
    }

    try {
        const response = await fetch(`${obtenerBaseApi()}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Email: email,
                Contrasena: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Error en el inicio de sesión');
        }

        if (data.token) {
            sessionStorage.setItem('token', data.token);
            localStorage.setItem('token', data.token);

            if (data.usuario) {
                sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
                localStorage.setItem('user', JSON.stringify(data.usuario));
            }

            localStorage.setItem('hospedaje_ultima_seccion', 'dashboard');
            const ruta = (data.usuario?.rol === 1) ? LOGIN_REDIRECT_ADMIN : LOGIN_REDIRECT_CLIENTE;
            window.location.href = ruta;
            return;
        }

        throw new Error('Credenciales incorrectas');
    } catch (error) {
        console.error('Error de login:', error);
        if (errorElement) {
            errorElement.textContent = error.message === 'Failed to fetch'
                ? 'Error: no se pudo conectar con el servidor.'
                : error.message;
        }
    } finally {
        if (loginButton) {
            loginButton.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    if (form && !form.dataset.loginInicializado) {
        form.addEventListener('submit', iniciarSesion);
        form.dataset.loginInicializado = 'true';
    }
});

window.iniciarSesion = iniciarSesion;
