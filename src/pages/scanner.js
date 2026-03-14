/**
 * Network Scanner page
 */
import { showToast } from '../components/toast.js';
import { apiUrl } from '../api.js';

export function renderScanner(container) {
  container.innerHTML = `
    <div class="animate-in">
      <div class="page-header">
        <h1 class="page-title">Network Scanner</h1>
        <p class="page-subtitle">Discover devices on your local network</p>
      </div>

      <div style="display:flex;gap:var(--space-md);margin-bottom:var(--space-xl);flex-wrap:wrap;align-items:center">
        <button class="btn btn-primary" id="btn-scan">
          📡 Scan Network
        </button>
        <span id="scan-status" style="display:flex;align-items:center;gap:var(--space-sm);color:var(--text-secondary);font-size:14px;"></span>
      </div>

      <div id="scan-results">
        <div class="empty-state">
          <span class="empty-state-icon">📡</span>
          <span class="empty-state-text">Click "Scan Network" to discover devices</span>
        </div>
      </div>
    </div>
  `;

  const btnScan = document.getElementById('btn-scan');
  btnScan.addEventListener('click', async () => {
    btnScan.disabled = true;
    btnScan.innerHTML = '<span class="spinner"></span> Scanning...';
    document.getElementById('scan-status').textContent = 'This may take a moment...';
    document.getElementById('scan-results').innerHTML = `
      <div class="empty-state">
        <div class="spinner spinner-lg"></div>
        <span class="empty-state-text" style="margin-top:var(--space-md)">Scanning network...</span>
      </div>
    `;

    try {
      const res = await fetch(apiUrl('/api/scan'));

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        if (text.trim().startsWith('<')) {
          throw new Error('Backend not found on this host. If you are on Netlify, you must deploy the backend separately and set VITE_API_URL.');
        }
        throw new Error('Server returned non-JSON response');
      }

      const data = await res.json();

      if (data.success && data.devices.length > 0) {
        document.getElementById('scan-status').textContent = `Found ${data.devices.length} device(s)`;
        document.getElementById('scan-results').innerHTML = `
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>IP Address</th>
                  <th>MAC Address</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${data.devices.map((d, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><code style="color:var(--accent-secondary)">${d.ip}</code></td>
                    <td><code style="color:var(--text-secondary)">${d.mac}</code></td>
                    <td>
                      <button class="btn btn-sm btn-secondary" onclick="window.location.hash='connect';
                        setTimeout(()=>{
                          const h=document.getElementById('ssh-host');
                          if(h) h.value='${d.ip}';
                        },100)">
                        🔌 Connect
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        showToast(`Found ${data.devices.length} device(s)`, 'success');
      } else {
        document.getElementById('scan-results').innerHTML = `
          <div class="empty-state">
            <span class="empty-state-icon">🔍</span>
            <span class="empty-state-text">No devices found on the network</span>
          </div>
        `;
        document.getElementById('scan-status').textContent = '';
      }
    } catch (err) {
      showToast(err.message, 'error');
      document.getElementById('scan-results').innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">⚠️</span>
          <span class="empty-state-text">Scan failed: ${err.message}</span>
        </div>
      `;
      document.getElementById('scan-status').textContent = '';
    }

    btnScan.disabled = false;
    btnScan.innerHTML = '📡 Scan Network';
  });
}
