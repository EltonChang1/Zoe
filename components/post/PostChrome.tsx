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
export function PostTopBar({ onBack }: { onBack?: () => void }) {
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
      trailing={<Icon name="more-horiz" size={22} color="#55343B" />}
    />
  );
}

export function CuratorHeader({
  author,
  publishedAt,
  showAuthorBadge = false,
  saved = false,
  onToggleSave,
}: {
  author: User;
  publishedAt: string;
  showAuthorBadge?: boolean;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
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
      </View>
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

export function DiscussionSection({
  post,
  comments,
  variant = "notes",
  viewerAvatar,
  onSubmit,
  submitting = false,
  canPost = true,
}: {
  post: Post;
  comments: Comment[];
  variant?: "notes" | "pill" | "thoughts";
  viewerAvatar?: string;
  onSubmit?: (body: string) => Promise<void> | void;
  submitting?: boolean;
  canPost?: boolean;
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
  const disabled = !onSubmit || !canPost || submitting;

  const handleSubmit = async () => {
    const body = draft.trim();
    if (!body || disabled) return;
    try {
      await onSubmit?.(body);
      setDraft("");
    } catch {
      // the mutation layer surfaces errors; we keep the draft intact so the
      // user can retry without retyping.
    }
  };

  const placeholder =
    !canPost
      ? "Sign in to join the discussion"
      : variant === "thoughts"
        ? "Add your thought…"
        : variant === "pill"
          ? "Share your thoughts…"
          : "Add a note or question…";

  return (
    <View
      className={cn(
        "rounded-xl p-5",
        "bg-surface-container-low",
      )}
    >
      <View className="flex-row items-center justify-between">
        <Title className="text-[18px]">{headerTitle}</Title>
        <View className="px-2 py-1 bg-background rounded">
          <Label className="text-[10px] uppercase tracking-widest">
            {comments.length} {comments.length === 1 ? "reply" : "replies"}
          </Label>
        </View>
      </View>

      {variant === "pill" ? (
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
      ) : (
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
      )}

      <View className="mt-5 gap-5">
        {comments.map((c) => (
          <CommentRow key={c.id} comment={c} post={post} />
        ))}
      </View>
    </View>
  );
}

function CommentRow({ comment, post }: { comment: Comment; post: Post }) {
  const author = getUser(comment.authorId);
  const isPostAuthor = comment.authorId === post.authorId;
  return (
    <View className={cn("flex-row gap-3", isPostAuthor ? "pl-11" : "")}>
      <Avatar uri={author.avatar} size="sm" />
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="font-body-medium text-on-surface text-[13px]">
            {author.displayName}
          </Text>
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
      </View>
    </View>
  );
}

function format(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}
