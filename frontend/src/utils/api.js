
export const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // Si 401 Unauthorized, déconnecter l'utilisateur
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expirée');
  }

  return response;
}