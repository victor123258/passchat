/**
 * Server and WebSocket configuration.
 * Supports running as a unified full-stack server OR static on GitHub Pages
 * connecting to a deployed backend.
 */

export function getApiBaseUrl(): string {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) return envApi.replace(/\/$/, '');

  const custom = localStorage.getItem('passchat_server_api_url');
  if (custom) return custom.replace(/\/$/, '');

  return '';
}

export function getWebSocketUrl(): string {
  const envWs = import.meta.env.VITE_WS_URL;
  if (envWs) return envWs;

  const custom = localStorage.getItem('passchat_server_ws_url');
  if (custom) return custom;

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  return 'ws://localhost:3000/ws';
}

export function setCustomBackend(backendUrl: string) {
  if (!backendUrl.trim()) {
    localStorage.removeItem('passchat_server_api_url');
    localStorage.removeItem('passchat_server_ws_url');
    return;
  }

  let clean = backendUrl.trim().replace(/\/$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('ws://') && !clean.startsWith('wss://')) {
    clean = 'https://' + clean;
  }

  const httpUrl = clean.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
  const wsUrl = (clean.startsWith('https://') || clean.startsWith('wss://') ? 'wss://' : 'ws://') +
    httpUrl.replace(/^https?:\/\//, '').replace(/\/ws$/, '') + '/ws';

  localStorage.setItem('passchat_server_api_url', httpUrl);
  localStorage.setItem('passchat_server_ws_url', wsUrl);
}
