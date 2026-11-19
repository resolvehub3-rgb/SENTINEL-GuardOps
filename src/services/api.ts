import type { AuthUser, UserRole } from '../types/guardops';

const TOKEN_STORAGE_KEY = 'guardops_auth_token';

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage restriction
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // ignore non-json error
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ user: AuthUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  portalLogin: (role: UserRole) =>
    apiRequest<{ user: AuthUser; token: string }>('/api/auth/portal', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  registerCompany: (payload: {
    companyName: string;
    contactName: string;
    email: string;
    password: string;
    phone?: string;
  }) =>
    apiRequest<{ user: AuthUser; token: string }>('/api/auth/register-company', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: async () => {
    const res = await apiRequest<{ authenticated: boolean; user: AuthUser | null }>('/api/auth/session');
    if (!res.authenticated || !res.user) {
      throw new Error('Not authenticated');
    }
    return { user: res.user };
  },
  logout: () => apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
};
