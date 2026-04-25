import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { GlassTopBar } from "@/components/nav/GlassTopBar";
import { Icon } from "@/components/ui/Icon";
import {
  Body,
  Display,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import {
  useAuth,
  useCreatePost,
  useObjectQuery,
  useObjectSearchQuery,
  useOwnerRankingListsQuery,
} from "@/lib/api";
import type { ApiSearchObjectHit } from "@/lib/api/types";
import { ApiHttpError } from "@/lib/api/client";

/**
 * Compose Post (PRD §12, VDK §16.4 — Post detail templates).
 *
 * Two-step flow:
 *   1. Pick (search) an object from the catalogue.
 *   2. Compose headline + caption + tags, choose a detail layout, and
 *      optionally attach one of your ranking lists.
 *
 * Submit calls `POST /posts`. On success the user lands on the published
 * post's detail screen and the Home / author-filtered feeds invalidate so
 * the new post shows up on next read.
 *
 * The object picker can be skipped by passing `?objectId=...` in the route,
 * which lets future call-sites (object detail, ranking list detail) deep-link
 * into the composer pre-seeded.
 */
type PickedObject = {
  id: string;
  title: string;
  subtitle?: string | null;
  type: ApiSearchObjectHit["type"];
  city?: string | null;
  heroImage?: string | null;
};

type Layout = "discovery_photo" | "album_review" | "product_hero";

const LAYOUT_OPTIONS: Array<{ id: Layout; label: string; hint: string }> = [
  {
    id: "discovery_photo",
    label: "Discovery photo",
    hint: "Full-bleed image · place / moment",
  },
  {
    id: "album_review",
    label: "Album review",
    hint: "Square art · rated track-by-track",
  },
  {
    id: "product_hero",
    label: "Product hero",
    hint: "Object front-and-center · editorial copy",
  },
];

// Smart default layout based on object type — matches the server's default
// (`discovery_photo`) but upgrades to album / product templates when the type
// makes them a better fit.
function defaultLayoutFor(type: PickedObject["type"]): Layout {
  switch (type) {
    case "album":
      return "album_review";
    case "perfume":
    case "fashion":
    case "sneaker":
    case "product":
      return "product_hero";
    default:
      return "discovery_photo";
  }
}

export default function ComposePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, user } = useAuth();
  const { objectId: seededObjectId } = useLocalSearchParams<{
    objectId?: string;
  }>();

  const [step, setStep] = useState<"pick" | "compose">(
    seededObjectId ? "compose" : "pick",
  );
  const [picked, setPicked] = useState<PickedObject | null>(null);

  // Deep-link hydration. When the composer opens with `?objectId=...` (e.g.
  // from the object-detail "Post about this" CTA) we still need to populate
  // `picked` — otherwise `canPublish` stays false and the Publish button
  // never enables. Fetch the object once, then seed state. We only trigger
  // this on the initial deep-link so in-composer navigation (Pick → Compose
  // with a freshly chosen object) isn't overwritten.
  const preseedQuery = useObjectQuery(seededObjectId ?? null);
  useEffect(() => {
    if (!seededObjectId || picked) return;
    const o = preseedQuery.data;
    if (!o) return;
    setPicked({
      id: o.id,
      title: o.title,
      subtitle: o.subtitle ?? null,
      type: o.type,
      city: o.city ?? null,
      heroImage: o.heroImage ?? null,
    });
  }, [seededObjectId, picked, preseedQuery.data]);

  const [headline, setHeadline] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [attachedListId, setAttachedListId] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>("discovery_photo");
  const [locationLabel, setLocationLabel] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useCreatePost();

  // Unauthenticated viewers bounce to sign-in; route matches Add-to-ranking's
  // guard shape so the onboarding loop is consistent.
  useEffect(() => {
    if (!isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isSignedIn, router]);

  // Seed the layout from the picked object's type whenever a new one is
  // chosen — but only if the user hasn't overridden it yet (state reset on
  // every pick is implicit since we re-run this effect).
  useEffect(() => {
    if (picked) setLayout(defaultLayoutFor(picked.type));
  }, [picked]);

  const listsQuery = useOwnerRankingListsQuery(user?.handle ?? null);
  const ownLists = listsQuery.data?.lists ?? [];

  const canPublish =
    Boolean(picked) &&
    headline.trim().length > 0 &&
    headline.trim().length <= 160 &&
    caption.trim().length > 0 &&
    caption.trim().length <= 2000 &&
    !mutation.isPending;

  const handlePublish = async () => {
    if (!picked) return;
    setSubmitError(null);
    try {
      const res = await mutation.mutateAsync({
        objectId: picked.id,
        headline: headline.trim(),
        caption: caption.trim(),
        tags,
        detailLayout: layout,
        rankingListId: attachedListId ?? undefined,
        locationLabel: locationLabel.trim() || undefined,
        aspect: layout === "album_review" ? "square" : "tall",
      });
      router.replace(`/post/${res.post.id}`);
    } catch (e) {
      if (e instanceof ApiHttpError) {
        setSubmitError(e.message);
      } else {
        setSubmitError("Couldn't publish — try again in a moment.");
      }
    }
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "").slice(0, 40);
    if (!t) return;
    if (tags.includes(t) || tags.length >= 12) {
      setTagInput("");
      return;
    }
    setTags([...tags, t]);
    setTagInput("");
  };

  return (
    <View className="flex-1 bg-background">
      <GlassTopBar
        leading={
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Icon name="close" size={22} color="#55343B" />
          </Pressable>
        }
        title={
          <Text className="font-display-italic text-primary text-[18px] tracking-tightest">
            {step === "pick" ? "What are you sharing?" : "Compose"}
          </Text>
        }
        trailing={
          step === "compose" ? (
            <Pressable
              hitSlop={10}
              onPress={handlePublish}
              disabled={!canPublish}
              className={cn("active:opacity-70", !canPublish && "opacity-40")}
            >
              <Label className="font-label-semibold text-primary text-[13px] uppercase tracking-widest">
                {mutation.isPending ? "Posting…" : "Publish"}
              </Label>
            </Pressable>
          ) : null
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 96,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === "pick" ? (
            <PickStep
              onPick={(hit) => {
                setPicked({
                  id: hit.id,
                  title: hit.title,
                  subtitle: hit.subtitle ?? null,
                  type: hit.type,
                  city: hit.city ?? null,
                  heroImage: hit.heroImage ?? null,
                });
                setStep("compose");
              }}
            />
          ) : (
            <ComposeStep
              picked={picked}
              onClearPick={() => {
                setPicked(null);
                setStep("pick");
              }}
              headline={headline}
              onChangeHeadline={setHeadline}
              caption={caption}
              onChangeCaption={setCaption}
              tags={tags}
              onRemoveTag={(t) => setTags(tags.filter((x) => x !== t))}
              tagInput={tagInput}
              onChangeTagInput={setTagInput}
              onCommitTag={addTag}
              layout={layout}
              onChangeLayout={setLayout}
              ownLists={ownLists}
              attachedListId={attachedListId}
              onToggleList={(id) =>
                setAttachedListId(attachedListId === id ? null : id)
              }
              locationLabel={locationLabel}
              onChangeLocation={setLocationLabel}
              submitError={submitError}
              submitting={mutation.isPending}
              canPublish={canPublish}
              onPublish={handlePublish}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------- Step 1 — Pick object ----------------

function PickStep({ onPick }: { onPick: (hit: ApiSearchObjectHit) => void }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 220);
  const { data, isFetching, isError } = useObjectSearchQuery(debounced);
  const results = data?.objects ?? [];

  return (
    <View>
      <LabelCaps>Step one</LabelCaps>
      <Display className="mt-2 text-[32px] leading-[36px]">
        Pick what you&apos;re sharing
      </Display>
      <Body className="mt-2 text-on-surface-variant">
        Search the catalogue — cafés, albums, perfumes, places. If nothing
        matches, publish a ranking entry first; new objects land in the
        catalogue automatically.
      </Body>

      <View className="mt-6 border-b border-outline-variant/40 pb-3 flex-row items-center">
        <Icon name="search" size={20} color="#504446" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search an album, a place, a bottle…"
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
          Type at least two characters to start.
        </Body>
      )}

      {isError && (
        <Body className="mt-5 text-rank-down">
          Search hit a snag — try a different phrase.
        </Body>
      )}

      {query.trim().length >= 2 && !isFetching && results.length === 0 && (
        <Body className="mt-5 text-on-surface-variant">
          No matches. Try a simpler phrase or a different spelling.
        </Body>
      )}

      <View className="mt-4 gap-2">
        {results.map((hit) => (
          <Pressable
            key={hit.id}
            onPress={() => onPick(hit)}
            className="flex-row items-center py-2 px-1 active:bg-surface-container-low rounded-lg"
          >
            {hit.heroImage ? (
              <Image
                source={{ uri: hit.heroImage }}
                style={{ width: 52, height: 52, borderRadius: 8 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{ width: 52, height: 52, borderRadius: 8 }}
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
            <Icon name="chevron-right" size={20} color="#827475" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---------------- Step 2 — Compose ----------------

function ComposeStep(props: {
  picked: PickedObject | null;
  onClearPick: () => void;
  headline: string;
  onChangeHeadline: (s: string) => void;
  caption: string;
  onChangeCaption: (s: string) => void;
  tags: string[];
  onRemoveTag: (t: string) => void;
  tagInput: string;
  onChangeTagInput: (s: string) => void;
  onCommitTag: () => void;
  layout: Layout;
  onChangeLayout: (l: Layout) => void;
  ownLists: Array<{ id: string; title: string }>;
  attachedListId: string | null;
  onToggleList: (id: string) => void;
  locationLabel: string;
  onChangeLocation: (s: string) => void;
  submitError: string | null;
  submitting: boolean;
  canPublish: boolean;
  onPublish: () => void;
}) {
  const {
    picked,
    onClearPick,
    headline,
    onChangeHeadline,
    caption,
    onChangeCaption,
    tags,
    onRemoveTag,
    tagInput,
    onChangeTagInput,
    onCommitTag,
    layout,
    onChangeLayout,
    ownLists,
    attachedListId,
    onToggleList,
    locationLabel,
    onChangeLocation,
    submitError,
    submitting,
    canPublish,
    onPublish,
  } = props;

  const headlineCount = headline.trim().length;
  const captionCount = caption.trim().length;

  return (
    <View>
      {/* Object chip */}
      {picked ? (
        <View className="rounded-xl bg-surface-container-lowest border border-outline-variant/15 p-3 flex-row items-center">
          {picked.heroImage ? (
            <Image
              source={{ uri: picked.heroImage }}
              style={{ width: 56, height: 56, borderRadius: 8 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{ width: 56, height: 56, borderRadius: 8 }}
              className="bg-surface-container items-center justify-center"
            >
              <Icon name="image" size={20} color="#B0A49F" />
            </View>
          )}
          <View className="ml-3 flex-1">
            <LabelCaps>{picked.type}</LabelCaps>
            <HeadlineItalic
              className="mt-0.5 text-primary text-[18px] leading-[22px]"
              numberOfLines={1}
            >
              {picked.title}
            </HeadlineItalic>
            {picked.city ? (
              <Label className="mt-0.5 text-[11px]">{picked.city}</Label>
            ) : null}
          </View>
          <Pressable
            onPress={onClearPick}
            hitSlop={10}
            className="p-2 active:opacity-70"
          >
            <Icon name="edit" size={18} color="#504446" />
          </Pressable>
        </View>
      ) : null}

      {/* Headline */}
      <Field label="Headline" counter={`${headlineCount}/160`}>
        <TextInput
          value={headline}
          onChangeText={onChangeHeadline}
          placeholder="A line that earns the double-tap"
          placeholderTextColor="rgba(80,68,70,0.55)"
          maxLength={160}
          multiline
          className="font-display-italic text-primary text-[24px] leading-[28px]"
          style={{ paddingVertical: 6, minHeight: 44 }}
        />
      </Field>

      {/* Caption */}
      <Field label="Review" counter={`${captionCount}/2000`}>
        <TextInput
          value={caption}
          onChangeText={onChangeCaption}
          placeholder="Write a paragraph. Who's it for? When does it land? Why does it stay with you?"
          placeholderTextColor="rgba(80,68,70,0.55)"
          maxLength={2000}
          multiline
          textAlignVertical="top"
          className="font-body text-on-surface text-[15px] leading-[22px]"
          style={{ paddingVertical: 8, minHeight: 132 }}
        />
      </Field>

      {/* Tags */}
      <Field label="Tags" counter={`${tags.length}/12`}>
        <View className="flex-row flex-wrap items-center gap-2">
          {tags.map((t) => (
            <Pressable
              key={t}
              onPress={() => onRemoveTag(t)}
              className="flex-row items-center bg-surface-container-low rounded-full pl-3 pr-2 py-1 active:opacity-70"
            >
              <Text className="font-label text-on-surface-variant text-[12px]">
                #{t}
              </Text>
              <Icon name="close" size={14} color="#827475" />
            </Pressable>
          ))}
          <TextInput
            value={tagInput}
            onChangeText={onChangeTagInput}
            onSubmitEditing={onCommitTag}
            onBlur={onCommitTag}
            placeholder={tags.length === 0 ? "Add a tag…" : ""}
            placeholderTextColor="rgba(80,68,70,0.45)"
            returnKeyType="done"
            autoCorrect={false}
            autoCapitalize="none"
            className="flex-1 font-body text-on-surface text-[14px]"
            style={{ minWidth: 100, paddingVertical: 4 }}
          />
        </View>
      </Field>

      {/* Layout */}
      <Field label="Detail layout">
        <View className="gap-2 mt-2">
          {LAYOUT_OPTIONS.map((opt) => {
            const selected = layout === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => onChangeLayout(opt.id)}
                className={cn(
                  "rounded-xl border p-3 flex-row items-center",
                  selected
                    ? "border-primary/50 bg-primary/5"
                    : "border-outline-variant/30 bg-surface-container-lowest",
                )}
              >
                <View
                  className={cn(
                    "w-5 h-5 rounded-full border items-center justify-center mr-3",
                    selected ? "border-primary" : "border-outline",
                  )}
                >
                  {selected ? (
                    <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                  ) : null}
                </View>
                <View className="flex-1">
                  <Text className="font-headline text-on-surface text-[14px]">
                    {opt.label}
                  </Text>
                  <Label className="mt-0.5 text-[11px]">{opt.hint}</Label>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Field>

      {/* Optional — attach a ranking list (own only) */}
      <Field
        label="Attach a ranking"
        counter={attachedListId ? "1 selected" : "optional"}
      >
        {ownLists.length === 0 ? (
          <Body className="mt-2 text-[13px] text-on-surface-variant">
            You don&apos;t have any lists yet. Start one from the Rankings tab
            and you can tie posts to it here.
          </Body>
        ) : (
          <View className="gap-2 mt-2">
            {ownLists.map((l) => {
              const selected = attachedListId === l.id;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => onToggleList(l.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 flex-row items-center justify-between",
                    selected
                      ? "border-primary/50 bg-primary/5"
                      : "border-outline-variant/30 bg-surface-container-lowest",
                  )}
                >
                  <Text
                    className="font-headline text-on-surface text-[14px] flex-1"
                    numberOfLines={1}
                  >
                    {l.title}
                  </Text>
                  <Icon
                    name={
                      selected ? "check-circle" : "radio-button-unchecked"
                    }
                    size={18}
                    color={selected ? "#55343B" : "#827475"}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </Field>

      {/* Location label */}
      <Field label="Location (optional)">
        <TextInput
          value={locationLabel}
          onChangeText={onChangeLocation}
          placeholder="Neighborhood, city, or a venue line"
          placeholderTextColor="rgba(80,68,70,0.55)"
          maxLength={120}
          className="font-body text-on-surface text-[14px]"
          style={{ paddingVertical: 6 }}
        />
      </Field>

      {submitError && (
        <Text className="mt-4 text-rank-down font-label text-[12px]">
          {submitError}
        </Text>
      )}

      <View className="mt-8">
        <Button
          label={submitting ? "Posting…" : "Publish"}
          onPress={onPublish}
          disabled={!canPublish}
          full
        />
      </View>
    </View>
  );
}

function Field({
  label,
  counter,
  children,
}: {
  label: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-8">
      <View className="flex-row items-baseline justify-between">
        <LabelCaps>{label}</LabelCaps>
        {counter ? (
          <Label className="text-[10px] text-on-surface-variant">
            {counter}
          </Label>
        ) : null}
      </View>
      <View className="mt-2 border-b border-outline-variant/30 pb-2">
        {children}
      </View>
    </View>
  );
}

// ---------------- misc ----------------

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
