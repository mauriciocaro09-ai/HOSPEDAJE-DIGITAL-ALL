/**
 * Sistema de modales de confirmación
 * Uso: await confirmAction('Eliminar', '¿Estás seguro?', onConfirm)
 */

/**
 * Muestra un modal de confirmación
 * @param {String} title - Título del modal
 * @param {String} message - Mensaje confirmación
 * @param {Function} onConfirm - Callback si se confirma
 * @param {Function} onCancel - Callback si se cancela
 * @returns {Promise} Resolves cuando se cierra
 */
function confirmAction(title, message, onConfirm = null, onCancel = null) {
  return new Promise((resolve) => {
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    `;

    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-lg shadow-xl p-6 w-96 animate-in';
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      padding: 24px;
      width: 384px;
      animation: modalSlideIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
      <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">${title}</h2>
      <p style="color: #64748b; margin-bottom: 24px;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancelBtn" style="padding: 8px 16px; border-radius: 6px; background-color: #e2e8f0; color: #334155; font-weight: 500; border: none; cursor: pointer; transition: all 0.3s ease;">
          Cancelar
        </button>
        <button id="confirmBtn" style="padding: 8px 16px; border-radius: 6px; background-color: #dc2626; color: white; font-weight: 500; border: none; cursor: pointer; transition: all 0.3s ease;">
          Confirmar
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Manejadores
    const confirmBtn = modal.querySelector('#confirmBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');

    // Estilos hover
    confirmBtn.addEventListener('mouseenter', () => {
      confirmBtn.style.backgroundColor = '#b91c1c';
    });
    confirmBtn.addEventListener('mouseleave', () => {
      confirmBtn.style.backgroundColor = '#dc2626';
    });

    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.backgroundColor = '#cbd5e1';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.backgroundColor = '#e2e8f0';
    });

    const close = () => {
      overlay.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => overlay.remove(), 300);
    };

    confirmBtn.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      close();
      resolve(true);
    });

    cancelBtn.addEventListener('click', () => {
      if (onCancel) onCancel();
      close();
      resolve(false);
    });

    // Cerrar con tecla ESC
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handleEscape);
        if (onCancel) onCancel();
        close();
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
}

// Agregar estilos de animación
const modalStyleEl = document.createElement('style');
modalStyleEl.textContent = `
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }
`;
document.head.appendChild(modalStyleEl);

window.confirmAction = confirmAction;
