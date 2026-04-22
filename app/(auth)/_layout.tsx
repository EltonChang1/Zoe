import { Stack } from "expo-router";

/**
 * Auth stack. Lives outside `(tabs)` so the glass tab bar never flashes
 * behind the sign-in/sign-up forms. Individual screens control their own
 * header chrome.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#FBF9F6" },
      }}
    />
  );
}
