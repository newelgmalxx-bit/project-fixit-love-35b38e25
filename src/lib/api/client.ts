const BASE = 'https://koswmat.com/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('saba_token');
}
function setToken(t: string, notify = true) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('saba_token', t);
  if (notify) window.dispatchEvent(new Event('saba:auth'));
}
function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('saba_token');
  localStorage.removeItem('saba_user');
  window.dispatchEvent(new Event('saba:auth'));
}
function getUser(): any {
  if (typeof window === 'undefined') return null;
  const d = localStorage.getItem('saba_user');
  return d ? JSON.parse(d) : null;
}
function setUser(u: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('saba_user', JSON.stringify(u));
}

function getSid(): string {
  if (typeof window === 'undefined') return '';
  let s = localStorage.getItem('saba_sid');
  if (!s) { s = crypto.randomUUID(); localStorage.setItem('saba_sid', s); }
  return s;
}

function getLang(): string {
  if (typeof document === 'undefined') return 'ar';
  return document.documentElement.lang || 'ar';
}

class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;
  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Accept-Language': getLang(),
    ...((opts.headers as Record<string, string>) || {}),
  };

  if (!(opts.body instanceof FormData) && opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (path.includes('/cart') && !token) {
    headers['X-Session-Id'] = getSid();
  }

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  let json: any = null;
  try { json = await res.json(); } catch { /* ignore */ }

  if (!res.ok || (json && json.success === false)) {
    // Note: do NOT auto-remove the token on 401 here — the auth layer
    // tries /auth/refresh once before deciding the session is dead.
    throw new ApiError(res.status, json?.message || `Request failed (${res.status})`, json?.errors);
  }

  return json as T;
}

export { request, ApiError, getToken, setToken, removeToken, getUser, setUser, getSid, getLang, BASE };