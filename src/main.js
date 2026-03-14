/**
 * Routhand — Main Application Bootstrap & Router
 */
import './styles/index.css';
import './styles/components.css';

import { apiUrl } from './api.js';
import { renderSidebar, updateSidebarStatus } from './components/sidebar.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderConnect } from './pages/connect.js';
import { renderScanner } from './pages/scanner.js';
import { renderTerminal, cleanupTerminal } from './pages/terminal.js';
import { renderInfo } from './pages/info.js';
import { renderCommands } from './pages/commands.js';

// --- App State ---
const state = {
    connected: false,
    host: null,
    connectedSince: null
};

let currentPage = null;

// --- Status polling ---
async function fetchStatus() {
    try {
        const res = await fetch(apiUrl('/api/status'));
        const data = await res.json();
        state.connected = data.connected;
        state.host = data.host;
        state.connectedSince = data.connectedSince;
        updateSidebarStatus(state.connected, state.host);
    } catch {
        // Server not available — just mark disconnected
        state.connected = false;
        state.host = null;
        updateSidebarStatus(false, null);
    }
}

// --- Page Router ---
function navigateTo(page) {
    // Cleanup previous page
    if (currentPage === 'terminal') {
        cleanupTerminal();
    }

    currentPage = page;
    const content = document.getElementById('content');
    const sidebar = document.getElementById('sidebar');

    // Render sidebar with active state
    renderSidebar(sidebar, page, navigateTo);
    updateSidebarStatus(state.connected, state.host);

    // Render page
    switch (page) {
        case 'dashboard':
            renderDashboard(content, state);
            break;
        case 'connect':
            renderConnect(content, state, () => {
                fetchStatus().then(() => navigateTo(currentPage));
            });
            break;
        case 'scanner':
            renderScanner(content);
            break;
        case 'terminal':
            renderTerminal(content, state);
            break;
        case 'info':
            renderInfo(content, state);
            break;
        case 'commands':
            renderCommands(content, state);
            break;
        default:
            renderDashboard(content, state);
    }
}

// --- Init ---
function init() {
    // Set initial page from hash
    const hash = window.location.hash.slice(1) || 'dashboard';
    fetchStatus().then(() => navigateTo(hash));

    // Handle hash changes
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.slice(1) || 'dashboard';
        fetchStatus().then(() => navigateTo(page));
    });

    // Poll status every 10 seconds
    setInterval(fetchStatus, 10000);
}

init();
