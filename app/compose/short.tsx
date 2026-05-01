import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  Body,
  HeadlineItalic,
  Label,
  LabelCaps,
} from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import {
  pickAndUploadImage,
  pickAndUploadVideo,
  useAuth,
  useCreateShort,
  useObjectQuery,
} from "@/lib/api";
import type { ApiSearchObjectHit } from "@/lib/api/types";
import type { UploadProgress } from "@/lib/api/uploads";
import { ApiHttpError } from "@/lib/api/client";
import { displayObjectType } from "@/lib/objects/display";

/**
 * Compose Short (PRD §20, VDK §16.6 — Shorts).
 *
 * Two-step flow that mirrors the Post composer for a consistent creation
 * model:
 *   1. Pick an object from the catalogue.
 *   2. Compose hook line, caption, hero image, optional video, optional
 *      audio label, and an optional ranking badge.
 *
 * Media is uploaded via the signed-PUT pipeline in `lib/api/uploads.ts`
 * (`POST /uploads/sign` → PUT raw bytes to the returned URL → store the
 * resolved public URL on the Short). The server's storage driver is
 * pluggable (local disk for dev, S3/R2 for prod).
 *
 * Submit calls `POST /shorts`. On success we land on the Shorts tab — the
 * `useCreateShort` hook invalidates `["shorts"]` so the feed refreshes.
 */
type PickedObject = {
  id: string;
  title: string;
  subtitle?: string | null;
  type: ApiSearchObjectHit["type"];
  city?: string | null;
  heroImage?: string | null;
};

type SlotState =
  | { status: "idle" }
  | { status: "uploading"; fraction: number }
  | { status: "error"; message: string };

