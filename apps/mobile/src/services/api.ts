import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegistrationRecord } from '../types';

export const DEFAULT_SERVER_URL = 'https://uhv-cell-api.onrender.com/api/v1';

const STORAGE_KEYS = {
  TOKEN: '@uhv_scanner_token',
  REFRESH_TOKEN: '@uhv_scanner_refresh_token',
  USER: '@uhv_scanner_user',
  SERVER_URL: '@uhv_scanner_server_url',
};

export const normalizeServerUrl = (url?: string | null): string => {
  if (!url) return DEFAULT_SERVER_URL;
  let clean = url.trim().replace(/\/+$/, '');
  if (!clean) return DEFAULT_SERVER_URL;
  if (!clean.endsWith('/api/v1')) {
    clean = `${clean}/api/v1`;
  }
  return clean;
};

export const getServerUrl = async (): Promise<string> => {
  try {
    const url = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL);
    return normalizeServerUrl(url);
  } catch {
    return DEFAULT_SERVER_URL;
  }
};

export const setServerUrl = async (url: string): Promise<void> => {
  const cleanUrl = normalizeServerUrl(url);
  await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, cleanUrl);
};

export const getStoredAuth = async () => {
  try {
    const [token, refreshToken, userStr, serverUrl] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.USER),
      AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL),
    ]);
    return {
      token,
      refreshToken,
      user: userStr ? JSON.parse(userStr) : null,
      serverUrl: serverUrl || DEFAULT_SERVER_URL,
    };
  } catch {
    return { token: null, refreshToken: null, user: null, serverUrl: DEFAULT_SERVER_URL };
  }
};

export const saveStoredAuth = async (token: string, user: any, refreshToken?: string) => {
  const items: [string, string][] = [
    [STORAGE_KEYS.TOKEN, token],
    [STORAGE_KEYS.USER, JSON.stringify(user)],
  ];
  if (refreshToken) {
    items.push([STORAGE_KEYS.REFRESH_TOKEN, refreshToken]);
  }
  await AsyncStorage.multiSet(items);
};

export const clearStoredAuth = async () => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
  ]);
};

// Response Interceptor: Token Refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Configured Axios Client Factory with Auto-Refresh
export const getApiClient = async () => {
  const baseURL = await getServerUrl();
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  client.interceptors.response.use(
    (response) => {
      // Backend TransformInterceptor wraps responses in { success: true, data: ... }
      if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
        return { ...response, data: response.data.data };
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return axios(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshRes = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          const payload = refreshRes.data?.data || refreshRes.data;
          const newAccessToken = payload?.tokens?.accessToken || payload?.accessToken;
          const newRefreshToken = payload?.tokens?.refreshToken || payload?.refreshToken;

          if (newAccessToken) {
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newAccessToken);
            if (newRefreshToken) {
              await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            }
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            processQueue(null, newAccessToken);
            return axios(originalRequest);
          } else {
            throw new Error('No access token returned from refresh');
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
};

// API Methods
export const api = {
  login: async (email: string, password: string) => {
    const client = await getApiClient();
    const res = await client.post('/auth/login', { email: email.trim(), password });
    return res.data;
  },

  verifyTicket: async (regId: string): Promise<RegistrationRecord> => {
    const client = await getApiClient();
    const cleanId = encodeURIComponent(regId.trim());
    const res = await client.get(`/events/registrations/verify/${cleanId}`);
    return res.data;
  },

  checkIn: async (
    regId: string,
    options?: { memberIndex?: number; memberName?: string; admitAll?: boolean },
  ): Promise<RegistrationRecord> => {
    const client = await getApiClient();
    const cleanId = encodeURIComponent(regId.trim());
    const res = await client.patch(`/events/registrations/${cleanId}/check-in`, options || {});
    return res.data;
  },

  spotPayment: async (
    regId: string,
    paymentMethod: 'CASH' | 'UPI' = 'CASH',
    reference?: string,
    options?: { memberIndex?: number; admitAll?: boolean },
  ): Promise<RegistrationRecord> => {
    const client = await getApiClient();
    const cleanId = encodeURIComponent(regId.trim());
    const res = await client.patch(`/events/registrations/${cleanId}/spot-payment`, {
      paymentMethod,
      reference,
      memberIndex: options?.memberIndex,
      admitAll: options?.admitAll,
    });
    return res.data;
  },

  verifyPayment: async (regId: string): Promise<RegistrationRecord> => {
    const client = await getApiClient();
    const cleanId = encodeURIComponent(regId.trim());
    const res = await client.patch(`/events/registrations/${cleanId}/verify-payment`, { status: 'VERIFIED' });
    return res.data;
  },

  rejectRegistration: async (regId: string): Promise<RegistrationRecord> => {
    const client = await getApiClient();
    const cleanId = encodeURIComponent(regId.trim());
    const res = await client.patch(`/events/registrations/${cleanId}`, { status: 'REJECTED' });
    return res.data;
  },
};
