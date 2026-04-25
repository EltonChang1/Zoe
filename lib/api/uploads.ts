import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";

import { ApiHttpError, request } from "./client";

/**
 * Upload pipeline — the thin client half of the signed-PUT flow.
 *
 *   1. User picks media via `pickImage` / `pickVideo`.
 *   2. `uploadAsset` calls `POST /uploads/sign` to mint a signed PUT URL.
 *   3. The raw bytes are PUT directly to that URL via `XMLHttpRequest`
 *      (chosen over `fetch` for upload-progress events on RN).
 *   4. The resolved `publicUrl` is returned and stored on the post/short.
 *
 * The server's storage driver is swappable (`UPLOADS_DRIVER=local|s3`);
 * nothing in this file knows the difference — we always PUT to whatever
 * `uploadUrl` the sign endpoint hands back.
 */

// ---------- Types ----------

export type UploadKind = "image" | "video";

export interface UploadSignatureResponse {
  key: string;
  uploadUrl: string;
  publicUrl: string;
  requiredHeaders: Record<string, string>;
  expiresAt: string;
  maxBytes: number;
}

export interface UploadedAsset {
  publicUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationMs?: number | null;
  byteLength: number;
}

export interface UploadProgress {
  /** Bytes sent so far. */
  loaded: number;
  /** Total bytes to send. */
  total: number;
  /** [0,1]; `NaN` if `total === 0`. */
  fraction: number;
}

// ---------- Mime helpers ----------

const IMAGE_MIME_ALLOW: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const VIDEO_MIME_ALLOW: readonly string[] = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

function inferMimeFromUri(uri: string, kind: UploadKind): string {
  const m = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const ext = m?.[1]?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "webm":
      return "video/webm";
    default:
      return kind === "image" ? "image/jpeg" : "video/mp4";
  }
}

function normalizeMime(asset: ImagePicker.ImagePickerAsset, kind: UploadKind): string {
  const raw = asset.mimeType?.toLowerCase();
  if (raw) {
    // Some picker results come back with codecs or parameters (e.g.
    // `video/mp4; codecs=hvc1`). We only want the base.
    const base = raw.split(";")[0]!.trim();
    const allow = kind === "image" ? IMAGE_MIME_ALLOW : VIDEO_MIME_ALLOW;
    if (allow.includes(base)) return base;
  }
  return inferMimeFromUri(asset.uri, kind);
}

// ---------- Picker wrappers ----------

export interface PickImageOptions {
  allowsEditing?: boolean;
  /** 0..1. Lower = smaller file. Default 0.85 feels right for photos. */
  quality?: number;
  aspect?: [number, number];
}

export async function pickImage(
  opts: PickImageOptions = {},
): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: opts.allowsEditing ?? false,
    quality: opts.quality ?? 0.85,
    aspect: opts.aspect,
    exif: false,
  });
  if (result.canceled) return null;
  return result.assets[0] ?? null;
}

export interface PickVideoOptions {
  /** Hard cap in seconds. Keep aligned with the feed UX (60s shorts). */
  videoMaxDurationSec?: number;
  allowsEditing?: boolean;
}

export async function pickVideo(
  opts: PickVideoOptions = {},
): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    allowsEditing: opts.allowsEditing ?? false,
    videoMaxDuration: opts.videoMaxDurationSec ?? 60,
    quality: 0.9,
  });
  if (result.canceled) return null;
  return result.assets[0] ?? null;
}

// ---------- Upload ----------

/**
 * Upload a picked asset. Returns the public URL the caller should store
 * on the Post / Short / avatar record. Throws `ApiHttpError` on any
 * failure — network, sign, or the PUT itself.
 */
export async function uploadAsset(
  asset: ImagePicker.ImagePickerAsset,
  kind: UploadKind,
  token: string,
  onProgress?: (p: UploadProgress) => void,
): Promise<UploadedAsset> {
  const mime = normalizeMime(asset, kind);
  const allow = kind === "image" ? IMAGE_MIME_ALLOW : VIDEO_MIME_ALLOW;
  if (!allow.includes(mime)) {
    throw new ApiHttpError(
      422,
      "unsupported_mime",
      `This ${kind} format (${mime}) isn't supported yet.`,
    );
  }

  // Read the local file into a fresh ArrayBuffer. `expo-file-system`'s
  // `File` implements Blob, but RN `fetch` / XHR bodies are more reliable
  // with raw bytes — especially on iOS for HEIC and MOV.
  let buffer: ArrayBuffer;
  try {
    const file = new File(asset.uri);
    buffer = await file.arrayBuffer();
  } catch (err) {
    throw new ApiHttpError(
      0,
      "file_read_failed",
      err instanceof Error ? err.message : "Couldn't read the selected file.",
    );
  }
  const byteLength = buffer.byteLength;

  // 1. Sign.
  const signed = await request<UploadSignatureResponse>("/uploads/sign", {
    method: "POST",
    token,
    body: { kind, contentType: mime, contentLength: byteLength },
  });

  if (byteLength > signed.maxBytes) {
    const mb = (signed.maxBytes / (1024 * 1024)).toFixed(0);
    throw new ApiHttpError(
      422,
      "file_too_large",
      `That ${kind} is too large. Max is ${mb} MB.`,
    );
  }

  // 2. PUT to the signed URL with progress reporting.
  await putBinary(signed.uploadUrl, buffer, mime, signed.requiredHeaders, onProgress);

  return {
    publicUrl: signed.publicUrl,
    mimeType: mime,
    width: asset.width,
    height: asset.height,
    durationMs: asset.duration ?? null,
    byteLength,
  };
}

export async function pickAndUploadImage(
  token: string,
  opts?: PickImageOptions,
  onProgress?: (p: UploadProgress) => void,
): Promise<UploadedAsset | null> {
  const asset = await pickImage(opts);
  if (!asset) return null;
  return uploadAsset(asset, "image", token, onProgress);
}

export async function pickAndUploadVideo(
  token: string,
  opts?: PickVideoOptions,
  onProgress?: (p: UploadProgress) => void,
): Promise<UploadedAsset | null> {
  const asset = await pickVideo(opts);
  if (!asset) return null;
  return uploadAsset(asset, "video", token, onProgress);
}

// ---------- PUT helper ----------

function putBinary(
  url: string,
  body: ArrayBuffer,
  contentType: string,
  extraHeaders: Record<string, string>,
  onProgress?: (p: UploadProgress) => void,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    // `requiredHeaders` from the signer always includes Content-Type, but
    // some drivers may add SDK-specific headers (x-amz-*). Apply them all.
    xhr.setRequestHeader("Content-Type", contentType);
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (k.toLowerCase() === "content-type") continue;
      xhr.setRequestHeader(k, v);
    }
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        const total = e.lengthComputable ? e.total : body.byteLength;
        const loaded = e.loaded;
        onProgress({
          loaded,
          total,
          fraction: total > 0 ? loaded / total : Number.NaN,
        });
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new ApiHttpError(
            xhr.status,
            "upload_failed",
            xhr.responseText || `Upload failed with HTTP ${xhr.status}`,
          ),
        );
      }
    };
    xhr.onerror = () => {
      reject(new ApiHttpError(0, "network_error", "Upload network error"));
    };
    xhr.ontimeout = () => {
      reject(new ApiHttpError(0, "timeout", "Upload timed out"));
    };
    // Large videos can easily take 30+ seconds on a middling connection;
    // give the request a generous ceiling before bailing.
    xhr.timeout = 5 * 60 * 1000;
    xhr.send(body);
  });
}
