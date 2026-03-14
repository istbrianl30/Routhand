/**
 * Dashboard page
 */
import { showToast } from '../components/toast.js';

export function renderDashboard(container, state) {
    const connected = state.connected;
    const host = state.host || '—';
    const since = state.connectedSince ? new Date(state.connectedSince).toLocaleString() : '—';

    container.innerHTML = `
    <div class="animate-in">
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Overview of your router connection</p>
      </div>

      <div class="grid-3" style="margin-bottom: var(--space-xl)">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Status</span>
            <div class="card-icon">${connected ? '🟢' : '🔴'}</div>
          </div>
          <span class="badge ${connected ? 'badge-success' : 'badge-error'}">
            ${connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Host</span>
            <div class="card-icon">🖥️</div>
          </div>
          <div class="stat-value" style="font-size: 18px">${host}</div>
          <div class="stat-label">Router address</div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Connected Since</span>
            <div class="card-icon">🕐</div>
          </div>
          <div style="font-size: 14px; color: var(--text-secondary)">${since}</div>
        </div>
      </div>

      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: var(--space-md);">Quick Actions</h2>
      <div class="grid-4">
        <button class="cmd-btn" data-action="terminal">
          <span class="cmd-btn-icon">💻</span>
          <span>Open Terminal</span>
        </button>
        <button class="cmd-btn" data-action="scanner">
          <span class="cmd-btn-icon">📡</span>
          <span>Scan Network</span>
        </button>
        <button class="cmd-btn" data-action="info">
          <span class="cmd-btn-icon">📋</span>
          <span>Router Info</span>
        </button>
        <button class="cmd-btn" data-action="commands">
          <span class="cmd-btn-icon">⚡</span>
          <span>Quick Commands</span>
        </button>
      </div>
    </div>
  `;

    // Quick action buttons navigate to pages
    container.querySelectorAll('.cmd-btn[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            window.location.hash = action;
        });
    });
}
