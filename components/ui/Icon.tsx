import { MaterialIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";

/**
 * Icon wrapper aligned to the Material Symbols vocabulary used in
 * Design_guide examples (code.html files). `MaterialIcons` covers the vast majority
 * of our names (arrow_back, more_horiz, bookmark, favorite, chat_bubble,
 * ios_share, explore, search, leaderboard, play_circle, person, etc.).
 *
 * Rule (VDK §12): never over-rely on icons — a well-set Inter word is
 * often more premium.
 */
export type IconName = ComponentProps<typeof MaterialIcons>["name"];

export function Icon({
  name,
  size = 24,
  color = "#55343B",
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: ComponentProps<typeof MaterialIcons>["style"];
}) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}
