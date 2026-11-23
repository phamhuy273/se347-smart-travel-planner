import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach Access Token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Variables for Silent Refresh Queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle Global 401 with Silent Refresh
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Ignore non-401 or missing config
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error.response?.data || error);
    }

    // Do not attempt refresh on auth endpoints (login, register, refresh-token, logout)
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/logout');

    if (isAuthEndpoint || originalRequest._retry) {
      return Promise.reject(error.response?.data || error);
    }

    // If refresh is already in progress, enqueue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Gọi endpoint /auth/refresh-token (cookie HttpOnly refresh_token sẽ tự động gửi kèm nhờ withCredentials: true)
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

      processQueue(null, newAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');

      // Chuyển hướng về login nếu không ở các trang công khai
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/register', '/', '/verify-email', '/forgot-password'];
      if (!publicPaths.includes(currentPath)) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }

      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