export default function ComposeShortScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, token } = useAuth();
  const { objectId: seededObjectId } = useLocalSearchParams<{
    objectId?: string;
  }>();

  const [step, setStep] = useState<"pick" | "compose">(
    seededObjectId ? "compose" : "pick",
  );
  const [picked, setPicked] = useState<PickedObject | null>(null);

  // Deep-link hydration (matches the Post composer — without this the
  // Publish button never enables on object-detail deep-links).
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

  const [hookLine, setHookLine] = useState("");
  const [caption, setCaption] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [audioLabel, setAudioLabel] = useState("");
  const [rankingBadgeEnabled, setRankingBadgeEnabled] = useState(false);
  const [rankingListTitle, setRankingListTitle] = useState("");
  const [rankingRank, setRankingRank] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [heroSlot, setHeroSlot] = useState<SlotState>({ status: "idle" });
  const [videoSlot, setVideoSlot] = useState<SlotState>({ status: "idle" });

  const mutation = useCreateShort();

  useEffect(() => {
    if (!isSignedIn) router.replace("/sign-in");
  }, [isSignedIn, router]);

  // Seed hero image from the picked object so the short starts with a
  // reasonable cover. Users can replace it via the picker below.
  useEffect(() => {
    if (picked?.heroImage && !heroImage) setHeroImage(picked.heroImage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  const uploading =
    heroSlot.status === "uploading" || videoSlot.status === "uploading";

  const parsedRank = rankingRank.trim() ? Number(rankingRank.trim()) : null;
  const rankingIsValid =
    !rankingBadgeEnabled ||
    (rankingListTitle.trim().length > 0 &&
      parsedRank !== null &&
      Number.isInteger(parsedRank) &&
      parsedRank > 0);

  const canPublish =
    Boolean(picked) &&
    hookLine.trim().length > 0 &&
    hookLine.trim().length <= 160 &&
    caption.trim().length > 0 &&
    caption.trim().length <= 500 &&
    isValidUrl(heroImage) &&
    (videoUrl.length === 0 || isValidUrl(videoUrl)) &&
    rankingIsValid &&
    !uploading &&
    !mutation.isPending;

  // ---------- Upload handlers ----------

  const handlePickHero = async () => {
    if (!token) {
      router.push("/sign-in");
      return;
    }
    setHeroSlot({ status: "uploading", fraction: 0 });
    try {
      const onProgress = (p: UploadProgress) =>
        setHeroSlot({ status: "uploading", fraction: fractionOf(p) });
      const uploaded = await pickAndUploadImage(token, undefined, onProgress);
      if (!uploaded) {
        // User cancelled the picker / denied permission.
        setHeroSlot({ status: "idle" });
        return;
      }
      setHeroImage(uploaded.publicUrl);
      setHeroSlot({ status: "idle" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setHeroSlot({ status: "error", message });
      Alert.alert("Couldn't upload photo", message);
    }
  };

  const handlePickVideo = async () => {
    if (!token) {
      router.push("/sign-in");
      return;
    }
    setVideoSlot({ status: "uploading", fraction: 0 });
    try {
      const onProgress = (p: UploadProgress) =>
        setVideoSlot({ status: "uploading", fraction: fractionOf(p) });
      const uploaded = await pickAndUploadVideo(
        token,
        { videoMaxDurationSec: 60 },
        onProgress,
      );
      if (!uploaded) {
        setVideoSlot({ status: "idle" });
        return;
      }
      setVideoUrl(uploaded.publicUrl);
      setVideoSlot({ status: "idle" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setVideoSlot({ status: "error", message });
      Alert.alert("Couldn't upload video", message);
    }
  };

  const handlePublish = async () => {
    if (!picked) return;
    setSubmitError(null);
    try {
      await mutation.mutateAsync({
        objectId: picked.id,
        hookLine: hookLine.trim(),
        caption: caption.trim(),
        heroImage: heroImage.trim(),
        videoUrl: videoUrl.trim() || undefined,
        audioLabel: audioLabel.trim() || undefined,
        rankingListTitle: rankingBadgeEnabled
          ? rankingListTitle.trim() || undefined
          : undefined,
        rankingRank:
          rankingBadgeEnabled && parsedRank !== null ? parsedRank : undefined,
      });
      router.replace("/(tabs)/shorts");
    } catch (e) {
      if (e instanceof ApiHttpError) {
        setSubmitError(e.message);
      } else {
        setSubmitError("Couldn't publish — try again in a moment.");
      }
    }
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
            {step === "pick" ? "Pick a subject" : "Compose short"}
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
              hookLine={hookLine}
              onChangeHookLine={setHookLine}
              caption={caption}
              onChangeCaption={setCaption}
              heroImage={heroImage}
              heroSlot={heroSlot}
              onPickHero={handlePickHero}
              onClearHero={() => setHeroImage("")}
              videoUrl={videoUrl}
              videoSlot={videoSlot}
              onPickVideo={handlePickVideo}
              onClearVideo={() => setVideoUrl("")}
              audioLabel={audioLabel}
              onChangeAudioLabel={setAudioLabel}
              rankingBadgeEnabled={rankingBadgeEnabled}
              onToggleRankingBadge={() =>
                setRankingBadgeEnabled((v) => !v)
              }
              rankingListTitle={rankingListTitle}
              onChangeRankingListTitle={setRankingListTitle}
              rankingRank={rankingRank}
              onChangeRankingRank={setRankingRank}
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

function fractionOf(p: UploadProgress): number {
  if (!Number.isFinite(p.fraction)) return 0;
  return Math.max(0, Math.min(1, p.fraction));
}

// ---------------- Step 1 — Pick object ----------------

function PickStep({ onPick }: { onPick: (hit: ApiSearchObjectHit) => void }) {
  const [mode, setMode] = useState<"places" | "music">("places");

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
      </View>

      {mode === "music" ? (
        <MusicPicker
          label="Step one"
          title="What is this short about?"
          body="Pick from Zoe or add an album or song from Spotify so viewers can open the object page."
          placeholder="Search albums, songs, artists..."
          onPick={onPick}
        />
      ) : (
        <PlacePicker
          label="Step one"
          title="What is this short about?"
          body="Shorts are always tied to a thing. Pick from Zoe or add a place from Google so viewers can open the object page."
          placeholder="Search a café, a place, an album..."
          onPick={onPick}
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
  onClearPick: () => void;
  hookLine: string;
  onChangeHookLine: (s: string) => void;
  caption: string;
  onChangeCaption: (s: string) => void;
  heroImage: string;
  heroSlot: SlotState;
  onPickHero: () => void;
  onClearHero: () => void;
  videoUrl: string;
  videoSlot: SlotState;
  onPickVideo: () => void;
  onClearVideo: () => void;
  audioLabel: string;
  onChangeAudioLabel: (s: string) => void;
  rankingBadgeEnabled: boolean;
  onToggleRankingBadge: () => void;
  rankingListTitle: string;
  onChangeRankingListTitle: (s: string) => void;
  rankingRank: string;
  onChangeRankingRank: (s: string) => void;
  submitError: string | null;
  submitting: boolean;
  canPublish: boolean;
  onPublish: () => void;
}) {
  const {
    picked,
    onClearPick,
    hookLine,
    onChangeHookLine,
    caption,
    onChangeCaption,
    heroImage,
    heroSlot,
    onPickHero,
    onClearHero,
    videoUrl,
    videoSlot,
    onPickVideo,
    onClearVideo,
    audioLabel,
    onChangeAudioLabel,
    rankingBadgeEnabled,
    onToggleRankingBadge,
    rankingListTitle,
    onChangeRankingListTitle,
    rankingRank,
    onChangeRankingRank,
    submitError,
    submitting,
    canPublish,
    onPublish,
  } = props;

  const hookCount = hookLine.trim().length;
  const captionCount = caption.trim().length;
  const heroReady = heroImage && isValidUrl(heroImage);

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
      ) : null}

      {/* Hero photo — required */}
      <MediaSlot
        label="Cover photo"
        hint="Shown as the still frame in feed."
        state={heroSlot}
        hasValue={Boolean(heroReady)}
        aspectRatio={9 / 16}
        previewUrl={heroReady ? heroImage : null}
        previewKind="image"
        onPick={onPickHero}
        onClear={heroReady ? onClearHero : undefined}
        pickLabel={heroReady ? "Change photo" : "Choose photo"}
      />

      {/* Video — optional, up to 60s */}
      <MediaSlot
        label="Video clip"
        hint="Optional · MP4 / MOV up to 60s."
        state={videoSlot}
        hasValue={Boolean(videoUrl)}
        aspectRatio={9 / 16}
        previewUrl={videoUrl || null}
        previewKind="video"
        onPick={onPickVideo}
        onClear={videoUrl ? onClearVideo : undefined}
        pickLabel={videoUrl ? "Change video" : "Choose video"}
      />

      {/* Hook line */}
      <Field label="Hook line" counter={`${hookCount}/160`}>
        <TextInput
          value={hookLine}
          onChangeText={onChangeHookLine}
          placeholder="The one line that stops the scroll."
          placeholderTextColor="rgba(80,68,70,0.55)"
          maxLength={160}
          multiline
          className="font-display-italic text-primary text-[22px] leading-[26px]"
          style={{ paddingVertical: 6, minHeight: 44 }}
        />
      </Field>

      {/* Caption */}
      <Field label="Caption" counter={`${captionCount}/500`}>
        <TextInput
          value={caption}
          onChangeText={onChangeCaption}
          placeholder="One or two paragraphs. Why does this clip matter?"
          placeholderTextColor="rgba(80,68,70,0.55)"
          maxLength={500}
          multiline
          textAlignVertical="top"
          className="font-body text-on-surface text-[15px] leading-[22px]"
          style={{ paddingVertical: 8, minHeight: 112 }}
        />
      </Field>

      {/* Audio label */}
      <Field label="Audio label (optional)">
        <TextInput
          value={audioLabel}
          onChangeText={onChangeAudioLabel}
          placeholder="Artist — track, or the sound credit line"
          placeholderTextColor="rgba(80,68,70,0.55)"
          maxLength={120}
          className="font-body text-on-surface text-[14px]"
          style={{ paddingVertical: 6 }}
        />
      </Field>

      {/* Ranking badge */}
      <View className="mt-8">
        <Pressable
          onPress={onToggleRankingBadge}
          className="flex-row items-center justify-between py-2 active:opacity-70"
        >
          <View className="flex-1">
            <LabelCaps>Attach a ranking badge</LabelCaps>
            <Body className="mt-1 text-[13px] text-on-surface-variant">
              Show a `#x` pill on the clip — e.g. “#1 on my Night Perfumes.”
            </Body>
          </View>
          <View
            className={cn(
              "w-11 h-6 rounded-full border px-0.5 justify-center",
              rankingBadgeEnabled
                ? "bg-primary/20 border-primary"
                : "bg-surface-container-low border-outline-variant/40",
            )}
          >
            <View
              className={cn(
                "w-5 h-5 rounded-full",
                rankingBadgeEnabled
                  ? "bg-primary self-end"
                  : "bg-outline self-start",
              )}
            />
          </View>
        </Pressable>
        {rankingBadgeEnabled ? (
          <View className="mt-4 gap-4">
            <Field label="Ranking list title">
              <TextInput
                value={rankingListTitle}
                onChangeText={onChangeRankingListTitle}
                placeholder="e.g. Night Perfumes"
                placeholderTextColor="rgba(80,68,70,0.55)"
                maxLength={80}
                className="font-body text-on-surface text-[14px]"
                style={{ paddingVertical: 6 }}
              />
            </Field>
            <Field label="Rank (1-indexed)">
              <TextInput
                value={rankingRank}
                onChangeText={(v) =>
                  onChangeRankingRank(v.replace(/[^0-9]/g, "").slice(0, 4))
                }
                placeholder="1"
                placeholderTextColor="rgba(80,68,70,0.55)"
                keyboardType="number-pad"
                className="font-body text-on-surface text-[14px]"
                style={{ paddingVertical: 6 }}
              />
            </Field>
          </View>
        ) : null}
      </View>

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

// ---------------- MediaSlot ----------------
//
// Consolidated picker UI for both hero photo and video. Three visual
// states: empty (big tap target), filled (preview + "Change / Remove"),
// uploading (progress bar overlay). Keeps the composer scannable at a
// glance.

function MediaSlot(props: {
  label: string;
  hint: string;
  state: SlotState;
  hasValue: boolean;
  aspectRatio: number;
  previewUrl: string | null;
  previewKind: "image" | "video";
  onPick: () => void;
  onClear?: () => void;
  pickLabel: string;
}) {
  const {
    label,
    hint,
    state,
    hasValue,
    aspectRatio,
    previewUrl,
    previewKind,
    onPick,
    onClear,
    pickLabel,
  } = props;
  const uploading = state.status === "uploading";
  const errored = state.status === "error";

  return (
    <View className="mt-8">
      <View className="flex-row items-baseline justify-between">
        <LabelCaps>{label}</LabelCaps>
        <Label className="text-[10px] text-on-surface-variant">{hint}</Label>
      </View>

      <View className="mt-3 rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/20">
        {hasValue && previewUrl ? (
          <View>
            {previewKind === "image" ? (
              <Image
                source={{ uri: previewUrl }}
                style={{ width: "100%", aspectRatio }}
                contentFit="cover"
              />
            ) : (
              // We don't ship a native video player yet; the thumbnail row
              // below is enough signal that the upload completed. When
              // expo-video lands in the composer we'll swap this view.
              <View
                style={{ width: "100%", aspectRatio }}
                className="bg-ink/90 items-center justify-center"
              >
                <Icon name="play-circle-outline" size={48} color="#FBF9F6" />
                <Label className="mt-2 text-surface/80">Video ready</Label>
              </View>
            )}
            {uploading ? <UploadingOverlay state={state} /> : null}
          </View>
        ) : (
          <Pressable
            onPress={uploading ? undefined : onPick}
            className="items-center justify-center py-10 px-6 active:opacity-70"
            style={{ aspectRatio }}
          >
            {uploading ? (
              <UploadingOverlay state={state} inline />
            ) : (
              <>
                <Icon
                  name={previewKind === "image" ? "add-a-photo" : "videocam"}
                  size={28}
                  color="#504446"
                />
                <Label className="mt-3 text-on-surface-variant">
                  {pickLabel}
                </Label>
              </>
            )}
          </Pressable>
        )}
      </View>

      {hasValue && !uploading ? (
        <View className="mt-2 flex-row gap-4">
          <Pressable
            onPress={onPick}
            hitSlop={8}
            className="active:opacity-70"
          >
            <Label className="font-label-semibold text-primary uppercase tracking-widest text-[11px]">
              {pickLabel}
            </Label>
          </Pressable>
          {onClear ? (
            <Pressable
              onPress={onClear}
              hitSlop={8}
              className="active:opacity-70"
            >
              <Label className="font-label-semibold text-rank-down uppercase tracking-widest text-[11px]">
                Remove
              </Label>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {errored ? (
        <Text className="mt-2 text-rank-down font-label text-[12px]">
          {state.message}
        </Text>
      ) : null}
    </View>
  );
}

function UploadingOverlay({
  state,
  inline = false,
}: {
  state: SlotState;
  inline?: boolean;
}) {
  if (state.status !== "uploading") return null;
  const pct = Math.round(state.fraction * 100);
  return (
    <View
      className={cn(
        "items-center justify-center gap-2",
        inline ? "" : "absolute inset-0 bg-ink/60",
      )}
    >
      <ActivityIndicator color={inline ? "#55343B" : "#FBF9F6"} />
      <Label
        className={cn(
          "text-[11px] uppercase tracking-widest",
          inline ? "text-on-surface-variant" : "text-surface/90",
        )}
      >
        {pct > 0 ? `Uploading · ${pct}%` : "Uploading…"}
      </Label>
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

function isValidUrl(s: string): boolean {
  if (!s) return false;
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
