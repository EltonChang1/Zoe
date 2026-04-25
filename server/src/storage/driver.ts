/**
 * Storage driver abstraction.
 *
 * The only thing the rest of the server knows about file storage is this
 * interface. Two drivers ship today:
 *   - `local`  — writes to disk under `UPLOADS_DIR` and serves files back
 *                through our own `/uploads/:key` route. Intended for dev,
 *                Expo Go, and single-box deployments.
 *   - `s3`     — returns presigned PUT URLs against an S3-compatible
 *                bucket. The routes layer never sees the bytes. (Not
 *                shipped yet — stubbed so the env switch is safe.)
 *
 * `sign()` is called by `POST /uploads/sign`. Clients PUT directly to the
 * returned `uploadUrl` and then send the resulting `publicUrl` back to the
 * create-short / create-post endpoint.
 */

export type UploadKind = "image" | "video";

export interface SignInput {
  kind: UploadKind;
  contentType: string;
  contentLength: number;
  userId: string;
  /** Origin from the incoming sign request — lets local driver build
   *  public URLs that work on whatever host the phone is talking to
   *  (LAN IP, ngrok, Cloudflare tunnel) without extra config. */
  requestOrigin: string;
}

export interface SignOutput {
  /** Opaque object key. Clients don't need to inspect it. */
  key: string;
  /** Fully-qualified PUT URL. No auth header required; the signature is
   *  embedded as a query string so `FileSystem.uploadAsync` can send raw
   *  bytes with just `Content-Type`. */
  uploadUrl: string;
  /** The URL to store on the Post / Short record after upload succeeds.  */
  publicUrl: string;
  /** Additional headers the client MUST send on the PUT. */
  requiredHeaders: Record<string, string>;
  /** ISO timestamp after which the signature is rejected. */
  expiresAt: string;
  /** Hard cap the driver enforced. Clients use this to decide whether to
   *  re-compress before uploading. */
  maxBytes: number;
}

export interface StorageDriver {
  readonly id: "local" | "s3";
  /**
   * Produce a client-usable upload URL pair. Returns a Promise so the S3
   * driver can await `getSignedUrl` — the local driver resolves
   * synchronously via `Promise.resolve`.
   */
  sign(input: SignInput): Promise<SignOutput>;
  /**
   * Best-effort delete of a previously returned `publicUrl`. Returns
   * silently when the URL does not belong to this driver (e.g. external
   * Unsplash URLs) or when the underlying object no longer exists.
   * Never throws — callers use this from within a delete-flow and should
   * not fail the user-facing request if storage cleanup lags.
   */
  deletePublicUrl(publicUrl: string): Promise<void>;
  /**
   * Recursively delete everything under a user's upload prefix. Used by
   * `DELETE /auth/me` to satisfy Apple's "delete personal data" rule
   * (Guideline 5.1.1(v)). Best-effort — logs and swallows errors.
   */
  deleteUserPrefix(userId: string): Promise<void>;
}

// ---------- Mime whitelists ----------
//
// Keep these narrow. Apple's App Privacy rules (and common sense) mean we
// don't accept raw binary blobs or formats the client can't render.

export const IMAGE_MIME_WHITELIST = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const VIDEO_MIME_WHITELIST = new Set<string>([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export function extForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    case "video/webm":
      return "webm";
    default:
      return "bin";
  }
}

export function assertKindMatchesMime(kind: UploadKind, mime: string): void {
  const set = kind === "image" ? IMAGE_MIME_WHITELIST : VIDEO_MIME_WHITELIST;
  if (!set.has(mime)) {
    throw Object.assign(new Error(`Unsupported ${kind} type: ${mime}`), {
      code: "unsupported_mime",
    });
  }
}
