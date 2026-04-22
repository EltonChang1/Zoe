import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/**
 * Glass bottom tab bar (VDK §11.5 / §2.1 Tab order):
 *   Discover · Search · Rank · Shorts · Profile — no center Add tab.
 * `bg-surface/80 + backdrop-blur-2xl`, ambient upward shadow.
 */
const TAB_META: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Discover", icon: "explore" },
  search: { label: "Search", icon: "search" },
  rankings: { label: "Rank", icon: "format-list-numbered" },
  shorts: { label: "Shorts", icon: "play-circle-outline" },
  profile: { label: "Profile", icon: "person-outline" },
};

export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0"
      style={{
        shadowColor: "#1B1C1A",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
        elevation: 8,
      }}
    >
      <BlurView intensity={60} tint="light" className="overflow-hidden">
        <View
          className="flex-row items-center justify-around bg-background/80 px-4"
          style={{ paddingBottom: insets.bottom + 8, paddingTop: 10 }}
        >
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const meta = TAB_META[route.name] ?? {
              label: route.name,
              icon: "circle" as IconName,
            };

            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
                className="flex-1 items-center justify-center py-1 active:opacity-80"
              >
                <Icon
                  name={meta.icon}
                  size={22}
                  color={focused ? "#55343B" : "#827475"}
                />
                <Text
                  className={cn(
                    "font-label-semibold uppercase mt-1",
                    "text-[10px] tracking-widest",
                    focused ? "text-primary" : "text-outline",
                  )}
                >
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
