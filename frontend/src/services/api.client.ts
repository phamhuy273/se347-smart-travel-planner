import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const AUTH_SESSION_EVENT = 'auth:session-changed';
const AUTH_REQUEST_TIMEOUT_MS = 10_000;

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

// Single source of truth for auth session (in-memory only; never stored in Web Storage)
let accessToken: string | null = null;
let currentUser: Record<string, any> | null = null;
let isGuestSession = false;
let sessionClearedCount = 0;
let isSwitchingUser = false;
let refreshPromise: Promise<string> | null = null;

function clearLegacyAuthStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.removeItem('access_token');
    window.localStorage?.removeItem('user_info');
  } catch {
    // Ignore storage errors in restricted environments
  }
}

clearLegacyAuthStorage();

export function getAccessToken(): string | null {
  return accessToken;
}

export function getSessionUser<T = Record<string, any>>(): T | null {
  return (currentUser as T) ?? null;
}

export function hasActiveSession(): boolean {
  return !!accessToken;
}

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

function dispatchSessionChanged(token: string | null, user: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(AUTH_SESSION_EVENT, {
        detail: { token, user },
      }),
    );
  }
}

export function setAuthSession(token: string, user: Record<string, any> | null) {
  accessToken = token;
  currentUser = user;
  isGuestSession = false;
  isSwitchingUser = false;
  refreshPromise = null;
  dispatchSessionChanged(accessToken, currentUser);
}

export function setSessionUser(user: Record<string, any> | null) {
  currentUser = user;
  dispatchSessionChanged(accessToken, currentUser);
}

function clearLocalSession(options: { markGuest?: boolean } = {}) {
  accessToken = null;
  currentUser = null;
  isSwitchingUser = false;
  refreshPromise = null;
  if (options.markGuest) {
    isGuestSession = true;
  }
  sessionClearedCount += 1;
  dispatchSessionChanged(null, null);
}

function isPublicPagePath(pathname: string): boolean {
  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname || '/';
  const publicPaths = ['/login', '/register', '/', '/verify-email', '/forgot-password'];
  return publicPaths.includes(normalizedPath);
}

