import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  Text,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import {
  Body,
  Display,
  HeadlineItalic,
  LabelCaps,
} from "@/components/ui/Text";
import { Icon } from "@/components/ui/Icon";
import { RankingListCard } from "@/components/cards/RankingListCard";
import { cn } from "@/lib/cn";
import type { RankingList } from "@/data/types";
import { currentUserId, getUser } from "@/data/users";
import {
  mapUser,
  useAuth,
  useCommunityRankingListsQuery,
  useOwnerRankingListsQuery,
} from "@/lib/api";

/**
 * Rankings hub — Community + Personal (VDK §18.3, Design_guide/ranking_page).
 *
 * Community: public ranking lists from the network, freshest first.
 * Personal: lists owned by the signed-in user.
 *
 * The hub is the primary entry point for list detail (`/ranking-list/:id`)
 * and, for Personal, for the pairwise Add flow (`/rank/add`).
 */
const FILTERS = ["Trending Lists", "New Tastemakers", "Category Gems"];

export default function RankingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const me = user ? mapUser(user) : getUser(currentUserId);
  const [mode, setMode] = useState<"community" | "personal">("community");
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);

  return (
    <View className="flex-1 bg-background">
      <GlassTopBar
        leading={
          <Pressable hitSlop={10} className="active:opacity-70">
            <Icon name="menu" size={22} color="#55343B" />
          </Pressable>
        }
        title={
          <Text className="font-display-italic text-primary text-[22px] tracking-tightest">
            Zoe
          </Text>
        }
        trailing={<Avatar uri={me.avatar} size="sm" />}
      />

      {mode === "community" ? (
        <CommunityView
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          mode={mode}
          setMode={setMode}
          onOpen={(id) => router.push(`/ranking-list/${id}`)}
        />
      ) : (
        <PersonalView
          ownerHandle={user?.handle ?? null}
          mode={mode}
          setMode={setMode}
          onAdd={() => router.push("/rank/add")}
          onOpen={(id) => router.push(`/ranking-list/${id}`)}
        />
      )}
    </View>
  );
}

// ------------- Shared chrome -------------

function Hero({ mode }: { mode: "community" | "personal" }) {
  return (
    <View className="px-6 pt-2 pb-6 items-center">
      <LabelCaps className="text-primary">The Rankings</LabelCaps>
      <Display className="mt-3 text-center text-[44px] leading-[48px]">
        {mode === "community" ? "Community Hub" : "Your Rankings"}
      </Display>
      <Body className="mt-3 text-center max-w-[320px]">
        {mode === "community"
          ? "Living rankings curated by the Zoe community. Find your next obsession."
          : "Your personal taste library — reorder, compare, publish."}
      </Body>
    </View>
  );
}

function ModeSwitch({
  mode,
  setMode,
}: {
  mode: "community" | "personal";
  setMode: (m: "community" | "personal") => void;
}) {
  return (
    <View className="flex-row self-center mb-2 bg-surface-container-low rounded-full p-1">
      {(["community", "personal"] as const).map((m) => (
        <Pressable
          key={m}
          onPress={() => setMode(m)}
          className={cn(
            "px-5 py-2 rounded-full",
            mode === m ? "bg-primary" : "bg-transparent",
          )}
        >
          <Text
            className={cn(
              "font-label-semibold uppercase tracking-widest text-[11px]",
              mode === m ? "text-on-primary" : "text-on-surface-variant",
            )}
          >
            {m === "community" ? "Community" : "Personal"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ------------- Community -------------

function CommunityView({
  activeFilter,
  setActiveFilter,
  mode,
  setMode,
  onOpen,
}: {
  activeFilter: string;
  setActiveFilter: (f: string) => void;
  mode: "community" | "personal";
  setMode: (m: "community" | "personal") => void;
  onOpen: (id: string) => void;
}) {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useCommunityRankingListsQuery();

  const lists = data?.lists ?? [];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: 96, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#55343B"
          colors={["#55343B"]}
          progressBackgroundColor="#FBF9F6"
          progressViewOffset={88}
        />
      }
    >
      <Hero mode={mode} />
      <ModeSwitch mode={mode} setMode={setMode} />

      {/* Filter tabs */}
      <View className="mt-6 mb-6 px-6 flex-row justify-around border-b border-outline-variant/30 pb-3">
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setActiveFilter(f)}
            className="pb-2"
          >
            <Text
              className={cn(
                "font-label-semibold uppercase tracking-widest text-[11px]",
                activeFilter === f ? "text-primary" : "text-on-surface-variant",
              )}
            >
              {f}
            </Text>
            {activeFilter === f && (
              <View className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-primary" />
            )}
          </Pressable>
        ))}
      </View>

      <View className="px-5">
        {isLoading && lists.length === 0 && (
          <View className="py-16 items-center">
            <ActivityIndicator color="#55343B" />
          </View>
        )}

        {isError && lists.length === 0 && (
          <EmptyState
            label="Couldn't load rankings"
            body={
              error instanceof Error
                ? error.message
                : "Pull to refresh in a moment."
            }
          />
        )}

        {!isLoading && !isError && lists.length === 0 && (
          <EmptyState
            label="Nothing here yet"
            body="Be the first to publish a list."
          />
        )}

        {lists.map((list) => (
          <RankingListCard
            key={list.id}
            list={list}
            onPress={() => onOpen(list.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ------------- Personal -------------

function PersonalView({
  ownerHandle,
  mode,
  setMode,
  onAdd,
  onOpen,
}: {
  ownerHandle: string | null;
  mode: "community" | "personal";
  setMode: (m: "community" | "personal") => void;
  onAdd: () => void;
  onOpen: (id: string) => void;
}) {
  const { data, isLoading, isError, refetch, isRefetching } =
    useOwnerRankingListsQuery(ownerHandle);

  const lists = data?.lists ?? [];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: 96, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#55343B"
          colors={["#55343B"]}
          progressBackgroundColor="#FBF9F6"
          progressViewOffset={88}
        />
      }
    >
      <Hero mode={mode} />
      <ModeSwitch mode={mode} setMode={setMode} />

      <View className="px-5 mt-4">
        <View className="flex-row items-center justify-between mb-4">
          <HeadlineItalic className="text-primary text-[22px]">
            My categories
          </HeadlineItalic>
          <Button label="Add" variant="primary" dense onPress={onAdd} />
        </View>

        {isLoading && lists.length === 0 && (
          <View className="py-10 items-center">
            <ActivityIndicator color="#55343B" />
          </View>
        )}

        {isError && (
          <EmptyState
            label="Couldn't load your lists"
            body="Pull to refresh in a moment."
          />
        )}

        {!isLoading && lists.length === 0 && (
          <View className="bg-surface-container-low rounded-xl p-6 items-start">
            <LabelCaps>Nothing yet</LabelCaps>
            <HeadlineItalic className="mt-1 text-primary">
              Start your first list
            </HeadlineItalic>
            <Body className="mt-2">
              Rank one thing you love. Compare against something else you love.
              Repeat.
            </Body>
            <View className="mt-4">
              <Button label="Add to ranking" onPress={onAdd} />
            </View>
          </View>
        )}

        {lists.map((list: RankingList) => (
          <RankingListCard
            key={list.id}
            list={list}
            onPress={() => onOpen(list.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function EmptyState({ label, body }: { label: string; body: string }) {
  return (
    <View className="bg-surface-container-low rounded-xl p-6 items-start">
      <LabelCaps>{label}</LabelCaps>
      <Body className="mt-2">{body}</Body>
    </View>
  );
}
