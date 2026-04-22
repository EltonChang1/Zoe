import { View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";

/**
 * Glass top app bar (VDK §11.5). `bg-surface/70 + backdrop-blur-xl`, 64px tall,
 * leading slot / centered slot / trailing slot.
 */
export function GlassTopBar({
  leading,
  title,
  trailing,
  variant = "light",
}: {
  leading?: React.ReactNode;
  title?: React.ReactNode;
  trailing?: React.ReactNode;
  variant?: "light" | "dark";
}) {
  const insets = useSafeAreaInsets();
  const isDark = variant === "dark";

  return (
    <View style={{ paddingTop: insets.top }} className="absolute top-0 left-0 right-0 z-40">
      <BlurView
        intensity={isDark ? 30 : 40}
        tint={isDark ? "dark" : "light"}
        className="overflow-hidden"
      >
        <View
          className={cn(
            "h-16 flex-row items-center px-5",
            isDark ? "bg-ink/40" : "bg-background/70",
          )}
        >
          <View className="w-10 items-start">{leading}</View>
          <View className="flex-1 items-center">{title}</View>
          <View className="w-10 items-end">{trailing}</View>
        </View>
      </BlurView>
    </View>
  );
}
