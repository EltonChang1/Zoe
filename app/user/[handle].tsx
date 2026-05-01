import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  View,
  Text,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import {
  Body,
  Display,
  Headline,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { Icon } from "@/components/ui/Icon";
import { RankingListCard } from "@/components/cards/RankingListCard";
import { cn } from "@/lib/cn";
import { getObject } from "@/data/objects";
import type { Post, RankingList } from "@/data/types";
import {
  useAuth,
  useBlockUser,
  useOwnerRankingListsQuery,
  useReport,
  useTasteProfileQuery,
  useToggleFollow,
  useUserPostsQuery,
  useUserProfileQuery,
} from "@/lib/api";
import { ApiHttpError } from "@/lib/api/client";
import type { ApiTasteProfile } from "@/lib/api/types";
import { confirmBlock, runReportFlow } from "@/components/moderation/actions";

/**
 * Other-user profile (VDK §18.5, Spec SCREEN 21).
 *
 * Editorial header (avatar, display name, handle, bio, stats strip), a follow
 * toggle with optimistic state, and a two-tab body (Posts grid · Rankings).
 *
 * The self-viewing case routes back to `(tabs)/profile` to keep the Sign-out
 * surface authoritative in one place.
 */
const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=200&q=60";

type Tab = "posts" | "rankings";

export default function UserProfileScreen() {
  const router = useRouter();
  const { handle: raw } = useLocalSearchParams<{ handle: string }>();
  const handle = (raw ?? "").toLowerCase();

  const profileQuery = useUserProfileQuery(handle);
  const postsQuery = useUserPostsQuery(handle);
  const listsQuery = useOwnerRankingListsQuery(handle);
  const tasteQuery = useTasteProfileQuery(handle);
  const followMutation = useToggleFollow();
  const reportMutation = useReport();
  const blockMutation = useBlockUser();
  const { isSignedIn } = useAuth();

  const [tab, setTab] = useState<Tab>("posts");
  const [followError, setFollowError] = useState<string | null>(null);

  const profile = profileQuery.data;

  const handleShare = () => {
    if (!profile) return;
    Share.share({
      message: `@${profile.handle} on Zoe — ${profile.displayName}\nhttps://zoe.app/u/${profile.handle}`,
    }).catch(() => undefined);
  };

  const openMoreMenu = () => {
    if (!profile) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    Alert.alert(`@${profile.handle}`, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report user",
        style: "destructive",
        onPress: () =>
          runReportFlow({
            subjectLabel: "profile",
            subjectType: "user",
            subjectId: profile.id,
            submit: (input) => reportMutation.mutateAsync(input),
          }),
      },
      {
        text: `Block @${profile.handle}`,
        style: "destructive",
        onPress: async () => {
          const ok = await confirmBlock(profile.displayName);
          if (!ok) return;
          blockMutation.mutate(profile.handle, {
            onSuccess: () => router.back(),
            onError: (err) =>
              Alert.alert(
                "Couldn't block",
                err instanceof Error ? err.message : "Please try again.",
              ),
          });
        },
      },
    ]);
  };

  const handleToggleFollow = async () => {
    if (!profile) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    setFollowError(null);
    try {
      await followMutation.mutateAsync({
        handle: profile.handle,
        followedByMe: profile.viewer.followedByMe,
      });
    } catch (e) {
      setFollowError(
        e instanceof ApiHttpError
          ? e.message
          : "Couldn't update — try again in a moment.",
      );
    }
  };

  // Any authenticated self-view bounces to the canonical self profile tab so
  // the Sign-out surface remains in one place. Defer to an effect so we don't
  // mutate navigation during render.
  useEffect(() => {
    if (profile?.viewer.isSelf) {
      router.replace("/(tabs)/profile");
    }
  }, [profile?.viewer.isSelf, router]);

  return (
    <View className="flex-1 bg-background">
      <GlassTopBar
        leading={
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Icon name="arrow-back" size={22} color="#55343B" />
          </Pressable>
        }
        title={
          <Text className="font-display-italic text-primary text-[18px] tracking-tightest">
            {profile ? `@${profile.handle}` : "Zoe"}
          </Text>
        }
        trailing={
          <View className="flex-row items-center gap-3">
            <Pressable hitSlop={10} onPress={handleShare}>
              <Icon name="ios-share" size={20} color="#55343B" />
            </Pressable>
            {profile && !profile.viewer.isSelf ? (
              <Pressable hitSlop={10} onPress={openMoreMenu}>
                <Icon name="more-horiz" size={22} color="#55343B" />
              </Pressable>
            ) : null}
          </View>
        }
      />

      {profileQuery.isLoading && !profile && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#55343B" />
        </View>
      )}

      {profileQuery.isError && !profile && (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Headline>Couldn&apos;t load profile</Headline>
          <Body>
            {profileQuery.error instanceof Error
              ? profileQuery.error.message
              : "Try again in a moment."}
          </Body>
          <Button label="Go back" onPress={() => router.back()} />
        </View>
      )}

      {profile && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 96, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={
                profileQuery.isRefetching ||
                postsQuery.isRefetching ||
                listsQuery.isRefetching ||
                tasteQuery.isRefetching
              }
              onRefresh={() => {
                profileQuery.refetch();
                postsQuery.refetch();
                listsQuery.refetch();
                tasteQuery.refetch();
              }}
              tintColor="#55343B"
              colors={["#55343B"]}
              progressBackgroundColor="#FBF9F6"
              progressViewOffset={88}
            />
          }
        >
          {/* Header */}
          <View className="px-6 pt-2">
            <View className="flex-row items-center">
              <Avatar uri={profile.avatarUrl ?? AVATAR_FALLBACK} size="xl" />
              <View className="flex-1 flex-row justify-around ml-6">
                <Stat value={profile.stats.posts} label="Posts" />
                <Stat value={profile.stats.followers} label="Followers" />
                <Stat value={profile.stats.following} label="Following" />
              </View>
            </View>

            <Display className="mt-5 text-[28px] leading-[32px]">
              {profile.displayName}
            </Display>
            {profile.bio ? (
              <Body className="mt-2 leading-[20px]">{profile.bio}</Body>
            ) : null}

            {!profile.viewer.isSelf && (
              <View className="mt-5">
                <FollowButton
                  followedByMe={profile.viewer.followedByMe}
                  followsMe={profile.viewer.followsMe}
                  submitting={followMutation.isPending}
                  onPress={handleToggleFollow}
                />
                {followError && (
                  <Text className="mt-2 text-rank-down font-label text-[12px]">
                    {followError}
                  </Text>
                )}
              </View>
            )}

            {profile.stats.lists > 0 && (
              <View className="mt-5">
                <LabelCaps className="text-on-surface-variant">
                  {profile.stats.lists} curated{" "}
                  {profile.stats.lists === 1 ? "list" : "lists"}
                </LabelCaps>
              </View>
            )}
          </View>

          {tasteQuery.data?.profile ? (
            <TasteProfilePanel profile={tasteQuery.data.profile} />
          ) : null}

          {/* Tabs */}
          <View className="mt-8 flex-row border-t border-outline-variant/30">
            {(["posts", "rankings"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                className={cn(
                  "flex-1 py-4 items-center",
                  tab === t ? "border-b-2 border-on-surface" : "",
                )}
              >
                <View className="flex-row items-center gap-2">
                  <Icon
                    name={t === "posts" ? "grid-view" : "star-border"}
                    size={16}
                    color={tab === t ? "#1B1C1A" : "#827475"}
                  />
                  <Text
                    className={cn(
                      "font-label-semibold uppercase tracking-widest text-[11px]",
                      tab === t ? "text-on-surface" : "text-on-surface-variant",
                    )}
                  >
                    {t === "posts" ? "Posts" : "Rankings"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {tab === "posts" ? (
            <PostsTab
              posts={postsQuery.data?.posts ?? []}
              isLoading={postsQuery.isLoading}
              onOpen={(id) => router.push(`/post/${id}`)}
              canLoadMore={Boolean(postsQuery.hasNextPage)}
              onLoadMore={() => postsQuery.fetchNextPage()}
              fetchingMore={postsQuery.isFetchingNextPage}
            />
          ) : (
            <RankingsTab
              lists={listsQuery.data?.lists ?? []}
              isLoading={listsQuery.isLoading}
              onOpen={(id) => router.push(`/ranking-list/${id}`)}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

// -------- Header pieces --------

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

function TasteProfilePanel({ profile }: { profile: ApiTasteProfile }) {
  if (profile.stats.visits === 0) return null;
  return (
    <View className="mx-5 mt-6 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
      <View className="flex-row items-center justify-between">
        <LabelCaps>Taste profile</LabelCaps>
        {profile.matchScore != null ? (
          <View className="rounded-full bg-surface-container-low px-3 py-1">
            <Label className="text-[10px]">{profile.matchScore}% match</Label>
          </View>
        ) : null}
      </View>
      <View className="mt-3 flex-row gap-5">
        <Stat value={profile.stats.visits} label="Visits" />
        <Stat value={profile.stats.restaurants} label="Places" />
        <Stat value={profile.stats.dishes} label="Dishes" />
      </View>
      <TasteChips title="Cities" items={profile.topCities} />
      <TasteChips title="Labels" items={profile.topLabels} />
      <TasteChips title="Dishes" items={profile.topDishes} />
    </View>
  );
}

function TasteChips({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  if (items.length === 0) return null;
  return (
    <View className="mt-4">
      <Label className="text-[10px] uppercase tracking-widest">{title}</Label>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {items.slice(0, 6).map((item) => (
          <View
            key={item.label}
            className="rounded-full bg-surface-container-low px-3 py-1"
          >
            <Text className="font-label text-on-surface-variant text-[11px]">
              {item.label} · {item.count}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FollowButton({
  followedByMe,
  followsMe,
  submitting,
  onPress,
}: {
  followedByMe: boolean;
  followsMe: boolean;
  submitting: boolean;
  onPress: () => void;
}) {
  // Copy gives the viewer context without duplicating a separate "Follows you"
  // badge elsewhere in the header.
  const label = followedByMe
    ? "Following"
    : followsMe
    ? "Follow back"
    : "Follow";
  return (
    <Button
      label={submitting ? "…" : label}
      variant={followedByMe ? "secondary" : "primary"}
      onPress={onPress}
      disabled={submitting}
      full
    />
  );
}

// -------- Tabs --------

function PostsTab({
  posts,
  isLoading,
  onOpen,
  canLoadMore,
  onLoadMore,
  fetchingMore,
}: {
  posts: Post[];
  isLoading: boolean;
  onOpen: (id: string) => void;
  canLoadMore: boolean;
  onLoadMore: () => void;
  fetchingMore: boolean;
}) {
  if (isLoading && posts.length === 0) {
    return (
      <View className="py-16 items-center">
        <ActivityIndicator color="#55343B" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View className="px-6 py-10">
        <EmptyCard
          label="Nothing posted"
          body="This curator hasn't shared anything yet."
        />
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row flex-wrap gap-[2px] pt-[2px]">
        {posts.map((p, i) => {
          if (i > 0 && i % 5 === 0) {
            return (
              <TextTile
                key={p.id}
                category={p.tags?.[0] ?? "NOTE"}
                title={p.headline}
                onPress={() => onOpen(p.id)}
              />
            );
          }
          return (
            <PhotoTile
              key={p.id}
              hero={p}
              onPress={() => onOpen(p.id)}
            />
          );
        })}
      </View>

      {canLoadMore && (
        <View className="px-5 mt-6">
          <Button
            label={fetchingMore ? "Loading…" : "Load more"}
            variant="secondary"
            onPress={onLoadMore}
            disabled={fetchingMore}
            full
          />
        </View>
      )}
    </View>
  );
}

function PhotoTile({ hero, onPress }: { hero: Post; onPress: () => void }) {
  const uri = findHeroUri(hero);
  return (
    <Pressable
      onPress={onPress}
      className="w-[33.1%] aspect-square active:opacity-80 bg-surface-container-low"
    >
      {uri ? (
        <Image source={{ uri }} style={{ flex: 1 }} contentFit="cover" />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Icon name="image" size={20} color="#B0A49F" />
        </View>
      )}
    </Pressable>
  );
}

function findHeroUri(post: Post): string | undefined {
  // Objects for any post returned by the feed endpoint are already registered
  // by `mapPost`, so this lookup is a plain cache read — no second fetch.
  return post.imageUrl || (post.objectId ? getObject(post.objectId)?.heroImage : undefined);
}

function TextTile({
  category,
  title,
  onPress,
}: {
  category: string;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="w-[33.1%] aspect-square bg-surface-container-highest p-3 justify-between active:opacity-80"
    >
      <LabelCaps className="text-on-surface-variant">{category}</LabelCaps>
      <Text
        className="font-headline text-on-surface text-[13px] leading-[16px]"
        numberOfLines={4}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function RankingsTab({
  lists,
  isLoading,
  onOpen,
}: {
  lists: RankingList[];
  isLoading: boolean;
  onOpen: (id: string) => void;
}) {
  if (isLoading && lists.length === 0) {
    return (
      <View className="py-16 items-center">
        <ActivityIndicator color="#55343B" />
      </View>
    );
  }

  if (lists.length === 0) {
    return (
      <View className="px-6 py-10">
        <EmptyCard
          label="No rankings yet"
          body="When this curator publishes a list, it'll live here."
        />
      </View>
    );
  }

  return (
    <View className="px-5 pt-6">
      {lists.map((list) => (
        <RankingListCard
          key={list.id}
          list={list}
          onPress={() => onOpen(list.id)}
        />
      ))}
    </View>
  );
}

function EmptyCard({ label, body }: { label: string; body: string }) {
  return (
    <View className="bg-surface-container-low rounded-xl p-6 items-start">
      <LabelCaps>{label}</LabelCaps>
      <HeadlineItalic className="mt-1 text-primary">
        {"\u2014"}
      </HeadlineItalic>
      <Body className="mt-2">{body}</Body>
    </View>
  );
}
