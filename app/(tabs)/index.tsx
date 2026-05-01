import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  Text,
  useWindowDimensions,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { HeadlineItalic } from "@/components/ui/Text";
import { Icon } from "@/components/ui/Icon";
import { MasonryCard, QuoteCard } from "@/components/cards/MasonryCard";
import type { Post } from "@/data/types";
import { useAuth, useFeedQuery, useNotifications } from "@/lib/api";

/**
 * Home (Discover) — editorial waterfall feed (VDK §16.1, §18.1).
 *
 * Data:
 *  - Live `/feed` via react-query `useFeedQuery`. Pages are flattened and
 *    mapped from the API shape into `Post` so the card components stay
 *    agnostic of wire format.
 *  - Pull-to-refresh calls `refetch()`; the next-page load is triggered
 *    when the user scrolls near the bottom.
 *
 * Layout:
 *  - Shortest-column masonry. Running heights are tracked in points; each
 *    tile goes into whichever column currently has less material.
 *  - An editorial quote card is injected at a stable spot (~25% in).
 */

const FEED_CHIPS = [
  {
    id: "for_you",
    label: "For You",
    title: "For you, today",
    params: { scope: "for_you" as const },
  },
  {
    id: "nearby_cafes",
    label: "Cafés near you",
    title: "Cafés near you",
    params: { scope: "home_city" as const, category: "cafe" },
  },
  {
    id: "date_night",
    label: "Date night",
    title: "Date night picks",
    params: { scope: "home_city" as const, category: "restaurant" },
  },
  {
    id: "saved_nearby",
    label: "Saved nearby",
    title: "Saved nearby",
    params: { scope: "home_city" as const, savedOnly: true },
  },
  {
    id: "trending_city",
    label: "Trending here",
    title: "Trending in your city",
    params: { scope: "home_city" as const },
  },
  {
    id: "anywhere",
    label: "Anywhere",
    title: "Anywhere on Zoe",
    params: { scope: "anywhere" as const },
  },
];

type QuoteEntry = {
  kind: "quote";
  id: string;
  quote: string;
  attribution: string;
};
type PostEntry = { kind: "post"; post: Post };
type FeedEntry = PostEntry | QuoteEntry;

const EDITORS_NOTE: QuoteEntry = {
  kind: "quote",
  id: "Q001",
  quote: "Rank what stays with you. Let the rest be noise.",
  attribution: "EDITOR'S NOTE · APRIL",
};

