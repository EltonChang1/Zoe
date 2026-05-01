import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Text,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { Icon, IconName } from "@/components/ui/Icon";
import { ShortMedia } from "@/components/shorts/ShortMedia";
import {
  Body,
  Headline,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import {
  useAuth,
  useBlockUser,
  useCreateShortComment,
  useDeleteShort,
  useDeleteShortComment,
  useLikeShort,
  useReport,
  useSaveShort,
  useShortComments,
  useShortsQuery,
} from "@/lib/api";
import { confirmBlock, runReportFlow } from "@/components/moderation/actions";
import type { ApiShort, ApiShortComment } from "@/lib/api/types";
import { getSpotifyLinks, openSpotifyLinks } from "@/lib/music/spotifyLinks";
import { formatRelativeTime } from "@/lib/time";
import { gradients } from "@/theme/tokens";

const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80";

/**
 * Shorts — immersive vertical surface.
 * VDK §16.6, §18.4; Design_guide/shorts_page/code.html.
 *
 * Layout is a pager scroll of hero frames with a glass action rail on the
 * right. Like / save now persist per-user via `/shorts/:id/{like,save}`
 * with an optimistic cache update so the rail is instantly responsive.
 * The comment button opens a bottom-sheet modal backed by
 * `/shorts/:id/comments` with optimistic append + delete.
 */
export default function ShortsScreen() {
  const router = useRouter();
  const { height } = Dimensions.get("window");
  const [index, setIndex] = useState(0);
  const lastFetchedIndex = useRef(-1);

  const query = useShortsQuery(10);
  const shorts = query.data?.shorts ?? [];

  // Active short for the comment sheet. `null` means the sheet is hidden.
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  // Global mute state for the pager. Starting muted matches iOS autoplay
  // constraints (video can only autoplay with sound after a user gesture)
  // and the standard shorts UX — tap unmute once, it sticks.
  const [muted, setMuted] = useState(true);
  const onToggleMute = useCallback(() => setMuted((m) => !m), []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const i = Math.round(y / height);
      if (i !== index) setIndex(i);

      if (
        query.hasNextPage &&
        !query.isFetchingNextPage &&
        i >= shorts.length - 2 &&
        lastFetchedIndex.current !== i
      ) {
        lastFetchedIndex.current = i;
        query.fetchNextPage();
      }
    },
    [height, index, query, shorts.length],
  );

  if (query.isLoading && shorts.length === 0) {
    return (
      <View className="flex-1 bg-ink">
        <ShortsTopBar />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FBF9F6" />
        </View>
      </View>
    );
  }

  if (query.isError && shorts.length === 0) {
    return (
      <View className="flex-1 bg-ink">
        <ShortsTopBar />
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <Headline className="text-surface text-center">
            Shorts couldn&apos;t load
          </Headline>
          <Body className="text-surface/70 text-center">
            {query.error instanceof Error
              ? query.error.message
              : "Check your connection and try again."}
          </Body>
          <Button label="Try again" onPress={() => query.refetch()} />
        </View>
      </View>
    );
  }

  if (shorts.length === 0) {
    return (
      <View className="flex-1 bg-ink">
        <ShortsTopBar />
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <HeadlineItalic className="text-surface text-center">
            Quiet here — for now.
          </HeadlineItalic>
          <Body className="text-surface/70 text-center">
            Shorts will appear here as curators publish them.
          </Body>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <ShortsTopBar />

      <ScrollView
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {shorts.map((s, i) => (
          <ShortFrame
            key={s.id}
            short={s}
            height={height}
            active={i === index}
            muted={muted}
            onToggleMute={onToggleMute}
            onOpenObject={() => router.push(`/object/${s.object.id}`)}
            onOpenAuthor={() => router.push(`/user/${s.author.handle}`)}
            onOpenComments={() => setActiveSheet(s.id)}
          />
        ))}

        {query.isFetchingNextPage && (
          <View
            style={{ height: 80 }}
            className="items-center justify-center"
          >
            <ActivityIndicator color="#FBF9F6" />
          </View>
        )}
      </ScrollView>

      <CommentsSheet
        shortId={activeSheet}
        onClose={() => setActiveSheet(null)}
      />
    </View>
  );
}

function ShortsTopBar() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  return (
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
      trailing={
        <Pressable
          hitSlop={10}
          onPress={() =>
            router.push(isSignedIn ? "/compose/short" : "/sign-in")
          }
          accessibilityLabel="Create a short"
        >
          <Icon name="add" size={22} color="#FBF9F6" />
        </Pressable>
      }
    />
  );
}

