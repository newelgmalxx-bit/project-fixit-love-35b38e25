// Base URL for the public Beauty Booking API.
// Used by the merchant dashboard and admin panel to reach backend endpoints.
export const API_BASE_URL = "https://koswmat.com";
export const API_PREFIX = `${API_BASE_URL}/api`;

export function apiUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${API_PREFIX}${clean}`;
}
