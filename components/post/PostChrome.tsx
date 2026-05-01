import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  View,
  Text,
  TextInput,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { Icon } from "@/components/ui/Icon";
import { Body, Label, LabelCaps, Title } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import type { Comment, Post, User } from "@/data/types";
import { getUser } from "@/data/users";

/**
 * Shared chrome across all three post detail layouts (VDK §16.5, Spec SCREEN 08):
 *  - GlassTopBar with back + more
 *  - Curator header strip (with save toggle)
 *  - Tags row
 *  - Like / Comment / Share bar (like is actionable)
 *  - Discussion section with controlled composer
 *
 * Every interactive affordance is *optional* — if a view doesn't pass the
 * handlers the controls degrade to read-only, matching the behaviour the
 * mock-powered prototype had before the API landed.
 */
export function PostTopBar({
  onBack,
  onMore,
}: {
  onBack?: () => void;
  /** Opens the author's overflow menu (Delete, in future Report/Share…).
   * Omit to hide the trailing button — safer than showing a dead icon. */
  onMore?: () => void;
}) {
  const router = useRouter();
  return (
    <GlassTopBar
      leading={
        <Pressable hitSlop={10} onPress={onBack ?? (() => router.back())}>
          <Icon name="arrow-back" size={22} color="#55343B" />
        </Pressable>
      }
      title={
        <Text className="font-display-italic text-primary text-[18px] tracking-tightest">
          Zoe
        </Text>
      }
      trailing={
        onMore ? (
          <Pressable
            hitSlop={10}
            onPress={onMore}
            accessibilityLabel="Post options"
            className="active:opacity-60"
          >
            <Icon name="more-horiz" size={22} color="#55343B" />
          </Pressable>
        ) : null
      }
    />
  );
}

export function CuratorHeader({
  author,
  publishedAt,
  showAuthorBadge = false,
  saved = false,
  onToggleSave,
  onPressAuthor,
}: {
  author: User;
  publishedAt: string;
  showAuthorBadge?: boolean;
  saved?: boolean;
  onToggleSave?: () => void;
  onPressAuthor?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        onPress={onPressAuthor}
        disabled={!onPressAuthor}
        className="flex-row items-center active:opacity-80"
      >
        <Avatar uri={author.avatar} size="md" />
        <View className="ml-3">
          <View className="flex-row items-center">
            <Text className="font-body-medium text-on-surface text-[14px]">
              {author.displayName}
            </Text>
            {showAuthorBadge && (
              <View className="ml-2 px-1.5 py-0.5 bg-primary/10 rounded-full">
                <Text className="font-label-semibold text-primary text-[9px] uppercase tracking-widest">
                  Author
                </Text>
              </View>
            )}
          </View>
          <Label className="mt-0.5 text-[11px] text-on-surface-variant">
            {publishedAt}
          </Label>
        </View>
      </Pressable>
      <Pressable
        hitSlop={10}
        disabled={!onToggleSave}
        onPress={onToggleSave}
        className="p-2 active:opacity-70"
      >
        <Icon
          name={saved ? "bookmark" : "bookmark-border"}
          size={22}
          color={saved ? "#55343B" : "#504446"}
        />
      </Pressable>
    </View>
  );
}

