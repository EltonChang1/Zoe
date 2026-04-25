import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  Text,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import {
  Body,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useAuth, useNotifications } from "@/lib/api";
import type { ApiNotificationItem } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/time";

/**
 * Inbox — the loop-closer for Zoe's social graph.
 *
 * Rendering is flat and chronological for MVP. Grouping ("Mira and 3
 * others liked your post") is a later iteration once we have enough
 * signal to know which groupings actually feel right.
 *
 * On mount we advance the last-seen bookmark so the home-screen bell
 * clears the dot, matching common expectations (opening the inbox
 * constitutes "seeing" everything currently visible).
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { query, items, markAllSeen } = useNotifications();

  useEffect(() => {
    if (!isSignedIn) return;
    // Wait until we have a first page, so the bookmark advances to the
    // real newest timestamp (not an optimistic `now` from an empty list).
    if (query.isSuccess) {
      markAllSeen();
    }
  }, [isSignedIn, query.isSuccess, markAllSeen]);

  // Auth gate — unauthenticated callers get a signed-out card.
  if (!isSignedIn) {
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
              Activity
            </Text>
          }
        />
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-surface-container-low rounded-xl p-6">
            <LabelCaps>No inbox yet</LabelCaps>
            <Body className="mt-2">
              Sign in to see who&apos;s been engaging with your posts and
              rankings.
            </Body>
            <View className="mt-4">
              <Button
                label="Sign in"
                onPress={() => router.push("/(auth)/sign-in")}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  const { isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    query;

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
            Activity
          </Text>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 96, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor="#55343B"
            colors={["#55343B"]}
            progressBackgroundColor="#FBF9F6"
            progressViewOffset={88}
          />
        }
      >
        <View className="px-5 mb-5">
          <LabelCaps>Your circle</LabelCaps>
          <HeadlineItalic className="mt-1 text-primary text-[30px]">
            Who&apos;s been around
          </HeadlineItalic>
        </View>

        {isLoading && items.length === 0 && (
          <View className="py-12 items-center">
            <ActivityIndicator color="#55343B" />
          </View>
        )}

        {isError && items.length === 0 && (
          <View className="px-5">
            <View className="rounded-xl bg-surface-container-low p-5">
              <LabelCaps>Couldn&apos;t load your inbox</LabelCaps>
              <Body className="mt-2">
                Something went sideways. Pull to try again.
              </Body>
            </View>
          </View>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <View className="px-5">
            <View className="rounded-xl bg-surface-container-low p-5">
              <LabelCaps>All quiet</LabelCaps>
              <Body className="mt-2">
                You&apos;re caught up. New likes, replies, and follows land
                here the moment they happen.
              </Body>
            </View>
          </View>
        )}

        {items.length > 0 && (
          <View className="px-5 gap-2">
            {items.map((n) => (
              <NotificationRow
                key={n.id}
                item={n}
                onOpen={() => openTarget(n, router)}
              />
            ))}

            {hasNextPage && (
              <Pressable
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="py-4 items-center active:opacity-70"
              >
                <Label className="text-[11px] uppercase tracking-widest">
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </Label>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------- Row ----------------

/**
 * Visual + copy per notification type. Kept in one place so the bell
 * and any future surface (push payloads, etc.) agree on phrasing.
 */
const VERB: Record<
  ApiNotificationItem["type"],
  { icon: IconName; tint: string; copy: (postHead?: string) => string }
> = {
  like: {
    icon: "favorite",
    tint: "#B4374E",
    copy: (h) =>
      h ? `liked your post "${truncate(h, 60)}"` : "liked your post",
  },
  comment: {
    icon: "chat-bubble",
    tint: "#55343B",
    copy: (h) =>
      h ? `commented on "${truncate(h, 60)}"` : "commented on your post",
  },
  reply: {
    icon: "reply",
    tint: "#55343B",
    copy: () => "replied to your comment",
  },
  follow: {
    icon: "person-add",
    tint: "#6B553B",
    copy: () => "started following you",
  },
};

function NotificationRow({
  item,
  onOpen,
}: {
  item: ApiNotificationItem;
  onOpen: () => void;
}) {
  const meta = VERB[item.type];
  return (
    <Pressable
      onPress={onOpen}
      className={cn(
        "flex-row items-start gap-3 rounded-xl p-4",
        "bg-surface-container-lowest border border-outline-variant/15",
        "active:opacity-90",
      )}
      style={{
        shadowColor: "#1B1C1A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 14,
        elevation: 1,
      }}
    >
      <View className="relative">
        <Avatar
          uri={
            item.actor.avatarUrl ??
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"
          }
          size="md"
        />
        <View
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
          style={{ backgroundColor: meta.tint }}
        >
          <Icon name={meta.icon} size={11} color="#FFFFFF" />
        </View>
      </View>

      <View className="flex-1">
        <Text
          className="text-on-surface text-[14px] leading-[19px]"
          numberOfLines={3}
        >
          <Text className="font-body-medium">{item.actor.displayName}</Text>
          <Text className="text-on-surface-variant">
            {" "}
            {meta.copy(item.target.postHeadline)}
          </Text>
        </Text>

        {item.target.commentBody && (
          <Text
            className="mt-1 text-on-surface-variant text-[13px] leading-[18px]"
            numberOfLines={2}
          >
            &ldquo;{item.target.commentBody}&rdquo;
          </Text>
        )}

        <Label className="mt-1 text-[11px]">
          {formatRelativeTime(item.createdAt)} · @{item.actor.handle}
        </Label>
      </View>
    </Pressable>
  );
}

// ---------------- Helpers ----------------

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function openTarget(
  item: ApiNotificationItem,
  router: ReturnType<typeof useRouter>,
) {
  switch (item.type) {
    case "like":
    case "comment":
    case "reply":
      if (item.target.postId) {
        router.push(`/post/${item.target.postId}`);
      }
      return;
    case "follow":
      if (item.target.handle) {
        router.push(`/user/${item.target.handle}`);
      }
      return;
  }
}
