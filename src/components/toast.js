/**
 * Toast notification component
 */

const ICONS = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
};

export function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
    <span>${message}</span>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