const NEAR_BOTTOM_THRESHOLD = 600; // px from the bottom that triggers pagination

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [activeChipId, setActiveChipId] = useState("for_you");
  const activeChip =
    FEED_CHIPS.find((chip) => chip.id === activeChipId) ?? FEED_CHIPS[0]!;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useFeedQuery(20, {
    ...activeChip.params,
    cityId:
      activeChip.params.scope === "home_city"
        ? user?.preferredCityId ?? user?.homeCityId ?? null
        : null,
  });

  const { width: screenWidth } = useWindowDimensions();
  // feed gutter: px-4 on wrapper, gap-3 between columns -> 16 + 12 + 16 = 44
  const columnWidth = (screenWidth - 44) / 2;

  const posts = useMemo(() => data?.posts ?? [], [data?.posts]);

  const { left, right } = useMemo(
    () => distributeIntoColumns(posts, EDITORS_NOTE, columnWidth),
    [posts, columnWidth],
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onScroll = useCallback(
    (e: {
      nativeEvent: {
        contentOffset: { y: number };
        contentSize: { height: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceToBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (
        distanceToBottom < NEAR_BOTTOM_THRESHOLD &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  return (
    <View className="flex-1 bg-background">
      <GlassTopBar
        leading={
          <Pressable
            className="active:opacity-70"
            hitSlop={10}
            onPress={() => router.push("/compose/post")}
            accessibilityLabel="Compose a post"
          >
            <Icon name="edit" size={22} color="#55343B" />
          </Pressable>
        }
        title={
          <Text className="font-display-italic text-primary text-[22px] tracking-tightest">
            Zoe
          </Text>
        }
        trailing={
          <View className="flex-row items-center gap-4">
            {user ? (
              <Pressable
                hitSlop={10}
                onPress={() => router.push("/notifications")}
                accessibilityLabel="Notifications"
                className="active:opacity-70"
              >
                <View>
                  <Icon name="notifications-none" size={22} color="#55343B" />
                  {unreadCount > 0 && (
                    <View
                      className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-primary items-center justify-center"
                      // Small "dot" when no count; pill shape when 10+
                    >
                      <Text className="text-surface text-[9px] font-label-semibold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ) : null}
            <Avatar uri={user?.avatarUrl} size="sm" />
          </View>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 96, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={120}
        onScroll={onScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={onRefresh}
            tintColor="#55343B"
            colors={["#55343B"]}
            progressBackgroundColor="#FBF9F6"
            progressViewOffset={88}
          />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          <View className="flex-row gap-2">
            {FEED_CHIPS.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                variant={c.id === activeChipId ? "active" : "filled"}
                onPress={() => setActiveChipId(c.id)}
              />
            ))}
          </View>
        </ScrollView>

        <View className="px-5 mb-3">
          <HeadlineItalic className="text-[28px] text-primary">
            {activeChip.title}
          </HeadlineItalic>
        </View>

        {isLoading && posts.length === 0 && (
          <View className="py-24 items-center">
            <ActivityIndicator color="#55343B" />
          </View>
        )}

        {isError && posts.length === 0 && (
          <View className="px-5 py-10">
            <Text className="font-body text-on-surface-variant text-[14px]">
              Couldn&apos;t load the feed.{" "}
              {error instanceof Error ? error.message : "Try again in a moment."}
            </Text>
          </View>
        )}

        <View className="flex-row px-4 gap-3">
          <MasonryColumn
            entries={left}
            onPressPost={(id) => router.push(`/post/${id}`)}
          />
          <MasonryColumn
            entries={right}
            onPressPost={(id) => router.push(`/post/${id}`)}
          />
        </View>

        {isFetchingNextPage && (
          <View className="py-8 items-center">
            <ActivityIndicator color="#55343B" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MasonryColumn({
  entries,
  onPressPost,
}: {
  entries: FeedEntry[];
  onPressPost: (id: string) => void;
}) {
  return (
    <View className="flex-1">
      {entries.map((entry) =>
        entry.kind === "post" ? (
          <MasonryCard
            key={entry.post.id}
            post={entry.post}
            onPress={() => onPressPost(entry.post.id)}
          />
        ) : (
          <QuoteCard
            key={entry.id}
            quote={entry.quote}
            attribution={entry.attribution}
          />
        ),
      )}
    </View>
  );
}

/**
 * Shortest-column waterfall.
 * Running heights are tracked in points; each tile goes into whichever
 * column currently has less material.
 */
function distributeIntoColumns(
  deck: Post[],
  quote: QuoteEntry,
  columnWidth: number,
): { left: FeedEntry[]; right: FeedEntry[] } {
  const columns: { items: FeedEntry[]; height: number }[] = [
    { items: [], height: 0 },
    { items: [], height: 0 },
  ];

  const placeAtShortest = (entry: FeedEntry, height: number) => {
    const target = columns[0].height <= columns[1].height ? 0 : 1;
    columns[target].items.push(entry);
    columns[target].height += height;
  };

  // Drop the editor's note near the top of the first visually balanced spot —
  // after 25% of the deck but before the halfway mark.
  const quoteAnchor = Math.max(1, Math.floor(deck.length * 0.25));

  deck.forEach((post, i) => {
    if (i === quoteAnchor) {
      placeAtShortest(quote, estimateQuoteHeight());
    }
    placeAtShortest(
      { kind: "post", post },
      estimatePostHeight(post, columnWidth),
    );
  });

  return { left: columns[0].items, right: columns[1].items };
}

function estimatePostHeight(post: Post, columnWidth: number): number {
  const ratio = aspectRatioFor(post.aspect);
  const imageHeight = columnWidth / ratio;
  // caption block below the image: title (~2 lines) + caption (~2 lines)
  // + 28pt footer (avatar row). Close enough for balancing purposes.
  const textBlock =
    20 /* title line 1 */ +
    20 /* title line 2 */ +
    6 /* gap */ +
    (post.caption ? 18 + 18 : 0) /* caption up to 2 lines */ +
    14 /* mt-3 */ +
    14 /* avatar/meta row */ +
    16 /* mb-4 card spacing */;
  return imageHeight + textBlock + 12; // +12 for the pt-3 above text
}

function estimateQuoteHeight(): number {
  return 24 + 26 * 3 + 14 + 40 + 16;
}

function aspectRatioFor(aspect: Post["aspect"]): number {
  switch (aspect) {
    case "tall":
      return 4 / 5;
    case "wide":
      return 16 / 10;
    case "square":
    default:
      return 1;
  }
}
