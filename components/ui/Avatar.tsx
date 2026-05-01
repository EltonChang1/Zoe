import { Image } from "expo-image";
import { View } from "react-native";

import { DEFAULT_BOT_AVATAR_URL } from "@/lib/avatar";
import { cn } from "@/lib/cn";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, { box: number; radius: number }> = {
  xs: { box: 24, radius: 12 },
  sm: { box: 32, radius: 16 },
  md: { box: 40, radius: 20 },
  lg: { box: 48, radius: 24 },
  xl: { box: 96, radius: 48 },
};

/**
 * Circular avatar with a 1px ring of outline-variant/30 per VDK §11.6.
 * Optional warm story ring.
 */
export function Avatar({
  uri,
  size = "md",
  ring = false,
  className,
}: {
  uri?: string | null;
  size?: Size;
  ring?: boolean;
  className?: string;
}) {
  const { box, radius } = sizeMap[size];
  return (
    <View
      className={cn(
        "items-center justify-center",
        ring ? "p-[2px] bg-gradient-to-br from-[#B48A5E] via-[#8B5D5D] to-[#55343B]" : "",
        className,
      )}
      style={ring ? { borderRadius: radius + 2 } : undefined}
    >
      <Image
        source={{ uri: uri ?? DEFAULT_BOT_AVATAR_URL }}
        style={{
          width: box,
          height: box,
          borderRadius: radius,
          borderWidth: 1,
          borderColor: "rgba(211,194,196,0.30)",
          backgroundColor: "#EAE8E5",
        }}
        contentFit="cover"
        transition={180}
      />
    </View>
  );
}
