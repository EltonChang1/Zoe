import { View } from "react-native";
import { BlurView } from "expo-blur";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { LabelCaps } from "@/components/ui/Text";
import { Text } from "react-native";

type Movement = "up" | "down" | "new" | "stable";

/**
 * Small rank pill overlay (VDK §11.3, §19.1).
 * bg-background/90 + backdrop-blur · rank-up / rank-down dot · optional number.
 * Designed to sit on photo cards (masonry, detail ribbons).
 */
export function RankPill({
  rank,
  movement = "stable",
  delta,
  variant = "pill",
  className,
}: {
  rank?: number;
  movement?: Movement;
  delta?: number;
  variant?: "pill" | "chip" | "floating";
  className?: string;
}) {
  const dotColor =
    movement === "up"
      ? "bg-rank-up"
      : movement === "down"
        ? "bg-rank-down"
        : movement === "new"
          ? "bg-new-entry"
          : "bg-outline";

  if (variant === "floating") {
    return (
      <View
        className={cn(
          "flex-row items-center gap-3 bg-surface-container-highest/90 px-5 py-3 rounded-[2px]",
          "border border-outline-variant/20",
          className,
        )}
      >
        <Text className="font-headline-italic text-primary text-[20px]">
          #{rank}
        </Text>
        <View className="h-5 w-[1px] bg-outline-variant/40" />
        <LabelCaps className="text-on-surface-variant">
          {/* caller wraps with title */}
        </LabelCaps>
      </View>
    );
  }

  return (
    <BlurView
      intensity={40}
      tint="light"
      className={cn(
        "overflow-hidden rounded-[2px]",
        className,
      )}
    >
      <View className="flex-row items-center gap-1.5 bg-background/85 px-2.5 py-1.5">
        <View className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
        {rank != null && (
          <Text className="font-serif text-on-surface text-[14px]">
            #{rank}
          </Text>
        )}
        {movement === "new" ? (
          <Text className="font-label-semibold text-new-entry uppercase tracking-widest text-[10px]">
            NEW
          </Text>
        ) : (
          (movement === "up" || movement === "down") && (
            <View className="flex-row items-center">
              <Icon
                name={movement === "up" ? "arrow-upward" : "arrow-downward"}
                size={12}
                color={movement === "up" ? "#547C65" : "#8B5D5D"}
              />
              {delta != null && (
                <Text
                  className={cn(
                    "font-label-semibold text-[10px] ml-0.5",
                    movement === "up" ? "text-rank-up" : "text-rank-down",
                  )}
                >
                  {delta}
                </Text>
              )}
            </View>
          )
        )}
      </View>
    </BlurView>
  );
}
