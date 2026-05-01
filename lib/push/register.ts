import Constants from "expo-constants";
import * as Device from "expo-device";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import type * as ExpoNotifications from "expo-notifications";

import { useAuth } from "@/lib/api/AuthProvider";
import { registerPushToken, unregisterPushToken } from "@/lib/api/endpoints";

type NotificationsModule = typeof ExpoNotifications;
let notificationsPromise: Promise<NotificationsModule | null> | null = null;

function pushNotificationsUnsupportedInExpoGo(): boolean {
  return Platform.OS === "android" && Constants.appOwnership === "expo";
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (pushNotificationsUnsupportedInExpoGo()) return null;
  notificationsPromise ??= import("expo-notifications")
    .then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      return Notifications;
    })
    .catch(() => null);
  return notificationsPromise;
}

export function usePushRegistration() {
  const { isSignedIn, token } = useAuth();
  const prevSessionTokenRef = useRef<string | null>(null);
  const registeredPushTokenRef = useRef<string | null>(null);

  // Register current signed-in device token.
  useEffect(() => {
    if (!isSignedIn || !token) return;
    let cancelled = false;

    (async () => {
      const pushToken = await requestExpoPushToken();
      if (!pushToken || cancelled) return;

      await registerPushToken(token, {
        token: pushToken,
        platform:
          Platform.OS === "ios" || Platform.OS === "android"
            ? Platform.OS
            : "web",
        appVersion: Constants.expoConfig?.version,
      }).catch(() => undefined);

      if (!cancelled) {
        registeredPushTokenRef.current = pushToken;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, token]);

  // Best-effort unregister on sign-out.
  useEffect(() => {
    const prevSessionToken = prevSessionTokenRef.current;
    if (!token && prevSessionToken && registeredPushTokenRef.current) {
      void unregisterPushToken(
        prevSessionToken,
        registeredPushTokenRef.current,
      ).catch(() => undefined);
      registeredPushTokenRef.current = null;
    }
    prevSessionTokenRef.current = token;
  }, [token]);
}

async function requestExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const Notifications = await getNotifications();
  if (!Notifications) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const res = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return res.data;
  } catch {
    return null;
  }
}
