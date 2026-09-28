const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function getAssetUrl(filePath) {
  if (!filePath) return '';
  const baseUrl = new URL(API_BASE_URL, window.location.origin);
  const assetUrl = new URL(filePath, baseUrl.origin);
  return ['http:', 'https:'].includes(assetUrl.protocol) ? assetUrl.toString() : '';
}

export async function apiRequest(path, { token, method = 'GET', body } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}