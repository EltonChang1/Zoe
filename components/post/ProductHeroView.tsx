import { Image } from "expo-image";
import { ScrollView, View, Text } from "react-native";

import { Button } from "@/components/ui/Button";
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
import type { PostInteraction } from "./types";

/**
 * Variant C — Product / fashion hero (Design_guide/posts/post_for_shoes).
 * Wide 16:10 product hero · floating rank chip · left-rule editorial copy ·
 * "Add to Collection" / "View Details" CTAs · "Thoughts" discussion.
 */
export function ProductHeroView({
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
        {/* Hero */}
        <View className="relative">
          <Image
            source={{ uri: object?.heroImage }}
            style={{ aspectRatio: 16 / 10 }}
            contentFit="cover"
            transition={260}
            className="w-full"
          />
          {/* Floating rank chip */}
          <View className="absolute right-5 -bottom-7 bg-surface-container-highest px-5 py-3 rounded flex-row items-center gap-3 border border-outline-variant/30"
            style={{
              shadowColor: "#1B1C1A",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 24,
            }}
          >
            <Text className="font-headline-italic text-primary text-[22px]">
              #{post.ranking.rank}
            </Text>
            <View className="w-[1px] h-6 bg-outline-variant/40" />
            <View>
              <LabelCaps className="text-[9px]">In list</LabelCaps>
              <Text
                className="font-body-medium text-on-surface text-[12px]"
                numberOfLines={1}
              >
                {post.ranking.listTitle}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-5 mt-14 gap-8">
          <CuratorHeader
            author={author}
            publishedAt={post.publishedAt}
            saved={interaction?.saved}
            onToggleSave={interaction?.onToggleSave}
            onPressAuthor={interaction?.onPressAuthor}
          />

          {/* Editorial copy with left rule */}
          <View className="flex-row">
            <View className="w-[3px] bg-primary mr-4 rounded-full" />
            <View className="flex-1 gap-3">
              <LabelCaps>{object?.type} · Feature</LabelCaps>
              <Headline className="text-[26px] leading-[30px]">
                {object?.title}
              </Headline>
              <Text className="font-headline-italic text-on-surface-variant text-[16px] -mt-1">
                {object?.subtitle}
              </Text>
              <Body className="mt-2 text-[15px] leading-[22px]">
                {post.caption}
              </Body>
            </View>
          </View>

          <TagRow tags={post.tags} />

          {/* CTAs */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Add to collection" full />
            </View>
            <View className="flex-1">
              <Button
                label="View details"
                variant="secondary"
                onPress={interaction?.onPressObject}
                full
              />
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
            variant="thoughts"
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
