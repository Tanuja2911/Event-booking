import axios from 'axios';
import { reactive, watch } from 'vue';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
export const authState = reactive({
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isAdmin: false,
  loading: true,
});
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
if (authState.accessToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${authState.accessToken}`;
}
apiClient.interceptors.request.use(
  (config) => {
    if (authState.accessToken) {
      config.headers['Authorization'] = `Bearer ${authState.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === 'users/login/' || originalRequest.url === 'users/token/refresh/') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refresh = authState.refreshToken;
      if (!refresh) {
        logout();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}users/token/refresh/`, {
          refresh: refresh,
        });

        const newAccessToken = response.data.access;
        setTokens(newAccessToken, refresh);

        isRefreshing = false;
        processQueue(null, newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        logout();
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
export function setTokens(access, refresh) {
  authState.accessToken = access;
  authState.refreshToken = refresh;
  authState.isAuthenticated = true;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
}

export function logout() {
  authState.accessToken = null;
  authState.refreshToken = null;
  authState.isAuthenticated = false;
  authState.user = null;
  authState.isAdmin = false;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  delete apiClient.defaults.headers.common['Authorization'];
}

export async function fetchProfile() {
  if (!authState.isAuthenticated) {
    authState.loading = false;
    return null;
  }
  try {
    const response = await apiClient.get('users/profile/');
    authState.user = response.data;
    authState.isAdmin = !!response.data.is_staff;
    return response.data;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    logout();
    return null;
  } finally {
    authState.loading = false;
  }
}
if (authState.isAuthenticated) {
  fetchProfile();
} else {
  authState.loading = false;
}
