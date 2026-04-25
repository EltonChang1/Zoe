import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, View, Text } from "react-native";

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
  TagRow,
} from "@/components/post/PostChrome";
import type { Comment, Post } from "@/data/types";
import { getObject } from "@/data/objects";
import { getUser } from "@/data/users";
import { gradients } from "@/theme/tokens";
import type { PostInteraction } from "./types";

/**
 * Variant A — Discovery / place post (Design_guide/posts/post_for_cafe).
 * - Hero 4:5 photo · glass location chip
 * - Ranking banner (tonal strip) with vertical primary gradient rule
 * - Serif headline · relaxed body · tag row
 * - Curator Notes discussion
 */
export function DiscoveryPhotoView({
  post,
  comments,
  interaction,
}: {
  post: Post;
  comments: Comment[];
  interaction?: PostInteraction;
}) {
  const author = getUser(post.authorId);
  const object = getObject(post.objectId);

  return (
    <View className="flex-1 bg-background">
      <PostTopBar onMore={interaction?.onMore} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 96, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 gap-6">
          <CuratorHeader
            author={author}
            publishedAt={post.publishedAt}
            saved={interaction?.saved}
            onToggleSave={interaction?.onToggleSave}
            onPressAuthor={interaction?.onPressAuthor}
          />

          {/* Hero photo */}
          <View className="relative rounded-xl overflow-hidden bg-surface-container-low">
            <Image
              source={{ uri: object?.heroImage }}
              style={{ aspectRatio: 4 / 5 }}
              contentFit="cover"
              transition={260}
              className="w-full"
            />
            {post.locationLabel && (
              <View className="absolute bottom-4 left-4 bg-background/90 px-3 py-1.5 rounded flex-row items-center gap-1.5">
                <Icon name="place" size={14} color="#504446" />
                <Text className="font-label-semibold text-on-surface text-[11px]">
                  {post.locationLabel}
                </Text>
              </View>
            )}
          </View>

          {/* Tonal ranking strip */}
          <View className="relative bg-surface-container-lowest border border-outline-variant/15 rounded-lg p-4 flex-row items-center justify-between overflow-hidden">
            <LinearGradient
              colors={gradients.rankSpine}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
              }}
            />
            <View className="flex-row items-center gap-4 pl-2">
              <View className="w-12 h-12 bg-surface-container rounded-lg items-center justify-center">
                <Text className="font-headline text-primary text-[20px]">
                  #{post.ranking.rank}
                </Text>
              </View>
              <View>
                <LabelCaps>Ranked in</LabelCaps>
                <Text className="font-headline text-on-surface text-[17px] tracking-tight mt-0.5">
                  {post.ranking.listTitle}
                </Text>
              </View>
            </View>
            {post.ranking.movement === "up" && (
              <View className="flex-row items-center">
                <Text className="font-label-semibold text-rank-up text-[12px] mr-1">
                  +{post.ranking.delta ?? 1}
                </Text>
                <Icon name="arrow-upward" size={16} color="#547C65" />
              </View>
            )}
            {post.ranking.movement === "down" && (
              <View className="flex-row items-center">
                <Text className="font-label-semibold text-rank-down text-[12px] mr-1">
                  -{post.ranking.delta ?? 1}
                </Text>
                <Icon name="arrow-downward" size={16} color="#8B5D5D" />
              </View>
            )}
            {post.ranking.movement === "new" && (
              <Label className="text-new-entry uppercase tracking-widest text-[10px]">
                New
              </Label>
            )}
          </View>

          {/* Curator's Note */}
          <View className="px-2 gap-3">
            <Headline className="text-[28px] leading-[32px]">
              {post.headline}
            </Headline>
            <Body className="text-[15px] leading-[22px]">{post.caption}</Body>
            <View className="pt-2">
              <TagRow tags={post.tags} />
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
            variant="notes"
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
