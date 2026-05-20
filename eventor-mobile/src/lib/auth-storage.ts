import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { LoginUser } from './api';

const TOKEN_KEY = 'eventor.sessionToken';
const USER_KEY = 'eventor.sessionUser';

export type StoredSession = {
  token: string;
  user: LoginUser;
};

export async function getStoredSession(): Promise<StoredSession | null> {
  const [token, userJson] = await Promise.all([
    getItem(TOKEN_KEY),
    getItem(USER_KEY),
  ]);

  if (!token || !userJson) {
    return null;
  }

  try {
    return {
      token,
      user: JSON.parse(userJson) as LoginUser,
    };
  } catch {
    await clearStoredSession();
    return null;
  }
}

export async function setStoredSession(session: StoredSession) {
  await Promise.all([
    setItem(TOKEN_KEY, session.token),
    setItem(USER_KEY, JSON.stringify(session.user)),
  ]);
}

export async function clearStoredSession() {
  await Promise.all([
    deleteItem(TOKEN_KEY),
    deleteItem(USER_KEY),
  ]);
}

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
