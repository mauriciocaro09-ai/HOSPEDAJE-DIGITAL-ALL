/**
 * Sistema de notificaciones Toast
 * Uso: showToast('Operación exitosa', 'success')
 */

let toastContainer = null;

/**
 * Muestra una notificación toast flotante
 * @param {String} message - Mensaje a mostrar
 * @param {String} type - Tipo: 'success', 'error', 'info'
 * @param {Number} duration - Duración en ms (default 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  // Crear contenedor si no existe
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(toastContainer);
  }

  // Crear elemento del toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  // Estilos según tipo
  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: '✕'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'ℹ'
    }
  };

  const style = typeStyles[type] || typeStyles.info;
  
  toast.innerHTML = `
    <div class="${style.bg} ${style.border} ${style.text} border px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-80">
      <span class="text-lg font-bold">${style.icon}</span>
      <span class="flex-1">${message}</span>
      <button class="text-lg font-bold opacity-70 hover:opacity-100 cursor-pointer">×</button>
    </div>
  `;

  // Agregar al contenedor
  toastContainer.appendChild(toast);

  // Manejador para cerrar
  const closeBtn = toast.querySelector('button');
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  });

  // Auto-cerrar después de duration ms
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
  
  .toast {
    animation: fadeIn 0.3s ease-out;
  }
`;
document.head.appendChild(style);

window.showToast = showToast;
