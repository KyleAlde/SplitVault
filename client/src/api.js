const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('splitvault_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The request failed');
  return body;
}

export const login = (email, password) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

export const getPools = () => request('/pools');
export const getDashboard = (poolId) => request(`/pools/${poolId}/dashboard`);
export const getClaims = (poolId) => request(`/pools/${poolId}/claims`);
export const getCategories = (poolId) => request(`/pools/${poolId}/categories`);
export const createClaim = (poolId, claim) => request(`/pools/${poolId}/claims`, {
  method: 'POST',
  body: JSON.stringify(claim),
});

export function saveSession(session) {
  localStorage.setItem('splitvault_token', session.token);
  localStorage.setItem('splitvault_user', JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem('splitvault_token');
  localStorage.removeItem('splitvault_user');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('splitvault_user')) || null;
  } catch {
    return null;
  }
}
