import "../global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider, QueryProvider, useAuth } from "@/lib/api";
import { usePushRegistration } from "@/lib/push/register";
import { useZoeFonts } from "@/theme/useFonts";

export default function RootLayout() {
  const fontsLoaded = useZoeFonts();

  if (!fontsLoaded) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <QueryProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Auth gate.
 *
 * - While the session is being hydrated from SecureStore, render an empty
 *   background (matching the splash) so we don't flash the feed or the
 *   sign-in form.
 * - Once hydrated, redirect based on whether the active route is inside
 *   `(auth)` or not. Keeping the Stack declaration conditional means the
 *   auth screens never share a navigation state with the tabs.
 */
function RootNavigator() {
  const { bootstrapping, isSignedIn } = useAuth();
  usePushRegistration();
  const segments = useSegments();
  const router = useRouter();

  const seg0 = segments[0];
  const inAuthGroup = seg0 === "(auth)";
  const onEmailFlowScreens =
    seg0 === "verify-email" || seg0 === "reset-password";

  useEffect(() => {
    if (bootstrapping) return;
    if (!isSignedIn && !inAuthGroup && !onEmailFlowScreens) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [bootstrapping, isSignedIn, inAuthGroup, onEmailFlowScreens, router]);

  if (bootstrapping) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FBF9F6" },
        animation: "fade",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen
        name="verify-email"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="post/[id]"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="ranking-list/[id]"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="user/[handle]"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="object/[id]"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="notifications"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="compose/post"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="compose/short"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="rank/add"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="settings/blocked"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
    </Stack>
  );
}

export const unstable_settings = {
  initialRouteName: "(tabs)",
};
