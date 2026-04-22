import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  View,
  Text,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { Icon, IconName } from "@/components/ui/Icon";
import { Body, HeadlineItalic, LabelCaps } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { shorts } from "@/data/shorts";
import { getObject } from "@/data/objects";
import { getUser } from "@/data/users";
import { gradients } from "@/theme/tokens";

/**
 * Shorts — immersive vertical video surface.
 * Dark warm, full-bleed, glass action rail, bottom-left curator.
 * VDK §16.6, §18.4; Design_guide/shorts_page/code.html.
 *
 * For prototype we render hero images (videos pulled in later).
 */
export default function ShortsScreen() {
  const { height } = Dimensions.get("window");
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / height);
    if (i !== index) setIndex(i);
  };

  return (
    <View className="flex-1 bg-ink">
      <GlassTopBar
        variant="dark"
        leading={
          <Pressable hitSlop={10}>
            <Icon name="menu" size={22} color="#FBF9F6" />
          </Pressable>
        }
        title={
          <Text className="font-display-italic text-surface text-[22px] tracking-tightest">
            Zoe
          </Text>
        }
        trailing={<Icon name="sort" size={22} color="#FBF9F6" />}
      />

      <ScrollView
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {shorts.map((s) => (
          <ShortFrame key={s.id} short={s} height={height} />
        ))}
      </ScrollView>
    </View>
  );
}

function ShortFrame({
  short,
  height,
}: {
  short: (typeof shorts)[number];
  height: number;
}) {
  const author = getUser(short.authorId);
  const object = getObject(short.objectId);
  return (
    <View style={{ height }} className="relative">
      <Image
        source={{ uri: short.hero }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
      />
      <LinearGradient
        colors={gradients.shortsTop}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200 }}
      />
      <LinearGradient
        colors={gradients.shortsBottom}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 360,
        }}
      />

      {/* Right rail */}
      <View className="absolute right-4 bottom-40 items-center gap-5">
        <RailAction icon="format-list-numbered" label="RANK" filled />
        <RailAction icon="favorite-border" label={formatCount(short.likes)} />
        <RailAction icon="chat-bubble-outline" label={formatCount(short.comments)} />
        <RailAction icon="bookmark-border" label={formatCount(short.saves)} />
        <RailAction icon="more-horiz" label="" />
      </View>

      {/* Bottom-left info */}
      <View className="absolute left-5 right-24 bottom-28">
        <View className="flex-row items-center mb-3">
          <Avatar uri={author.avatar} size="sm" />
          <View className="ml-3">
            <Text className="font-headline text-surface text-[16px]">
              {author.displayName}
            </Text>
            <LabelCaps className="text-surface/70">Curator</LabelCaps>
          </View>
        </View>
        <HeadlineItalic className="text-surface text-[22px] leading-[26px] mb-2">
          {short.hookLine}
        </HeadlineItalic>
        <Body className="text-surface/80 text-[13px] leading-[18px]">
          {short.caption}
        </Body>

        <View className="flex-row gap-2 mt-4">
          {object?.city && <DarkPill icon="place" label={object.city} />}
          {short.audioLabel && (
            <DarkPill icon="music-note" label={short.audioLabel} />
          )}
        </View>
      </View>
    </View>
  );
}

function RailAction({
  icon,
  label,
  filled = false,
}: {
  icon: IconName;
  label: string;
  filled?: boolean;
}) {
  return (
    <Pressable className="items-center active:opacity-80">
      <BlurView
        intensity={30}
        tint="dark"
        className="overflow-hidden rounded-full"
      >
        <View
          className={cn(
            "w-12 h-12 items-center justify-center",
            filled ? "bg-surface/95" : "bg-white/10 border border-white/20",
          )}
        >
          <Icon name={icon} size={22} color={filled ? "#55343B" : "#FBF9F6"} />
        </View>
      </BlurView>
      {!!label && (
        <Text className="font-label-semibold text-surface text-[11px] tracking-widest mt-1">
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function DarkPill({ icon, label }: { icon: IconName; label: string }) {
  return (
    <BlurView intensity={20} tint="dark" className="overflow-hidden rounded-full">
      <View className="flex-row items-center bg-ink/50 border border-white/10 px-3 py-1.5 gap-1.5">
        <Icon name={icon} size={12} color="#FBF9F6" />
        <Text className="font-label text-surface text-[11px]">{label}</Text>
      </View>
    </BlurView>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}
