/**
 * API configuration — resolves base URL for all fetch calls.
 * In development: Vite proxy handles /api → localhost:3001
 * In production: reads VITE_API_URL env var, or falls back to same-origin
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
    const url = `${API_BASE}${path}`;
    if (import.meta.env.DEV) {
        console.log(`[API] Fetching: ${url}`);
    }
    return url;
}

export function wsUrl() {
    if (API_BASE && (API_BASE.startsWith('http') || API_BASE.startsWith('//'))) {
        const url = new URL(API_BASE.startsWith('//') ? window.location.protocol + API_BASE : API_BASE);
        const proto = url.protocol === 'https:' ? 'wss' : 'ws';
        return `${proto}://${url.host}/ws`;
    }
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}/ws`;
}
