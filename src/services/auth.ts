import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

export type StoredTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

function getFirebaseAuth() {
  return getAuth(getApp());
}

export async function login(email: string, password: string) {
  const auth = getFirebaseAuth();
  const result = await auth.signInWithEmailAndPassword(email, password);
  const firebaseUser = result.user;
  const accessToken = await firebaseUser.getIdToken();
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
  const result = await auth.createUserWithEmailAndPassword(email, password);
  const firebaseUser = result.user;

  if (firebaseUser.displayName !== name) {
    await firebaseUser.updateProfile({ displayName: name });
  }

  const accessToken = await firebaseUser.getIdToken();
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
  await auth.signOut();
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

  const accessToken = await firebaseUser.getIdToken(true);
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
