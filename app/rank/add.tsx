import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { MusicPicker } from "@/components/music/MusicPicker";
import { PlacePicker } from "@/components/places/PlacePicker";
import {
  Body,
  Display,
  Headline,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { gradients } from "@/theme/tokens";
import {
  PairwiseCompareStep,
  usePairwiseInsertion,
} from "@/components/rank/PairwiseCompare";
import {
  RestaurantSocialFields,
  emptyRestaurantSocialDraft,
  isRestaurantLikeClientObject,
  mentionedUserIdsFromDraft,
  restaurantVisitInputFromDraft,
  type RestaurantSocialDraft,
} from "@/components/social/RestaurantSocialFields";
import {
  useAuth,
  useCreateRankingList,
  useInsertRankingEntry,
  useObjectQuery,
  useOwnerRankingListsQuery,
  useRankingListQuery,
} from "@/lib/api";
import type { ApiSearchObjectHit } from "@/lib/api/types";
import { ApiHttpError } from "@/lib/api/client";
import { pickAndUploadImage } from "@/lib/api/uploads";
import { displayObjectType } from "@/lib/objects/display";

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
type Step = "category" | "search" | "compare" | "photo" | "caption" | "confirm";
const STEPS: Step[] = ["category", "search", "compare", "photo", "caption", "confirm"];

export default function AddToRankingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, token } = useAuth();

  // Optional deep-link: `?objectId=O001` pre-selects the subject and skips
  // the search step — e.g. tapping "Add to a ranking" on an object page.
  const { objectId: objectIdParam, listId: listIdParam } = useLocalSearchParams<{
    objectId?: string;
    listId?: string;
  }>();
  const preselectQuery = useObjectQuery(objectIdParam ?? null);

  const [step, setStep] = useState<Step>(
    listIdParam ? (objectIdParam ? "compare" : "search") : "category",
  );
  const [listId, setListId] = useState<string | null>(listIdParam ?? null);
  const [picked, setPicked] = useState<PickedObject | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const pairwise = usePairwiseInsertion();
  const [note, setNote] = useState("");
  const [socialDraft, setSocialDraft] = useState<RestaurantSocialDraft>(
    emptyRestaurantSocialDraft,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hydrate `picked` from the deep-link payload once the object detail lands.
  // We keep it one-shot (only when picked is still null) so user navigation
  // inside the flow isn't undone.
  useEffect(() => {
    if (!objectIdParam || picked) return;
    const o = preselectQuery.data;
    if (!o) return;
    setPicked({
      id: o.id,
      title: o.title,
      subtitle: o.subtitle ?? undefined,
      city: o.city ?? undefined,
      heroImage:
        o.heroImage ??
        "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80",
      type: o.type,
    });
    if (isMusicType(o.type)) setImageUrl(o.heroImage ?? "");
  }, [objectIdParam, picked, preselectQuery.data]);

  const listQuery = useRankingListQuery(listId ?? undefined);
  const list = listQuery.data?.list;
  const insertMutation = useInsertRankingEntry();

  // On deep-link ("compare" without having picked via the search step first)
  // the list may not have loaded when we switched steps. Once it lands,
  // initialise the pairwise bounds. Unset state is `lo === 0 && hi === 0`
  // (because the algorithm always terminates at one of those equalities and
  // steps away from "compare").
  const [compareSeeded, setCompareSeeded] = useState(false);
  useEffect(() => {
    if (step !== "compare") {
      if (compareSeeded) setCompareSeeded(false);
      return;
    }
    if (!list || compareSeeded) return;
    const count = list.entries.length;
    const doneIndex = pairwise.start(count);
    if (doneIndex !== null) {
      setStep(needsPhoto(picked) ? "photo" : "caption");
      return;
    }
    setCompareSeeded(true);
  }, [step, list, compareSeeded, pairwise, pairwise.start]);

  const startCompare = (entriesCount: number, subject: PickedObject | null = picked) => {
    const doneIndex = pairwise.start(entriesCount);
    if (doneIndex !== null) {
      setStep(needsPhoto(subject) ? "photo" : "caption");
      return;
    }
    setStep("compare");
  };

  const advanceToPublishPrep = () => {
    if (needsPhoto(picked)) {
      setStep("photo");
      return;
    }
    if (picked?.heroImage && isMusicType(picked.type) && !imageUrl) {
      setImageUrl(picked.heroImage);
    }
    setStep("caption");
  };

  const pairwiseAnswer = (newIsBetter: boolean) => {
    if (!list) return;
    const doneIndex = pairwise.answer(newIsBetter);
    if (doneIndex !== null) advanceToPublishPrep();
  };

  const handleUploadImage = async () => {
    if (!token) return;
    setSubmitError(null);
    setUploadingImage(true);
    try {
      const uploaded = await pickAndUploadImage(token, {
        allowsEditing: false,
        quality: 0.85,
      });
      if (uploaded) setImageUrl(uploaded.publicUrl);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : "Couldn't upload that image.",
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePublish = async () => {
    const insertIndex = pairwise.insertIndex;
    if (!list || !picked || insertIndex == null) return;
    const publishImageUrl = needsPhoto(picked) ? imageUrl : imageUrl || picked.heroImage;
    if (!publishImageUrl) {
      setSubmitError("Upload a photo before publishing this ranking.");
      setStep("photo");
      return;
    }
    setSubmitError(null);
    try {
      await insertMutation.mutateAsync({
        listId: list.id,
        objectId: picked.id,
        insertAt: insertIndex + 1, // UI index -> 1-indexed rank
        note: note.trim() || undefined,
        imageUrl: publishImageUrl,
        publishPost: {
          headline: `${picked.title} is #${insertIndex + 1} in ${list.title}`,
          caption: note.trim() || `Added to ${list.title}.`,
        },
        mentionedUserIds: mentionedUserIdsFromDraft(socialDraft),
        restaurantVisit: isRestaurantLikeClientObject(picked.type)
          ? restaurantVisitInputFromDraft(socialDraft)
          : undefined,
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
            preselected={picked ?? undefined}
            onPick={(id, entriesCount) => {
              setListId(id);
              // If the subject is already chosen (deep-link), skip search.
              if (picked) {
                if (entriesCount === 0) {
                  pairwise.setInsertIndex(0);
                  setStep(needsPhoto(picked) ? "photo" : "caption");
                } else {
                  // `useRankingListQuery` will hydrate once listId is set —
                  // the "compare" step handles the loading state itself.
                  setStep("compare");
                }
                return;
              }
              setStep("search");
            }}
          />
        )}

        {step === "search" && listId && (
          <SearchStep
            cityId={listQuery.data?.raw.cityId ?? null}
            category={list?.category}
            placeType={placeSearchTypeFromCategory(list?.category)}
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
              setSocialDraft(emptyRestaurantSocialDraft());
              setImageUrl(isMusicType(p.type) ? p.heroImage : "");
              // We need the list loaded to know entry count for pairwise.
              const entriesCount = list?.entries.length ?? 0;
              if (listQuery.isLoading) {
                // List detail not ready yet; the "go" button will be blocked.
                setStep("compare");
                return;
              }
              startCompare(entriesCount, p);
            }}
            picked={picked}
          />
        )}

        {step === "compare" && list && picked && (
          <PairwiseCompareStep
            picked={picked}
            midObjectId={list.entries[pairwise.mid]?.objectId}
            midRank={pairwise.mid + 1}
            onAnswer={pairwiseAnswer}
            onTie={() => {
              pairwise.tie();
              advanceToPublishPrep();
            }}
          />
        )}

        {step === "compare" && (!list || listQuery.isLoading) && (
          <View className="py-16 items-center">
            <ActivityIndicator color="#55343B" />
          </View>
        )}

        {step === "photo" && picked && (
          <PhotoStep
            picked={picked}
            imageUrl={imageUrl}
            uploading={uploadingImage}
            error={submitError}
            onUpload={handleUploadImage}
            onNext={() => setStep("caption")}
          />
        )}

        {step === "caption" && picked && list && (
          <CaptionStep
            list={list}
            picked={picked}
            imageUrl={imageUrl || picked.heroImage}
            insertIndex={pairwise.insertIndex ?? 0}
            note={note}
            onChangeNote={setNote}
            socialDraft={socialDraft}
            onChangeSocialDraft={setSocialDraft}
            restaurantEnabled={isRestaurantLikeClientObject(picked.type)}
            onNext={() => setStep("confirm")}
          />
        )}

        {step === "confirm" && picked && list && (
          <ConfirmStep
            list={list}
            picked={picked}
            imageUrl={imageUrl || picked.heroImage}
            insertIndex={pairwise.insertIndex ?? 0}
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

function isMusicType(type: string | undefined | null) {
  return type === "album" || type === "track";
}

function needsPhoto(picked: PickedObject | null) {
  return Boolean(picked && !isMusicType(picked.type));
}

type ListLite = {
  id: string;
  title: string;
  category: string;
  entriesCount: number;
};

// ---------------- Category ----------------

function CategoryStep({
  preselected,
  onPick,
}: {
  preselected?: PickedObject;
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
        {preselected ? "Which list?" : "Which list?"}
      </Display>
      <Body className="mt-3">
        {preselected
          ? `Pick a list to rank ${preselected.title} in.`
          : "Pick one of your lists — or start a new one in the category you care about."}
      </Body>

      {preselected ? (
        <View className="mt-6 bg-surface-container-low rounded-xl p-4 flex-row items-center gap-3 border border-outline-variant/20">
          <Image
            source={{ uri: preselected.heroImage }}
            style={{ width: 52, height: 52, borderRadius: 8 }}
            contentFit="cover"
          />
          <View className="flex-1">
            <Text
              className="font-headline text-on-surface text-[16px]"
              numberOfLines={1}
            >
              {preselected.title}
            </Text>
            <Label
              className="mt-0.5 text-[11px]"
              numberOfLines={1}
            >
              {preselected.subtitle ?? displayObjectType(preselected.type)}
              {preselected.city ? ` · ${preselected.city}` : ""}
            </Label>
          </View>
        </View>
      ) : null}

      {isLoading && (
        <View className="mt-10 items-center">
          <ActivityIndicator color="#55343B" />
        </View>
      )}

      {isError && (
        <View className="mt-6 rounded-xl bg-surface-container-low p-4">
          <Body>{"Couldn't load your lists."}</Body>
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

function SearchStep({
  onPick,
  picked,
  cityId,
  category,
  placeType,
}: {
  onPick: (hit: ApiSearchObjectHit) => void;
  picked: PickedObject | null;
  cityId?: string | null;
  category?: string;
  placeType: "all" | "place" | "restaurant" | "cafe" | "bar";
}) {
  const musicType = musicSearchTypeFromCategory(category);

  if (musicType) {
    return (
      <MusicPicker
        label="Step two"
        title="What are we ranking?"
        body="Search Zoe first, or pull in an album or song from Spotify."
        placeholder="Search albums, songs, artists..."
        type={musicType}
        picked={picked}
        onPick={onPick}
      />
    );
  }

  return (
    <PlacePicker
      label="Step two"
      title="What are we ranking?"
      body="Search Zoe first, or pull in a restaurant, café, bar, or spot from Google Places."
      placeholder="Search restaurants, cafés, bars, spots…"
      cityId={cityId}
      type={placeType}
      picked={picked}
      onPick={onPick}
    />
  );
}

function placeSearchTypeFromCategory(
  category: string | undefined,
): "all" | "place" | "restaurant" | "cafe" | "bar" {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("cafe") || normalized.includes("coffee")) {
    return "cafe";
  }
  if (normalized.includes("bar") || normalized.includes("wine")) {
    return "bar";
  }
  if (
    normalized.includes("restaurant") ||
    normalized.includes("eat") ||
    normalized.includes("food")
  ) {
    return "restaurant";
  }
  if (normalized.includes("spot") || normalized.includes("place")) {
    return "place";
  }
  return "all";
}

function musicSearchTypeFromCategory(
  category: string | undefined,
): "all" | "album" | "track" | null {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("album")) return "album";
  if (
    normalized.includes("song") ||
    normalized.includes("track") ||
    normalized.includes("single")
  ) {
    return "track";
  }
  if (
    normalized.includes("music") ||
    normalized.includes("artist") ||
    normalized.includes("playlist")
  ) {
    return "all";
  }
  return null;
}

// ---------------- Photo ----------------

function PhotoStep({
  picked,
  imageUrl,
  uploading,
  error,
  onUpload,
  onNext,
}: {
  picked: PickedObject;
  imageUrl: string;
  uploading: boolean;
  error: string | null;
  onUpload: () => void;
  onNext: () => void;
}) {
  return (
    <View>
      <LabelCaps>Step four</LabelCaps>
      <Display className="mt-2 text-[32px] leading-[36px]">
        Add your photo
      </Display>
      <Body className="mt-3">
        Ranking updates publish to the feed, so places need an image from you.
      </Body>

      <View className="mt-6 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/20">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ aspectRatio: 4 / 5 }}
            contentFit="cover"
          />
        ) : (
          <Pressable
            onPress={onUpload}
            disabled={uploading}
            className="h-72 items-center justify-center border border-dashed border-outline-variant/50"
          >
            {uploading ? (
              <ActivityIndicator color="#55343B" />
            ) : (
              <>
                <Icon name="add-a-photo" size={28} color="#55343B" />
                <Label className="mt-2 text-[11px] uppercase tracking-widest">
                  Upload photo
                </Label>
              </>
            )}
          </Pressable>
        )}
      </View>

      <View className="mt-4 bg-surface-container-low rounded-xl p-4 flex-row items-center gap-3">
        <Image
          source={{ uri: picked.heroImage }}
          style={{ width: 52, height: 52, borderRadius: 8 }}
          contentFit="cover"
        />
        <View className="flex-1">
          <Text className="font-headline text-on-surface text-[17px]">
            {picked.title}
          </Text>
          <Label className="mt-0.5">
            {picked.subtitle ?? displayObjectType(picked.type)}
          </Label>
        </View>
      </View>

      {error && (
        <Text className="mt-4 text-rank-down text-[12px] font-label">
          {error}
        </Text>
      )}

      <View className="mt-8 gap-3">
        <Button
          label={imageUrl ? "Continue" : uploading ? "Uploading…" : "Upload photo"}
          onPress={imageUrl ? onNext : onUpload}
          disabled={uploading}
          full
        />
      </View>
    </View>
  );
}

// ---------------- Caption ----------------

function CaptionStep({
  list,
  picked,
  imageUrl,
  insertIndex,
  note,
  onChangeNote,
  socialDraft,
  onChangeSocialDraft,
  restaurantEnabled,
  onNext,
}: {
  list: { title: string };
  picked: PickedObject;
  imageUrl: string;
  insertIndex: number;
  note: string;
  onChangeNote: (s: string) => void;
  socialDraft: RestaurantSocialDraft;
  onChangeSocialDraft: (draft: RestaurantSocialDraft) => void;
  restaurantEnabled: boolean;
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
          source={{ uri: imageUrl || picked.heroImage }}
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

      <RestaurantSocialFields
        draft={socialDraft}
        onChange={onChangeSocialDraft}
        restaurantEnabled={restaurantEnabled}
      />

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
  imageUrl,
  insertIndex,
  note,
  submitting,
  error,
  onPublish,
}: {
  list: { title: string };
  picked: PickedObject;
  imageUrl: string;
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
            source={{ uri: imageUrl || picked.heroImage }}
            style={{ aspectRatio: 16 / 10 }}
            contentFit={isMusicType(picked.type) ? "contain" : "cover"}
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
            <Body className="mt-3 text-[14px] leading-[20px]">
              {`"${note}"`}
            </Body>
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
