import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
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
import { getObject } from "@/data/objects";
import { gradients } from "@/theme/tokens";
import {
  useAuth,
  useCreateRankingList,
  useInsertRankingEntry,
  useObjectSearchQuery,
  useOwnerRankingListsQuery,
  useRankingListQuery,
} from "@/lib/api";
import type { ApiSearchObjectHit } from "@/lib/api/types";
import { ApiHttpError } from "@/lib/api/client";

/**
 * Add-to-Ranking (PRD §13, Spec SCREEN 16) — live.
 *
 * Stepper: category -> search -> compare -> caption -> confirm
 *
 * The pairwise comparator is a classic binary search over the chosen list's
 * already-ranked entries. Each tap shrinks [lo,hi]; when it collapses we
 * know the new item's exact 1-indexed rank. The final confirm step sends
 * `POST /ranking-lists/:id/entries { objectId, insertAt, note }` to the
 * transactional ranking engine, which dense-shifts existing ranks server-side.
 */
type Step = "category" | "search" | "compare" | "caption" | "confirm";
const STEPS: Step[] = ["category", "search", "compare", "caption", "confirm"];

export default function AddToRankingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();

  const [step, setStep] = useState<Step>("category");
  const [listId, setListId] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedObject | null>(null);
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(0);
  const [mid, setMid] = useState(0);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const listQuery = useRankingListQuery(listId ?? undefined);
  const list = listQuery.data?.list;
  const insertMutation = useInsertRankingEntry();

  const startCompare = (entriesCount: number) => {
    if (entriesCount === 0) {
      setInsertIndex(0);
      setStep("caption");
      return;
    }
    setLo(0);
    setHi(entriesCount - 1);
    setMid(Math.floor(entriesCount / 2));
    setStep("compare");
  };

  const pairwiseAnswer = (newIsBetter: boolean) => {
    if (!list) return;
    if (newIsBetter) {
      if (mid === lo) {
        setInsertIndex(mid);
        setStep("caption");
        return;
      }
      const nextHi = mid - 1;
      setHi(nextHi);
      setMid(Math.floor((lo + nextHi) / 2));
    } else {
      if (mid === hi) {
        setInsertIndex(mid + 1);
        setStep("caption");
        return;
      }
      const nextLo = mid + 1;
      setLo(nextLo);
      setMid(Math.floor((nextLo + hi) / 2));
    }
  };

  const handlePublish = async () => {
    if (!list || !picked || insertIndex == null) return;
    setSubmitError(null);
    try {
      await insertMutation.mutateAsync({
        listId: list.id,
        objectId: picked.id,
        insertAt: insertIndex + 1, // UI index -> 1-indexed rank
        note: note.trim() || undefined,
      });
      router.replace(`/ranking-list/${list.id}`);
    } catch (e) {
      if (e instanceof ApiHttpError) {
        setSubmitError(
          e.status === 409
            ? "This item is already in the list."
            : e.message || "Something went wrong.",
        );
      } else {
        setSubmitError("Couldn't save — check your connection and try again.");
      }
    }
  };

  if (!isSignedIn) {
    return (
      <View
        className="flex-1 bg-background items-center justify-center px-6"
        style={{ paddingTop: insets.top }}
      >
        <Headline className="text-center">Sign in to rank things</Headline>
        <Body className="mt-3 text-center">
          Your rankings live on your account. Take ten seconds to create one.
        </Body>
        <View className="mt-6 flex-row gap-3">
          <Button label="Sign in" onPress={() => router.replace("/sign-in")} />
          <Button
            label="Not now"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  const stepIdx = STEPS.indexOf(step);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Icon name="close" size={22} color="#55343B" />
        </Pressable>
        <Text className="font-display-italic text-primary text-[18px] tracking-tightest">
          Zoe
        </Text>
        <View className="w-6" />
      </View>

      {/* Stepper */}
      <View className="px-5 pb-2 flex-row items-center gap-2">
        {STEPS.map((s, i) => {
          const active = i <= stepIdx;
          return (
            <View
              key={s}
              className={cn(
                "h-[2px] flex-1 rounded-full",
                active ? "bg-primary" : "bg-outline-variant/40",
              )}
            />
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === "category" && (
          <CategoryStep
            onPick={(id, entriesCount) => {
              setListId(id);
              if (entriesCount === 0) {
                // Empty list: skip straight past compare — we'll still land
                // at rank 1 once an object is chosen.
                setStep("search");
              } else {
                setStep("search");
              }
            }}
          />
        )}

        {step === "search" && listId && (
          <SearchStep
            onPick={(hit) => {
              const p: PickedObject = {
                id: hit.id,
                title: hit.title,
                subtitle: hit.subtitle ?? undefined,
                city: hit.city ?? undefined,
                heroImage:
                  hit.heroImage ??
                  "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80",
                type: hit.type,
              };
              setPicked(p);
              // We need the list loaded to know entry count for pairwise.
              const entriesCount = list?.entries.length ?? 0;
              if (listQuery.isLoading) {
                // List detail not ready yet; the "go" button will be blocked.
                setStep("compare");
                return;
              }
              startCompare(entriesCount);
            }}
            picked={picked}
          />
        )}

        {step === "compare" && list && picked && (
          <CompareStep
            list={list}
            picked={picked}
            midObjectId={list.entries[mid]?.objectId}
            midRank={mid + 1}
            onAnswer={pairwiseAnswer}
            onTie={() => {
              setInsertIndex(mid + 1);
              setStep("caption");
            }}
          />
        )}

        {step === "compare" && (!list || listQuery.isLoading) && (
          <View className="py-16 items-center">
            <ActivityIndicator color="#55343B" />
          </View>
        )}

        {step === "caption" && picked && list && (
          <CaptionStep
            list={list}
            picked={picked}
            insertIndex={insertIndex ?? 0}
            note={note}
            onChangeNote={setNote}
            onNext={() => setStep("confirm")}
          />
        )}

        {step === "confirm" && picked && list && (
          <ConfirmStep
            list={list}
            picked={picked}
            insertIndex={insertIndex ?? 0}
            note={note}
            submitting={insertMutation.isPending}
            error={submitError}
            onPublish={handlePublish}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ---------------- Types ----------------

type PickedObject = {
  id: string;
  title: string;
  subtitle?: string;
  city?: string;
  heroImage: string;
  type: string;
};

type ListLite = {
  id: string;
  title: string;
  category: string;
  entriesCount: number;
};

// ---------------- Category ----------------

function CategoryStep({
  onPick,
}: {
  onPick: (id: string, entriesCount: number) => void;
}) {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useOwnerRankingListsQuery(
    user?.handle,
  );
  const lists = data?.lists ?? [];

  const [creating, setCreating] = useState(false);
  const createMutation = useCreateRankingList();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreateError(null);
    if (!title.trim() || !category.trim()) {
      setCreateError("Title and category are required.");
      return;
    }
    try {
      const res = await createMutation.mutateAsync({
        title: title.trim(),
        category: category.trim(),
        visibility: "public",
      });
      // A newly-created list is empty, so we skip comparisons for the very
      // first entry.
      onPick(res.list.id, 0);
    } catch (e) {
      setCreateError(
        e instanceof Error ? e.message : "Couldn't create the list.",
      );
    }
  };

  return (
    <View>
      <LabelCaps>Step one</LabelCaps>
      <Display className="mt-2 text-[34px] leading-[38px]">
        Which list?
      </Display>
      <Body className="mt-3">
        Pick one of your lists — or start a new one in the category you care
        about.
      </Body>

      {isLoading && (
        <View className="mt-10 items-center">
          <ActivityIndicator color="#55343B" />
        </View>
      )}

      {isError && (
        <View className="mt-6 rounded-xl bg-surface-container-low p-4">
          <Body>Couldn't load your lists.</Body>
          <View className="mt-3">
            <Button label="Try again" onPress={() => refetch()} />
          </View>
        </View>
      )}

      {!isLoading && !isError && (
        <View className="mt-8 gap-3">
          {lists.map((l) => {
            const lite: ListLite = {
              id: l.id,
              title: l.title,
              category: l.category,
              // Summary shape doesn't carry entries; the server's _count is
              // mapped into `saves` as 0 (see mappers.ts) — we fetch the real
              // count via useRankingListQuery once a list is picked. So we
              // show a generic eyebrow for the row.
              entriesCount: 0,
            };
            return (
              <Pressable
                key={l.id}
                onPress={() => onPick(lite.id, lite.entriesCount)}
                className="flex-row items-center bg-surface-container-low rounded-xl p-4 border border-outline-variant/20 active:opacity-80"
              >
                <View className="w-10 h-10 bg-surface-container rounded-full items-center justify-center mr-3">
                  <Icon name="format-list-numbered" size={18} color="#55343B" />
                </View>
                <View className="flex-1">
                  <Text className="font-headline text-on-surface text-[17px]">
                    {l.title}
                  </Text>
                  <Label className="mt-0.5">{l.category}</Label>
                </View>
                <Icon name="chevron-right" size={22} color="#827475" />
              </Pressable>
            );
          })}

          {!creating ? (
            <Pressable
              onPress={() => setCreating(true)}
              className="flex-row items-center justify-center rounded-xl p-4 border border-dashed border-outline-variant/50 active:opacity-80"
            >
              <Icon name="add" size={18} color="#55343B" />
              <Text className="ml-2 font-label-semibold text-primary uppercase tracking-widest text-[12px]">
                New list
              </Text>
            </Pressable>
          ) : (
            <View className="rounded-xl p-5 bg-surface-container-lowest border border-outline-variant/30 gap-3">
              <LabelCaps>New list</LabelCaps>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title (e.g. All-Time Ramen)"
                placeholderTextColor="rgba(80,68,70,0.55)"
                className="font-headline text-on-surface text-[17px]"
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(80,68,70,0.15)",
                  paddingVertical: 8,
                }}
              />
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Category (e.g. Food · Ramen)"
                placeholderTextColor="rgba(80,68,70,0.55)"
                className="font-body text-on-surface text-[15px]"
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(80,68,70,0.15)",
                  paddingVertical: 8,
                }}
              />
              {createError && (
                <Text className="text-rank-down text-[12px] font-label">
                  {createError}
                </Text>
              )}
              <View className="flex-row gap-2 mt-2">
                <Button
                  label={createMutation.isPending ? "Creating…" : "Create list"}
                  onPress={handleCreate}
                  full
                />
              </View>
              <Pressable
                onPress={() => {
                  setCreating(false);
                  setCreateError(null);
                }}
                className="items-center py-2"
              >
                <Text className="font-label text-secondary text-[12px]">
                  Cancel
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------- Search ----------------

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function SearchStep({
  onPick,
  picked,
}: {
  onPick: (hit: ApiSearchObjectHit) => void;
  picked: PickedObject | null;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 220);
  const { data, isFetching, isError } = useObjectSearchQuery(debounced);

  const results = data?.objects ?? [];

  return (
    <View>
      <LabelCaps>Step two</LabelCaps>
      <Display className="mt-2 text-[34px] leading-[38px]">
        What are we ranking?
      </Display>

      <View className="mt-6 border-b border-outline-variant/40 pb-3 flex-row items-center">
        <Icon name="search" size={20} color="#504446" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search a place, album, product…"
          placeholderTextColor="rgba(80,68,70,0.55)"
          autoFocus
          className="flex-1 ml-3 font-headline-italic text-on-surface text-[20px]"
          style={{ paddingVertical: 4 }}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {isFetching && <ActivityIndicator color="#55343B" />}
      </View>

      {query.trim().length < 2 && (
        <Body className="mt-5 text-on-surface-variant">
          Type at least two characters to search the catalogue.
        </Body>
      )}

      {isError && (
        <Body className="mt-5 text-rank-down">
          Search hit a snag. Try a different phrase.
        </Body>
      )}

      {query.trim().length >= 2 && !isFetching && results.length === 0 && (
        <Body className="mt-5 text-on-surface-variant">
          No matches. Try a simpler phrase or a different spelling.
        </Body>
      )}

      <View className="mt-6 gap-2">
        {results.map((o) => (
          <SearchResultRow
            key={o.id}
            hit={o}
            selected={picked?.id === o.id}
            onPress={() => onPick(o)}
          />
        ))}
      </View>
    </View>
  );
}

function SearchResultRow({
  hit,
  selected,
  onPress,
}: {
  hit: ApiSearchObjectHit;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center rounded-xl p-3 active:bg-surface-container-low",
        selected && "bg-surface-container-low",
      )}
    >
      {hit.heroImage ? (
        <Image
          source={{ uri: hit.heroImage }}
          style={{ width: 60, height: 60, borderRadius: 8 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{ width: 60, height: 60, borderRadius: 8 }}
          className="bg-surface-container-low items-center justify-center"
        >
          <Icon name="image" size={20} color="#B0A49F" />
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text
          className="font-headline text-on-surface text-[16px]"
          numberOfLines={1}
        >
          {hit.title}
        </Text>
        <Label className="mt-0.5 text-[11px]" numberOfLines={1}>
          {hit.subtitle ?? hit.type}
          {hit.city ? ` · ${hit.city}` : ""}
        </Label>
      </View>
      <Icon name="chevron-right" size={20} color="#827475" />
    </Pressable>
  );
}

// ---------------- Compare ----------------

function CompareStep({
  list,
  picked,
  midObjectId,
  midRank,
  onAnswer,
  onTie,
}: {
  list: { id: string; title: string; entries: { objectId: string }[] };
  picked: PickedObject;
  midObjectId?: string;
  midRank: number;
  onAnswer: (newIsBetter: boolean) => void;
  onTie: () => void;
}) {
  // Server-side details were registered into the object registry by
  // mapRankingListDetail, so this lookup resolves without another fetch.
  const against = midObjectId ? getObject(midObjectId) : null;

  if (!against) {
    return (
      <View className="py-16 items-center">
        <ActivityIndicator color="#55343B" />
      </View>
    );
  }

  return (
    <View>
      <LabelCaps>Step three</LabelCaps>
      <Display className="mt-2 text-[32px] leading-[36px]">
        Which one is better?
      </Display>
      <Body className="mt-3">
        We will narrow the exact rank in a few taps. Be honest — your list is
        yours.
      </Body>

      <View className="mt-8 flex-row gap-3">
        <CompareCard
          heroImage={picked.heroImage}
          title={picked.title}
          subtitle={picked.subtitle}
          label="The new one"
          onPress={() => onAnswer(true)}
          gradient
        />
        <CompareCard
          heroImage={against.heroImage}
          title={against.title}
          subtitle={against.subtitle}
          label={`Currently #${midRank}`}
          onPress={() => onAnswer(false)}
        />
      </View>

      <View className="mt-6 items-center">
        <Pressable onPress={onTie} className="py-3 active:opacity-70">
          <Text className="font-label text-secondary text-[13px] underline decoration-secondary/40">
            About the same
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CompareCard({
  heroImage,
  title,
  subtitle,
  label,
  onPress,
  gradient,
}: {
  heroImage: string;
  title: string;
  subtitle?: string;
  label: string;
  onPress: () => void;
  gradient?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/20 active:opacity-85"
      style={{
        shadowColor: "#1B1C1A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
      }}
    >
      <View className="relative">
        <Image
          source={{ uri: heroImage }}
          style={{ aspectRatio: 3 / 4 }}
          contentFit="cover"
        />
        {gradient && (
          <LinearGradient
            colors={gradients.primaryCTA}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 2,
            }}
          >
            <Text className="font-label-semibold text-on-primary uppercase tracking-widest text-[9px]">
              New
            </Text>
          </LinearGradient>
        )}
      </View>
      <View className="p-3">
        <LabelCaps>{label}</LabelCaps>
        <Text className="font-headline text-on-surface text-[16px] mt-1">
          {title}
        </Text>
        {subtitle && (
          <Text className="font-body text-on-surface-variant text-[12px] mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ---------------- Caption ----------------

function CaptionStep({
  list,
  picked,
  insertIndex,
  note,
  onChangeNote,
  onNext,
}: {
  list: { title: string };
  picked: PickedObject;
  insertIndex: number;
  note: string;
  onChangeNote: (s: string) => void;
  onNext: () => void;
}) {
  const newRank = insertIndex + 1;
  return (
    <View>
      <LabelCaps>Step four</LabelCaps>
      <Display className="mt-2 text-[32px] leading-[36px]">
        Why does it earn #{newRank}?
      </Display>
      <Body className="mt-3">
        One honest sentence is plenty. Longer notes make richer posts.
      </Body>

      <View className="mt-6 bg-surface-container-low rounded-xl p-5 flex-row items-center gap-4">
        <Image
          source={{ uri: picked.heroImage }}
          style={{ width: 56, height: 56, borderRadius: 8 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <Text className="font-headline text-on-surface text-[17px]">
            {picked.title}
          </Text>
          <Label className="mt-0.5">
            Ranked #{newRank} in {list.title}
          </Label>
        </View>
      </View>

      <View className="mt-6 border border-outline-variant/30 rounded-xl bg-surface-container-lowest px-5 py-4">
        <TextInput
          value={note}
          onChangeText={onChangeNote}
          placeholder="What made you bump this up?"
          placeholderTextColor="rgba(80,68,70,0.55)"
          multiline
          style={{
            minHeight: 110,
            textAlignVertical: "top",
            fontFamily: "Newsreader_500Medium_Italic",
            fontSize: 18,
            lineHeight: 24,
            color: "#1B1C1A",
          }}
          maxLength={600}
        />
      </View>

      <View className="mt-8">
        <Button label="Continue" onPress={onNext} full />
      </View>
    </View>
  );
}

// ---------------- Confirm ----------------

function ConfirmStep({
  list,
  picked,
  insertIndex,
  note,
  submitting,
  error,
  onPublish,
}: {
  list: { title: string };
  picked: PickedObject;
  insertIndex: number;
  note: string;
  submitting: boolean;
  error: string | null;
  onPublish: () => void;
}) {
  const newRank = insertIndex + 1;
  return (
    <View>
      <LabelCaps>Final step</LabelCaps>
      <Display className="mt-2 text-[32px] leading-[36px]">Looks right?</Display>

      <View className="mt-8 rounded-xl overflow-hidden bg-surface-container-lowest border border-outline-variant/20">
        <View className="relative">
          <Image
            source={{ uri: picked.heroImage }}
            style={{ aspectRatio: 16 / 10 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={gradients.primaryCTA}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 2,
            }}
          >
            <Text className="font-label-semibold text-on-primary uppercase tracking-widest text-[10px]">
              New · #{newRank}
            </Text>
          </LinearGradient>
        </View>
        <View className="p-5">
          <LabelCaps>{list.title}</LabelCaps>
          <HeadlineItalic className="mt-1 text-primary text-[22px]">
            {picked.title}
          </HeadlineItalic>
          {!!note && (
            <Body className="mt-3 text-[14px] leading-[20px]">"{note}"</Body>
          )}
        </View>
      </View>

      {error && (
        <View className="mt-6 rounded-xl bg-rank-down/10 p-4 border border-rank-down/30">
          <Text className="text-rank-down font-label text-[13px]">
            {error}
          </Text>
        </View>
      )}

      <View className="mt-8 gap-3">
        <Button
          label={submitting ? "Publishing…" : "Publish ranking"}
          onPress={onPublish}
          disabled={submitting}
          full
        />
      </View>
    </View>
  );
}
