/**
 * Quick Commands page
 */
import { showToast } from '../components/toast.js';
import { apiUrl } from '../api.js';

const PRESET_COMMANDS = [
  { icon: '🌐', label: 'Show IP Config', cmd: 'ip addr show 2>/dev/null || ifconfig' },
  { icon: '🗺️', label: 'Routing Table', cmd: 'ip route show 2>/dev/null || netstat -rn' },
  { icon: '📊', label: 'System Info', cmd: 'uname -a' },
  { icon: '🕐', label: 'Uptime', cmd: 'uptime' },
  { icon: '💾', label: 'Disk Usage', cmd: 'df -h' },
  { icon: '🧠', label: 'Memory', cmd: 'free -h 2>/dev/null || cat /proc/meminfo' },
  { icon: '📡', label: 'ARP Table', cmd: 'arp -a 2>/dev/null || ip neigh show' },
  { icon: '🔥', label: 'Firewall Rules', cmd: 'iptables -L -n 2>/dev/null || ufw status' },
  { icon: '👤', label: 'Whoami', cmd: 'whoami' },
  { icon: '📋', label: 'Processes', cmd: 'ps aux --sort=-%mem | head -15' },
  { icon: '🌍', label: 'DNS Config', cmd: 'cat /etc/resolv.conf' },
  { icon: '🔌', label: 'Open Ports', cmd: 'ss -tulnp 2>/dev/null || netstat -tulnp' },
];

export function renderCommands(container, state) {
  if (!state.connected) {
    container.innerHTML = `
      <div class="animate-in">
        <div class="page-header">
          <h1 class="page-title">Quick Commands</h1>
          <p class="page-subtitle">Execute common router commands</p>
        </div>
        <div class="card">
          <div class="empty-state">
            <span class="empty-state-icon">🔌</span>
            <span class="empty-state-text">Connect to a router first to run commands</span>
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
        <h1 class="page-title">Quick Commands</h1>
        <p class="page-subtitle">Execute common commands on ${state.host}</p>
      </div>

      <!-- Custom command -->
      <div class="card" style="margin-bottom:var(--space-xl)">
        <div class="card-header">
          <span class="card-title">Custom Command</span>
          <div class="card-icon">⌨️</div>
        </div>
        <form id="custom-cmd-form" style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
          <input class="input" id="custom-cmd-input" placeholder="Enter command..." style="flex:1;min-width:200px;font-family:'JetBrains Mono',monospace;">
          <button type="submit" class="btn btn-primary">▶ Run</button>
        </form>
      </div>

      <!-- Preset commands grid -->
      <h2 style="font-size:18px;font-weight:600;margin-bottom:var(--space-md)">Preset Commands</h2>
      <div class="grid-4" style="margin-bottom:var(--space-xl)">
        ${PRESET_COMMANDS.map(c => `
          <button class="cmd-btn" data-cmd="${c.cmd.replace(/"/g, '&quot;')}">
            <span class="cmd-btn-icon">${c.icon}</span>
            <span>${c.label}</span>
          </button>
        `).join('')}
      </div>

      <!-- Output -->
      <div class="card" id="cmd-output-card" style="display:none">
        <div class="card-header">
          <span class="card-title" id="cmd-output-title">Output</span>
          <button class="btn btn-ghost btn-sm" id="btn-clear-output">Clear</button>
        </div>
        <div id="cmd-output" class="output-block"></div>
      </div>
    </div>
  `;

  // Run preset command
  container.querySelectorAll('.cmd-btn[data-cmd]').forEach(btn => {
    btn.addEventListener('click', () => {
      executeCommand(btn.dataset.cmd);
    });
  });

  // Run custom command
  document.getElementById('custom-cmd-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('custom-cmd-input');
    if (input.value.trim()) {
      executeCommand(input.value.trim());
    }
  });

  // Clear output
  document.getElementById('btn-clear-output').addEventListener('click', () => {
    document.getElementById('cmd-output-card').style.display = 'none';
  });
}

async function executeCommand(command) {
  const outputCard = document.getElementById('cmd-output-card');
  const outputEl = document.getElementById('cmd-output');
  const titleEl = document.getElementById('cmd-output-title');

  outputCard.style.display = 'block';
  titleEl.textContent = `$ ${command}`;
  outputEl.textContent = 'Executing...';

  try {
    const res = await fetch(apiUrl('/api/exec'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    const data = await res.json();
    if (data.success) {
      outputEl.textContent = data.output || '(no output)';
    } else {
      outputEl.textContent = `Error: ${data.error}`;
      showToast(data.error, 'error');
    }
  } catch (err) {
    outputEl.textContent = `Error: ${err.message}`;
    showToast(err.message, 'error');
  }

  // Scroll to output
  outputCard.scrollIntoView({ behavior: 'smooth' });
}
