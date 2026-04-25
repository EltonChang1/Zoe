import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { ApiSession, ApiUser } from "./types";

/**
 * Session persistence.
 *
 * - **Native (iOS / Android)**: `expo-secure-store` (keychain / encrypted prefs).
 * - **Web**: `expo-secure-store` has no implementation (`ExpoSecureStore.web`
 *   is an empty object), so `setItemAsync` would throw after a successful
 *   `/auth/login`. We mirror the same key/value contract in `localStorage`
 *   for dev and browser testing — acceptable for a local Vite/Metro web build;
 *   a production PWA may want httpOnly cookies or a tighter strategy.
 */

const TOKEN_KEY = "zoe.session.token";
const EXPIRES_KEY = "zoe.session.expiresAt";
const USER_KEY = "zoe.session.user";

const useWebSession =
  Platform.OS === "web" && typeof localStorage !== "undefined";

function webGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function webSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // quota / private mode
  }
}

function webDelete(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export interface PersistedSession {
  token: string;
  expiresAt: string;
  user: ApiUser;
}

export async function loadSession(): Promise<PersistedSession | null> {
  try {
    const [token, expiresAt, userJson] = useWebSession
      ? [webGet(TOKEN_KEY), webGet(EXPIRES_KEY), webGet(USER_KEY)]
      : await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(EXPIRES_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
    if (!token || !userJson || !expiresAt) return null;
    if (new Date(expiresAt).getTime() < Date.now()) {
      await clearSession();
      return null;
    }
    return { token, expiresAt, user: JSON.parse(userJson) as ApiUser };
  } catch {
    // SecureStore can throw on simulators without a keychain configured —
    // treat as "no session" rather than breaking the app.
    return null;
  }
}

export async function saveSession(
  session: ApiSession,
  user: ApiUser,
): Promise<void> {
  if (useWebSession) {
    webSet(TOKEN_KEY, session.token);
    webSet(EXPIRES_KEY, session.expiresAt);
    webSet(USER_KEY, JSON.stringify(user));
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, session.token),
    SecureStore.setItemAsync(EXPIRES_KEY, session.expiresAt),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearSession(): Promise<void> {
  if (useWebSession) {
    webDelete(TOKEN_KEY);
    webDelete(EXPIRES_KEY);
    webDelete(USER_KEY);
    return;
  }
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined),
    SecureStore.deleteItemAsync(EXPIRES_KEY).catch(() => undefined),
    SecureStore.deleteItemAsync(USER_KEY).catch(() => undefined),
  ]);
}
