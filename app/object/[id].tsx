import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  View,
  Text,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import {
  Body,
  Display,
  Headline,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { RankingListCard } from "@/components/cards/RankingListCard";
import { cn } from "@/lib/cn";
import type { Post, RankingList } from "@/data/types";
import {
  useAuth,
  useObjectListsQuery,
  useObjectPostsQuery,
  useObjectQuery,
} from "@/lib/api";
import type { ApiObjectDetail } from "@/lib/api/types";

/**
 * Object detail (VDK §15.3, Spec SCREEN 09).
 *
 * The catalogue surface every content reference in the app eventually
 * wants to land on — tapped from Search, from a Ranking List entry, from a
 * Post's object kicker, or from the Compose object chip.
 *
 * Layout: editorial hero (cover, category kicker, title/subtitle, location,
 * short descriptor, tag chips, stats), two CTAs (Write / Add-to-ranking),
 * and two tabs ("Reviews" paginated post feed, "Ranked in" list cards).
 */
type Tab = "reviews" | "rankings";

const TABS: Array<{ id: Tab; label: string; icon: IconName }> = [
  { id: "reviews", label: "Reviews", icon: "grid-view" },
  { id: "rankings", label: "Ranked in", icon: "star-border" },
];

export default function ObjectDetailScreen() {
  const router = useRouter();
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = raw ?? "";

  const objectQuery = useObjectQuery(id);
  const postsQuery = useObjectPostsQuery(id);
  const listsQuery = useObjectListsQuery(id);
  const { isSignedIn } = useAuth();

  const object = objectQuery.data;
  const posts: Post[] = postsQuery.data?.posts ?? [];
  const lists: RankingList[] = listsQuery.data?.lists ?? [];

  const [tab, setTab] = useState<Tab>("reviews");

  const onShare = () => {
    if (!object) return;
    Share.share({
      message: `${object.title}${object.city ? ` · ${object.city}` : ""} on Zoe\nhttps://zoe.app/o/${object.id}`,
    }).catch(() => undefined);
  };

  const onWriteAbout = () => {
    if (!object) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    router.push(`/compose/post?objectId=${object.id}`);
  };

  const onAddToRanking = () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    // Carry the object through the add-to-ranking flow so the user lands
    // directly on the list-pick step with the item pre-selected.
    if (object) {
      router.push(`/rank/add?objectId=${object.id}`);
    } else {
      router.push("/rank/add");
    }
  };

  const refreshing =
    objectQuery.isRefetching ||
    postsQuery.isRefetching ||
    listsQuery.isRefetching;

  const onRefresh = () => {
    objectQuery.refetch();
    postsQuery.refetch();
    listsQuery.refetch();
  };

  return (
    <View className="flex-1 bg-background">
      <GlassTopBar
        leading={
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Icon name="arrow-back" size={22} color="#55343B" />
          </Pressable>
        }
        title={
          <Text
            className="font-display-italic text-primary text-[18px] tracking-tightest"
            numberOfLines={1}
          >
            {object?.title ?? "Zoe"}
          </Text>
        }
        trailing={
          <Pressable hitSlop={10} onPress={onShare}>
            <Icon name="ios-share" size={20} color="#55343B" />
          </Pressable>
        }
      />

      {objectQuery.isLoading && !object && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#55343B" />
        </View>
      )}

      {objectQuery.isError && !object && (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Headline>Couldn&apos;t load this</Headline>
          <Body>
            {objectQuery.error instanceof Error
              ? objectQuery.error.message
              : "Try again in a moment."}
          </Body>
          <Button label="Go back" onPress={() => router.back()} />
        </View>
      )}

      {object && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 96, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#55343B"
              colors={["#55343B"]}
              progressBackgroundColor="#FBF9F6"
              progressViewOffset={88}
            />
          }
        >
          <Hero object={object} />

          {/* CTAs */}
          <View className="mt-6 px-5 flex-row gap-3">
            <View className="flex-1">
              <Button label="Write about it" onPress={onWriteAbout} full />
            </View>
            <View className="flex-1">
              <Button
                label="Add to a ranking"
                variant="secondary"
                onPress={onAddToRanking}
                full
              />
            </View>
          </View>

          {/* Tabs */}
          <View className="mt-8 flex-row border-t border-outline-variant/30">
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
                      tab === t.id
                        ? "text-on-surface"
                        : "text-on-surface-variant",
                    )}
                  >
                    {t.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          {tab === "reviews" ? (
            <ReviewsTab
              posts={posts}
              isLoading={postsQuery.isLoading}
              canLoadMore={Boolean(postsQuery.hasNextPage)}
              fetchingMore={postsQuery.isFetchingNextPage}
              onLoadMore={() => postsQuery.fetchNextPage()}
              onOpen={(postId) => router.push(`/post/${postId}`)}
            />
          ) : (
            <RankingsTab
              lists={lists}
              isLoading={listsQuery.isLoading}
              onOpen={(listId) => router.push(`/ranking-list/${listId}`)}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ---------------- Hero ----------------

function Hero({ object }: { object: ApiObjectDetail }) {
  return (
    <View>
      {object.heroImage ? (
        <View className="mx-5 rounded-xl overflow-hidden bg-surface-container-low">
          <Image
            source={{ uri: object.heroImage }}
            style={{ aspectRatio: 16 / 10 }}
            contentFit="cover"
            transition={280}
            className="w-full"
          />
        </View>
      ) : null}

      <View className="px-6 pt-6">
        <LabelCaps className="text-primary">{object.type}</LabelCaps>
        <Display className="mt-2 text-[32px] leading-[36px]">
          {object.title}
        </Display>
        {object.subtitle ? (
          <HeadlineItalic className="mt-2 text-on-surface-variant text-[16px]">
            {object.subtitle}
          </HeadlineItalic>
        ) : null}

        {(object.city || object.neighborhood) && (
          <View className="flex-row items-center mt-3">
            <Icon name="place" size={14} color="#827475" />
            <Label className="ml-1 text-[12px]">
              {[object.neighborhood, object.city].filter(Boolean).join(" · ")}
            </Label>
          </View>
        )}

        {object.shortDescriptor ? (
          <Body className="mt-4 text-[15px] leading-[22px]">
            {object.shortDescriptor}
          </Body>
        ) : null}

        {/* Stats */}
        <View className="flex-row items-center gap-6 mt-5">
          <Stat label="Posts" value={object._count.posts} />
          <Stat label="Rankings" value={object._count.entries} />
        </View>

        {/* Tags */}
        {object.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 mt-5">
            {object.tags.map((t) => (
              <View
                key={t}
                className="px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/20"
              >
                <Text className="font-label text-on-surface-variant text-[11px]">
                  #{t.replace(/[-_\s]/g, "")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const formatted =
    value >= 1000 ? `${(value / 1000).toFixed(1)}K` : `${value}`;
  return (
    <View>
      <Text className="font-headline text-on-surface text-[20px]">
        {formatted}
      </Text>
      <Label className="mt-0.5 text-[10px] uppercase tracking-widest">
        {label}
      </Label>
    </View>
  );
}

// ---------------- Tabs ----------------

function ReviewsTab({
  posts,
  isLoading,
  canLoadMore,
  fetchingMore,
  onLoadMore,
  onOpen,
}: {
  posts: Post[];
  isLoading: boolean;
  canLoadMore: boolean;
  fetchingMore: boolean;
  onLoadMore: () => void;
  onOpen: (id: string) => void;
}) {
  if (isLoading && posts.length === 0) {
    return (
      <View className="py-12 items-center">
        <ActivityIndicator color="#55343B" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyPane
        label="No reviews yet"
        body="Be the first — a single thoughtful paragraph is a review on Zoe."
      />
    );
  }

  return (
    <View>
      <View className="px-5 pt-6 gap-3">
        {posts.map((p) => (
          <PostSummaryCard key={p.id} post={p} onPress={() => onOpen(p.id)} />
        ))}
      </View>

      {canLoadMore && (
        <Pressable
          onPress={onLoadMore}
          disabled={fetchingMore}
          className="py-4 items-center active:opacity-70"
        >
          <Label className="text-[11px] uppercase tracking-widest">
            {fetchingMore ? "Loading…" : "Load more"}
          </Label>
        </Pressable>
      )}
    </View>
  );
}

function PostSummaryCard({
  post,
  onPress,
}: {
  post: Post;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-xl bg-surface-container-lowest border border-outline-variant/15",
        "active:opacity-90",
      )}
      style={{
        shadowColor: "#1B1C1A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 1,
      }}
    >
      <View className="p-4">
        <HeadlineItalic className="text-primary text-[18px] leading-[22px]">
          {post.headline}
        </HeadlineItalic>
        <Body
          className="mt-2 text-[13px] leading-[18px] text-on-surface-variant"
          numberOfLines={3}
        >
          {post.caption}
        </Body>
        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Icon name="favorite-border" size={14} color="#827475" />
              <Label className="text-[11px]">{post.likes}</Label>
            </View>
            <View className="flex-row items-center gap-1">
              <Icon name="chat-bubble-outline" size={14} color="#827475" />
              <Label className="text-[11px]">{post.comments}</Label>
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <Label className="text-[11px]">Open review</Label>
            <Icon name="chevron-right" size={14} color="#827475" />
          </View>
        </View>
      </View>
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
      <View className="py-12 items-center">
        <ActivityIndicator color="#55343B" />
      </View>
    );
  }

  if (lists.length === 0) {
    return (
      <EmptyPane
        label="Not ranked yet"
        body="Be the first to put this in a list — it'll show up here for future viewers."
      />
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

function EmptyPane({ label, body }: { label: string; body: string }) {
  return (
    <View className="px-6 py-10">
      <View className="bg-surface-container-low rounded-xl p-6">
        <LabelCaps>{label}</LabelCaps>
        <Body className="mt-2">{body}</Body>
      </View>
    </View>
  );
}
