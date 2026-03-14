/**
 * Router Info page — System Info, Interfaces, Routing Table
 */
import { showToast } from '../components/toast.js';
import { apiUrl } from '../api.js';

export function renderInfo(container, state) {
  if (!state.connected) {
    container.innerHTML = `
      <div class="animate-in">
        <div class="page-header">
          <h1 class="page-title">Router Info</h1>
          <p class="page-subtitle">View interface and routing information</p>
        </div>
        <div class="card">
          <div class="empty-state">
            <span class="empty-state-icon">🔌</span>
            <span class="empty-state-text">Connect to a router first to view info</span>
            <button class="btn btn-primary" style="margin-top:var(--space-md)" onclick="window.location.hash='connect'">
              Go to Connect
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="animate-in">
      <div class="page-header">
        <h1 class="page-title">Router Info</h1>
        <p class="page-subtitle">System, interfaces, and routing information for ${state.host}</p>
      </div>

      <div style="margin-bottom:var(--space-md)">
        <button class="btn btn-primary" id="btn-refresh-info">🔄 Refresh All</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div class="card">
          <div class="card-header">
            <span class="card-title">System Info</span>
            <div class="card-icon">🖥️</div>
          </div>
          <div id="info-system" class="output-block" style="min-height:80px">Loading...</div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Interfaces</span>
            <div class="card-icon">🌐</div>
          </div>
          <div id="info-interfaces" class="output-block" style="min-height:100px">Loading...</div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Routing Table</span>
            <div class="card-icon">🗺️</div>
          </div>
          <div id="info-routes" class="output-block" style="min-height:100px">Loading...</div>
        </div>
      </div>
    </div>
  `;

  fetchAllInfo();

  document.getElementById('btn-refresh-info').addEventListener('click', () => {
    fetchAllInfo();
    showToast('Refreshing info...', 'info');
  });
}

async function fetchAllInfo() {
  fetchSection(apiUrl('/api/system'), 'info-system', (data) => {
    return `Hostname:  ${data.hostname}\nUptime:    ${data.uptime}\nVersion:   ${data.version}`;
  });
  fetchSection(apiUrl('/api/interfaces'), 'info-interfaces', (data) => data.output);
  fetchSection(apiUrl('/api/routes'), 'info-routes', (data) => data.output);
}

async function fetchSection(url, elementId, formatter) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = 'Loading...';

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      el.textContent = typeof formatter === 'function' ? formatter(data) : data.output;
    } else {
      el.textContent = `Error: ${data.error}`;
    }
  } catch (err) {
    el.textContent = `Error: ${err.message}`;
  }
}
