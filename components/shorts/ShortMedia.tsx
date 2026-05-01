import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { View } from "react-native";

/**
 * Background media for a single Shorts frame.
 *
 * Two modes:
 *   - `videoUrl` missing → falls back to the hero image (hero is the
 *     still frame on the Short record; every Short has one, and some
 *     shorts may be image-only by design).
 *   - `videoUrl` present → renders `<VideoView>` with the hero image
 *     as a poster. The player is paused until `active` flips to true,
 *     loops forever, and follows the global `muted` state so toggling
 *     unmute on one frame applies to the whole pager.
 *
 * We deliberately pause *and* seek back to 0 when a frame deactivates.
 * That matches TikTok / Reels behavior — scrolling back to a clip starts
 * it from the top, not from wherever it was when it left the viewport.
 *
 * The mute toggle lives in `ShortFrame`, not here, so it paints above
 * the gradient overlays that sit on top of this component. ShortMedia
 * is purely the background layer.
 */
export interface ShortMediaProps {
  heroImage: string;
  videoUrl?: string | null;
  preserveArtwork?: boolean;
  /** True when this frame is the one currently snapped into view. */
  active: boolean;
  /** Mute state is lifted to the feed so it persists across frames. */
  muted: boolean;
}

export function ShortMedia({
  heroImage,
  videoUrl,
  preserveArtwork = false,
  active,
  muted,
}: ShortMediaProps) {
  if (videoUrl) {
    return (
      <VideoFrame
        uri={videoUrl}
        poster={heroImage}
        preservePoster={preserveArtwork}
        active={active}
        muted={muted}
      />
    );
  }
  return (
    <Image
      source={{ uri: heroImage }}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      contentFit={preserveArtwork ? "contain" : "cover"}
      transition={300}
    />
  );
}

function VideoFrame({
  uri,
  poster,
  preservePoster,
  active,
  muted,
}: {
  uri: string;
  poster: string;
  preservePoster: boolean;
  active: boolean;
  muted: boolean;
}) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = true;
    p.muted = muted;
    p.audioMixingMode = "mixWithOthers";
    // Don't auto-play in setup — we drive play/pause from the `active`
    // effect below so only the visible frame is ever playing.
  });

  // Drive playback from focus state. We also seek to 0 on deactivate so
  // scrolling back restarts the clip cleanly.
  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
      try {
        player.currentTime = 0;
      } catch {
        // `currentTime` setter throws before the player is ready; the
        // next activation will reach readyToPlay and play from 0 anyway.
      }
    }
  }, [active, player]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Poster. The VideoView renders transparently until the first
          frame is decoded; without a poster the whole screen flashes
          black on load. expo-image stays behind the player with a
          fast transition so the seam is invisible on real devices. */}
      <Image
        source={{ uri: poster }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit={preservePoster ? "contain" : "cover"}
        transition={200}
      />
      <VideoView
        player={player}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}
