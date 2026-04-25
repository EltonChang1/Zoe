import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, Alert, Share, View } from "react-native";

import { AlbumReviewView } from "@/components/post/AlbumReviewView";
import { DiscoveryPhotoView } from "@/components/post/DiscoveryPhotoView";
import { ProductHeroView } from "@/components/post/ProductHeroView";
import type { PostInteraction } from "@/components/post/types";
import { Body, Headline } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import type { Comment } from "@/data/types";
import { registerUser } from "@/data/users";
import {
  mapPost,
  useAuth,
  useBlockUser,
  useCreateComment,
  useDeleteComment,
  useDeletePost,
  useLikePost,
  usePostComments,
  usePostQuery,
  useReport,
  useSavePost,
} from "@/lib/api";
import { confirmBlock, runReportFlow } from "@/components/moderation/actions";
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
  const commentsQuery = usePostComments(id ?? null);
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const commentMutation = useCreateComment();
  const deleteCommentMutation = useDeleteComment();
  const deletePostMutation = useDeletePost();
  const reportMutation = useReport();
  const blockMutation = useBlockUser();

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

  // Flatten the paginated (parent → replies) shape into a single array that
  // preserves `parentId`. The discussion component rebuilds the tree itself
  // so this stays a dumb projection. While we're here, register every
  // commenter + reply author in the client mock registry so avatars/handles
  // render correctly for users we haven't seen elsewhere yet.
  const loadedComments = commentsQuery.data?.comments ?? [];
  const flatComments = useMemo<Comment[]>(() => {
    if (!data) return [];
    const postAuthorId = data.post.authorId;
    const out: Comment[] = [];

    const AVATAR_FALLBACK =
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80";

    const adopt = (a: {
      id: string;
      handle: string;
      displayName: string;
      avatarUrl: string | null;
    }) => {
      registerUser({
        id: a.id,
        handle: a.handle,
        displayName: a.displayName,
        avatar: a.avatarUrl ?? AVATAR_FALLBACK,
        bio: "",
        followers: 0,
        following: 0,
        postsCount: 0,
      });
    };

    for (const c of loadedComments) {
      adopt(c.author);
      out.push({
        id: c.id,
        authorId: c.author.id,
        handle: c.author.handle,
        body: c.body,
        timestamp: formatRelativeTime(c.createdAt),
        isAuthor: c.author.id === postAuthorId,
        parentId: null,
        likes: c.likes,
      });
      for (const r of c.replies) {
        adopt(r.author);
        out.push({
          id: r.id,
          authorId: r.author.id,
          handle: r.author.handle,
          body: r.body,
          timestamp: formatRelativeTime(r.createdAt),
          isAuthor: r.author.id === postAuthorId,
          parentId: c.id,
        });
      }
    }
    return out;
  }, [data, loadedComments]);

  const onToggleLike = useCallback(() => {
    if (!isSignedIn || !id) return;
    likeMutation.mutate({ id, liked });
  }, [isSignedIn, id, liked, likeMutation]);

  const onToggleSave = useCallback(() => {
    if (!isSignedIn || !id) return;
    saveMutation.mutate({ id, saved });
  }, [isSignedIn, id, saved, saveMutation]);

  const onSubmitComment = useCallback(
    async (body: string, parentId?: string) => {
      if (!isSignedIn || !id) return;
      await commentMutation.mutateAsync({ id, body, parentId });
    },
    [isSignedIn, id, commentMutation],
  );

  const onDeleteComment = useCallback(
    (commentId: string) => {
      if (!isSignedIn || !id) return;
      deleteCommentMutation.mutate({ postId: id, commentId });
    },
    [isSignedIn, id, deleteCommentMutation],
  );

  const onPressCommentAuthor = useCallback(
    (handle: string) => router.push(`/user/${handle}`),
    [router],
  );

  // Overflow menu. Authors see Delete; everyone else sees Report + Block
  // (Apple 1.2 requires both entry points on UGC content). Alert gives us
  // a native-feeling destructive confirm on both platforms without an
  // extra sheet component.
  const isAuthor = data?.post.viewer?.isAuthor ?? false;
  const authorHandleForMore = data?.post.author.handle;
  const authorDisplayForMore = data?.post.author.displayName ?? "";
  const authorIdForMore = data?.post.author.id;
  const onMore = useCallback(() => {
    if (!id) return;
    if (isAuthor) {
      Alert.alert(
        "Delete post?",
        "This removes the post and all its comments, likes, and saves. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              deletePostMutation.mutate(id, {
                onSuccess: () => router.back(),
                onError: (err) => {
                  Alert.alert(
                    "Couldn't delete post",
                    err instanceof Error
                      ? err.message
                      : "Please try again in a moment.",
                  );
                },
              });
            },
          },
        ],
      );
      return;
    }
    if (!authorHandleForMore || !authorIdForMore) return;
    // Non-authors: offer Report post / Block author / Cancel.
    Alert.alert("More", "What would you like to do?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report post",
        style: "destructive",
        onPress: () =>
          runReportFlow({
            subjectLabel: "post",
            subjectType: "post",
            subjectId: id,
            submit: (input) => reportMutation.mutateAsync(input),
          }),
      },
      {
        text: `Block @${authorHandleForMore}`,
        style: "destructive",
        onPress: async () => {
          const ok = await confirmBlock(authorDisplayForMore);
          if (!ok) return;
          blockMutation.mutate(authorHandleForMore, {
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
  }, [
    id,
    isAuthor,
    authorHandleForMore,
    authorIdForMore,
    authorDisplayForMore,
    deletePostMutation,
    reportMutation,
    blockMutation,
    router,
  ]);

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

  const authorHandle = data.post.author.handle;

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
    // Show the overflow menu for everyone — authors get Delete, others
    // get Report + Block. Keep it anonymous-safe by only exposing it
    // when the viewer can act on at least one option.
    onMore: isSignedIn ? onMore : undefined,
    onPressAuthor: () => router.push(`/user/${authorHandle}`),
    onPressObject: () => router.push(`/object/${mappedPost.objectId}`),
    onSubmitComment,
    submittingComment: commentMutation.isPending,
    viewerId: user?.id,
    onDeleteComment,
    onPressCommentAuthor,
    loadingComments: commentsQuery.isLoading,
    hasMoreComments: Boolean(commentsQuery.hasNextPage),
    loadingMoreComments: commentsQuery.isFetchingNextPage,
    onLoadMoreComments: commentsQuery.hasNextPage
      ? () => commentsQuery.fetchNextPage()
      : undefined,
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
