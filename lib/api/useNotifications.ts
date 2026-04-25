import { useCallback, useEffect, useState } from "react";

import { useAuth } from "./AuthProvider";
import { useNotificationsQuery } from "./queries";
import {
  loadLastSeenAt,
  saveLastSeenAt,
} from "./notifications-seen";
import type { ApiNotificationItem } from "./types";

/**
 * Presentation hook for the inbox.
 *
 * Wraps `useNotificationsQuery` + the per-user last-seen bookmark so both
 * the notifications screen and the home-screen bell can share the same
 * source of truth for "how many new things since the user last opened
 * the inbox".
 *
 * The `markAllSeen` callback is what you call when the user opens the
 * inbox — it advances the bookmark to the timestamp of the newest item
 * on the first page (or "now" if the inbox is empty).
 */
export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id;

  const query = useNotificationsQuery();
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the last-seen bookmark whenever the signed-in user changes.
  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    if (!userId) {
      setLastSeenAt(null);
      setHydrated(true);
      return;
    }
    loadLastSeenAt(userId).then((iso) => {
      if (!cancelled) {
        setLastSeenAt(iso);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const items: ApiNotificationItem[] = query.data?.items ?? [];

  // Unread = events newer than the bookmark.
  // While still hydrating, we deliberately report 0 so the home-screen
  // bell doesn't flash a dot that immediately disappears.
  const unreadCount =
    !hydrated || !userId
      ? 0
      : items.reduce((n, item) => {
          if (!lastSeenAt) return n + 1;
          return new Date(item.createdAt) > new Date(lastSeenAt) ? n + 1 : n;
        }, 0);

  const markAllSeen = useCallback(async () => {
    if (!userId) return;
    const newestIso = items[0]?.createdAt ?? new Date().toISOString();
    setLastSeenAt(newestIso);
    await saveLastSeenAt(userId, newestIso);
  }, [userId, items]);

  return {
    query,
    items,
    unreadCount,
    lastSeenAt,
    markAllSeen,
  };
}
