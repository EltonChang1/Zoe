import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
  useSearchAllQuery,
} from "@/lib/api";
import type {
  ApiSearchObjectHit,
  ApiSearchPostHit,
  ApiSearchUserHit,
} from "@/lib/api/types";

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

  const { data, isFetching, isError } = useSearchAllQuery(trimmed);

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
          {active && isFetching && (
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
          />
        ) : (
          <FollowingActivity
            onOpenPost={(id) => router.push(`/post/${id}`)}
          />
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
}: {
  data:
    | {
        objects?: ApiSearchObjectHit[];
        posts?: ApiSearchPostHit[];
        users?: ApiSearchUserHit[];
      }
    | undefined;
  isError: boolean;
  onOpenPost: (id: string) => void;
  onOpenUser: (handle: string) => void;
  onOpenObject: (id: string) => void;
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
  const totalHits = users.length + objects.length + posts.length;

  if (data && totalHits === 0) {
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
      {users.length > 0 && (
        <Section label="People" kicker={`${users.length} curators`}>
          <View className="gap-1">
            {users.map((u) => (
              <UserRow
                key={u.id}
                hit={u}
                onPress={() => onOpenUser(u.handle)}
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
                onPress={() => onOpenObject(o.id)}
              />
            ))}
          </View>
        </Section>
      )}

      {posts.length > 0 && (
        <Section label="Posts" kicker={`${posts.length} reviews`}>
          <View className="gap-3">
            {posts.map((p) => (
              <PostRow key={p.id} hit={p} onPress={() => onOpenPost(p.id)} />
            ))}
          </View>
        </Section>
      )}
    </View>
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
          {hit.subtitle ?? hit.type}
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
