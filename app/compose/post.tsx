import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { MusicPicker } from "@/components/music/MusicPicker";
import { PlacePicker } from "@/components/places/PlacePicker";
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
  Body,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import {
  useAuth,
  useCreatePost,
  useObjectQuery,
  useOwnerRankingListsQuery,
  useRankingListQuery,
} from "@/lib/api";
import type { ApiSearchObjectHit } from "@/lib/api/types";
import { ApiHttpError } from "@/lib/api/client";
import { pickAndUploadImage } from "@/lib/api/uploads";
import { displayObjectType } from "@/lib/objects/display";
import type { RankingEntry, RankingList } from "@/data/types";

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

type ComposeKind = "places" | "music" | "blog";
type Layout = "discovery_photo" | "album_review" | "product_hero" | "blog_story";

const LAYOUT_OPTIONS: { id: Layout; label: string; hint: string }[] = [
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
  {
    id: "blog_story",
    label: "Blog story",
    hint: "Life post · image-led note",
  },
];

// Smart default layout based on object type — matches the server's default
// (`discovery_photo`) but upgrades to album / product templates when the type
// makes them a better fit.
function defaultLayoutFor(type: PickedObject["type"]): Layout {
  switch (type) {
    case "album":
    case "track":
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
  const { isSignedIn, user, token } = useAuth();
  const { objectId: seededObjectId } = useLocalSearchParams<{
    objectId?: string;
  }>();

  const [step, setStep] = useState<"pick" | "compose" | "compare">(
    seededObjectId ? "compose" : "pick",
  );
  const [composeKind, setComposeKind] = useState<ComposeKind>("places");
  const [picked, setPicked] = useState<PickedObject | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

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
    setComposeKind(o.type === "album" || o.type === "track" ? "music" : "places");
    setImageUrl(o.type === "album" || o.type === "track" ? o.heroImage ?? "" : "");
  }, [seededObjectId, picked, preseedQuery.data]);

  const [headline, setHeadline] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [attachedListId, setAttachedListId] = useState<string | null>(null);
  const [rankingNote, setRankingNote] = useState("");
  const [comparisonSeedKey, setComparisonSeedKey] = useState<string | null>(
    null,
  );
  const [layout, setLayout] = useState<Layout>("discovery_photo");
  const [locationLabel, setLocationLabel] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [socialDraft, setSocialDraft] = useState<RestaurantSocialDraft>(
    emptyRestaurantSocialDraft,
  );

  const mutation = useCreatePost();
  const pairwise = usePairwiseInsertion();

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
    if (composeKind === "blog") {
      setLayout("blog_story");
      return;
    }
    if (picked) setLayout(defaultLayoutFor(picked.type));
  }, [composeKind, picked]);

  const listsQuery = useOwnerRankingListsQuery(user?.handle ?? null);
  const ownLists = listsQuery.data?.lists ?? [];
  const selectedListQuery = useRankingListQuery(attachedListId ?? undefined);
  const selectedList = selectedListQuery.data?.list;
  const existingRankedEntry =
    picked && selectedList
      ? selectedList.entries.find((entry) => entry.objectId === picked.id)
      : undefined;
  const rankingAttachmentReady =
    !attachedListId ||
    Boolean(existingRankedEntry) ||
    pairwise.insertIndex != null;
  const hasRequiredImage =
    composeKind === "music"
      ? Boolean(imageUrl || picked?.heroImage)
      : Boolean(imageUrl);
  const subjectReady = composeKind === "blog" || Boolean(picked);

  useEffect(() => {
    if (!attachedListId || !picked) {
      pairwise.reset();
      setComparisonSeedKey(null);
      return;
    }
    if (!selectedList) return;

    const key = `${attachedListId}:${picked.id}:${selectedList.entries.length}`;
    if (comparisonSeedKey === key) return;

    pairwise.reset();
    setRankingNote("");
    setComparisonSeedKey(key);

    if (selectedList.entries.some((entry) => entry.objectId === picked.id)) {
      setStep("compose");
      return;
    }

    const doneIndex = pairwise.start(selectedList.entries.length);
    setStep(doneIndex === null ? "compare" : "compose");
  }, [
    attachedListId,
    picked,
    selectedList,
    comparisonSeedKey,
    pairwise,
    pairwise.reset,
    pairwise.start,
  ]);

  const canPublish =
    subjectReady &&
    hasRequiredImage &&
    headline.trim().length > 0 &&
    headline.trim().length <= 160 &&
    caption.trim().length > 0 &&
    caption.trim().length <= 2000 &&
    rankingAttachmentReady &&
    !selectedListQuery.isLoading &&
    !uploadingImage &&
    !mutation.isPending;

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
    if (composeKind !== "blog" && !picked) return;
    setSubmitError(null);
    const finalImageUrl = imageUrl || picked?.heroImage || "";
    if (composeKind !== "music" && !imageUrl) {
      setSubmitError("Upload a photo before publishing.");
      return;
    }
    if (!finalImageUrl) {
      setSubmitError("Add an image before publishing.");
      return;
    }
    const rankingAttachment =
      composeKind !== "blog" && attachedListId && existingRankedEntry
        ? ({ mode: "existing", listId: attachedListId } as const)
        : composeKind !== "blog" && attachedListId && pairwise.insertIndex != null
          ? ({
              mode: "insert",
              listId: attachedListId,
              insertAt: pairwise.insertIndex + 1,
              note: rankingNote.trim() || undefined,
            } as const)
          : undefined;
    try {
      const restaurantEnabled =
        composeKind !== "blog" && isRestaurantLikeClientObject(picked?.type);
      const restaurantVisit = restaurantEnabled
        ? restaurantVisitInputFromDraft(socialDraft)
        : undefined;
      const res = await mutation.mutateAsync({
        objectId: picked?.id,
        postKind:
          composeKind === "blog"
            ? "blog"
            : composeKind === "music"
              ? "music"
              : "place",
        imageUrl: finalImageUrl,
        headline: headline.trim(),
        caption: caption.trim(),
        tags,
        detailLayout: layout,
        rankingAttachment,
        locationLabel:
          composeKind === "blog" ? undefined : locationLabel.trim() || undefined,
        aspect:
          layout === "album_review"
            ? "square"
            : layout === "product_hero"
              ? "wide"
              : "tall",
        mentionedUserIds: mentionedUserIdsFromDraft(socialDraft),
        restaurantVisit,
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
            {step === "pick"
              ? "What are you sharing?"
              : step === "compare"
                ? "Rank it"
                : "Compose"}
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
              onPick={(hit, kind) => {
                setComposeKind(kind);
                setPicked({
                  id: hit.id,
                  title: hit.title,
                  subtitle: hit.subtitle ?? null,
                  type: hit.type,
                  city: hit.city ?? null,
                  heroImage: hit.heroImage ?? null,
                });
                setSocialDraft(emptyRestaurantSocialDraft());
                setImageUrl(kind === "music" ? hit.heroImage ?? "" : "");
                if (!locationLabel.trim()) {
                  setLocationLabel(hit.city ?? hit.subtitle ?? "");
                }
                setStep("compose");
              }}
              onBlog={() => {
                setComposeKind("blog");
                setPicked(null);
                setAttachedListId(null);
                setSocialDraft(emptyRestaurantSocialDraft());
                pairwise.reset();
                setComparisonSeedKey(null);
                setLocationLabel("");
                setLayout("blog_story");
                setStep("compose");
              }}
            />
          ) : step === "compare" && picked && selectedList ? (
            <PairwiseCompareStep
              picked={{
                id: picked.id,
                title: picked.title,
                subtitle: picked.subtitle ?? undefined,
                heroImage:
                  picked.heroImage ??
                  "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80",
              }}
              midObjectId={selectedList.entries[pairwise.mid]?.objectId}
              midRank={pairwise.mid + 1}
              eyebrow="Attach ranking"
              body="Compare this post subject against your list so Zoe can place it honestly."
              onAnswer={(newIsBetter) => {
                const doneIndex = pairwise.answer(newIsBetter);
                if (doneIndex !== null) setStep("compose");
              }}
              onTie={() => {
                pairwise.tie();
                setStep("compose");
              }}
            />
          ) : (
            <ComposeStep
              picked={picked}
              composeKind={composeKind}
              onClearPick={() => {
                setPicked(null);
                setAttachedListId(null);
                setImageUrl("");
                setSocialDraft(emptyRestaurantSocialDraft());
                pairwise.reset();
                setComparisonSeedKey(null);
                setStep("pick");
              }}
              imageUrl={imageUrl || (composeKind === "music" ? picked?.heroImage ?? "" : "")}
              uploadingImage={uploadingImage}
              onUploadImage={handleUploadImage}
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
              selectedListLoading={selectedListQuery.isLoading}
              selectedList={selectedList}
              existingRankedEntry={existingRankedEntry}
              insertIndex={pairwise.insertIndex}
              rankingNote={rankingNote}
              onChangeRankingNote={setRankingNote}
              onToggleList={(id) => {
                setAttachedListId(attachedListId === id ? null : id);
                pairwise.reset();
                setComparisonSeedKey(null);
                setRankingNote("");
              }}
              locationLabel={locationLabel}
              onChangeLocation={setLocationLabel}
              submitError={submitError}
              socialDraft={socialDraft}
              onChangeSocialDraft={setSocialDraft}
              restaurantEnabled={
                composeKind !== "blog" &&
                isRestaurantLikeClientObject(picked?.type)
              }
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

function PickStep({
  onPick,
  onBlog,
}: {
  onPick: (hit: ApiSearchObjectHit, kind: Exclude<ComposeKind, "blog">) => void;
  onBlog: () => void;
}) {
  const [mode, setMode] = useState<ComposeKind>("places");

  return (
    <View>
      <View className="mb-5 flex-row rounded-xl bg-surface-container-low p-1">
        <ModeButton
          label="Places"
          active={mode === "places"}
          onPress={() => setMode("places")}
        />
        <ModeButton
          label="Music"
          active={mode === "music"}
          onPress={() => setMode("music")}
        />
        <ModeButton
          label="Blog"
          active={mode === "blog"}
          onPress={() => setMode("blog")}
        />
      </View>

      {mode === "blog" ? (
        <View className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-5">
          <LabelCaps>Step one</LabelCaps>
          <HeadlineItalic className="mt-2 text-primary text-[28px] leading-[32px]">
            Share a life post
          </HeadlineItalic>
          <Body className="mt-3 text-[14px] leading-[20px]">
            Blog posts are image-led notes about your life, not tied to a place
            or song.
          </Body>
          <View className="mt-5">
            <Button label="Continue" onPress={onBlog} full />
          </View>
        </View>
      ) : mode === "music" ? (
        <MusicPicker
          label="Step one"
          title="Pick what you're sharing"
          body="Search Zoe's catalogue or add an album or song from Spotify."
          placeholder="Search albums, songs, artists..."
          onPick={(hit) => onPick(hit, "music")}
        />
      ) : (
        <PlacePicker
          label="Step one"
          title="Pick what you're sharing"
          body="Search Zoe's catalogue or add a restaurant, café, bar, or spot from Google Places."
          placeholder="Search an album, a place, a café..."
          onPick={(hit) => onPick(hit, "places")}
        />
      )}
    </View>
  );
}

function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-1 items-center rounded-lg py-2 active:opacity-75",
        active && "bg-background",
      )}
    >
      <Label className="font-label-semibold uppercase tracking-widest text-[11px]">
        {label}
      </Label>
    </Pressable>
  );
}

