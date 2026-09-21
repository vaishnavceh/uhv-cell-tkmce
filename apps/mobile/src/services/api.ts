import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegistrationRecord } from '../types';

export const DEFAULT_SERVER_URL = 'https://uhv-cell-api.onrender.com/api/v1';

const STORAGE_KEYS = {
  TOKEN: '@uhv_scanner_token',
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
    const [token, userStr, serverUrl] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.USER),
      AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL),
    ]);
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
      serverUrl: serverUrl || DEFAULT_SERVER_URL,
    };
  } catch {
    return { token: null, user: null, serverUrl: DEFAULT_SERVER_URL };
  }
};

export const saveStoredAuth = async (token: string, user: any) => {
  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
    AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
  ]);
};

export const clearStoredAuth = async () => {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
    AsyncStorage.removeItem(STORAGE_KEYS.USER),
  ]);
};

// Configured Axios Client Factory
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
    (error) => Promise.reject(error),
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
    const res = await client.get(`/events/registrations/verify/${regId.trim()}`);
    return res.data;
  },

  checkIn: async (
    regId: string,
    options?: { memberIndex?: number; memberName?: string; admitAll?: boolean },
  ): Promise<RegistrationRecord> => {
    const client = await getApiClient();
    const res = await client.patch(`/events/registrations/${regId.trim()}/check-in`, options || {});
    return res.data;
  },

  spotPayment: async (
    regId: string,
    paymentMethod: 'CASH' | 'UPI' = 'CASH',
    reference?: string,
    options?: { memberIndex?: number; admitAll?: boolean },
  ): Promise<RegistrationRecord> => {
    const client = await getApiClient();
    const res = await client.patch(`/events/registrations/${regId.trim()}/spot-payment`, {
      paymentMethod,
      reference,
      memberIndex: options?.memberIndex,
      admitAll: options?.admitAll,
    });
    return res.data;
  },

  verifyPayment: async (regId: string): Promise<RegistrationRecord> => {
    const client = await getApiClient();
    const res = await client.patch(`/events/registrations/${regId.trim()}/verify-payment`, { status: 'VERIFIED' });
    return res.data;
  },

  rejectRegistration: async (regId: string): Promise<RegistrationRecord> => {
    const client = await getApiClient();
    const res = await client.patch(`/events/registrations/${regId.trim()}`, { status: 'REJECTED' });
    return res.data;
  },
};
