import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Last-seen bookmark for the inbox.
 *
 * The server deliberately doesn't track read-state yet (see `routes/
 * notifications.ts` — all events are derived from the social tables, and
 * we don't want to start double-writing until there's product pressure
 * for it).
 *
 * Instead, the client persists a "last opened" timestamp per user. The
 * unread count is simply `notifications where createdAt > lastSeenAt`,
 * derivable on the client from the first page of the infinite query.
 *
 * Keys are namespaced per user id so switching accounts doesn't leak
 * read-state between them.
 */

const prefix = "zoe.notifications.lastSeenAt.";

const useWeb = Platform.OS === "web" && typeof localStorage !== "undefined";

export async function loadLastSeenAt(userId: string): Promise<string | null> {
  const key = prefix + userId;
  try {
    if (useWeb) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function saveLastSeenAt(
  userId: string,
  iso: string,
): Promise<void> {
  const key = prefix + userId;
  try {
    if (useWeb) {
      try {
        localStorage.setItem(key, iso);
      } catch {
        // private mode / quota
      }
      return;
    }
    await SecureStore.setItemAsync(key, iso);
  } catch {
    // Keychain-less simulators — drop silently; inbox just stays
    // "all unread" until the user opens it, same fallback as the session.
  }
}
