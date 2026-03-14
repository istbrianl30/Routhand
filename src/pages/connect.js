/**
 * Connect page — SSH connection form + saved profiles
 */
import { showToast } from '../components/toast.js';
import { apiUrl } from '../api.js';

export function renderConnect(container, state, onStatusChange) {
  container.innerHTML = `
    <div class="animate-in">
      <div class="page-header">
        <h1 class="page-title">Connect</h1>
        <p class="page-subtitle">Establish an SSH connection to your router</p>
      </div>

      <div class="grid-2">
        <!-- Connection form -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">SSH Connection</span>
            <div class="card-icon">🔑</div>
          </div>
          <form id="connect-form" style="display:flex;flex-direction:column;gap:var(--space-md)">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="ssh-host">Host / IP</label>
                <input class="input" type="text" id="ssh-host" placeholder="192.168.1.1" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="ssh-port">Port</label>
                <input class="input" type="number" id="ssh-port" value="22" placeholder="22">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="ssh-user">Username</label>
              <input class="input" type="text" id="ssh-user" placeholder="admin" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="ssh-password">Password</label>
              <input class="input" type="password" id="ssh-password" placeholder="••••••••">
            </div>
            <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
              <button type="submit" class="btn btn-primary" id="btn-connect" ${state.connected ? 'disabled' : ''}>
                ${state.connected ? '✓ Connected' : '🔌 Connect'}
              </button>
              ${state.connected ? `<button type="button" class="btn btn-danger" id="btn-disconnect">Disconnect</button>` : ''}
              <button type="button" class="btn btn-secondary" id="btn-save-profile">💾 Save Profile</button>
            </div>
          </form>
        </div>

        <!-- Saved profiles -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Saved Profiles</span>
            <div class="card-icon">📁</div>
          </div>
          <div id="profiles-list" style="display:flex;flex-direction:column;gap:var(--space-sm)">
            <div class="empty-state">
              <span class="empty-state-icon">📁</span>
              <span class="empty-state-text">Loading profiles...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  loadProfiles();

  // Connect form
  const form = document.getElementById('connect-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-connect');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Connecting...';

    try {
      const res = await fetch(apiUrl('/api/connect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: document.getElementById('ssh-host').value,
          port: document.getElementById('ssh-port').value,
          username: document.getElementById('ssh-user').value,
          password: document.getElementById('ssh-password').value
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Connected to ${document.getElementById('ssh-host').value}`, 'success');
        onStatusChange();
      } else {
        showToast(data.error || 'Connection failed', 'error');
        btn.disabled = false;
        btn.textContent = '🔌 Connect';
      }
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = '🔌 Connect';
    }
  });

  // Disconnect
  const btnDisconnect = document.getElementById('btn-disconnect');
  if (btnDisconnect) {
    btnDisconnect.addEventListener('click', async () => {
      try {
        await fetch(apiUrl('/api/disconnect'), { method: 'POST' });
        showToast('Disconnected', 'info');
        onStatusChange();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Save profile
  document.getElementById('btn-save-profile').addEventListener('click', async () => {
    const host = document.getElementById('ssh-host').value;
    const port = document.getElementById('ssh-port').value;
    const username = document.getElementById('ssh-user').value;
    const password = document.getElementById('ssh-password').value;

    if (!host || !username) {
      showToast('Fill in host and username first', 'warning');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/profiles'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, username, password, name: `${username}@${host}` })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Profile saved', 'success');
        loadProfiles();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function loadProfiles() {
  const listEl = document.getElementById('profiles-list');
  if (!listEl) return;

  try {
    const res = await fetch(apiUrl('/api/profiles'));
    const data = await res.json();

    if (!data.profiles || data.profiles.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">📁</span>
          <span class="empty-state-text">No saved profiles yet. Connect and save one!</span>
        </div>
      `;
      return;
    }

    listEl.innerHTML = data.profiles.map(p => `
      <div class="profile-card">
        <div class="profile-info">
          <span class="profile-name">${p.name || p.host}</span>
          <span class="profile-host">${p.username}@${p.host}:${p.port}</span>
        </div>
        <div class="profile-actions">
          <button class="btn btn-sm btn-primary" data-profile-connect='${JSON.stringify(p)}'>Connect</button>
          <button class="btn btn-sm btn-danger" data-profile-delete="${p.id}">🗑</button>
        </div>
      </div>
    `).join('');

    // Profile connect buttons
    listEl.querySelectorAll('[data-profile-connect]').forEach(btn => {
      btn.addEventListener('click', () => {
        const profile = JSON.parse(btn.dataset.profileConnect);
        document.getElementById('ssh-host').value = profile.host;
        document.getElementById('ssh-port').value = profile.port;
        document.getElementById('ssh-user').value = profile.username;
        document.getElementById('ssh-password').value = profile.password || '';
        showToast('Profile loaded — click Connect', 'info');
      });
    });

    // Profile delete buttons
    listEl.querySelectorAll('[data-profile-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await fetch(apiUrl(`/api/profiles/${btn.dataset.profileDelete}`), { method: 'DELETE' });
          showToast('Profile deleted', 'info');
          loadProfiles();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  } catch {
    listEl.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">⚠️</span>
        <span class="empty-state-text">Could not load profiles</span>
      </div>
    `;
  }
}
