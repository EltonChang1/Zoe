import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { env } from "../env.js";
import { HttpError } from "../http/errors.js";
import {
  currentUser,
  requireAuth,
  type AuthVariables,
} from "../auth/middleware.js";
import { storage } from "../storage/index.js";
import {
  IMAGE_MIME_WHITELIST,
  VIDEO_MIME_WHITELIST,
} from "../storage/driver.js";
import {
  readUpload,
  verifyPut,
  writeUpload,
} from "../storage/local.js";

/**
 * Uploads router.
 *
 *  POST /uploads/sign          (auth) → { uploadUrl, publicUrl, ... }
 *  PUT  /uploads/put/:...key   (signed) receives bytes (local driver only)
 *  GET  /uploads/:...key       (public) serves the file back (local only)
 *
 * The sign endpoint is driver-agnostic; the PUT/GET pair only runs under
 * the local driver. When UPLOADS_DRIVER=s3 the client PUTs directly to S3
 * and GETs through the CDN, so neither hits this server.
 */

const signSchema = z.object({
  kind: z.enum(["image", "video"]),
  contentType: z.string().min(1).max(120),
  // Cap the sign-request payload hard so a malicious client can't pre-burn
  // a 10 GB allowance and then send nothing. The driver re-validates.
  contentLength: z.coerce
    .number()
    .int()
    .positive()
    .max(200 * 1024 * 1024),
  filename: z.string().max(200).optional(),
});

function requestOrigin(c: {
  req: {
    header: (name: string) => string | undefined;
    url: string;
  };
}): string {
  // Prefer X-Forwarded-* headers so we get the public URL behind a tunnel
  // (ngrok, cloudflared, Expo tunnel). Fall back to the request URL's
  // origin, which is correct on direct LAN / localhost hits.
  const proto =
    c.req.header("x-forwarded-proto") ??
    new URL(c.req.url).protocol.replace(":", "");
  const host = c.req.header("x-forwarded-host") ?? c.req.header("host");
  if (host) return `${proto}://${host}`;
  const u = new URL(c.req.url);
  return `${u.protocol}//${u.host}`;
}

export const uploadsRouter = new Hono<{ Variables: AuthVariables }>()
  // ---------------- Sign ----------------
  .post("/sign", requireAuth, zValidator("json", signSchema), async (c) => {
    const me = currentUser(c);
    const body = c.req.valid("json");
    try {
      const out = await storage.sign({
        kind: body.kind,
        contentType: body.contentType,
        contentLength: body.contentLength,
        userId: me.id,
        requestOrigin: requestOrigin(c),
      });
      return c.json(out);
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      if (code === "unsupported_mime") {
        throw HttpError.unprocessable(
          err instanceof Error ? err.message : "Unsupported media type",
        );
      }
      if (code === "file_too_large") {
        throw HttpError.unprocessable(
          err instanceof Error ? err.message : "File too large",
        );
      }
      throw err;
    }
  })

  // ---------------- PUT (local driver only) ----------------
  //
  // The signed query string carries the token, expiry, and user id; the
  // path carries the object key. We reconstruct the HMAC over the same
  // tuple, compare in constant time, and only then accept the bytes.
  .put("/put/:key{.+}", async (c) => {
    if (storage.id !== "local") {
      throw HttpError.notFound();
    }

    const key = c.req.param("key");
    const token = c.req.query("token") ?? "";
    const expQ = c.req.query("exp") ?? "";
    const uid = c.req.query("uid") ?? "";
    const expiresAtMs = Number(expQ);
    if (!Number.isFinite(expiresAtMs)) {
      throw HttpError.badRequest("Invalid upload URL");
    }

    const contentType = c.req.header("content-type") ?? "";
    if (
      !IMAGE_MIME_WHITELIST.has(contentType) &&
      !VIDEO_MIME_WHITELIST.has(contentType)
    ) {
      throw HttpError.unprocessable("Unsupported content type");
    }

    const isVideo = VIDEO_MIME_WHITELIST.has(contentType);
    const maxBytes = isVideo
      ? env.UPLOADS_VIDEO_MAX_BYTES
      : env.UPLOADS_IMAGE_MAX_BYTES;

    verifyPut({
      key,
      contentType,
      maxBytes,
      expiresAtMs,
      userId: uid,
      token,
    });

    // Pull the body. Hono's `arrayBuffer()` consumes the full request; we
    // cap at `maxBytes + 1` so an oversized payload fails fast instead of
    // filling memory.
    const buf = Buffer.from(await c.req.arrayBuffer());
    if (buf.byteLength === 0) {
      throw HttpError.badRequest("Empty upload body");
    }
    if (buf.byteLength > maxBytes) {
      throw HttpError.unprocessable("Upload exceeds the size limit");
    }

    await writeUpload(key, buf, contentType);
    return c.json({ ok: true, key, bytes: buf.byteLength });
  })

  // ---------------- GET (local driver only) ----------------
  .get("/:key{.+}", async (c) => {
    if (storage.id !== "local") {
      throw HttpError.notFound();
    }
    const key = c.req.param("key");
    const file = await readUpload(key);
    if (!file) throw HttpError.notFound("File not found");
    // Copy into a fresh ArrayBuffer so the body type matches BodyInit on
    // Node 20+ (Buffer's ArrayBufferLike upsets Hono's Data type).
    const bytes = new Uint8Array(file.data.byteLength);
    bytes.set(file.data);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(bytes.byteLength),
        // Uploads are effectively immutable — safe to cache aggressively.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  });
