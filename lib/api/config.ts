import Constants from "expo-constants";
import { NativeModules, Platform, TurboModuleRegistry } from "react-native";

function stripTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, "");
}

type SourceCodeTurboModule = {
  getConstants: () => { scriptURL: string };
};

/**
 * Packager base URL + full bundle URL (same as RN SourceCode: TurboModule
 * `SourceCode` when available, else null so callers can fall back).
 */
function packagerUrlsFromNative(): { packagerBase: string; fullBundleUrl: string } | null {
  try {
    const sourceCode = TurboModuleRegistry.get<SourceCodeTurboModule>("SourceCode");
    if (!sourceCode) return null;
    const scriptUrl = sourceCode.getConstants().scriptURL;
    const match = scriptUrl.match(/^https?:\/\/.*?\//);
    const packagerBase = match ? match[0] : null;
    if (!packagerBase) return null;
    return { packagerBase, fullBundleUrl: scriptUrl };
  } catch {
    return null;
  }
}

/**
 * Metro serves the JS bundle from a URL whose host is reachable from this
 * runtime. In Expo Go on a phone, that is your machine's LAN IP — unlike
 * `localhost` in a `.env` file, which would point at the phone itself.
 *
 * Prefer TurboModule `SourceCode` via `TurboModuleRegistry`. On Android,
 * `NativeModules.SourceCode` is often unset while the TurboModule still works — without this, we fell back
 * to `10.0.2.2` or `localhost` and every `fetch` failed with "Network request failed".
 */
function devMachineHostFromBundle(): string | undefined {
  if (Platform.OS === "web") return undefined;
  const fromTurbo = packagerUrlsFromNative();
  if (fromTurbo) {
    try {
      const candidate = fromTurbo.fullBundleUrl ?? fromTurbo.packagerBase;
      const { hostname } = new URL(candidate);
      if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
        return hostname;
      }
    } catch {
      // fall through
    }
  }
  const scriptURL = (NativeModules as { SourceCode?: { scriptURL?: string } }).SourceCode
    ?.scriptURL;
  if (!scriptURL) return undefined;
  try {
    const { hostname } = new URL(scriptURL);
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return hostname;
    }
    return hostname || undefined;
  } catch {
    return undefined;
  }
}

/**
 * If EXPO_PUBLIC_API_URL uses loopback but the bundle is loaded from another
 * host (typical: `.env` has localhost while Expo Go uses LAN), use the bundle
 * host so login/API calls reach the dev machine.
 */
function resolveEnvBaseUrl(raw: string): string {
  const trimmed = stripTrailingSlashes(raw.trim());
  if (Platform.OS === "web") return trimmed;
  try {
    const base = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `http://${trimmed}`;
    const u = new URL(base);
    const bundleHost = devMachineHostFromBundle();
    const loopback =
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "[::1]";
    if (
      __DEV__ &&
      loopback &&
      bundleHost &&
      bundleHost !== "localhost" &&
      bundleHost !== "127.0.0.1"
    ) {
      u.hostname = bundleHost;
      return stripTrailingSlashes(u.toString());
    }
  } catch {
    // fall through
  }
  return trimmed;
}

/**
 * Resolve the API base URL for the current runtime.
 *
 * Order of precedence:
 * 1. EXPO_PUBLIC_API_URL (loopback is rewritten from the Metro bundle host in
 *    dev on native — see `resolveEnvBaseUrl`).
 * 2. Host from the Metro bundle URL (`SourceCode.scriptURL`) — reliable in
 *    Expo Go when manifest `hostUri` is missing (e.g. newer SDKs).
 * 3. Manifest `hostUri` when present.
 * 4. Platform defaults: Android emulator → 10.0.2.2; else localhost.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return resolveEnvBaseUrl(fromEnv);

  const bundleHost = devMachineHostFromBundle();

  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants.expoGoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { hostUri?: string } } } })
      .manifest2?.extra?.expoGo?.hostUri;
  const uriHost = typeof hostUri === "string" ? hostUri.split(":")[0] : undefined;

  const metroHost = bundleHost ?? uriHost;

  if (Platform.OS === "android") {
    // Emulator: Metro is often reached as 10.0.2.2; the packager host in
    // scriptURL may still be 10.0.2.2. Physical device: we must have a real
    // LAN host from the bundle — never guess 10.0.2.2 when we already know
    // a routable host.
    if (metroHost && metroHost !== "localhost") {
      return `http://${metroHost}:4000`;
    }
    // No LAN host parsed (e.g. scriptURL is file://) — emulator fallback only.
    return "http://10.0.2.2:4000";
  }

  if (metroHost) return `http://${metroHost}:4000`;
  return "http://localhost:4000";
}

export const API_BASE_URL = resolveBaseUrl();
