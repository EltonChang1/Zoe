import { Pressable, PressableProps, Text } from "react-native";

import { cn } from "@/lib/cn";

type Variant = "ghost" | "filled" | "active";

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  className?: string;
  dense?: boolean;
};

/** Rounded tag/category pill (VDK §11, §18.1 category row). */
export function Chip({ label, variant = "ghost", className, dense, ...rest }: Props) {
  const padY = dense ? "py-1" : "py-1.5";
  const padX = dense ? "px-3" : "px-3.5";

  const base =
    variant === "active"
      ? "bg-primary"
      : variant === "filled"
        ? "bg-surface-container-low border border-outline-variant/20"
        : "bg-transparent border border-outline-variant/30";
  const textColor =
    variant === "active" ? "text-on-primary" : "text-on-surface-variant";

  return (
    <Pressable
      className={cn(
        "rounded-full flex-row items-center",
        padY,
        padX,
        base,
        "active:opacity-80",
        className,
      )}
      {...rest}
    >
      <Text
        className={cn(
          "font-label uppercase tracking-widest text-[11px]",
          textColor,
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