export function TagRow({ tags }: { tags: string[] }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {tags.map((t) => (
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
  );
}

export function RestaurantSocialSummary({ post }: { post: Post }) {
  const mentions = post.mentions ?? [];
  const visit = post.restaurantVisit;
  if (mentions.length === 0 && !visit) return null;

  return (
    <View className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 gap-3">
      {mentions.length > 0 ? (
        <View>
          <LabelCaps>Mentioned</LabelCaps>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {mentions.map((user) => (
              <Pill key={user.id} label={`@${user.handle}`} />
            ))}
          </View>
        </View>
      ) : null}

      {visit ? (
        <View className="gap-3">
          {visit.companions.length > 0 ? (
            <View>
              <LabelCaps>With</LabelCaps>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {visit.companions.map((user) => (
                  <Pill key={user.id} label={`@${user.handle}`} />
                ))}
              </View>
            </View>
          ) : null}

          {visit.dishes.length > 0 ? (
            <View>
              <LabelCaps>Ordered</LabelCaps>
              <View className="mt-2 gap-2">
                {visit.dishes.map((dish, index) => (
                  <View
                    key={`${dish.name}:${index}`}
                    className="rounded bg-surface-container-low px-3 py-2"
                  >
                    <Text className="font-headline text-on-surface text-[14px]">
                      {dish.name}
                      {dish.recommended ? " · recommended" : ""}
                    </Text>
                    {dish.note ? (
                      <Label className="mt-0.5 text-[11px]">{dish.note}</Label>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {(visit.mealType || visit.priceTier || visit.labels.length > 0) ? (
            <View className="flex-row flex-wrap gap-2">
              {visit.mealType ? <Pill label={visit.mealType} /> : null}
              {visit.priceTier ? <Pill label={"$".repeat(visit.priceTier)} /> : null}
              {visit.labels.map((label) => (
                <Pill key={label} label={`#${label}`} />
              ))}
            </View>
          ) : null}

          {visit.note ? (
            <Body className="text-[13px] leading-[18px]">{visit.note}</Body>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-surface-container-low px-3 py-1">
      <Text className="font-label text-on-surface-variant text-[11px]">
        {label}
      </Text>
    </View>
  );
}

export function InteractionBar({
  likes,
  comments,
  bordered = true,
  liked = false,
  onToggleLike,
  onShare,
}: {
  likes: number;
  comments: number;
  bordered?: boolean;
  liked?: boolean;
  onToggleLike?: () => void;
  onShare?: () => void;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center justify-between pt-4 px-2",
        bordered ? "border-t border-outline-variant/15" : "",
      )}
    >
      <View className="flex-row gap-6">
        <Pressable
          onPress={onToggleLike}
          disabled={!onToggleLike}
          className="flex-row items-center gap-2 active:opacity-70"
          hitSlop={8}
        >
          <Icon
            name={liked ? "favorite" : "favorite-border"}
            size={20}
            color={liked ? "#B56B76" : "#504446"}
          />
          <Label className="font-body-medium text-[13px]">{format(likes)}</Label>
        </Pressable>
        <View className="flex-row items-center gap-2">
          <Icon name="chat-bubble-outline" size={20} color="#504446" />
          <Label className="font-body-medium text-[13px]">
            {format(comments)}
          </Label>
        </View>
      </View>
      <Pressable
        onPress={onShare}
        disabled={!onShare}
        hitSlop={8}
        className="active:opacity-70"
      >
        <Icon name="ios-share" size={20} color="#504446" />
      </Pressable>
    </View>
  );
}

type ReplyTarget = { id: string; handle?: string; displayName: string };

export function DiscussionSection({
  post,
  comments,
  variant = "notes",
  viewerAvatar,
  viewerId,
  onSubmit,
  submitting = false,
  canPost = true,
  onDelete,
  onPressAuthor,
  loadingInitial = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  totalHint,
}: {
  post: Post;
  comments: Comment[];
  variant?: "notes" | "pill" | "thoughts";
  viewerAvatar?: string;
  /** UserId of the signed-in viewer. Used to decide which comments expose
   * the Delete affordance. */
  viewerId?: string;
  /** Fires with an optional `parentId` when the row is a reply. */
  onSubmit?: (body: string, parentId?: string) => Promise<void> | void;
  submitting?: boolean;
  canPost?: boolean;
  /** Delete a comment. When omitted, the Delete action is hidden. */
  onDelete?: (commentId: string) => void;
  /** Navigate to a commenter's profile. */
  onPressAuthor?: (handle: string) => void;
  /** First page is still loading (distinct from `loadingMore` below). */
  loadingInitial?: boolean;
  /** Server has more comment pages beyond what's currently rendered. */
  hasMore?: boolean;
  /** A follow-up page request is in flight. */
  loadingMore?: boolean;
  /** Fetch the next page. When omitted, the Load more affordance is hidden. */
  onLoadMore?: () => void;
  /** Authoritative comment count from `post.stats.comments`. Used in the
   * header chip when a pager is active so the user doesn't see "3 replies"
   * on a thread with 500. Falls back to the local length when omitted. */
  totalHint?: number;
}) {
  // Fallback to the mock Clara avatar when no viewer avatar is provided yet
  // (e.g. first render during route boot).
  const me = viewerAvatar ?? getUser("U000").avatar;
  const headerTitle =
    variant === "notes"
      ? "Curator Notes"
      : variant === "pill"
        ? "Discussion"
        : "Thoughts";

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const disabled = !onSubmit || !canPost || submitting;

  // Build the threaded view once per `comments` update. We still accept a
  // flat array (parents + replies in-order) to keep the screen-level mapper
  // simple, and reconstruct the tree here — this way a future stream of
  // server pushes can swap in a new array without the UI caring about order.
  const threaded = buildThreaded(comments);
  // When a pager is in play, `totalHint` reflects the server's authoritative
  // count; otherwise we fall back to what we actually have in memory so the
  // chip doesn't lie on smaller detached mock screens.
  const totalReplies = totalHint ?? comments.length;

  const handleSubmit = async () => {
    const body = draft.trim();
    if (!body || disabled) return;
    try {
      await onSubmit?.(body, replyTo?.id);
      setDraft("");
      setReplyTo(null);
    } catch {
      // the mutation layer surfaces errors; we keep the draft intact so the
      // user can retry without retyping.
    }
  };

  const placeholder = !canPost
    ? "Sign in to join the discussion"
    : replyTo
      ? `Reply to ${replyTo.displayName}…`
      : variant === "thoughts"
        ? "Add your thought…"
        : variant === "pill"
          ? "Share your thoughts…"
          : "Add a note or question…";

  const renderComposer = () => {
    if (variant === "pill") {
      return (
        <View className="mt-5 flex-row items-center bg-background rounded-full px-4 py-2 border border-outline-variant/20">
          <Avatar uri={me} size="xs" />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={!disabled}
            placeholder={placeholder}
            placeholderTextColor="rgba(80,68,70,0.55)"
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            blurOnSubmit
            className="flex-1 ml-3 font-body text-on-surface text-[14px]"
          />
          <Pressable
            onPress={handleSubmit}
            disabled={disabled || draft.trim().length === 0}
            hitSlop={8}
            className="active:opacity-70"
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#55343B" />
            ) : (
              <Icon
                name="send"
                size={18}
                color={draft.trim().length === 0 ? "#B0A49F" : "#55343B"}
              />
            )}
          </Pressable>
        </View>
      );
    }
    return (
      <View className="mt-4 flex-row items-start gap-3">
        <Avatar uri={me} size="sm" />
        <View className="flex-1 flex-row items-center gap-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={!disabled}
            placeholder={placeholder}
            placeholderTextColor="rgba(80,68,70,0.55)"
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            blurOnSubmit
            className="flex-1 border-b border-outline-variant/30 font-body text-on-surface text-[14px] pb-2"
          />
          <Pressable
            onPress={handleSubmit}
            disabled={disabled || draft.trim().length === 0}
            hitSlop={8}
            className="active:opacity-70 pb-2"
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#55343B" />
            ) : (
              <LabelCaps
                className={cn(
                  "text-[10px]",
                  draft.trim().length === 0
                    ? "text-on-surface-variant/50"
                    : "text-primary",
                )}
              >
                POST
              </LabelCaps>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View className={cn("rounded-xl p-5", "bg-surface-container-low")}>
      <View className="flex-row items-center justify-between">
        <Title className="text-[18px]">{headerTitle}</Title>
        <View className="px-2 py-1 bg-background rounded">
          <Label className="text-[10px] uppercase tracking-widest">
            {totalReplies} {totalReplies === 1 ? "reply" : "replies"}
          </Label>
        </View>
      </View>

      {replyTo && (
        <View className="mt-4 flex-row items-center gap-2 px-3 py-2 bg-background rounded-full border border-outline-variant/20 self-start">
          <Icon name="reply" size={14} color="#55343B" />
          <Label className="text-[11px] text-primary">
            Replying to {replyTo.displayName}
          </Label>
          <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
            <Icon name="close" size={14} color="#827475" />
          </Pressable>
        </View>
      )}

      {renderComposer()}

      <View className="mt-5 gap-5">
        {loadingInitial && threaded.length === 0 ? (
          <View className="py-6 items-center">
            <ActivityIndicator size="small" color="#55343B" />
          </View>
        ) : null}

        {threaded.map((node) => (
          <CommentThread
            key={node.id}
            parent={node}
            post={post}
            viewerId={viewerId}
            onStartReply={(t) => setReplyTo(t)}
            onDelete={onDelete}
            onPressAuthor={onPressAuthor}
            canReply={canPost}
          />
        ))}

        {hasMore && onLoadMore ? (
          <Pressable
            onPress={loadingMore ? undefined : onLoadMore}
            disabled={loadingMore}
            hitSlop={6}
            className="self-center flex-row items-center gap-2 py-2 px-4 bg-background rounded-full border border-outline-variant/30 active:opacity-70"
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#55343B" />
            ) : (
              <Icon name="expand-more" size={14} color="#55343B" />
            )}
            <LabelCaps className="text-[10px] text-primary">
              {loadingMore ? "Loading…" : "Load more"}
            </LabelCaps>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ------------- Thread building -------------

type CommentNode = Comment & { children: Comment[] };

function buildThreaded(comments: Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of comments) {
    nodes.set(c.id, { ...c, children: [] });
  }
  for (const c of comments) {
    const node = nodes.get(c.id)!;
    if (c.parentId && nodes.has(c.parentId)) {
      nodes.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// ------------- Thread + Row -------------

function CommentThread({
  parent,
  post,
  viewerId,
  onStartReply,
  onDelete,
  onPressAuthor,
  canReply,
}: {
  parent: CommentNode;
  post: Post;
  viewerId?: string;
  onStartReply: (target: ReplyTarget) => void;
  onDelete?: (commentId: string) => void;
  onPressAuthor?: (handle: string) => void;
  canReply: boolean;
}) {
  return (
    <View>
      <CommentRow
        comment={parent}
        post={post}
        viewerId={viewerId}
        onStartReply={onStartReply}
        onDelete={onDelete}
        onPressAuthor={onPressAuthor}
        canReply={canReply}
      />

      {parent.children.length > 0 && (
        <View className="mt-4 ml-5 pl-4 gap-4 border-l border-outline-variant/30">
          {parent.children.map((child) => (
            <CommentRow
              key={child.id}
              comment={child}
              post={post}
              viewerId={viewerId}
              // Children can't be replied to (the server stores a single
              // level of nesting) — a "Reply" on a child still targets the
              // top-level parent so the thread stays readable.
              onStartReply={(_t) =>
                onStartReply({
                  id: parent.id,
                  handle: parent.handle,
                  displayName: getUser(parent.authorId).displayName,
                })
              }
              onDelete={onDelete}
              onPressAuthor={onPressAuthor}
              canReply={canReply}
              compact
            />
          ))}
        </View>
      )}
    </View>
  );
}

function CommentRow({
  comment,
  post,
  viewerId,
  onStartReply,
  onDelete,
  onPressAuthor,
  canReply,
  compact,
}: {
  comment: Comment;
  post: Post;
  viewerId?: string;
  onStartReply?: (target: ReplyTarget) => void;
  onDelete?: (commentId: string) => void;
  onPressAuthor?: (handle: string) => void;
  canReply: boolean;
  compact?: boolean;
}) {
  const author = getUser(comment.authorId);
  const isPostAuthor = comment.authorId === post.authorId;
  const canDelete =
    Boolean(onDelete) &&
    Boolean(viewerId) &&
    (comment.authorId === viewerId || post.authorId === viewerId);

  const pressAuthor = () => {
    const handle = comment.handle ?? author.handle;
    if (handle && onPressAuthor) onPressAuthor(handle);
  };

  return (
    <View className="flex-row gap-3">
      <Pressable onPress={pressAuthor} hitSlop={4}>
        <Avatar uri={author.avatar} size={compact ? "xs" : "sm"} />
      </Pressable>
      <View className="flex-1">
        <View className="flex-row items-center flex-wrap">
          <Pressable onPress={pressAuthor} hitSlop={4}>
            <Text className="font-body-medium text-on-surface text-[13px]">
              {author.displayName}
            </Text>
          </Pressable>
          {isPostAuthor && (
            <View className="ml-2 px-1.5 py-0.5 bg-primary/10 rounded-full">
              <Text className="font-label-semibold text-primary text-[9px] uppercase tracking-widest">
                Author
              </Text>
            </View>
          )}
          <Label className="ml-2 text-[11px] text-on-surface-variant">
            {comment.timestamp}
          </Label>
        </View>
        <Body className="mt-1 text-[13px] leading-[18px]">{comment.body}</Body>

        {(canReply || canDelete) && (
          <View className="flex-row items-center mt-2 gap-4">
            {canReply && onStartReply && (
              <Pressable
                onPress={() =>
                  onStartReply({
                    id: comment.id,
                    handle: comment.handle,
                    displayName: author.displayName,
                  })
                }
                hitSlop={6}
                className="active:opacity-70"
              >
                <Label className="text-[10px] uppercase tracking-widest">
                  Reply
                </Label>
              </Pressable>
            )}
            {canDelete && (
              <Pressable
                onPress={() => onDelete?.(comment.id)}
                hitSlop={6}
                className="active:opacity-70"
              >
                <Label className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Delete
                </Label>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function format(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}
