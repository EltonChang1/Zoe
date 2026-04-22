import { Tabs } from "expo-router";

import { GlassTabBar } from "@/components/nav/GlassTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "#FBF9F6" } }}
    >
      <Tabs.Screen name="index" options={{ title: "Discover" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="rankings" options={{ title: "Rank" }} />
      <Tabs.Screen name="shorts" options={{ title: "Shorts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
