// In development, Vite proxies /api/* to http://localhost:5000
// In production, VITE_API_URL should be set to your deployed backend URL
const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = rawApiUrl && rawApiUrl.length > 0
  ? rawApiUrl.replace(/\/+$/, '')
  : ''; // Empty string = use Vite proxy (relative paths like /api/...)

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};