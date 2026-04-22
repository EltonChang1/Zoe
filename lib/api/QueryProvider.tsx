import NetInfo from "@react-native-community/netinfo";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

/**
 * Wires Tanstack Query's `focusManager` and `onlineManager` to the right
 * React Native signals. Without these the default refetch-on-focus behaviour
 * doesn't fire on mobile, and the offline detection is a no-op.
 *
 * NetInfo is optional — if the package isn't installed we fall back to
 * always-online, which is the safe default.
 */
function wireRnEventBridges() {
  // AppState → focus
  const onChange = (status: AppStateStatus) => {
    if (Platform.OS !== "web") {
      focusManager.setFocused(status === "active");
    }
  };
  const sub = AppState.addEventListener("change", onChange);

  // NetInfo → online
  let netUnsub: (() => void) | undefined;
  try {
    // Lazy because NetInfo is not a required dep; skip silently if missing.
    netUnsub = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(
        state.isConnected == null ? true : state.isConnected,
      );
    });
  } catch {
    onlineManager.setOnline(true);
  }

  return () => {
    sub.remove();
    netUnsub?.();
  };
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            // Mobile networks glitch more; a brief staleTime cuts chatter
            // without hiding data updates meaningfully.
            staleTime: 15_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  useEffect(wireRnEventBridges, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