// ---------------- Step 2 — Compose ----------------

function ComposeStep(props: {
  picked: PickedObject | null;
  composeKind: ComposeKind;
  onClearPick: () => void;
  imageUrl: string;
  uploadingImage: boolean;
  onUploadImage: () => void;
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
  ownLists: { id: string; title: string }[];
  attachedListId: string | null;
  selectedListLoading: boolean;
  selectedList?: RankingList;
  existingRankedEntry?: RankingEntry;
  insertIndex: number | null;
  rankingNote: string;
  onChangeRankingNote: (s: string) => void;
  onToggleList: (id: string) => void;
  locationLabel: string;
  onChangeLocation: (s: string) => void;
  submitError: string | null;
  socialDraft: RestaurantSocialDraft;
  onChangeSocialDraft: (draft: RestaurantSocialDraft) => void;
  restaurantEnabled: boolean;
  submitting: boolean;
  canPublish: boolean;
  onPublish: () => void;
}) {
  const {
    picked,
    composeKind,
    onClearPick,
    imageUrl,
    uploadingImage,
    onUploadImage,
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
    selectedListLoading,
    selectedList,
    existingRankedEntry,
    insertIndex,
    rankingNote,
    onChangeRankingNote,
    onToggleList,
    locationLabel,
    onChangeLocation,
    submitError,
    socialDraft,
    onChangeSocialDraft,
    restaurantEnabled,
    submitting,
    canPublish,
    onPublish,
  } = props;

  const headlineCount = headline.trim().length;
  const captionCount = caption.trim().length;
  const imageRequired = composeKind !== "music";

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
            <LabelCaps>{displayObjectType(picked.type)}</LabelCaps>
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
      ) : composeKind === "blog" ? (
        <View className="rounded-xl bg-surface-container-lowest border border-outline-variant/15 p-4">
          <LabelCaps>Blog</LabelCaps>
          <HeadlineItalic className="mt-1 text-primary text-[20px] leading-[24px]">
            A life post
          </HeadlineItalic>
          <Body className="mt-2 text-[13px] leading-[19px]">
            Share a moment without attaching it to a catalog object.
          </Body>
          <Pressable
            onPress={onClearPick}
            className="mt-3 flex-row items-center active:opacity-70"
          >
            <Icon name="edit" size={16} color="#504446" />
            <Label className="ml-1 text-[11px]">Change type</Label>
          </Pressable>
        </View>
      ) : null}

      <Field
        label={imageRequired ? "Upload image" : "Image"}
        counter={imageRequired ? "required" : "Spotify artwork"}
      >
        {imageUrl ? (
          <View className="mt-2 rounded-xl overflow-hidden bg-surface-container-low">
            <Image
              source={{ uri: imageUrl }}
              style={{ aspectRatio: composeKind === "music" ? 1 : 4 / 5 }}
              contentFit={composeKind === "music" ? "contain" : "cover"}
              transition={220}
              className="w-full"
            />
          </View>
        ) : (
          <Pressable
            onPress={onUploadImage}
            disabled={uploadingImage}
            className="mt-2 h-44 rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low items-center justify-center active:opacity-80"
          >
            {uploadingImage ? (
              <ActivityIndicator color="#55343B" />
            ) : (
              <>
                <Icon name="add-a-photo" size={24} color="#55343B" />
                <Label className="mt-2 text-[11px] uppercase tracking-widest">
                  Add photo
                </Label>
              </>
            )}
          </Pressable>
        )}
        {composeKind !== "music" && imageUrl ? (
          <Pressable
            onPress={onUploadImage}
            disabled={uploadingImage}
            className="mt-3 flex-row items-center active:opacity-70"
          >
            <Icon name="add-a-photo" size={16} color="#504446" />
            <Label className="ml-1 text-[11px]">
              {uploadingImage ? "Uploading…" : "Replace photo"}
            </Label>
          </Pressable>
        ) : null}
      </Field>

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
      <Field
        label={composeKind === "blog" ? "Story" : "Review"}
        counter={`${captionCount}/2000`}
      >
        <TextInput
          value={caption}
          onChangeText={onChangeCaption}
          placeholder={
            composeKind === "blog"
              ? "What happened? What did it feel like?"
              : "Write a paragraph. Who's it for? When does it land? Why does it stay with you?"
          }
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

      <RestaurantSocialFields
        draft={socialDraft}
        onChange={onChangeSocialDraft}
        restaurantEnabled={restaurantEnabled}
      />

      {/* Layout */}
      {composeKind !== "blog" ? (
      <Field label="Detail layout">
        <View className="gap-2 mt-2">
          {LAYOUT_OPTIONS.filter((opt) => opt.id !== "blog_story").map((opt) => {
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
      ) : null}

      {/* Optional — attach a ranking list (own only) */}
      {composeKind !== "blog" ? (
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
            {attachedListId ? (
              <View className="rounded-xl bg-surface-container-low px-3 py-3 border border-outline-variant/20">
                {selectedListLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#55343B" />
                    <Label className="ml-2 text-[11px]">
                      Loading ranking...
                    </Label>
                  </View>
                ) : existingRankedEntry ? (
                  <Label className="text-[11px]">
                    Already ranked #{existingRankedEntry.rank} ·{" "}
                    {existingRankedEntry.score.toFixed(1)}
                  </Label>
                ) : insertIndex != null && selectedList ? (
                  <View>
                    <Label className="text-[11px]">
                      Will publish as #{insertIndex + 1} in {selectedList.title}
                    </Label>
                    <TextInput
                      value={rankingNote}
                      onChangeText={onChangeRankingNote}
                      placeholder="Optional ranking note"
                      placeholderTextColor="rgba(80,68,70,0.55)"
                      maxLength={600}
                      multiline
                      className="mt-2 font-body text-on-surface text-[13px]"
                      style={{ paddingVertical: 4, minHeight: 44 }}
                    />
                  </View>
                ) : (
                  <Label className="text-[11px] text-rank-down">
                    Finish the comparison to publish.
                  </Label>
                )}
              </View>
            ) : null}
          </View>
        )}
      </Field>
      ) : null}

      {/* Location label */}
      {composeKind !== "blog" ? (
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
      ) : null}

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
