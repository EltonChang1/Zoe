import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View, Text } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { Body, Display, Headline, Label, LabelCaps } from "@/components/ui/Text";
import { Icon } from "@/components/ui/Icon";
import { RankingListCard } from "@/components/cards/RankingListCard";
import { cn } from "@/lib/cn";
import { objects } from "@/data/objects";
import { posts } from "@/data/posts";
import { rankings } from "@/data/rankings";
import { currentUserId, getUser } from "@/data/users";
import { mapUser, useAuth } from "@/lib/api";

/**
 * Profile (self) — VDK §18.5, Design_guide/profile_page/code.html.
 * Glass top bar · header (avatar + stats + name + bio) · highlights ·
 * tabs (Posts / Shorts / Rankings) · mixed image + text editorial tiles.
 */
type Tab = "posts" | "shorts" | "rankings";
const TABS: Array<{ id: Tab; label: string; icon: any }> = [
  { id: "posts", label: "Posts", icon: "grid-view" },
  { id: "shorts", label: "Shorts", icon: "play-arrow" },
  { id: "rankings", label: "Rankings", icon: "star-border" },
];

const HIGHLIGHTS = ["Cafés", "Travel", "Perfume", "Albums", "+"];

export default function ProfileScreen() {
  const router = useRouter();
  const { user: apiUser, signOut } = useAuth();
  // Prefer the signed-in user; fall back to the mock "Clara" so the
  // prototype view still renders if Auth hasn't populated yet.
  const me = apiUser ? mapUser(apiUser) : getUser(currentUserId);
  const [tab, setTab] = useState<Tab>("posts");

  const myPosts = posts; // treat as own for prototype
  const myLists = rankings.filter((r) => r.ownerId === currentUserId);

  const openMoreMenu = () => {
    Alert.alert(me.displayName, undefined, [
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <GlassTopBar
        leading={
          <Pressable hitSlop={10}>
            <Icon name="menu" size={22} color="#55343B" />
          </Pressable>
        }
        title={
          <Text className="font-display-italic text-primary text-[22px] tracking-tightest">
            Zoe
          </Text>
        }
        trailing={
          <Pressable hitSlop={10} onPress={openMoreMenu}>
            <Icon name="more-horiz" size={22} color="#55343B" />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 96, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-2">
          <View className="flex-row items-center">
            <Avatar uri={me.avatar} size="xl" />
            <View className="flex-1 flex-row justify-around ml-6">
              <Stat value={me.postsCount} label="Posts" />
              <Stat value={me.followers} label="Followers" />
              <Stat value={me.following} label="Following" />
            </View>
          </View>

          <Display className="mt-5 text-[28px] leading-[32px]">
            {me.displayName}
          </Display>
          <Body className="mt-2 leading-[20px]">{me.bio}</Body>
        </View>

        {/* Highlights */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        >
          <View className="flex-row gap-3">
            {HIGHLIGHTS.map((h) => (
              <View key={h} className="items-center">
                <View className="w-16 h-16 rounded-full bg-surface-container-low border border-outline-variant/40 items-center justify-center">
                  <Text className="font-label-semibold text-on-surface-variant text-[11px]">
                    {h}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Tabs */}
        <View className="flex-row border-t border-outline-variant/30">
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              className={cn(
                "flex-1 py-4 items-center",
                tab === t.id ? "border-b-2 border-on-surface" : "",
              )}
            >
              <View className="flex-row items-center gap-2">
                <Icon
                  name={t.icon}
                  size={16}
                  color={tab === t.id ? "#1B1C1A" : "#827475"}
                />
                <Text
                  className={cn(
                    "font-label-semibold uppercase tracking-widest text-[11px]",
                    tab === t.id ? "text-on-surface" : "text-on-surface-variant",
                  )}
                >
                  {t.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Tab content */}
        {tab === "posts" && (
          <View className="flex-row flex-wrap gap-[2px] pt-[2px]">
            {myPosts.map((p, i) => {
              // every 5th tile becomes an editorial text tile
              if (i > 0 && i % 5 === 0) {
                return <TextTile key={p.id} category={p.tags[0] ?? "NOTE"} title={p.headline} />;
              }
              return (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/post/${p.id}`)}
                  className="w-[33.1%] aspect-square active:opacity-80"
                >
                  <Image
                    source={{ uri: objects[p.objectId]?.heroImage }}
                    style={{ flex: 1 }}
                    contentFit="cover"
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        {tab === "shorts" && (
          <View className="p-6 items-center">
            <LabelCaps>Coming soon</LabelCaps>
            <Headline className="mt-2 text-primary">
              Your Shorts will land here
            </Headline>
          </View>
        )}

        {tab === "rankings" && (
          <View className="px-5 pt-6">
            {myLists.map((list) => (
              <RankingListCard
                key={list.id}
                list={list}
                onPress={() => router.push("/(tabs)/rankings")}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const formatted =
    value >= 1000 ? `${(value / 1000).toFixed(1)}K` : `${value}`;
  return (
    <View className="items-center">
      <Text className="font-headline text-on-surface text-[20px]">
        {formatted}
      </Text>
      <Label className="mt-1 text-[10px] uppercase tracking-widest">
        {label}
      </Label>
    </View>
  );
}

function TextTile({ category, title }: { category: string; title: string }) {
  return (
    <View className="w-[33.1%] aspect-square bg-surface-container-highest p-3 justify-between">
      <LabelCaps className="text-on-surface-variant">{category}</LabelCaps>
      <Text
        className="font-headline text-on-surface text-[13px] leading-[16px]"
        numberOfLines={4}
      >
        {title}
      </Text>
    </View>
  );
}