function clearSessionAndRedirect() {
  clearLocalSession({ markGuest: true });

  if (typeof window === 'undefined') return;

  if (!isPublicPagePath(window.location.pathname)) {
    const currentTarget = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/login?redirect=${encodeURIComponent(getSafeRedirect(currentTarget))}`;
  }
}

function createAuthChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel !== 'function') return null;
  try {
    return new BroadcastChannel('auth');
  } catch {
    return null;
  }
}

const authChannel = createAuthChannel();

if (authChannel) {
  authChannel.onmessage = (event: MessageEvent) => {
    if (event.data?.type === 'logout') {
      clearSessionAndRedirect();
    }
  };
}

function broadcastLogout() {
  try {
    if (authChannel) {
      authChannel.postMessage({ type: 'logout' });
    } else if (typeof BroadcastChannel === 'function') {
      const channel = new BroadcastChannel('auth');
      channel.postMessage({ type: 'logout' });
      channel.close();
    }
  } catch {
    // Ignore BroadcastChannel errors
  }
}

// Request Interceptor: Attach Access Token from module memory
apiClient.interceptors.request.use(
  (config) => {
    (config as any)._sessionCount = sessionClearedCount;
    if (accessToken) {
      setAuthorizationHeader(config, accessToken);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export function withAuthLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && typeof navigator.locks?.request === 'function') {
    return navigator.locks.request('auth-refresh', () => task());
  }
  return task();
}

interface RefreshOptions {
  redirectOnAuthFailure: boolean;
  clearedCountAtStart: number;
}

async function performRefresh(
  usedToken: string | null,
  options: RefreshOptions,
): Promise<string> {
  const runRefresh = async (): Promise<string> => {
    if (isSwitchingUser) {
      throw new Error('Phiên đăng nhập đang chuyển tài khoản');
    }

    if (sessionClearedCount !== options.clearedCountAtStart) {
      throw new Error('Phiên đăng nhập đã hết hạn');
    }

    if (accessToken && accessToken !== usedToken) {
      return accessToken;
    }

    // Empty token because the tab logged out/cleared session (vs initial bootstrap where usedToken === null && !isGuestSession)
    if (!accessToken && (usedToken !== null || isGuestSession)) {
      throw new Error('Phiên đăng nhập đã hết hạn');
    }

    try {
      // Gọi endpoint /auth/refresh-token (cookie HttpOnly refresh_token tự động gửi kèm nhờ withCredentials: true)
      const refreshResponse = await axios.post(
        `${baseURL}/auth/refresh-token`,
        {},
        { withCredentials: true, timeout: AUTH_REQUEST_TIMEOUT_MS },
      );

      if (sessionClearedCount !== options.clearedCountAtStart) {
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      const resData = refreshResponse.data?.data || refreshResponse.data;
      const newAccessToken = resData?.accessToken;

      if (!newAccessToken) {
        throw new Error('Không nhận được Access Token mới');
      }

      const previousUserId = currentUser?.id != null ? String(currentUser.id) : null;
      const nextUser = resData?.user ?? currentUser;
      const nextUserId = nextUser?.id != null ? String(nextUser.id) : null;
      const isUserSwitched = Boolean(
        previousUserId && nextUserId && previousUserId !== nextUserId,
      );

      accessToken = newAccessToken;
      currentUser = nextUser;
      isGuestSession = false;
      dispatchSessionChanged(accessToken, currentUser);

      if (isUserSwitched) {
        isSwitchingUser = true;
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
        const switchErr: any = new Error('Phiên đăng nhập đã chuyển sang tài khoản khác');
        switchErr.__userSwitched = true;
        throw switchErr;
      }

      return newAccessToken;
    } catch (refreshErr: any) {
      if (!refreshErr?.__userSwitched) {
        const status = refreshErr?.response?.status;
        if (status === 401 || status === 403) {
          if (options.redirectOnAuthFailure) {
            clearSessionAndRedirect();
          } else {
            clearLocalSession({ markGuest: true });
          }
        }
      }
      throw refreshErr;
    }
  };

  return withAuthLock(runRefresh);
}

export async function ensureSession(): Promise<boolean> {
  if (isSwitchingUser) return false;
  if (accessToken) return true;
  if (isGuestSession) return false;

  const clearedCountAtStart = sessionClearedCount;
  if (!refreshPromise) {
    const nextRefreshPromise = performRefresh(null, {
      redirectOnAuthFailure: false,
      clearedCountAtStart,
    }).finally(() => {
      if (refreshPromise === nextRefreshPromise) {
        refreshPromise = null;
      }
    });
    refreshPromise = nextRefreshPromise;
  }

  try {
    await refreshPromise;
    return !!accessToken && !isSwitchingUser;
  } catch {
    return false;
  }
}

export async function logoutSession(): Promise<void> {
  let cleared = false;
  try {
    await withAuthLock(async () => {
      try {
        await apiClient.post('/auth/logout', {}, { timeout: AUTH_REQUEST_TIMEOUT_MS });
      } catch {
        // Swallowed: even if server is offline or times out, client clears credentials
      } finally {
        clearLocalSession({ markGuest: true });
        cleared = true;
      }
    });
  } catch {
    if (!cleared) {
      clearLocalSession({ markGuest: true });
    }
  } finally {
    broadcastLogout();
  }
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
    const clearedCountAtStart =
      (originalRequest as any)._sessionCount ?? sessionClearedCount;

    if (!refreshPromise) {
      const nextRefreshPromise = performRefresh(usedToken, {
        redirectOnAuthFailure: true,
        clearedCountAtStart,
      }).finally(() => {
        if (refreshPromise === nextRefreshPromise) {
          refreshPromise = null;
        }
      });
      refreshPromise = nextRefreshPromise;
    }

    try {
      const newAccessToken = await refreshPromise;
      if (
        isSwitchingUser ||
        sessionClearedCount !== clearedCountAtStart ||
        !accessToken
      ) {
        return Promise.reject(unwrapApiError(new Error('Phiên đăng nhập đã hết hạn')));
      }
      setAuthorizationHeader(originalRequest, newAccessToken);
      return apiClient(originalRequest);
    } catch (refreshErr) {
      return Promise.reject(unwrapApiError(refreshErr));
    }
  },
);

export default apiClient;
