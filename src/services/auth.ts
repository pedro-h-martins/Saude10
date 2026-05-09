import { getApp } from '@react-native-firebase/app';
import { signOut as authSignOut, createUserWithEmailAndPassword, EmailAuthProvider, getAuth, getIdToken, reauthenticateWithCredential, signInWithEmailAndPassword, updatePassword, updateProfile } from '@react-native-firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { AUTH_ACCESS_TOKEN_KEY as ACCESS_TOKEN_KEY, API_BASE_URL, AUTH_PENDING_PWD_CHANGE_KEY, AUTH_REFRESH_TOKEN_KEY as REFRESH_TOKEN_KEY } from '../constants/config';

export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

function getFirebaseAuth() {
  return getAuth(getApp());
}

export async function login(email: string, password: string) {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = result.user;
  const accessToken = await getIdToken(firebaseUser);
  await storeTokens({ accessToken, refreshToken: null });

  return {
    user: {
      _id: firebaseUser.uid,
      name: firebaseUser.displayName ?? email,
      email: firebaseUser.email ?? email,
      birthDate: new Date(),
      weight: 0,
      height: 0,
    },
  };
}

export async function signUp(name: string, email: string, password: string, birthDate: Date, weight: number, height: number) {
  const auth = getFirebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = result.user;

  if (firebaseUser.displayName !== name) {
    await updateProfile(firebaseUser, { displayName: name });
  }

  const accessToken = await getIdToken(firebaseUser);
  await storeTokens({ accessToken, refreshToken: null });

  return {
    user: {
      _id: firebaseUser.uid,
      name,
      email: firebaseUser.email ?? email,
      birthDate,
      weight,
      height,
    },
  };
}

export async function signOut() {
  const auth = getFirebaseAuth();
  await authSignOut(auth);
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => null);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => null);
}

export async function signInDev() {
  return {
    user: {
      _id: 'dev-user',
      name: 'Developer',
      email: 'dev@example.com',
      birthDate: new Date(),
      weight: 70,
      height: 170,
    },
  };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user || !user.email) {
    throw new Error('Usuário não autenticado');
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
  return { success: true };
}

export async function getStoredTokens(): Promise<StoredTokens> {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY).catch(() => null);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null);
  return {
    accessToken,
    refreshToken,
  };
}

export async function refreshTokens(): Promise<StoredTokens> {
  const firebaseUser = getFirebaseAuth().currentUser;

  if (!firebaseUser) {
    return { accessToken: null, refreshToken: null };
  }

  const accessToken = await getIdToken(firebaseUser, true);
  await storeTokens({ accessToken, refreshToken: null });

  return {
    accessToken,
    refreshToken: null,
  };
}

export async function fetchProfile(accessToken: string | null) {
  const firebaseUser = getFirebaseAuth().currentUser;
  if (!firebaseUser) {
    return null;
  }

  return {
    _id: firebaseUser.uid,
    name: firebaseUser.displayName ?? firebaseUser.email ?? 'User',
    email: firebaseUser.email ?? '',
    birthDate: new Date(),
    weight: 0,
    height: 0,
  };
}

async function storeTokens(tokens: StoredTokens) {
  if (tokens.accessToken) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken).catch(() => null);
  }
  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken).catch(() => null);
  }
}

type PendingPwdPayload = { currentPassword: string; newPassword: string; queuedAt: string };

async function savePendingPasswordChange(payload: PendingPwdPayload): Promise<void> {
  try {
    await SecureStore.setItemAsync(AUTH_PENDING_PWD_CHANGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Failed to save pending password change', e);
  }
}

export async function getPendingPasswordChange(): Promise<PendingPwdPayload | null> {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_PENDING_PWD_CHANGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingPwdPayload;
  } catch (e) {
    console.warn('Failed to read pending password change', e);
    return null;
  }
}

export async function clearPendingPasswordChange(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_PENDING_PWD_CHANGE_KEY);
  } catch (e) {
    console.warn('Failed to clear pending password change', e);
  }
}

export async function processPendingPasswordChange(): Promise<boolean> {
  const pending = await getPendingPasswordChange();
  if (!pending) return false;

  try {
    const tokens = await getStoredTokens();
    const accessToken = tokens.accessToken;

    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ currentPassword: pending.currentPassword, newPassword: pending.newPassword }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Change password failed: ${res.status} ${text}`);
    }

    await clearPendingPasswordChange();
    return true;
  } catch (e: any) {
    const isNetworkError = e && (e.message === 'Network request failed' || e.constructor.name === 'TypeError');
    if (isNetworkError) {
      return false;
    }
    throw e;
  }
}

export async function changePasswordRemote(currentPassword: string, newPassword: string): Promise<{ offline?: boolean }>
{
  try {
    const tokens = await getStoredTokens();
    const accessToken = tokens.accessToken;

    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Change password failed: ${res.status} ${text}`);
    }

    return {};
  } catch (e: any) {
    const isNetworkError = e && (e.message === 'Network request failed' || e.constructor.name === 'TypeError');
    if (isNetworkError) {
      const payload: PendingPwdPayload = { currentPassword, newPassword, queuedAt: new Date().toISOString() };
      await savePendingPasswordChange(payload);
      return { offline: true };
    }
    throw e;
  }
}