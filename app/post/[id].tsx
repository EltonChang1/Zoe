import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Share, View } from "react-native";

import { AlbumReviewView } from "@/components/post/AlbumReviewView";
import { DiscoveryPhotoView } from "@/components/post/DiscoveryPhotoView";
import { ProductHeroView } from "@/components/post/ProductHeroView";
import type { PostInteraction } from "@/components/post/types";
import { Body, Headline } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import type { Comment } from "@/data/types";
import {
  mapPost,
  useAuth,
  useCreateComment,
  useLikePost,
  usePostQuery,
  useSavePost,
} from "@/lib/api";
import { formatRelativeTime } from "@/lib/time";

/**
 * Post Detail router (Spec SCREEN 08):
 *  - Fetches the post via `/posts/:id` through react-query.
 *  - Assembles a `PostInteraction` with optimistic like/save toggles + a
 *    comment submission handler, and hands it to whichever of the three
 *    editorial templates the post's `detailLayout` requests.
 */
export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isSignedIn } = useAuth();

  const { data, isLoading, isError, error } = usePostQuery(id);
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const commentMutation = useCreateComment();

  // Optimistic overlays — keep client-perceived counts/state in sync while
  // mutations are in-flight. Reset each time the server payload updates.
  const viewer = data?.post.viewer;
  const stats = data?.post.stats;

  const liked = viewer?.likedByMe ?? false;
  const saved = viewer?.savedByMe ?? false;

  const optimisticLikes =
    (stats?.likes ?? 0) +
    (likeMutation.isPending ? (liked ? -1 : 1) : 0);
  const optimisticLiked = likeMutation.isPending ? !liked : liked;
  const optimisticSaved = saveMutation.isPending ? !saved : saved;

  const mappedPost = useMemo(() => {
    if (!data) return null;
    const base = mapPost(data.post);
    // Prefer the *optimistic* counts so the UI is instantly responsive.
    return {
      ...base,
      likes: optimisticLikes,
    };
  }, [data, optimisticLikes]);

  const flatComments = useMemo<Comment[]>(() => {
    if (!data) return [];
    const postAuthorId = data.post.authorId;
    const out: Comment[] = [];
    for (const c of data.comments) {
      out.push({
        id: c.id,
        authorId: c.authorId,
        body: c.body,
        timestamp: formatRelativeTime(c.createdAt),
        isAuthor: c.authorId === postAuthorId,
        likes: c.likes,
      });
      for (const r of c.replies) {
        out.push({
          id: r.id,
          authorId: r.author.id,
          body: r.body,
          timestamp: formatRelativeTime(r.createdAt),
          isAuthor: r.author.id === postAuthorId,
        });
      }
    }
    return out;
  }, [data]);

  const onToggleLike = useCallback(() => {
    if (!isSignedIn || !id) return;
    likeMutation.mutate({ id, liked });
  }, [isSignedIn, id, liked, likeMutation]);

  const onToggleSave = useCallback(() => {
    if (!isSignedIn || !id) return;
    saveMutation.mutate({ id, saved });
  }, [isSignedIn, id, saved, saveMutation]);

  const onSubmitComment = useCallback(
    async (body: string) => {
      if (!isSignedIn || !id) return;
      await commentMutation.mutateAsync({ id, body });
    },
    [isSignedIn, id, commentMutation],
  );

  const onShare = useCallback(() => {
    if (!id || !data) return;
    const title = data.post.headline ?? "Zoe";
    Share.share({
      message: `${title}\nhttps://zoe.app/p/${id}`,
    }).catch(() => undefined);
  }, [id, data]);

  if (isLoading && !data) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#55343B" />
      </View>
    );
  }

  if (isError || !data || !mappedPost) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6 gap-3">
        <Headline>Post not found</Headline>
        <Body>
          {error instanceof Error
            ? error.message
            : "Try another entry from your feed."}
        </Body>
        <Button label="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  const interaction: PostInteraction = {
    liked: optimisticLiked,
    saved: optimisticSaved,
    likes: optimisticLikes,
    comments: stats?.comments ?? mappedPost.comments,
    isAuthor: viewer?.isAuthor ?? false,
    viewerAvatar: user?.avatarUrl ?? undefined,
    canPost: isSignedIn,
    onToggleLike,
    onToggleSave,
    onShare,
    onSubmitComment,
    submittingComment: commentMutation.isPending,
  };

  switch (mappedPost.detailLayout) {
    case "album_review":
      return (
        <AlbumReviewView
          post={mappedPost}
          comments={flatComments}
          interaction={interaction}
        />
      );
    case "product_hero":
      return (
        <ProductHeroView
          post={mappedPost}
          comments={flatComments}
          interaction={interaction}
        />
      );
    case "discovery_photo":
    default:
      return (
        <DiscoveryPhotoView
          post={mappedPost}
          comments={flatComments}
          interaction={interaction}
        />
      );
  }
}
