import { Image } from "expo-image";
import { Pressable, View, Text } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Body, Label, Title } from "@/components/ui/Text";
import { RankPill } from "@/components/rank/RankPill";
import { cn } from "@/lib/cn";
import type { Post } from "@/data/types";
import { getUser } from "@/data/users";
import { getObject } from "@/data/objects";

/**
 * Editorial masonry card for the Home feed (VDK §16.1, §18.1).
 *  - rounded-xl media, no divider lines
 *  - optional rank pill (glass overlay)
 *  - serif title + short caption line-clamped
 *  - footer: avatar / @handle / heart + count
 */
const aspectRatioFor = (aspect: Post["aspect"]): number => {
  switch (aspect) {
    case "tall":
      return 4 / 5;
    case "wide":
      return 16 / 10;
    case "square":
    default:
      return 1;
  }
};

export function MasonryCard({
  post,
  onPress,
}: {
  post: Post;
  onPress?: () => void;
}) {
  const author = getUser(post.authorId);
  const object = getObject(post.objectId);

  const ratio = aspectRatioFor(post.aspect);
  // masonry column is half screen minus gutter; feed height ~ width / ratio
  const imageStyle = { aspectRatio: ratio };

  return (
    <Pressable onPress={onPress} className="mb-4 active:opacity-90">
      <View className="relative">
        <Image
          source={{ uri: object?.heroImage }}
          style={imageStyle}
          contentFit="cover"
          transition={240}
          className="w-full rounded-xl bg-surface-container-low"
        />
        {post.ranking?.rank && (
          <View className="absolute top-3 right-3">
            <RankPill
              rank={post.ranking.rank}
              movement={post.ranking.movement}
              delta={post.ranking.delta}
            />
          </View>
        )}
        {post.locationLabel && (
          <View className="absolute bottom-3 left-3 flex-row items-center gap-1.5 bg-background/90 px-2.5 py-1 rounded-[2px]">
            <Icon name="place" size={12} color="#504446" />
            <Text className="font-label text-on-surface text-[11px]">
              {post.locationLabel}
            </Text>
          </View>
        )}
      </View>

      <View className="pt-3 pr-1">
        <Title className="text-[17px] leading-[20px]" numberOfLines={2}>
          {post.headline}
        </Title>
        {!!post.caption && (
          <Body
            className="mt-1.5 text-[13px] leading-[18px]"
            numberOfLines={2}
          >
            {post.caption}
          </Body>
        )}

        <View className="flex-row items-center mt-3 pr-1">
          <Avatar uri={author.avatar} size="xs" />
          <Label className="ml-2 text-on-surface-variant text-[11px]">
            @{author.handle}
          </Label>
          <View className="flex-1" />
          <View className="flex-row items-center">
            <Icon name="favorite-border" size={14} color="#504446" />
            <Label className="ml-1 text-[11px]">
              {formatCount(post.likes)}
            </Label>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Editorial text-only quote card (VDK §16.1 "Editorial quote card").
 * No media; `surface-container-low` fill with ghost border.
 */
export function QuoteCard({
  quote,
  attribution,
  onPress,
}: {
  quote: string;
  attribution: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "mb-4 bg-surface-container-low rounded-xl border border-outline-variant/15 p-5",
        "active:opacity-90",
      )}
    >
      <Icon name="format-quote" size={24} color="rgba(85,52,59,0.5)" />
      <Title className="mt-2 text-[20px] leading-[26px]">{quote}</Title>
      <Label className="mt-4 uppercase tracking-widest text-[10px] text-on-surface-variant">
        {attribution}
      </Label>
    </Pressable>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}
