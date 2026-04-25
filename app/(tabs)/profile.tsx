import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import {
  Body,
  Display,
  Headline,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { Icon } from "@/components/ui/Icon";
import { RankingListCard } from "@/components/cards/RankingListCard";
import type { IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { getObject } from "@/data/objects";
import type { Post, RankingList } from "@/data/types";
import { currentUserId, getUser } from "@/data/users";
import {
  ApiHttpError,
  mapUser,
  useAuth,
  useOwnerRankingListsQuery,
  useUserPostsQuery,
  useUserProfileQuery,
} from "@/lib/api";

/**
 * Self profile (VDK §18.5, Spec SCREEN 21 / Design_guide/profile_page).
 *
 * Lives at the canonical `(tabs)/profile` surface (the other-user
 * `/user/:handle` route redirects self-views here so the Sign-out affordance
 * stays in one place). The editorial chrome — glass top bar, highlights,
 * 3-tab grid — is preserved from the mock prototype; data reads now go
 * through the same hooks the other-user screen uses.
 */
type Tab = "posts" | "shorts" | "rankings";
const TABS: Array<{ id: Tab; label: string; icon: IconName }> = [
  { id: "posts", label: "Posts", icon: "grid-view" },
  { id: "shorts", label: "Shorts", icon: "play-arrow" },
  { id: "rankings", label: "Rankings", icon: "star-border" },
];

const HIGHLIGHTS = ["Cafés", "Travel", "Perfume", "Albums", "+"];

const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=200&q=60";

export default function ProfileScreen() {
  const router = useRouter();
  const { user: apiUser, signOut, deleteAccount, resendVerificationEmail } =
    useAuth();
  const [resendBusy, setResendBusy] = useState(false);
  const handle = apiUser?.handle ?? null;

  // Live profile for the signed-in user. When signed-out we still render the
  // prototype mock "Clara" so the tab has a recognisable shape (auth is not
  // gated here — Home + Rankings both handle unauth states already).
  const profileQuery = useUserProfileQuery(handle);
  const postsQuery = useUserPostsQuery(handle);
  const listsQuery = useOwnerRankingListsQuery(handle);

  const profile = profileQuery.data;
  const posts = postsQuery.data?.posts ?? [];
  const lists = listsQuery.data?.lists ?? [];

  // Fallback for the signed-out / loading-boot case.
  const fallbackMe = apiUser ? mapUser(apiUser) : getUser(currentUserId);
  const displayName = profile?.displayName ?? fallbackMe.displayName;
  const avatarUri = profile?.avatarUrl ?? fallbackMe.avatar ?? AVATAR_FALLBACK;
  const bio = profile?.bio ?? fallbackMe.bio;
  const stats = profile?.stats ?? {
    posts: fallbackMe.postsCount,
    followers: fallbackMe.followers,
    following: fallbackMe.following,
    lists: 0,
  };

  const [tab, setTab] = useState<Tab>("posts");

  // Two-step destructive confirm for account deletion. The first alert is
  // the action-sheet-style menu (Sign out / Delete account); the second is
  // the explicit "are you sure?" prompt required by App Store review.
  // We use plain Alert on both platforms so we don't add a custom menu
  // dependency just for two entries.
  const openDeleteConfirm = () => {
    Alert.alert(
      "Delete your account?",
      "This permanently removes your profile, posts, shorts, rankings, comments, likes and saves. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              // The AuthProvider clears the local session on success, so
              // the screen re-renders as signed-out. Send the user back
              // to Home so they can browse or sign up again.
              router.replace("/");
            } catch (err) {
              Alert.alert(
                "Couldn't delete account",
                err instanceof Error
                  ? err.message
                  : "Please try again in a moment.",
              );
            }
          },
        },
      ],
    );
  };

  const openMoreMenu = () => {
    if (!apiUser) {
      router.push("/sign-in");
      return;
    }
    Alert.alert(displayName, undefined, [
      {
        text: "Blocked users",
        // Cast until expo-router regenerates typed-route metadata for
        // the new `app/settings/blocked` screen on next dev boot.
        onPress: () => router.push("/settings/blocked" as never),
      },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
      {
        text: "Delete account",
        style: "destructive",
        onPress: openDeleteConfirm,
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Creation sheet (PRD §22.3 — posting from Profile, not from an Add tab).
  // One affordance that reveals every creation type the app ships today.
  const openCreateMenu = () => {
    if (!apiUser) {
      router.push("/sign-in");
      return;
    }
    Alert.alert("Create", undefined, [
      {
        text: "Post",
        onPress: () => router.push("/compose/post"),
      },
      {
        text: "Short",
        onPress: () => router.push("/compose/short"),
      },
      {
        text: "Ranking",
        onPress: () => router.push("/rank/add"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const refreshing =
    profileQuery.isRefetching ||
    postsQuery.isRefetching ||
    listsQuery.isRefetching;

  const onRefresh = () => {
    profileQuery.refetch();
    postsQuery.refetch();
    listsQuery.refetch();
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
          <View className="flex-row items-center gap-4">
            {apiUser ? (
              <Pressable
                hitSlop={10}
                onPress={openCreateMenu}
                accessibilityLabel="Create a post, short, or ranking"
              >
                <Icon name="add" size={22} color="#55343B" />
              </Pressable>
            ) : null}
            <Pressable hitSlop={10} onPress={openMoreMenu}>
              <Icon name="more-horiz" size={22} color="#55343B" />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 96, paddingBottom: 140 }}
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
        {/* Header */}
        <View className="px-6 pt-2">
          {apiUser?.emailVerified === false ? (
            <View className="mb-5 rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3">
              <Body className="text-[13px] leading-[19px] text-primary">
                Verify your email to secure your account. Check your inbox for
                the link, or resend below.
              </Body>
              <Pressable
                className="mt-3 self-start active:opacity-70"
                disabled={resendBusy}
                onPress={async () => {
                  setResendBusy(true);
                  try {
                    await resendVerificationEmail();
                    Alert.alert(
                      "Email sent",
                      "If you don’t see it, check spam or try again in a minute.",
                    );
                  } catch (e) {
                    Alert.alert(
                      "Couldn’t send",
                      e instanceof ApiHttpError
                        ? e.message
                        : e instanceof Error
                          ? e.message
                          : "Please try again shortly.",
                    );
                  } finally {
                    setResendBusy(false);
                  }
                }}
              >
                <Label className="text-primary text-[12px] uppercase tracking-widest underline">
                  {resendBusy ? "Sending…" : "Resend verification email"}
                </Label>
              </Pressable>
            </View>
          ) : null}
          <View className="flex-row items-center">
            <Avatar uri={avatarUri} size="xl" />
            <View className="flex-1 flex-row justify-around ml-6">
              <Stat value={stats.posts} label="Posts" />
              <Stat value={stats.followers} label="Followers" />
              <Stat value={stats.following} label="Following" />
            </View>
          </View>

          <Display className="mt-5 text-[28px] leading-[32px]">
            {displayName}
          </Display>
          {bio ? (
            <Body className="mt-2 leading-[20px]">{bio}</Body>
          ) : null}

          {!apiUser && (
            <Pressable
              onPress={() => router.push("/sign-in")}
              className="mt-4 self-start rounded-full bg-primary px-4 py-2 active:opacity-90"
            >
              <Label className="text-on-primary text-[12px] uppercase tracking-widest">
                Sign in
              </Label>
            </Pressable>
          )}
        </View>

        {/* Highlights (static for now — first-party highlight reels aren't
            on the roadmap yet). */}
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

        {tab === "posts" && (
          <PostsGrid
            posts={posts}
            isLoading={postsQuery.isLoading}
            canLoadMore={Boolean(postsQuery.hasNextPage)}
            fetchingMore={postsQuery.isFetchingNextPage}
            onLoadMore={() => postsQuery.fetchNextPage()}
            onOpen={(id) => router.push(`/post/${id}`)}
            isSignedIn={Boolean(apiUser)}
          />
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
          <RankingsPane
            lists={lists}
            isLoading={listsQuery.isLoading}
            onOpen={(id) => router.push(`/ranking-list/${id}`)}
            isSignedIn={Boolean(apiUser)}
          />
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

function PostsGrid({
  posts,
  isLoading,
  canLoadMore,
  fetchingMore,
  onLoadMore,
  onOpen,
  isSignedIn,
}: {
  posts: Post[];
  isLoading: boolean;
  canLoadMore: boolean;
  fetchingMore: boolean;
  onLoadMore: () => void;
  onOpen: (id: string) => void;
  isSignedIn: boolean;
}) {
  if (isLoading && posts.length === 0) {
    return (
      <View className="py-12 items-center">
        <ActivityIndicator color="#55343B" />
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <EmptyPane
        label="Sign in to see your posts"
        body="Zoe remembers every review you publish — sign in to bring them back."
      />
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyPane
        label="No posts yet"
        body="Share your first review — every headline you publish will live right here."
      />
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
          return <PhotoTile key={p.id} post={p} onPress={() => onOpen(p.id)} />;
        })}
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

function PhotoTile({ post, onPress }: { post: Post; onPress: () => void }) {
  const uri = getObject(post.objectId)?.heroImage;
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

function RankingsPane({
  lists,
  isLoading,
  onOpen,
  isSignedIn,
}: {
  lists: RankingList[];
  isLoading: boolean;
  onOpen: (id: string) => void;
  isSignedIn: boolean;
}) {
  if (isLoading && lists.length === 0) {
    return (
      <View className="py-12 items-center">
        <ActivityIndicator color="#55343B" />
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <EmptyPane
        label="Sign in to see your lists"
        body="Your rankings sync across devices once you're signed in."
      />
    );
  }

  if (lists.length === 0) {
    return (
      <EmptyPane
        label="No lists yet"
        body="Start a list from the Add tab — rank anything from cafés to perfumes."
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
