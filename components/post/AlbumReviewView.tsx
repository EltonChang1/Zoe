import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, View, Text } from "react-native";

import { Icon } from "@/components/ui/Icon";
import {
  Body,
  Headline,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import {
  CuratorHeader,
  DiscussionSection,
  InteractionBar,
  PostTopBar,
  RestaurantSocialSummary,
  TagRow,
} from "@/components/post/PostChrome";
import type { Comment, Post } from "@/data/types";
import { getObject } from "@/data/objects";
import { getUser } from "@/data/users";
import { getSpotifyLinks, openSpotifyLinks } from "@/lib/music/spotifyLinks";
import { gradients } from "@/theme/tokens";
import type { PostInteraction } from "./types";

/**
 * Variant B — Album / music review (Design_guide/posts/post_for_album).
 * Square artwork · gradient ranking ribbon · centered editorial title/artist ·
 * nested editorial card for the critic's note · pill composer discussion.
 */
export function AlbumReviewView({
  post,
  comments,
  interaction,
}: {
  post: Post;
  comments: Comment[];
  interaction?: PostInteraction;
}) {
  const author = getUser(post.authorId);
  const object = post.objectId ? getObject(post.objectId) : undefined;
  const spotifyLinks = getSpotifyLinks(object);
  const hasSpotify = Boolean(spotifyLinks.uri || spotifyLinks.webUrl);

  return (
    <View className="flex-1 bg-background">
      <PostTopBar onMore={interaction?.onMore} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 96, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 gap-8">
          <CuratorHeader
            author={author}
            publishedAt={post.publishedAt}
            saved={interaction?.saved}
            onToggleSave={interaction?.onToggleSave}
            onPressAuthor={interaction?.onPressAuthor}
          />

          {/* Square artwork hero with ribbon */}
          <View className="items-center gap-5">
            <View className="w-full rounded-xl overflow-hidden bg-surface-container-low relative">
              <Image
                source={{ uri: post.imageUrl || object?.heroImage }}
                style={{ aspectRatio: 1 }}
                contentFit={hasSpotify ? "contain" : "cover"}
                transition={260}
                className="w-full"
              />
            </View>
            {hasSpotify ? (
              <Label className="text-[10px] text-on-surface-variant">
                Metadata by Spotify
              </Label>
            ) : null}

            {/* Gradient ranking ribbon */}
            <LinearGradient
              colors={gradients.primaryCTA}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 4,
                minWidth: 220,
                alignItems: "center",
                shadowColor: "#55343B",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.18,
                shadowRadius: 24,
              }}
            >
              <Label className="uppercase tracking-widest text-[10px] text-on-primary/80">
                {post.ranking.listTitle}
              </Label>
              <Text className="font-display text-on-primary text-[34px] tracking-tight leading-[36px]">
                #{post.ranking.rank}
              </Text>
            </LinearGradient>

            <View className="items-center">
              <Text className="font-headline text-on-surface text-[28px] tracking-tight">
                {object?.title}
              </Text>
              <Text className="font-headline-italic text-primary text-[18px] mt-1">
                {object?.subtitle}
              </Text>
              {hasSpotify ? (
                <Pressable
                  onPress={() => openSpotifyLinks(spotifyLinks).catch(() => undefined)}
                  className="mt-4 flex-row items-center rounded-full border border-outline-variant/35 px-4 py-2 active:opacity-70"
                >
                  <Icon name="library-music" size={16} color="#55343B" />
                  <Label className="ml-2 text-[11px] font-label-semibold uppercase tracking-widest text-primary">
                    Listen on Spotify
                  </Label>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Nested editorial card (critic's note) */}
          <View className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/15">
            <View className="flex-row items-center gap-2 mb-3">
              <LabelCaps>Review</LabelCaps>
              <View className="h-[1px] flex-1 bg-outline-variant/30" />
            </View>
            <Headline className="text-[22px] leading-[28px]">
              {post.headline}
            </Headline>
            <Body className="mt-3 text-[15px] leading-[22px]">
              {post.caption}
            </Body>
            <View className="mt-4">
              <TagRow tags={post.tags} />
            </View>
            <View className="mt-4">
              <RestaurantSocialSummary post={post} />
            </View>
          </View>

          <InteractionBar
            likes={interaction?.likes ?? post.likes}
            comments={interaction?.comments ?? post.comments}
            liked={interaction?.liked}
            onToggleLike={interaction?.onToggleLike}
            onShare={interaction?.onShare}
          />
        </View>

        <View className="px-5 mt-10">
          <DiscussionSection
            post={post}
            comments={comments}
            variant="pill"
            viewerAvatar={interaction?.viewerAvatar}
            viewerId={interaction?.viewerId}
            canPost={interaction?.canPost ?? true}
            onSubmit={interaction?.onSubmitComment}
            submitting={interaction?.submittingComment}
            onDelete={interaction?.onDeleteComment}
            onPressAuthor={interaction?.onPressCommentAuthor}
            loadingInitial={interaction?.loadingComments}
            hasMore={interaction?.hasMoreComments}
            loadingMore={interaction?.loadingMoreComments}
            onLoadMore={interaction?.onLoadMoreComments}
            totalHint={interaction?.comments}
          />
        </View>
      </ScrollView>
    </View>
  );
}
