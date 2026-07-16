import { request, setToken, setUser, removeToken, getToken } from './client';
import type {
  User, ApiResponse, AuthResponse,
  LoginPayload, RegisterPayload,
  RequestOtpPayload, VerifyOtpPayload,
} from './types';

/**
 * Backend may return either:
 *   { success, message, data: { user, token, ... } }
 * or a flattened:
 *   { success, message, token, user, ... }
 *
 * Normalize both into ApiResponse<AuthResponse>.
 */
function normalizeAuth(res: any): ApiResponse<AuthResponse> {
  const data = res?.data ?? res ?? {};
  const user = data.user ?? res?.user;
  const token = data.token ?? res?.token;
  const isNew = data.isNew ?? res?.isNew;
  const requiresOtp = data.requiresOtp ?? res?.requiresOtp;
  const email = data.email ?? res?.email;
  return {
    success: res?.success ?? true,
    message: res?.message,
    data: { user, token, isNew, requiresOtp, email, message: res?.message },
  };
}

async function postAuth(path: string, body: any): Promise<ApiResponse<AuthResponse>> {
  const raw = await request<any>(path, { method: 'POST', body: JSON.stringify(body) });
  const res = normalizeAuth(raw);
  if (res.data?.token) setToken(res.data.token);
  if (res.data?.user) setUser(res.data.user);
  return res;
}

export const auth = {
  signup: (body: RegisterPayload) => postAuth('/auth/register', body),

  login: (body: LoginPayload | { email?: string; phone?: string; emailOrPhone?: string; password: string }) => {
    const emailOrPhone =
      (body as any).emailOrPhone ?? (body as any).email ?? (body as any).phone ?? '';
    return postAuth('/auth/login', { emailOrPhone, password: body.password });
  },

  /** Verify OTP after registration. */
  verifyRegisterOtp: (body: VerifyOtpPayload) =>
    postAuth('/auth/register/verify-otp', body),

  /** Resend registration OTP. Rate-limited to 60s. */
  resendRegisterOtp: (body: RequestOtpPayload) =>
    request<ApiResponse<{ ok?: boolean }>>('/auth/register/resend-otp', {
      method: 'POST', body: JSON.stringify(body),
    }),

  /** Step 1: request a 6-digit OTP via email. */
  requestEmailOtp: (body: RequestOtpPayload) =>
    request<ApiResponse<{ ok?: boolean }>>('/auth/login/email/request-otp', {
      method: 'POST', body: JSON.stringify(body),
    }),

  /** Step 2: verify OTP and receive token + user. */
  verifyEmailOtp: (body: VerifyOtpPayload) =>
    postAuth('/auth/login/email/verify-otp', body),

  /** Google OAuth — accepts either idToken or credential field name. */
  google: (idToken: string) =>
    postAuth('/auth/oauth/google', { idToken, credential: idToken }),

  logout: async () => {
    if (getToken()) {
      try { await request('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    }
    removeToken();
  },

  me: async () => {
    const raw = await request<any>('/auth/me');
    const data = raw?.data ?? raw ?? {};
    const user: User = data.user ?? raw?.user;
    return { success: raw?.success ?? true, message: raw?.message, data: { user } } as ApiResponse<{ user: User }>;
  },

  /** Try to mint a new token from the existing one. */
  refresh: async () => {
    const raw = await request<any>('/auth/refresh', { method: 'POST' });
    const res = normalizeAuth(raw);
    // Silent token replacement: firing `saba:auth` here re-enters AuthProvider.refresh()
    // and can create an infinite update loop when the backend rotates tokens.
    if (res.data?.token) setToken(res.data.token, false);
    if (res.data?.user) setUser(res.data.user);
    return res;
  },

  forgot: (email: string) =>
    request<ApiResponse<{ ok: boolean }>>('/auth/forgot-password', {
      method: 'POST', body: JSON.stringify({ email }),
    }),

  reset: (token: string, password: string) =>
    request('/auth/reset-password', {
      method: 'POST', body: JSON.stringify({ token, password }),
    }),
};
