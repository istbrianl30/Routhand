/**
 * Sidebar navigation component
 */

const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'connect', icon: '🔌', label: 'Connect' },
    { id: 'scanner', icon: '📡', label: 'Scanner' },
    { id: 'terminal', icon: '💻', label: 'Terminal' },
    { id: 'info', icon: '📋', label: 'Router Info' },
    { id: 'commands', icon: '⚡', label: 'Commands' },
];

export function renderSidebar(container, activePage, onNavigate) {
    container.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">🌐</div>
      <span class="sidebar-logo-text">Routhand</span>
    </div>
    <nav class="sidebar-nav">
      ${navItems.map(item => `
        <a class="sidebar-link ${activePage === item.id ? 'active' : ''}"
           data-page="${item.id}" href="#${item.id}">
          <span class="sidebar-link-icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-status" id="sidebar-status">
      <span class="sidebar-status-dot" id="status-dot"></span>
      <span class="sidebar-status-text" id="status-text">Disconnected</span>
    </div>
  `;

    container.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            window.location.hash = page;
            onNavigate(page);
        });
    });
}

export function updateSidebarStatus(connected, host) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (dot) {
        dot.className = `sidebar-status-dot ${connected ? 'connected' : ''}`;
    }
    if (text) {
        text.textContent = connected ? `Connected to ${host}` : 'Disconnected';
    }
}
