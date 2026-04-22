import * as SecureStore from "expo-secure-store";

import type { ApiSession, ApiUser } from "./types";

/**
 * Session persistence.
 *
 * Tokens and the cached "last user" shape are stored in the OS keychain via
 * expo-secure-store. The user blob gives us an optimistic boot — we can
 * render a signed-in chrome before `/auth/me` validates the token.
 */

const TOKEN_KEY = "zoe.session.token";
const EXPIRES_KEY = "zoe.session.expiresAt";
const USER_KEY = "zoe.session.user";

export interface PersistedSession {
  token: string;
  expiresAt: string;
  user: ApiUser;
}

export async function loadSession(): Promise<PersistedSession | null> {
  try {
    const [token, expiresAt, userJson] = await Promise.all([
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
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, session.token),
    SecureStore.setItemAsync(EXPIRES_KEY, session.expiresAt),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(EXPIRES_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}
