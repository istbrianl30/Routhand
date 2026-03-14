/**
 * API configuration — resolves base URL for all fetch calls.
 * In development: Vite proxy handles /api → localhost:3001
 * In production: reads VITE_API_URL env var, or falls back to same-origin
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
    return `${API_BASE}${path}`;
}

export function wsUrl() {
    const base = API_BASE || window.location.origin;
    const url = new URL(base);
    const proto = url.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${url.host}/ws`;
}
