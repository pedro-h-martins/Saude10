import { API_BASE_URL, AUTH_ACCESS_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY } from '@/constants/config';
import * as SecureStore from 'expo-secure-store';

export type AuthResponse = {
  accessToken: string | null;
  refreshToken?: string | null;
  user?: any;
  offline?: boolean;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Login failed: ${res.status} ${text}`);
    }

    const data = await res.json();

    if (data.accessToken) {
      await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, data.accessToken);
    }
    if (data.refreshToken) {
      await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, data.refreshToken);
    }

    return {
      accessToken: data.accessToken ?? null,
      refreshToken: data.refreshToken ?? null,
      user: data.user ?? null,
    };
  } catch (e: any) {
    const isNetworkError = e && (e.message === 'Network request failed' || e.constructor.name === 'TypeError');
    if (isNetworkError) {
      console.warn('Network unavailable — creating offline session fallback.');
      
      const id = `offline-${email}`;
      const user = {
        _id: id,
        name: email.split('@')[0],
        email,
        birthDate: new Date(),
        weight: 0,
        height: 0,
        updatedAt: new Date(),
      };

      await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, 'offline-token');
      await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, 'offline-refresh');

      return { accessToken: 'offline-token', refreshToken: 'offline-refresh', user, offline: true };
    }

    throw e;
  }
}

export async function signOut(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY);
}

export async function getStoredTokens(): Promise<{ accessToken?: string | null; refreshToken?: string | null }> {
  const accessToken = await SecureStore.getItemAsync(AUTH_ACCESS_TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY);
  return { accessToken, refreshToken };
}

export async function refreshTokens(): Promise<AuthResponse> {
  const tokens = await getStoredTokens();
  if (!tokens.refreshToken) throw new Error('No refresh token available');

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Refresh failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (data.accessToken) {
    await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, data.accessToken);
  }
  if (data.refreshToken) {
    await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, data.refreshToken);
  }

  return {
    accessToken: data.accessToken ?? null,
    refreshToken: data.refreshToken ?? null,
    user: data.user ?? null,
  };
}

export async function fetchProfile(accessToken?: string | null): Promise<any> {
  if (!accessToken) throw new Error('No access token');
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Profile fetch failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function authFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const tokens = await getStoredTokens();
  let accessToken = tokens.accessToken;

  init = init ?? {};
  init.headers = { ...(init.headers || {}), 'Content-Type': 'application/json' } as any;

  if (accessToken) {
    (init.headers as any).Authorization = `Bearer ${accessToken}`;
  }

  let res = await fetch(input, init);
  if (res.status === 401) {
    try {
      const refreshed = await refreshTokens();
      accessToken = refreshed.accessToken ?? undefined;
      if (accessToken) {
        (init.headers as any).Authorization = `Bearer ${accessToken}`;
        res = await fetch(input, init);
      }
    } catch (e) {

      throw e;
    }
  }

  return res;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  birthDate: Date,
  weight: number,
  height: number
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, birthDate, weight, height }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Sign up failed: ${res.status} ${text}`);
    }

    const data = await res.json();

    if (data.accessToken) {
      await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, data.accessToken);
    }
    if (data.refreshToken) {
      await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, data.refreshToken);
    }

    return {
      accessToken: data.accessToken ?? null,
      refreshToken: data.refreshToken ?? null,
      user: data.user ?? null,
    };
  } catch (e: any) {
    const isNetworkError = e && (e.message === 'Network request failed' || e.constructor.name === 'TypeError');
    if (isNetworkError) {
      console.warn('Network unavailable — creating offline account fallback.');
      const id = `offline-${Date.now()}`;
      const user = {
        _id: id,
        name,
        email,
        birthDate,
        weight,
        height,
        updatedAt: new Date(),
      };

      await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, 'offline-token');
      await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, 'offline-refresh');

      return { accessToken: 'offline-token', refreshToken: 'offline-refresh', user, offline: true };
    }

    throw e;
  }
}

export async function signInDev(): Promise<AuthResponse> {
  const id = `dev-${Date.now()}`;
  const user = {
    _id: id,
    name: 'Demo User',
    email: `demo+${Date.now()}@example.com`,
    birthDate: new Date(),
    weight: 80,
    height: 180,
    updatedAt: new Date(),
  };

  await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, 'dev-token');
  await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, 'dev-refresh');

  return { accessToken: 'dev-token', refreshToken: 'dev-refresh', user };
}
