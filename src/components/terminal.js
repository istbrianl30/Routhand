/**
 * Terminal component wrapping xterm.js
 */
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { wsUrl } from '../api.js';

let terminal = null;
let fitAddon = null;
let ws = null;

const THEME = {
    background: '#0a0e1a',
    foreground: '#e2e8f0',
    cursor: '#6366f1',
    cursorAccent: '#0a0e1a',
    selectionBackground: 'rgba(99, 102, 241, 0.3)',
    black: '#1e293b',
    red: '#ef4444',
    green: '#10b981',
    yellow: '#f59e0b',
    blue: '#3b82f6',
    magenta: '#a855f7',
    cyan: '#06b6d4',
    white: '#f1f5f9',
    brightBlack: '#475569',
    brightRed: '#f87171',
    brightGreen: '#34d399',
    brightYellow: '#fbbf24',
    brightBlue: '#60a5fa',
    brightMagenta: '#c084fc',
    brightCyan: '#22d3ee',
    brightWhite: '#ffffff'
};

export function createTerminal(container) {
    // Clean up previous
    destroyTerminal();

    terminal = new Terminal({
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 14,
        lineHeight: 1.4,
        cursorBlink: true,
        cursorStyle: 'bar',
        theme: THEME,
        allowTransparency: true,
        scrollback: 5000
    });

    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(container);

    // Small delay to ensure the container is measured
    setTimeout(() => {
        fitAddon.fit();
    }, 100);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
        if (fitAddon) {
            fitAddon.fit();
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }));
            }
        }
    });
    resizeObserver.observe(container);

    return terminal;
}

export function connectTerminalWS() {
    if (!terminal) return;

    ws = new WebSocket(wsUrl());

    ws.onopen = () => {
        terminal.writeln('\x1b[32m● Connected to terminal\x1b[0m\r\n');
        // Send initial size
        ws.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }));
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'data') {
                terminal.write(msg.data);
            } else if (msg.type === 'error') {
                terminal.writeln(`\x1b[31m✗ ${msg.data}\x1b[0m`);
            }
        } catch {
            terminal.write(event.data);
        }
    };

    ws.onclose = () => {
        terminal.writeln('\r\n\x1b[33m● Connection closed\x1b[0m');
    };

    ws.onerror = () => {
        terminal.writeln('\r\n\x1b[31m✗ WebSocket error\x1b[0m');
    };

    // Send user input to server
    terminal.onData((data) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'input', data }));
        }
    });
}

export function destroyTerminal() {
    if (ws) {
        ws.close();
        ws = null;
    }
    if (terminal) {
        terminal.dispose();
        terminal = null;
    }
    fitAddon = null;
}
