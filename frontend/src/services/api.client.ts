import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const AUTH_SESSION_EVENT = 'auth:session-changed';

export function getSafeRedirect(rawRedirect: unknown): string {
  if (typeof rawRedirect !== 'string') return '/dashboard';
  if (
    !rawRedirect.startsWith('/') ||
    rawRedirect.startsWith('//') ||
    rawRedirect.includes('\\')
  ) {
    return '/dashboard';
  }
  return rawRedirect;
}

const PUBLIC_AUTH_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/refresh-token',
  '/auth/logout',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/verify-otp',
  '/auth/reset-password',
]);

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

function unwrapApiError(error: any) {
  return error?.response?.data || error;
}

function getBearerToken(headers: any): string | null {
  if (!headers) return null;
  const raw =
    typeof headers.get === 'function'
      ? headers.get('Authorization') || headers.get('authorization')
      : headers.Authorization || headers.authorization;
  if (typeof raw !== 'string') return null;
  return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
}

function setAuthorizationHeader(config: any, token: string) {
  if (typeof config.headers?.set === 'function') {
    config.headers.set('Authorization', `Bearer ${token}`);
  } else {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
}

function normalizeEndpointPath(url?: string, reqBaseURL?: string): string {
  if (!url) return '';
  try {
    const rawBase = reqBaseURL || baseURL || 'http://localhost';
    const absoluteBase = rawBase.startsWith('http')
      ? rawBase
      : `http://localhost${rawBase.startsWith('/') ? '' : '/'}${rawBase}`;
    const baseWithSlash = absoluteBase.endsWith('/') ? absoluteBase : `${absoluteBase}/`;
    const basePath = new URL(absoluteBase).pathname.replace(/\/+$/, '');
    let pathname = new URL(url, baseWithSlash).pathname;

    if (basePath && pathname.startsWith(basePath)) {
      pathname = pathname.slice(basePath.length);
    }
    if (!pathname.startsWith('/')) pathname = `/${pathname}`;
    return pathname.replace(/\/+$/, '') || '/';
  } catch {
    return '';
  }
}

function isPublicAuthEndpoint(url?: string, reqBaseURL?: string): boolean {
  return PUBLIC_AUTH_PATHS.has(normalizeEndpointPath(url, reqBaseURL));
}

function readStoredUser() {
  const raw = localStorage.getItem('user_info');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function dispatchSessionChanged(token: string | null, user: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(AUTH_SESSION_EVENT, {
        detail: { token, user },
      }),
    );
  }
}

function clearSessionAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_info');
  dispatchSessionChanged(null, null);

  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;
  const normalizedPath =
    currentPath.length > 1 ? currentPath.replace(/\/+$/, '') : currentPath;
  const publicPaths = ['/login', '/register', '/', '/verify-email', '/forgot-password'];
  if (!publicPaths.includes(normalizedPath)) {
    const currentTarget = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/login?redirect=${encodeURIComponent(getSafeRedirect(currentTarget))}`;
  }
}

// Request Interceptor: Attach Access Token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setAuthorizationHeader(config, token);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let refreshPromise: Promise<string> | null = null;

export function withAuthLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && typeof navigator.locks?.request === 'function') {
    return navigator.locks.request('auth-refresh', () => task());
  }
  return task();
}

async function performRefresh(usedToken: string | null): Promise<string> {
  const runRefresh = async (): Promise<string> => {
    const currentToken = localStorage.getItem('access_token');

    if (!currentToken) {
      clearSessionAndRedirect();
      throw new Error('Phiên đăng nhập đã hết hạn');
    }

    if (usedToken && currentToken !== usedToken) {
      dispatchSessionChanged(currentToken, readStoredUser());
      return currentToken;
    }

    try {
      // Gọi endpoint /auth/refresh-token (cookie HttpOnly refresh_token tự động gửi kèm nhờ withCredentials: true)
      const refreshResponse = await axios.post(
        `${baseURL}/auth/refresh-token`,
        {},
        { withCredentials: true },
      );

      const resData = refreshResponse.data?.data || refreshResponse.data;
      const newAccessToken = resData?.accessToken;

      if (!newAccessToken) {
        throw new Error('Không nhận được Access Token mới');
      }

      localStorage.setItem('access_token', newAccessToken);
      if (resData.user) {
        localStorage.setItem('user_info', JSON.stringify(resData.user));
      }
      dispatchSessionChanged(newAccessToken, resData.user ?? readStoredUser());

      return newAccessToken;
    } catch (refreshErr: any) {
      const status = refreshErr?.response?.status;
      if (status === 401 || status === 403) {
        clearSessionAndRedirect();
      }
      throw refreshErr;
    }
  };

  return withAuthLock(runRefresh);
}

// Response Interceptor: Handle Global 401 with Silent Refresh
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Ignore non-401 or missing config
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(unwrapApiError(error));
    }

    if (
      isPublicAuthEndpoint(originalRequest.url, originalRequest.baseURL) ||
      originalRequest._retry
    ) {
      return Promise.reject(unwrapApiError(error));
    }

    originalRequest._retry = true;
    const usedToken = getBearerToken(originalRequest.headers);

    if (!refreshPromise) {
      refreshPromise = performRefresh(usedToken).finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const newAccessToken = await refreshPromise;
      setAuthorizationHeader(originalRequest, newAccessToken);
      return apiClient(originalRequest);
    } catch (refreshErr) {
      return Promise.reject(unwrapApiError(refreshErr));
    }
  },
);

export default apiClient;
