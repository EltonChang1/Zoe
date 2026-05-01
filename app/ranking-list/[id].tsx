import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  View,
  Text,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { Icon } from "@/components/ui/Icon";
import {
  Body,
  Display,
  Headline,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import type { RankingEntry, RankingList, User } from "@/data/types";
import { getObject } from "@/data/objects";
import { getUser } from "@/data/users";
import { getSpotifyLinks, openSpotifyLinks } from "@/lib/music/spotifyLinks";
import {
  useAuth,
  useBlockUser,
  useDeleteRankingList,
  useRankingListQuery,
  useReport,
} from "@/lib/api";
import { confirmBlock, runReportFlow } from "@/components/moderation/actions";
import { gradients } from "@/theme/tokens";

/**
 * Ranking list detail (Spec SCREEN 14, VDK §18.3):
 *
 *  - Editorial hero: cover photo, category eyebrow, Display title, italic
 *    description, owner chrome.
 *  - Ordered ranked entries with numbered rank pill, object thumbnail,
 *    object title/subtitle, movement pill (up/down/new).
 *  - Owner-only "Add to list" CTA routes to `/rank/add?listId=...`.
 */
export default function RankingListDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useRankingListQuery(id);

  const list = data?.list;
  const owner = list ? getUser(list.ownerId) : null;
  const isOwner = Boolean(list && user && list.ownerId === user.id);
  const deleteMutation = useDeleteRankingList();
  const reportMutation = useReport();
  const blockMutation = useBlockUser();

  const handleShare = () => {
    if (!list) return;
    Share.share({
      message: `${list.title} — ${list.category}\nhttps://zoe.app/l/${list.id}`,
    }).catch(() => undefined);
  };

  const handleDelete = () => {
    if (!list) return;
    Alert.alert(
      "Delete this ranking?",
      "The list and every ranked entry will be removed. Posts that cite the list keep their content but lose the ranking chip.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteMutation.mutate(list.id, {
              onSuccess: () => router.back(),
              onError: (err) =>
                Alert.alert(
                  "Couldn't delete list",
                  err instanceof Error
                    ? err.message
                    : "Please try again in a moment.",
                ),
            }),
        },
      ],
    );
  };

  const openMoreMenu = () => {
    if (!list || !owner) return;
    if (isOwner) {
      handleDelete();
      return;
    }
    Alert.alert("More", "What would you like to do?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Report list",
        style: "destructive",
        // Ranking lists live next to posts in the server's data model — we
        // log the report against the list's *author* via subjectType=user
        // so triage tooling can route it the same way it does for a
        // profile report. If we later add a list-level subject type we
        // can swap without any client migration.
        onPress: () =>
          runReportFlow({
            subjectLabel: "list",
            subjectType: "user",
            subjectId: list.ownerId,
            submit: (input) => reportMutation.mutateAsync(input),
          }),
      },
      {
        text: `Block @${owner.handle}`,
        style: "destructive",
        onPress: async () => {
          const ok = await confirmBlock(owner.displayName);
          if (!ok) return;
          blockMutation.mutate(owner.handle, {
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
  };

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
            Zoe
          </Text>
        }
        trailing={
          <View className="flex-row items-center gap-3">
            <Pressable hitSlop={10} onPress={handleShare}>
              <Icon name="ios-share" size={20} color="#55343B" />
            </Pressable>
            {list && user ? (
              <Pressable
                hitSlop={10}
                onPress={openMoreMenu}
                accessibilityLabel="List options"
                className="active:opacity-60"
              >
                <Icon name="more-horiz" size={22} color="#55343B" />
              </Pressable>
            ) : null}
          </View>
        }
      />

      {isLoading && !list && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#55343B" />
        </View>
      )}

      {isError && !list && (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Headline>Couldn&apos;t load list</Headline>
          <Body>
            {error instanceof Error
              ? error.message
              : "Try again in a moment."}
          </Body>
          <Button label="Go back" onPress={() => router.back()} />
        </View>
      )}

      {list && owner && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 96, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          <HeroHeader list={list} owner={owner} />

          <View className="px-5 mt-8 gap-5">
            {list.entries.length === 0 ? (
              <EmptyEntries
                isOwner={isOwner}
                onAdd={() => router.push(`/rank/add?listId=${list.id}`)}
              />
            ) : (
              list.entries.map((entry) => (
                <EntryRow
                  key={entry.objectId}
                  entry={entry}
                  onPress={() => router.push(`/object/${entry.objectId}`)}
                />
              ))
            )}
          </View>

          {isOwner && list.entries.length > 0 && (
            <View className="px-5 mt-10">
              <Button
                label="Add to this ranking"
                onPress={() => router.push(`/rank/add?listId=${list.id}`)}
                full
              />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ------------- Hero -------------

function HeroHeader({ list, owner }: { list: RankingList; owner: User }) {
  return (
    <View>
      {list.coverImage ? (
        <View className="mx-5 rounded-xl overflow-hidden bg-surface-container-low">
          <Image
            source={{ uri: list.coverImage }}
            style={{ aspectRatio: 16 / 10 }}
            contentFit="cover"
            transition={280}
            className="w-full"
          />
        </View>
      ) : null}

      <View className="px-6 pt-6 items-center">
        <LabelCaps className="text-primary">{list.category}</LabelCaps>
        <Display className="mt-3 text-center text-[34px] leading-[38px]">
          {list.title}
        </Display>
        {list.description ? (
          <HeadlineItalic className="mt-3 text-center text-[17px] leading-[22px] text-on-surface-variant">
            {list.description}
          </HeadlineItalic>
        ) : null}

        <View className="flex-row items-center mt-5 gap-2">
          <Avatar uri={owner.avatar} size="sm" />
          <Label className="text-[12px] text-on-surface-variant">
            by{" "}
            <Text className="font-body-medium text-on-surface">
              {owner.displayName}
            </Text>{" "}
            · @{owner.handle}
          </Label>
        </View>

        <View className="flex-row items-center gap-6 mt-4">
          <Stat label="Ranked" value={list.entries.length} />
          {list.saves > 0 && <Stat label="Saves" value={list.saves} />}
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="font-headline text-on-surface text-[20px] leading-[24px]">
        {value}
      </Text>
      <LabelCaps className="mt-1 text-[10px] text-on-surface-variant">
        {label}
      </LabelCaps>
    </View>
  );
}

// ------------- Ranked entry row -------------

function EntryRow({
  entry,
  onPress,
}: {
  entry: RankingEntry;
  onPress?: () => void;
}) {
  const object = getObject(entry.objectId);
  const spotifyLinks = getSpotifyLinks(object);
  const hasSpotify = Boolean(spotifyLinks.uri || spotifyLinks.webUrl);
  const imageUrl = entry.imageUrl || object?.heroImage;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/15 active:opacity-90"
      style={{
        shadowColor: "#1B1C1A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 1,
      }}
    >
      <View className="relative w-[112px] bg-surface-container-low">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ flex: 1, aspectRatio: 1 }}
            contentFit={hasSpotify ? "contain" : "cover"}
            transition={220}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Icon name="image" size={24} color="#B0A49F" />
          </View>
        )}
        {!hasSpotify ? (
          <LinearGradient
            colors={gradients.rankSpine}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 3,
            }}
          />
        ) : null}
      </View>

      <View className="flex-1 p-4 justify-between">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-baseline gap-2">
              <Text className="font-display-italic text-primary text-[24px] tracking-tightest">
                #{entry.rank} · {entry.score.toFixed(1)}
              </Text>
              {entry.movement && (
                <MovementPill
                  movement={entry.movement}
                  delta={entry.delta}
                />
              )}
            </View>
            <Text
              className="font-headline text-on-surface text-[16px] leading-[20px] mt-1"
              numberOfLines={2}
            >
              {object?.title ?? "Unknown"}
            </Text>
            {object?.subtitle ? (
              <Text
                className="font-headline-italic text-on-surface-variant text-[13px] mt-0.5"
                numberOfLines={1}
              >
                {object.subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {(object?.city || object?.neighborhood) && (
          <View className="flex-row items-center mt-3">
            <Icon name="place" size={12} color="#8F8480" />
            <Label className="ml-1 text-[11px]">
              {[object.neighborhood, object.city]
                .filter(Boolean)
                .join(" · ")}
            </Label>
          </View>
        )}

        {hasSpotify ? (
          <View className="mt-3 items-start">
            <Pressable
              onPress={() => openSpotifyLinks(spotifyLinks).catch(() => undefined)}
              className="flex-row items-center rounded-full border border-outline-variant/35 px-3 py-1.5 active:opacity-70"
            >
              <Icon name="library-music" size={14} color="#55343B" />
              <Label className="ml-1.5 text-[10px] font-label-semibold uppercase tracking-widest text-primary">
                Listen
              </Label>
            </Pressable>
            <Label className="mt-1 text-[9px] text-on-surface-variant">
              Metadata by Spotify
            </Label>
          </View>
        ) : null}

        {entry.note ? (
          <Body
            className="mt-2 text-[12px] leading-[16px] text-on-surface-variant"
            numberOfLines={2}
          >
            {entry.note}
          </Body>
        ) : null}

        {entry.restaurantVisit ? (
          <View className="mt-3 gap-1">
            {entry.restaurantVisit.companions.length > 0 ? (
              <Label className="text-[10px]" numberOfLines={1}>
                With{" "}
                {entry.restaurantVisit.companions
                  .map((user) => `@${user.handle}`)
                  .join(", ")}
              </Label>
            ) : null}
            {entry.restaurantVisit.dishes.length > 0 ? (
              <Label className="text-[10px]" numberOfLines={2}>
                Ordered{" "}
                {entry.restaurantVisit.dishes
                  .map((dish) => dish.name)
                  .join(", ")}
              </Label>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function MovementPill({
  movement,
  delta,
}: {
  movement: "up" | "down" | "new" | "stable";
  delta?: number;
}) {
  if (movement === "new") {
    return (
      <View className="px-1.5 py-0.5 rounded border border-new-entry/40">
        <Label className="uppercase tracking-widest text-new-entry text-[9px]">
          New
        </Label>
      </View>
    );
  }
  if (movement === "up") {
    return (
      <View className="flex-row items-center">
        <Icon name="arrow-upward" size={12} color="#547C65" />
        <Label className="ml-0.5 text-rank-up text-[11px]">
          {delta ?? 1}
        </Label>
      </View>
    );
  }
  if (movement === "down") {
    return (
      <View className="flex-row items-center">
        <Icon name="arrow-downward" size={12} color="#8B5D5D" />
        <Label className="ml-0.5 text-rank-down text-[11px]">
          {delta ?? 1}
        </Label>
      </View>
    );
  }
  return null;
}

// ------------- Empty -------------

function EmptyEntries({ isOwner, onAdd }: { isOwner: boolean; onAdd: () => void }) {
  return (
    <View className="bg-surface-container-low rounded-xl p-6 items-start">
      <LabelCaps>Nothing ranked yet</LabelCaps>
      <HeadlineItalic className="mt-1 text-primary">
        {isOwner ? "Place your first entry" : "The curator is still collecting."}
      </HeadlineItalic>
      <Body className="mt-2">
        {isOwner
          ? "Add one item you love, then compare as you encounter more."
          : "Check back soon — this list is being shaped."}
      </Body>
      {isOwner && (
        <View className={cn("mt-4")}>
          <Button label="Add to ranking" onPress={onAdd} />
        </View>
      )}
    </View>
  );
}
