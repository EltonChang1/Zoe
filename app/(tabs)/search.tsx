import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Text,
} from "react-native";

import { ActivityCard } from "@/components/cards/ActivityCard";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import {
  Body,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { Icon } from "@/components/ui/Icon";
import { currentUserId, getUser } from "@/data/users";
import type { ActivityCard as ActivityCardType } from "@/data/types";
import { cn } from "@/lib/cn";
import {
  mapUser,
  useActivityQuery,
  useAuth,
  useFollowSearch,
  useGooglePlaceSearchQuery,
  useRecordSearchEvent,
  useSavedLibraryQuery,
  useSearchAllQuery,
  useSearchSuggestionsQuery,
  useUpsertGooglePlace,
} from "@/lib/api";
import type {
  ApiGooglePlaceHit,
  ApiSearchListHit,
  ApiSearchObjectHit,
  ApiSearchPostHit,
  ApiSearchUserHit,
} from "@/lib/api/types";
import { displayObjectType } from "@/lib/objects/display";

/**
 * Search / Following Activity — VDK §18.2, Design_guide/search_page.
 *
 * The surface pivots based on input state:
 *   • empty input → "Following activity" editorial feed (still mock-backed;
 *     there's no dedicated follow-graph endpoint yet).
 *   • ≥ 2 chars   → live cross-type search (people / places & things /
 *     posts) via `GET /search?type=all`. Caller-side debouncing keeps the
 *     network polite without a backend rate limiter.
 */
export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const me = user ? mapUser(user) : getUser(currentUserId);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 220);
  const trimmed = debounced.trim();
  const active = trimmed.length >= 2;
  const googleSessionToken = useMemo(createSessionToken, []);
  const [pendingGooglePlaceId, setPendingGooglePlaceId] = useState<string | null>(
    null,
  );
  const [googleSelectError, setGoogleSelectError] = useState<string | null>(
    null,
  );

  const { data, isFetching, isError } = useSearchAllQuery(trimmed);
  const suggestionsQuery = useSearchSuggestionsQuery();
  const recordSearch = useRecordSearchEvent();
  const followSearch = useFollowSearch();
  const googleQuery = useGooglePlaceSearchQuery(trimmed, {
    sessionToken: googleSessionToken,
    limit: 8,
  });
  const upsertGoogle = useUpsertGooglePlace();

  const openGooglePlace = async (hit: ApiGooglePlaceHit) => {
    setGoogleSelectError(null);
    setPendingGooglePlaceId(hit.placeId);
    recordSearch.mutate({
      query: trimmed || hit.title,
      resultType: "google_place",
      resultId: hit.placeId,
    });
    try {
      const res = await upsertGoogle.mutateAsync({
        placeId: hit.placeId,
        sessionToken: googleSessionToken,
      });
      router.push(`/object/${res.object.id}`);
    } catch (err) {
      setGoogleSelectError(
        err instanceof Error
          ? err.message
          : "Couldn't open this Google place.",
      );
    } finally {
      setPendingGooglePlaceId(null);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <GlassTopBar
        leading={
          <Pressable hitSlop={10} className="active:opacity-70">
            <Icon name="tune" size={22} color="#55343B" />
          </Pressable>
        }
        title={
          <Text className="font-display-italic text-primary text-[22px] tracking-tightest">
            Zoe
          </Text>
        }
        trailing={<Avatar uri={me.avatar} size="sm" />}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 96, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Editorial search input */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center border-b border-outline-variant/40 pb-3">
            <Icon name="search" size={22} color="#504446" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for inspiration…"
              placeholderTextColor="rgba(80,68,70,0.6)"
              autoCorrect={false}
              autoCapitalize="none"
              className="flex-1 ml-3 font-headline-italic text-on-surface text-[22px]"
              style={{ paddingVertical: 6 }}
            />
            {query.length > 0 ? (
              <Pressable
                hitSlop={8}
                onPress={() => setQuery("")}
                className="active:opacity-70"
              >
                <Icon name="close" size={22} color="#504446" />
              </Pressable>
            ) : (
              <Pressable hitSlop={8} className="active:opacity-70">
                <Icon name="center-focus-weak" size={22} color="#504446" />
              </Pressable>
            )}
          </View>
          {active && (isFetching || googleQuery.isFetching) && (
            <View className="flex-row items-center mt-3">
              <ActivityIndicator size="small" color="#55343B" />
              <Label className="ml-2 text-[11px]">Searching…</Label>
            </View>
          )}
        </View>

        {active ? (
          <SearchResults
            data={data}
            isError={isError}
            onOpenPost={(id) => router.push(`/post/${id}`)}
            onOpenUser={(handle) => router.push(`/user/${handle}`)}
            onOpenObject={(id) => router.push(`/object/${id}`)}
            onOpenList={(id) => router.push(`/ranking-list/${id}`)}
            query={trimmed}
            onRecordResult={(resultType, resultId) =>
              recordSearch.mutate({ query: trimmed, resultType, resultId })
            }
            onFollowQuery={() => followSearch.mutate(trimmed)}
            followPending={followSearch.isPending}
            googlePlaces={googleQuery.data?.googlePlaces ?? []}
            googleAttribution={googleQuery.data?.attribution}
            googleUnavailable={Boolean(googleQuery.data?.unavailable)}
            googleError={googleSelectError}
            pendingGooglePlaceId={pendingGooglePlaceId}
            onOpenGooglePlace={openGooglePlace}
          />
        ) : (
          <>
            <SearchHabitPanel
              prompts={suggestionsQuery.data?.prompts ?? []}
              recent={suggestionsQuery.data?.recent ?? []}
              followed={suggestionsQuery.data?.followed ?? []}
              trending={suggestionsQuery.data?.trending ?? []}
              onPick={(q) => {
                setQuery(q);
                recordSearch.mutate({ query: q, resultType: "prompt" });
              }}
              onOpenObject={(id) => router.push(`/object/${id}`)}
              onFollow={(q) => followSearch.mutate(q)}
              followPending={followSearch.isPending}
            />
            <SavedTasteShelf />
            <FollowingActivity
              onOpenPost={(id) => router.push(`/post/${id}`)}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------- Active search results ----------------

function SearchResults({
  data,
  isError,
  onOpenPost,
  onOpenUser,
  onOpenObject,
  onOpenList,
  query,
  onRecordResult,
  onFollowQuery,
  followPending,
  googlePlaces,
  googleAttribution,
  googleUnavailable,
  googleError,
  pendingGooglePlaceId,
  onOpenGooglePlace,
}: {
  data:
    | {
        objects?: ApiSearchObjectHit[];
        posts?: ApiSearchPostHit[];
        users?: ApiSearchUserHit[];
        lists?: ApiSearchListHit[];
      }
    | undefined;
  isError: boolean;
  onOpenPost: (id: string) => void;
  onOpenUser: (handle: string) => void;
  onOpenObject: (id: string) => void;
  onOpenList: (id: string) => void;
  query: string;
  onRecordResult: (
    resultType: "object" | "post" | "user" | "list",
    resultId: string,
  ) => void;
  onFollowQuery: () => void;
  followPending: boolean;
  googlePlaces: ApiGooglePlaceHit[];
  googleAttribution?: string;
  googleUnavailable: boolean;
  googleError: string | null;
  pendingGooglePlaceId: string | null;
  onOpenGooglePlace: (hit: ApiGooglePlaceHit) => void;
}) {
  if (isError) {
    return (
      <View className="px-5">
        <View className="rounded-xl bg-surface-container-low p-5">
          <LabelCaps>Search hit a snag</LabelCaps>
          <Body className="mt-2">
            Our engine tripped. Try a different phrase in a moment.
          </Body>
        </View>
      </View>
    );
  }

  const users = data?.users ?? [];
  const objects = data?.objects ?? [];
  const posts = data?.posts ?? [];
  const lists = data?.lists ?? [];
  const totalHits =
    users.length + objects.length + posts.length + lists.length + googlePlaces.length;

  if (data && totalHits === 0 && !googleUnavailable) {
    return (
      <View className="px-5">
        <View className="rounded-xl bg-surface-container-low p-5">
          <LabelCaps>Nothing here</LabelCaps>
          <HeadlineItalic className="mt-1 text-primary text-[22px]">
            Try a lighter touch
          </HeadlineItalic>
          <Body className="mt-2">
            Zoe searches titles, cities, and captions. A simpler phrase usually
            lands more results.
          </Body>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-8">
      <View className="px-5">
        <Pressable
          disabled={followPending}
          onPress={onFollowQuery}
          className="self-start rounded-full bg-primary/10 px-3 py-1.5 active:opacity-70"
        >
          <Label className="text-[11px] uppercase tracking-widest text-primary">
            Follow “{query}”
          </Label>
        </Pressable>
      </View>

      {users.length > 0 && (
        <Section label="People" kicker={`${users.length} curators`}>
          <View className="gap-1">
            {users.map((u) => (
              <UserRow
                key={u.id}
                hit={u}
                onPress={() => {
                  onRecordResult("user", u.id);
                  onOpenUser(u.handle);
                }}
              />
            ))}
          </View>
        </Section>
      )}

      {objects.length > 0 && (
        <Section
          label="Places & things"
          kicker={`${objects.length} in the catalogue`}
        >
          <View className="gap-1">
            {objects.map((o) => (
              <ObjectRow
                key={o.id}
                hit={o}
                onPress={() => {
                  onRecordResult("object", o.id);
                  onOpenObject(o.id);
                }}
              />
            ))}
          </View>
        </Section>
      )}

      {googlePlaces.length > 0 && (
        <Section
          label="Google Places"
          kicker={googleAttribution ?? "Powered by Google"}
        >
          <View className="gap-1">
            {googlePlaces.map((p) => (
              <GooglePlaceRow
                key={p.placeId}
                hit={p}
                pending={pendingGooglePlaceId === p.placeId}
                onPress={() => onOpenGooglePlace(p)}
              />
            ))}
          </View>
        </Section>
      )}

      {googleError ? (
        <View className="px-5">
          <Body className="text-rank-down text-[13px]">{googleError}</Body>
        </View>
      ) : null}

      {googleUnavailable ? (
        <View className="px-5">
          <Label className="text-[11px] text-on-surface-variant">
            Google Places is not configured on this server yet.
          </Label>
        </View>
      ) : null}

      {posts.length > 0 && (
        <Section label="Posts" kicker={`${posts.length} reviews`}>
          <View className="gap-3">
            {posts.map((p) => (
              <PostRow
                key={p.id}
                hit={p}
                onPress={() => {
                  onRecordResult("post", p.id);
                  onOpenPost(p.id);
                }}
              />
            ))}
          </View>
        </Section>
      )}

      {lists.length > 0 && (
        <Section label="Rankings" kicker={`${lists.length} lists`}>
          <View className="gap-3">
            {lists.map((list) => (
              <RankingListRow
                key={list.id}
                hit={list}
                onPress={() => {
                  onRecordResult("list", list.id);
                  onOpenList(list.id);
                }}
              />
            ))}
          </View>
        </Section>
      )}
    </View>
  );
}

function SearchHabitPanel({
  prompts,
  recent,
  followed,
  trending,
  onPick,
  onOpenObject,
  onFollow,
  followPending,
}: {
  prompts: string[];
  recent: { id: string; query: string; inferredCategory: string | null }[];
  followed: { id: string; query: string; inferredCategory: string | null }[];
  trending: {
    id: string;
    title: string;
    type: string;
    city: string | null;
    rank: number;
    listTitle: string;
  }[];
  onPick: (query: string) => void;
  onOpenObject: (id: string) => void;
  onFollow: (query: string) => void;
  followPending: boolean;
}) {
  const starterPrompts = prompts.slice(0, 4);
  return (
    <View className="px-5 mb-8 gap-5">
      <View>
        <LabelCaps>Search habit</LabelCaps>
        <HeadlineItalic className="mt-1 text-primary text-[28px]">
          Decide with taste
        </HeadlineItalic>
      </View>

      {recent.length > 0 ? (
        <View>
          <Label className="mb-2 text-[11px] uppercase tracking-widest">
            Recent searches
          </Label>
          <View className="flex-row flex-wrap gap-2">
            {recent.map((item) => (
              <Chip
                key={item.id}
                label={item.query}
                variant="filled"
                dense
                onPress={() => onPick(item.query)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View>
        <Label className="mb-2 text-[11px] uppercase tracking-widest">
          Try asking Zoe
        </Label>
        <View className="flex-row flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <Chip
              key={prompt}
              label={prompt}
              variant="ghost"
              dense
              onPress={() => onPick(prompt)}
            />
          ))}
        </View>
      </View>

      {followed.length > 0 ? (
        <View>
          <Label className="mb-2 text-[11px] uppercase tracking-widest">
            Followed searches
          </Label>
          <View className="gap-2">
            {followed.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onPick(item.query)}
                className="rounded-xl bg-surface-container-low p-3 active:opacity-80"
              >
                <Label className="text-[12px] text-primary">
                  {item.query}
                </Label>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <Pressable
          disabled={followPending || starterPrompts.length === 0}
          onPress={() => onFollow(starterPrompts[0] ?? "best cafés near me")}
          className="rounded-xl bg-surface-container-low p-4 active:opacity-80"
        >
          <LabelCaps>Follow a search</LabelCaps>
          <Body className="mt-1 text-[13px]">
            Zoe can keep a query warm, like cafés near you or albums your
            friends rank high.
          </Body>
        </Pressable>
      )}

      {trending.length > 0 ? (
        <View>
          <Label className="mb-2 text-[11px] uppercase tracking-widest">
            Trending in your city
          </Label>
          <View className="gap-1">
            {trending.slice(0, 3).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onOpenObject(item.id)}
                className="flex-row items-center rounded-xl bg-surface-container-low px-3 py-2 active:opacity-80"
              >
                <View className="w-8 h-8 rounded-full bg-background items-center justify-center">
                  <Label className="text-[11px] text-primary">#{item.rank}</Label>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-headline text-on-surface text-[14px]">
                    {item.title}
                  </Text>
                  <Label className="text-[10px]" numberOfLines={1}>
                    {item.listTitle}
                    {item.city ? ` · ${item.city}` : ""}
                  </Label>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function SavedTasteShelf() {
  const savedQuery = useSavedLibraryQuery({ limit: 8 });
  const posts = savedQuery.data?.posts ?? [];
  const unranked = savedQuery.data?.unrankedObjects ?? [];
  if (!savedQuery.isLoading && posts.length === 0 && unranked.length === 0) {
    return null;
  }
  return (
    <View className="px-5 mb-8">
      <View className="mb-3 flex-row items-baseline justify-between">
        <LabelCaps>Saved taste</LabelCaps>
        {unranked.length > 0 ? (
          <Label className="text-[10px] text-primary">
            {unranked.length} saved, not ranked
          </Label>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {posts.slice(0, 6).map((post) => (
            <View
              key={post.id}
              className="w-40 rounded-xl bg-surface-container-low p-3"
            >
              <Text
                className="font-headline text-on-surface text-[14px]"
                numberOfLines={2}
              >
                {post.headline}
              </Text>
              <Label className="mt-2 text-[10px]" numberOfLines={1}>
                {post.why ?? "Saved by you"}
              </Label>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function GooglePlaceRow({
  hit,
  pending,
  onPress,
}: {
  hit: ApiGooglePlaceHit;
  pending: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      className="flex-row items-center py-2 px-1 active:opacity-70"
    >
      <View
        style={{ width: 56, height: 56, borderRadius: 8 }}
        className="bg-surface-container-low items-center justify-center"
      >
        <Icon name="place" size={20} color="#55343B" />
      </View>
      <View className="ml-3 flex-1">
        <Text
          className="font-headline text-on-surface text-[15px]"
          numberOfLines={1}
        >
          {hit.title}
        </Text>
        <Label className="mt-0.5 text-[11px]" numberOfLines={1}>
          {hit.subtitle ?? hit.primaryType ?? hit.type}
        </Label>
      </View>
      {pending ? (
        <ActivityIndicator size="small" color="#55343B" />
      ) : (
        <Icon name="add-location-alt" size={18} color="#827475" />
      )}
    </Pressable>
  );
}

function Section({
  label,
  kicker,
  children,
}: {
  label: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="px-5">
      <View className="mb-3 flex-row items-baseline justify-between">
        <LabelCaps>{label}</LabelCaps>
        {kicker ? (
          <Label className="text-[10px] text-on-surface-variant">
            {kicker}
          </Label>
        ) : null}
      </View>
      {children}
    </View>
  );
}

// ---------------- Rows ----------------

// Neutral cocoa tile for users without an avatar — keeps row height stable.
const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=200&q=60";

function UserRow({
  hit,
  onPress,
}: {
  hit: ApiSearchUserHit;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-2 px-1 active:bg-surface-container-low rounded-lg"
    >
      <Avatar uri={hit.avatarUrl ?? AVATAR_FALLBACK} size="sm" />
      <View className="ml-3 flex-1">
        <Text className="font-headline text-on-surface text-[15px]">
          {hit.displayName}
        </Text>
        <Label className="mt-0.5 text-[11px]">@{hit.handle}</Label>
      </View>
      <Icon name="chevron-right" size={20} color="#827475" />
    </Pressable>
  );
}

function ObjectRow({
  hit,
  onPress,
}: {
  hit: ApiSearchObjectHit;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-2 px-1 active:opacity-70"
    >
      {hit.heroImage ? (
        <Image
          source={{ uri: hit.heroImage }}
          style={{ width: 56, height: 56, borderRadius: 8 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{ width: 56, height: 56, borderRadius: 8 }}
          className="bg-surface-container-low items-center justify-center"
        >
          <Icon name="image" size={18} color="#B0A49F" />
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text
          className="font-headline text-on-surface text-[15px]"
          numberOfLines={1}
        >
          {hit.title}
        </Text>
        <Label className="mt-0.5 text-[11px]" numberOfLines={1}>
          {hit.subtitle ?? displayObjectType(hit.type)}
          {hit.city ? ` · ${hit.city}` : ""}
        </Label>
      </View>
      <Icon name="chevron-right" size={18} color="#B0A49F" />
    </Pressable>
  );
}

function PostRow({
  hit,
  onPress,
}: {
  hit: ApiSearchPostHit;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-xl bg-surface-container-lowest border border-outline-variant/15",
        "active:opacity-90",
      )}
      style={{
        shadowColor: "#1B1C1A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 1,
      }}
    >
      <View className="p-4">
        <HeadlineItalic className="text-primary text-[18px] leading-[22px]">
          {hit.headline}
        </HeadlineItalic>
        <Body
          className="mt-2 text-[13px] leading-[18px] text-on-surface-variant"
          numberOfLines={3}
        >
          {hit.caption}
        </Body>
        <View className="mt-3 flex-row items-center">
          <Icon name="chevron-right" size={14} color="#827475" />
          <Label className="ml-1 text-[11px]">Open review</Label>
        </View>
      </View>
    </Pressable>
  );
}

function RankingListRow({
  hit,
  onPress,
}: {
  hit: ApiSearchListHit;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl bg-surface-container-low p-4 active:opacity-90"
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-lg bg-background items-center justify-center">
          <Icon name="format-list-numbered" size={18} color="#55343B" />
        </View>
        <View className="ml-3 flex-1">
          <HeadlineItalic className="text-primary text-[18px] leading-[22px]">
            {hit.title}
          </HeadlineItalic>
          <Label className="mt-1 text-[11px]" numberOfLines={1}>
            @{hit.owner.handle} · {hit.entries} ranked · {hit.category}
          </Label>
          {hit.description ? (
            <Body className="mt-2 text-[13px]" numberOfLines={2}>
              {hit.description}
            </Body>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ---------------- Following Activity ----------------

function FollowingActivity({
  onOpenPost,
}: {
  onOpenPost: (id: string) => void;
}) {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useActivityQuery();
  const items: ActivityCardType[] = data?.items ?? [];
  const hasItems = items.length > 0;

  return (
    <>
      <View className="px-5 mb-5">
        <LabelCaps>Following activity</LabelCaps>
        <HeadlineItalic className="mt-1 text-primary text-[30px]">
          Your circle, ranked
        </HeadlineItalic>
      </View>

      {isLoading && !hasItems && (
        <View className="py-10 items-center">
          <ActivityIndicator color="#55343B" />
        </View>
      )}

      {isError && !hasItems && (
        <View className="px-5">
          <View className="rounded-xl bg-surface-container-low p-5">
            <LabelCaps>Activity is quiet</LabelCaps>
            <Body className="mt-2">
              We couldn&apos;t fetch the latest moves. Pull to refresh in a
              moment.
            </Body>
          </View>
        </View>
      )}

      {!isLoading && !isError && !hasItems && (
        <View className="px-5">
          <View className="rounded-xl bg-surface-container-low p-5">
            <LabelCaps>Nothing yet</LabelCaps>
            <HeadlineItalic className="mt-1 text-primary text-[22px]">
              Follow a few curators
            </HeadlineItalic>
            <Body className="mt-2">
              New rankings from people you follow will appear here. Start with
              the Community tab in Rankings.
            </Body>
          </View>
        </View>
      )}

      {hasItems && (
        <View className="px-5">
          {items.map((a) => (
            <ActivityCard
              key={a.id}
              card={a}
              onPress={() => onOpenPost(a.id)}
            />
          ))}

          {hasNextPage && (
            <Pressable
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="py-3 items-center active:opacity-70"
            >
              <Label className="text-[11px] uppercase tracking-widest">
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Label>
            </Pressable>
          )}
        </View>
      )}
    </>
  );
}

// ---------------- hooks ----------------

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function createSessionToken() {
  const random = Math.random().toString(36).slice(2);
  return `zoe-${Date.now().toString(36)}-${random}`;
}
