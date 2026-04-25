import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { env } from "../env.js";
import { HttpError } from "../http/errors.js";
import {
  assertKindMatchesMime,
  extForMime,
  IMAGE_MIME_WHITELIST,
  VIDEO_MIME_WHITELIST,
  type SignInput,
  type SignOutput,
  type StorageDriver,
  type UploadKind,
} from "./driver.js";

/**
 * Local-disk storage driver.
 *
 * Writes to `env.UPLOADS_DIR` on the API host and serves uploaded bytes
 * back through the same Hono app at `GET /uploads/:key`. Signed PUT URLs
 * are HMAC tokens that encode the (key, content-type, max-bytes, expiry)
 * tuple so the receiving handler can validate a request before touching
 * the filesystem.
 *
 * Not suitable for multi-host deployments — `UPLOADS_DRIVER=s3` is the
 * production path. Kept deliberately small; production uploads belong in
 * object storage, not on the app server's disk.
 */

const PUT_PATH_PREFIX = "/uploads/put";
const PUBLIC_PATH_PREFIX = "/uploads";

function signToken(params: {
  key: string;
  contentType: string;
  maxBytes: number;
  expiresAtMs: number;
  userId: string;
}): string {
  const msg = [
    params.key,
    params.contentType,
    String(params.maxBytes),
    String(params.expiresAtMs),
    params.userId,
  ].join("\n");
  return createHmac("sha256", env.UPLOADS_SIGNING_SECRET)
    .update(msg)
    .digest("base64url");
}

export interface LocalPutContext {
  key: string;
  contentType: string;
  maxBytes: number;
  expiresAtMs: number;
  userId: string;
  token: string;
}

/** Verify an incoming signed PUT. Throws `HttpError` on any failure. */
export function verifyPut(ctx: LocalPutContext, now = Date.now()): void {
  if (!ctx.token) throw HttpError.forbidden("Missing upload token");
  if (now > ctx.expiresAtMs) throw HttpError.forbidden("Upload link expired");

  const expected = signToken(ctx);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(ctx.token);
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    throw HttpError.forbidden("Upload token mismatch");
  }
}

function maxBytesFor(kind: UploadKind): number {
  return kind === "image"
    ? env.UPLOADS_IMAGE_MAX_BYTES
    : env.UPLOADS_VIDEO_MAX_BYTES;
}

function buildKey(kind: UploadKind, userId: string, mime: string): string {
  // `u/<userId>/<kind>/<uuid>.<ext>` — low-cardinality prefixes keep the
  // on-disk tree navigable, uuid avoids collisions. Never derived from
  // user input, so path traversal via the key isn't possible.
  const id = randomUUID();
  const ext = extForMime(mime);
  return `u/${userId}/${kind}/${id}.${ext}`;
}

function publicUrlToKey(publicUrl: string): string | null {
  // Only treat URLs that match our public `/uploads/<key>` shape as ours.
  // Anything else (external Unsplash / CDN / future S3 URL) is skipped.
  try {
    const u = new URL(publicUrl);
    const marker = "/uploads/";
    const idx = u.pathname.indexOf(marker);
    if (idx < 0) return null;
    const key = u.pathname.slice(idx + marker.length);
    if (!key || key.startsWith("put/")) return null;
    return key;
  } catch {
    return null;
  }
}

export const localDriver: StorageDriver = {
  id: "local",

  async deletePublicUrl(publicUrl: string): Promise<void> {
    const key = publicUrlToKey(publicUrl);
    if (!key) return;
    try {
      const abs = pathForKey(key);
      await fs.unlink(abs);
    } catch {
      // File already gone or key somehow unsafe — either way, nothing to
      // clean up. Storage cleanup is best-effort by design.
    }
  },

  async deleteUserPrefix(userId: string): Promise<void> {
    // Strip to a safe slug shape — userIds are cuid-style in practice,
    // but belt-and-braces before we hand a value to rm -rf semantics.
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) return;
    const abs = path.resolve(uploadsRoot(), "u", userId);
    // Guard against ever walking outside the uploads root.
    const root = uploadsRoot();
    if (!abs.startsWith(root + path.sep)) return;
    try {
      await fs.rm(abs, { recursive: true, force: true });
    } catch {
      // Directory didn't exist or partial removal — nothing actionable.
    }
  },

  async sign(input: SignInput): Promise<SignOutput> {
    assertKindMatchesMime(input.kind, input.contentType);
    const maxBytes = maxBytesFor(input.kind);
    if (input.contentLength > maxBytes) {
      throw Object.assign(
        new Error(
          `File is ${Math.round(input.contentLength / (1024 * 1024))} MB; cap is ${Math.round(
            maxBytes / (1024 * 1024),
          )} MB`,
        ),
        { code: "file_too_large" },
      );
    }

    const expiresAtMs = Date.now() + env.UPLOADS_SIGNED_TTL_SECONDS * 1_000;
    const key = buildKey(input.kind, input.userId, input.contentType);
    const token = signToken({
      key,
      contentType: input.contentType,
      maxBytes,
      expiresAtMs,
      userId: input.userId,
    });

    const base = env.UPLOADS_PUBLIC_BASE_URL ?? input.requestOrigin;
    const uploadUrl =
      `${base}${PUT_PATH_PREFIX}/${key}` +
      `?token=${encodeURIComponent(token)}` +
      `&exp=${expiresAtMs}` +
      `&uid=${encodeURIComponent(input.userId)}`;
    const publicUrl = `${base}${PUBLIC_PATH_PREFIX}/${key}`;

    return {
      key,
      uploadUrl,
      publicUrl,
      requiredHeaders: { "Content-Type": input.contentType },
      expiresAt: new Date(expiresAtMs).toISOString(),
      maxBytes,
    };
  },
};

// ---------- Filesystem helpers used by the PUT / GET handlers ----------

function assertSafeKey(key: string): void {
  if (key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    throw HttpError.badRequest("Invalid upload key");
  }
}

function uploadsRoot(): string {
  return path.resolve(env.UPLOADS_DIR);
}

function pathForKey(key: string): string {
  assertSafeKey(key);
  const abs = path.resolve(uploadsRoot(), key);
  // Second line of defence: ensure the resolved path stays inside the root.
  const root = uploadsRoot();
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw HttpError.badRequest("Invalid upload key");
  }
  return abs;
}

export async function writeUpload(
  key: string,
  data: Uint8Array,
  contentType: string,
): Promise<void> {
  // Re-validate against the whitelist. If a client somehow gets a signed
  // URL but sends bytes of the wrong type, we refuse to keep the file.
  if (
    !IMAGE_MIME_WHITELIST.has(contentType) &&
    !VIDEO_MIME_WHITELIST.has(contentType)
  ) {
    throw HttpError.unprocessable("Unsupported content type");
  }
  const abs = pathForKey(key);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
}

export async function readUpload(
  key: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  try {
    const abs = pathForKey(key);
    const data = await fs.readFile(abs);
    const contentType = contentTypeFromExt(path.extname(abs));
    return { data, contentType };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return null;
    throw err;
  }
}

function contentTypeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".heic":
      return "image/heic";
    case ".heif":
      return "image/heif";
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}
