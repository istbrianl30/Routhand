/**
 * Terminal page — full-screen interactive terminal
 */
import { createTerminal, connectTerminalWS, destroyTerminal } from '../components/terminal.js';

export function renderTerminal(container, state) {
    if (!state.connected) {
        container.innerHTML = `
      <div class="animate-in">
        <div class="page-header">
          <h1 class="page-title">Terminal</h1>
          <p class="page-subtitle">Interactive SSH terminal</p>
        </div>
        <div class="card">
          <div class="empty-state">
            <span class="empty-state-icon">🔌</span>
            <span class="empty-state-text">Connect to a router first to use the interactive terminal</span>
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
      <div class="page-header" style="margin-bottom:var(--space-md)">
        <h1 class="page-title">Terminal</h1>
        <p class="page-subtitle">Interactive SSH session to ${state.host}</p>
      </div>
      <div class="terminal-container" id="terminal-mount"></div>
    </div>
  `;

    const termContainer = document.getElementById('terminal-mount');
    createTerminal(termContainer);
    connectTerminalWS();
}

export function cleanupTerminal() {
    destroyTerminal();
}
