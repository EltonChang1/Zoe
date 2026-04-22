import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Resolve the API base URL for the current runtime.
 *
 * Order of precedence:
 * 1. EXPO_PUBLIC_API_URL env var (set it to your LAN IP on physical devices).
 * 2. Dev fallbacks based on the Metro host so simulators "just work":
 *    - iOS simulator  → http://localhost:4000
 *    - Android emulator → http://10.0.2.2:4000
 *    - Expo Go / dev client on LAN → http://<metro-host>:4000
 * 3. A last-resort localhost (shouldn't be hit in practice).
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { hostUri?: string } } } })
      .manifest2?.extra?.expoGo?.hostUri;
  const metroHost =
    typeof hostUri === "string" ? hostUri.split(":")[0] : undefined;

  if (Platform.OS === "android") {
    // The Android emulator can't reach host "localhost" — it loops on itself.
    // 10.0.2.2 is the emulator's special alias for the host machine.
    return `http://${metroHost && metroHost !== "localhost" ? metroHost : "10.0.2.2"}:4000`;
  }

  if (metroHost) return `http://${metroHost}:4000`;
  return "http://localhost:4000";
}

export const API_BASE_URL = resolveBaseUrl();