// ---------------- Short frame ----------------

function ShortFrame({
  short,
  height,
  active,
  muted,
  onToggleMute,
  onOpenObject,
  onOpenAuthor,
  onOpenComments,
}: {
  short: ApiShort;
  height: number;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onOpenObject: () => void;
  onOpenAuthor: () => void;
  onOpenComments: () => void;
}) {
  const router = useRouter();
  const { isSignedIn, user } = useAuth();
  const likeMutation = useLikeShort();
  const saveMutation = useSaveShort();
  const deleteShortMutation = useDeleteShort();
  const reportMutation = useReport();
  const blockMutation = useBlockUser();

  const liked = short.viewer?.likedByMe ?? false;
  const saved = short.viewer?.savedByMe ?? false;
  const isAuthor = Boolean(user?.id && user.id === short.author.id);
  const spotifyLinks = getSpotifyLinks(short.object);
  const hasSpotify = Boolean(spotifyLinks.uri || spotifyLinks.webUrl);

  const onLike = () => {
    if (!isSignedIn) return router.push("/sign-in");
    likeMutation.mutate({ id: short.id, liked });
  };
  const onSave = () => {
    if (!isSignedIn) return router.push("/sign-in");
    saveMutation.mutate({ id: short.id, saved });
  };
  const onMore = () => {
    if (isAuthor) {
      Alert.alert(
        "Delete short?",
        "This removes the clip and all its likes, saves and comments. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () =>
              deleteShortMutation.mutate(short.id, {
                onError: (err) =>
                  Alert.alert(
                    "Couldn't delete short",
                    err instanceof Error
                      ? err.message
                      : "Please try again in a moment.",
                  ),
              }),
          },
        ],
      );
      return;
    }
    // Non-authors: Report clip / Block creator.
    Alert.alert("More", "What would you like to do?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report clip",
        style: "destructive",
        onPress: () =>
          runReportFlow({
            subjectLabel: "clip",
            subjectType: "short",
            subjectId: short.id,
            submit: (input) => reportMutation.mutateAsync(input),
          }),
      },
      {
        text: `Block @${short.author.handle}`,
        style: "destructive",
        onPress: async () => {
          const ok = await confirmBlock(short.author.displayName);
          if (!ok) return;
          blockMutation.mutate(short.author.handle, {
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

  return (
    <View style={{ height }} className="relative">
      <ShortMedia
        heroImage={short.heroImage}
        videoUrl={short.videoUrl ?? null}
        preserveArtwork={hasSpotify}
        active={active}
        muted={muted}
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

      {/* Mute toggle. Lives above the gradients so touches pass through
          and the chip is readable against the top darkening. Only
          rendered when there's a video to mute — image-only shorts keep
          the top-right corner clean. */}
      {short.videoUrl ? (
        <View className="absolute right-5 top-28">
          <Pressable
            onPress={onToggleMute}
            hitSlop={10}
            accessibilityLabel={muted ? "Unmute" : "Mute"}
            className="active:opacity-70"
          >
            <BlurView
              intensity={30}
              tint="dark"
              className="overflow-hidden rounded-full"
            >
              <View className="bg-white/10 border border-white/20 w-9 h-9 items-center justify-center">
                <Icon
                  name={muted ? "volume-off" : "volume-up"}
                  size={18}
                  color="#FBF9F6"
                />
              </View>
            </BlurView>
          </Pressable>
        </View>
      ) : null}

      {short.rankingRank != null && short.rankingListTitle ? (
        <View className="absolute left-5 top-28">
          <BlurView
            intensity={30}
            tint="dark"
            className="overflow-hidden rounded-full"
          >
            <View className="flex-row items-center bg-white/10 border border-white/20 px-3 py-1.5 gap-2">
              <LabelCaps className="text-surface">
                #{short.rankingRank}
              </LabelCaps>
              <Text
                className="font-label text-surface text-[11px] max-w-[180px]"
                numberOfLines={1}
              >
                {short.rankingListTitle}
              </Text>
            </View>
          </BlurView>
        </View>
      ) : null}

      {/* Right rail */}
      <View className="absolute right-4 bottom-40 items-center gap-5">
        <RailAction icon="format-list-numbered" label="RANK" filled />
        <RailAction
          icon={liked ? "favorite" : "favorite-border"}
          label={formatCount(short.stats.likes)}
          onPress={onLike}
          accent={liked ? "#E5678B" : undefined}
        />
        <RailAction
          icon="chat-bubble-outline"
          label={formatCount(short.stats.comments)}
          onPress={onOpenComments}
        />
        <RailAction
          icon={saved ? "bookmark" : "bookmark-border"}
          label={formatCount(short.stats.saves)}
          onPress={onSave}
          accent={saved ? "#F5D388" : undefined}
        />
        <RailAction
          icon="more-horiz"
          label=""
          onPress={isSignedIn ? onMore : undefined}
        />
      </View>

      {/* Bottom-left info */}
      <View className="absolute left-5 right-24 bottom-28">
        <Pressable
          onPress={onOpenAuthor}
          className="flex-row items-center mb-3 active:opacity-80"
          hitSlop={6}
        >
          <Avatar uri={short.author.avatarUrl ?? AVATAR_FALLBACK} size="sm" />
          <View className="ml-3">
            <Text className="font-headline text-surface text-[16px]">
              {short.author.displayName}
            </Text>
            <LabelCaps className="text-surface/70">Curator</LabelCaps>
          </View>
        </Pressable>

        <HeadlineItalic className="text-surface text-[22px] leading-[26px] mb-2">
          {short.hookLine}
        </HeadlineItalic>
        <Body className="text-surface/80 text-[13px] leading-[18px]">
          {short.caption}
        </Body>

        <View className="flex-row gap-2 mt-4">
          <Pressable onPress={onOpenObject} hitSlop={4}>
            <DarkPill icon="label" label={short.object.title} />
          </Pressable>
          {short.audioLabel ? (
            <DarkPill icon="music-note" label={short.audioLabel} />
          ) : null}
          {hasSpotify ? (
            <Pressable
              onPress={() => openSpotifyLinks(spotifyLinks).catch(() => undefined)}
              hitSlop={4}
            >
              <DarkPill icon="library-music" label="Listen on Spotify" />
            </Pressable>
          ) : null}
        </View>
        {hasSpotify ? (
          <Label className="mt-2 text-[10px] text-surface/60">
            Metadata by Spotify
          </Label>
        ) : null}
      </View>
    </View>
  );
}

function RailAction({
  icon,
  label,
  filled = false,
  accent,
  onPress,
}: {
  icon: IconName;
  label: string;
  filled?: boolean;
  accent?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center active:opacity-70"
      hitSlop={4}
    >
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
          <Icon
            name={icon}
            size={22}
            color={accent ?? (filled ? "#55343B" : "#FBF9F6")}
          />
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
        <Text
          className="font-label text-surface text-[11px] max-w-[160px]"
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </BlurView>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

// ---------------- Comments sheet ----------------

/**
 * Bottom-sheet modal for short comments. Renders over the top of the pager
 * (the Shorts ScrollView stays mounted so scroll position is preserved).
 * Keyboard-aware so the input isn't covered when a reply is being typed.
 */
function CommentsSheet({
  shortId,
  onClose,
}: {
  shortId: string | null;
  onClose: () => void;
}) {
  const { height } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const { user, isSignedIn } = useAuth();
  const router = useRouter();

  const commentsQuery = useShortComments(shortId ?? null);
  const createMutation = useCreateShortComment();
  const deleteMutation = useDeleteShortComment();

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ApiShortComment | null>(null);

  // Rebuild the flat-to-tree shape for rendering. The server already
  // returns replies nested under their parent, so this is mostly a pass-
  // through — we just stitch pages together.
  const comments = useMemo(
    () => commentsQuery.data?.comments ?? [],
    [commentsQuery.data],
  );

  const onSubmit = async () => {
    if (!shortId) return;
    if (!isSignedIn) {
      onClose();
      router.push("/sign-in");
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed) return;
    const parentId = replyTo?.parentId ?? replyTo?.id;
    setDraft("");
    setReplyTo(null);
    try {
      await createMutation.mutateAsync({
        id: shortId,
        body: trimmed,
        parentId,
      });
    } catch {
      // Rollback handled by the mutation; restore draft so the user can retry.
      setDraft(trimmed);
    }
  };

  const onDelete = (commentId: string) => {
    if (!shortId) return;
    deleteMutation.mutate({ shortId, commentId });
  };

  return (
    <Modal
      visible={shortId != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        {/* Backdrop — dim + dismiss on tap. */}
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <View
            className="bg-surface rounded-t-3xl overflow-hidden"
            style={{ maxHeight: height * 0.78, minHeight: height * 0.55 }}
          >
            {/* Grabber */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-outline-variant/60" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-3 border-b border-outline-variant/20">
              <LabelCaps>Comments</LabelCaps>
              <Pressable onPress={onClose} hitSlop={8}>
                <Icon name="close" size={20} color="#55343B" />
              </Pressable>
            </View>

            {/* Scroll body */}
            <ScrollView
              contentContainerStyle={{ paddingVertical: 12 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {commentsQuery.isLoading && comments.length === 0 ? (
                <View className="py-16 items-center">
                  <ActivityIndicator color="#55343B" />
                </View>
              ) : null}

              {!commentsQuery.isLoading && comments.length === 0 ? (
                <View className="py-16 items-center px-8">
                  <HeadlineItalic className="text-on-surface text-center text-[20px]">
                    Be the first.
                  </HeadlineItalic>
                  <Body className="mt-2 text-center">
                    A single thoughtful sentence is a great comment on Zoe.
                  </Body>
                </View>
              ) : null}

              {comments.map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  viewerId={user?.id}
                  onReply={() => setReplyTo(c)}
                  onDelete={onDelete}
                />
              ))}

              {commentsQuery.hasNextPage ? (
                <Pressable
                  onPress={() => commentsQuery.fetchNextPage()}
                  className="py-3 items-center active:opacity-70"
                >
                  <Label className="text-[11px] uppercase tracking-widest">
                    {commentsQuery.isFetchingNextPage
                      ? "Loading…"
                      : "Load more"}
                  </Label>
                </Pressable>
              ) : null}
            </ScrollView>

            {/* Reply banner */}
            {replyTo ? (
              <View className="flex-row items-center px-5 py-2 bg-surface-container-low border-t border-outline-variant/20">
                <Label className="flex-1 text-[12px]">
                  Replying to{" "}
                  <Text className="font-label-semibold">
                    @{replyTo.author.handle}
                  </Text>
                </Label>
                <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                  <Icon name="close" size={16} color="#827475" />
                </Pressable>
              </View>
            ) : null}

            {/* Composer */}
            <View
              className="px-4 py-3 border-t border-outline-variant/20 flex-row items-center gap-3"
              style={{ paddingBottom: Math.max(12, insets.bottom) }}
            >
              <Avatar
                uri={user?.avatarUrl ?? AVATAR_FALLBACK}
                size="sm"
              />
              <View className="flex-1 bg-surface-container-low rounded-full px-4 py-2">
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={
                    isSignedIn ? "Add a comment…" : "Sign in to comment"
                  }
                  placeholderTextColor="rgba(80,68,70,0.55)"
                  editable={isSignedIn}
                  className="font-body text-on-surface text-[14px]"
                  multiline
                  maxLength={800}
                  onSubmitEditing={onSubmit}
                  returnKeyType="send"
                  blurOnSubmit
                />
              </View>
              <Pressable
                onPress={onSubmit}
                disabled={!draft.trim() || createMutation.isPending}
                hitSlop={8}
                className="active:opacity-70"
              >
                <Icon
                  name="arrow-upward"
                  size={22}
                  color={
                    !draft.trim() || createMutation.isPending
                      ? "#B0A49F"
                      : "#55343B"
                  }
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function CommentRow({
  comment,
  viewerId,
  onReply,
  onDelete,
}: {
  comment: ApiShortComment;
  viewerId?: string;
  onReply: () => void;
  onDelete: (commentId: string) => void;
}) {
  const router = useRouter();
  const isPending = comment.id.startsWith("__pending_");
  const canDelete = viewerId === comment.authorId && !isPending;

  return (
    <View className="px-5 py-3">
      <View className="flex-row">
        <Pressable
          onPress={() => router.push(`/user/${comment.author.handle}`)}
          hitSlop={6}
        >
          <Avatar
            uri={comment.author.avatarUrl ?? AVATAR_FALLBACK}
            size="sm"
          />
        </Pressable>
        <View className="flex-1 ml-3">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push(`/user/${comment.author.handle}`)}
              hitSlop={4}
            >
              <Text className="font-label-semibold text-on-surface text-[13px]">
                @{comment.author.handle}
              </Text>
            </Pressable>
            <Label className="text-[11px]">
              {isPending ? "sending…" : formatRelativeTime(comment.createdAt)}
            </Label>
          </View>
          <Body className="mt-1 text-on-surface text-[14px] leading-[20px]">
            {comment.body}
          </Body>

          <View className="flex-row items-center gap-4 mt-2">
            <Pressable onPress={onReply} hitSlop={4}>
              <Label className="text-[11px] uppercase tracking-widest">
                Reply
              </Label>
            </Pressable>
            {canDelete ? (
              <Pressable onPress={() => onDelete(comment.id)} hitSlop={4}>
                <Label className="text-[11px] uppercase tracking-widest text-rank-down">
                  Delete
                </Label>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {comment.replies.length > 0 ? (
        <View className="ml-10 mt-3 gap-3">
          {comment.replies.map((r) => (
            <View key={r.id} className="flex-row">
              <Pressable
                onPress={() => router.push(`/user/${r.author.handle}`)}
                hitSlop={6}
              >
                <Avatar
                  uri={r.author.avatarUrl ?? AVATAR_FALLBACK}
                  size="xs"
                />
              </Pressable>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center gap-2">
                  <Text className="font-label-semibold text-on-surface text-[12px]">
                    @{r.author.handle}
                  </Text>
                  <Label className="text-[10px]">
                    {r.id.startsWith("__pending_")
                      ? "sending…"
                      : formatRelativeTime(r.createdAt)}
                  </Label>
                </View>
                <Body className="mt-0.5 text-on-surface text-[13px] leading-[18px]">
                  {r.body}
                </Body>
                {viewerId === r.authorId && !r.id.startsWith("__pending_") ? (
                  <Pressable
                    onPress={() => onDelete(r.id)}
                    hitSlop={4}
                    className="mt-1"
                  >
                    <Label className="text-[10px] uppercase tracking-widest text-rank-down">
                      Delete
                    </Label>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
