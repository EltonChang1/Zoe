import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../env.js";
import {
  assertKindMatchesMime,
  extForMime,
  type SignInput,
  type SignOutput,
  type StorageDriver,
  type UploadKind,
} from "./driver.js";

/**
 * S3 / R2 / B2 / MinIO storage driver.
 *
 * Clients PUT bytes **directly** to the presigned URL — neither the
 * upload body nor the served asset ever touches this server. That
 * decouples the API process from the hot path and is the only way this
 * scales horizontally.
 *
 * Public URLs are always built from `UPLOADS_PUBLIC_BASE_URL` (required
 * when `UPLOADS_DRIVER=s3`, enforced in env.ts). Point it at:
 *   - CloudFront distribution in front of the bucket (recommended), or
 *   - Cloudflare R2 custom domain, or
 *   - the bucket's virtual-hosted endpoint if you serve public buckets
 *     directly (not recommended — CDN gives you HTTPS + caching).
 *
 * Bucket must have CORS configured so the Expo / web client can PUT:
 *
 *     [{ "AllowedMethods": ["PUT"],
 *        "AllowedOrigins": ["*"],
 *        "AllowedHeaders": ["*"],
 *        "ExposeHeaders":  ["ETag"] }]
 */

const PUT_EXPIRES_SECONDS_DEFAULT = 600;

function maxBytesFor(kind: UploadKind): number {
  return kind === "image"
    ? env.UPLOADS_IMAGE_MAX_BYTES
    : env.UPLOADS_VIDEO_MAX_BYTES;
}

function buildKey(kind: UploadKind, userId: string, mime: string): string {
  // Same layout as the local driver so `deleteUserPrefix` is symmetric.
  return `u/${userId}/${kind}/${randomUUID()}.${extForMime(mime)}`;
}

function makeClient(): S3Client {
  // We assert these exist at env-parse time (see env.ts superRefine).
  // `!` here just tells TS what we already enforce at boot.
  return new S3Client({
    region: env.S3_REGION!,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

function publicUrlFromKey(key: string): string {
  const base = env.UPLOADS_PUBLIC_BASE_URL!.replace(/\/+$/, "");
  return `${base}/${key}`;
}

function keyFromPublicUrl(publicUrl: string): string | null {
  const base = env.UPLOADS_PUBLIC_BASE_URL;
  if (!base) return null;
  try {
    const baseUrl = new URL(base);
    const u = new URL(publicUrl);
    if (u.origin !== baseUrl.origin) return null;
    // Strip any prefix path the base URL has (e.g. `/media`).
    const basePath = baseUrl.pathname.replace(/\/+$/, "");
    if (!u.pathname.startsWith(basePath + "/")) return null;
    const key = u.pathname.slice(basePath.length + 1);
    return key || null;
  } catch {
    return null;
  }
}

// Lazy-init the client so local-driver deployments don't pay the SDK
// constructor cost and never touch AWS code paths at all.
let _client: S3Client | null = null;
function client(): S3Client {
  if (!_client) _client = makeClient();
  return _client;
}

export const s3Driver: StorageDriver = {
  id: "s3",

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

    const key = buildKey(input.kind, input.userId, input.contentType);
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: key,
      ContentType: input.contentType,
      // Signing Content-Length makes the signature bind to a specific
      // byte count — a client that tries to upload more bytes than it
      // declared gets a 403 from S3 rather than silently overflowing
      // whatever size cap we enforced at sign-time.
      ContentLength: input.contentLength,
      // We don't set `ACL: "public-read"` — access is granted through the
      // CDN / bucket policy, not per-object ACLs. Modern buckets default
      // to ownership-enforced and reject ACL writes anyway.
    });

    const ttl = env.UPLOADS_SIGNED_TTL_SECONDS || PUT_EXPIRES_SECONDS_DEFAULT;
    // The SDK bakes ContentType and ContentLength from the command
    // inputs into the signature automatically, so anything the client
    // PUTs with a different size or MIME type is rejected by S3.
    const uploadUrl = await getSignedUrl(client(), command, { expiresIn: ttl });
    const expiresAtMs = Date.now() + ttl * 1000;

    return {
      key,
      uploadUrl,
      publicUrl: publicUrlFromKey(key),
      // Content-Length is a forbidden header on web XHR and is
      // auto-computed by React Native's XHR; don't ask the client to
      // set it. Content-Type must be sent verbatim for the signature
      // to validate.
      requiredHeaders: {
        "Content-Type": input.contentType,
      },
      expiresAt: new Date(expiresAtMs).toISOString(),
      maxBytes,
    };
  },

  async deletePublicUrl(publicUrl: string): Promise<void> {
    const key = keyFromPublicUrl(publicUrl);
    if (!key) return;
    try {
      await client().send(
        new DeleteObjectCommand({ Bucket: env.S3_BUCKET!, Key: key }),
      );
    } catch {
      // Best-effort — same contract as the local driver.
    }
  },

  async deleteUserPrefix(userId: string): Promise<void> {
    // Guard: userIds are cuid-style, but refuse anything that could let a
    // caller walk out of the per-user prefix. Same shape as local driver.
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) return;
    const prefix = `u/${userId}/`;
    const c = client();
    try {
      let continuationToken: string | undefined;
      // ListObjectsV2 returns up to 1000 keys per page — loop until the
      // prefix is empty. DeleteObjects accepts up to 1000 per call which
      // lines up nicely.
      do {
        const list = await c.send(
          new ListObjectsV2Command({
            Bucket: env.S3_BUCKET!,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );
        const objects = (list.Contents ?? [])
          .map((o) => o.Key)
          .filter((k): k is string => typeof k === "string");
        if (objects.length > 0) {
          await c.send(
            new DeleteObjectsCommand({
              Bucket: env.S3_BUCKET!,
              Delete: {
                Objects: objects.map((Key) => ({ Key })),
                Quiet: true,
              },
            }),
          );
        }
        continuationToken = list.IsTruncated
          ? list.NextContinuationToken
          : undefined;
      } while (continuationToken);
    } catch {
      // Swallow — compliance contract is the DB delete, not the storage
      // sweep. Orphans can be reaped by an S3 lifecycle rule.
    }
  },
};
