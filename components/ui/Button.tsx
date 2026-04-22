import { Pressable, PressableProps, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { cn } from "@/lib/cn";
import { gradients } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "tertiary";

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  className?: string;
  full?: boolean;
  dense?: boolean;
};

/**
 * Modern Curator buttons (VDK §11.2):
 *  - primary   : gradient fill (primary -> primary-container), sharp radius, on-primary text
 *  - secondary : transparent + ghost border at 15% outline-variant, primary text
 *  - tertiary  : pure text in cocoa/secondary, underline on press
 */
export function Button({
  label,
  variant = "primary",
  className,
  full,
  dense,
  onPress,
  ...rest
}: Props) {
  const padY = dense ? "py-2" : "py-3";
  const padX = dense ? "px-5" : "px-6";
  const widthCls = full ? "w-full" : "";

  if (variant === "primary") {
    return (
      <Pressable onPress={onPress} className={cn(widthCls, className)} {...rest}>
        {({ pressed }) => (
          <LinearGradient
            colors={gradients.primaryCTA}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 2,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            }}
          >
            <View
              className={cn(
                padY,
                padX,
                "flex-row items-center justify-center",
                "shadow-black/10",
              )}
            >
              <Text className="font-label-semibold text-on-primary uppercase tracking-widest text-[13px]">
                {label}
              </Text>
            </View>
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={onPress}
        className={cn(
          widthCls,
          "bg-transparent border border-outline-variant/30 rounded-[2px]",
          padY,
          padX,
          "active:opacity-80",
          className,
        )}
        {...rest}
      >
        <Text className="font-label-semibold text-primary uppercase tracking-widest text-[13px] text-center">
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={cn(widthCls, "py-2 active:opacity-70", className)}
      {...rest}
    >
      <Text className="font-label text-secondary text-[13px] underline decoration-secondary/40">
        {label}
      </Text>
    </Pressable>
  );
}
