import "../global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider, QueryProvider, useAuth } from "@/lib/api";
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
  const segments = useSegments();
  const router = useRouter();

  const inAuthGroup = segments[0] === "(auth)";

  useEffect(() => {
    if (bootstrapping) return;
    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [bootstrapping, isSignedIn, inAuthGroup, router]);

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
        name="post/[id]"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="ranking-list/[id]"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="rank/add"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}

export const unstable_settings = {
  initialRouteName: "(tabs)",
};
