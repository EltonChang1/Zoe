import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Body, Label, Title } from "@/components/ui/Text";
import type { RankingList } from "@/data/types";
import { getUser } from "@/data/users";

/**
 * Ranking list preview card (VDK §16.2) — used in Rankings Community Hub
 * and personal hub. Collectible, identity-rich, lifted tonal surface.
 */
export function RankingListCard({
  list,
  onPress,
}: {
  list: RankingList;
  onPress?: () => void;
}) {
  const owner = getUser(list.ownerId);
  return (
    <Pressable
      onPress={onPress}
      className="mb-5 active:opacity-90 rounded-xl overflow-hidden bg-surface-container-lowest"
      style={{
        shadowColor: "#1B1C1A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
        elevation: 2,
      }}
    >
      {list.coverImage && (
        <Image
          source={{ uri: list.coverImage }}
          style={{ aspectRatio: 4 / 3 }}
          contentFit="cover"
          transition={220}
          className="w-full"
        />
      )}
      <View className="p-4">
        <Label className="uppercase tracking-widest text-[10px] text-on-surface-variant">
          {list.category}
        </Label>
        <Title className="mt-1 text-[18px] leading-[22px]">{list.title}</Title>
        {list.description && (
          <Body className="mt-1.5 text-[13px] leading-[18px]" numberOfLines={2}>
            {list.description}
          </Body>
        )}
        <View className="flex-row items-center mt-3">
          <Avatar uri={owner.avatar} size="xs" />
          <Label className="ml-2 text-[11px]">by @{owner.handle}</Label>
          <View className="flex-1" />
          <View className="flex-row items-center">
            <Icon name="favorite-border" size={14} color="#504446" />
            <Label className="ml-1 text-[11px]">{list.saves}</Label>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
