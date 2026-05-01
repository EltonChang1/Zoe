import "dotenv/config";
import { z } from "zod";

/**
 * Env parsing with a single schema so the rest of the app never reads
 * `process.env` directly. A misconfigured server fails fast at boot.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  SESSION_TOKEN_PEPPER: z.string().default(""),

  // Uploads. The storage driver is pluggable so we can swap the local-disk
  // implementation for S3 / R2 without touching routes or the client.
  UPLOADS_DRIVER: z.enum(["local", "s3"]).default("local"),
  UPLOADS_DIR: z.string().default(".uploads"),
  // Optional override for the public-facing CDN / API base. When unset the
  // local driver builds URLs from the request origin (covers LAN / Ngrok /
  // Expo Go without extra config).
  UPLOADS_PUBLIC_BASE_URL: z.string().url().optional(),
  // HMAC secret for signing PUT URLs in the local driver. Generate per-env
  // in production — a weak default is fine for `development` only.
  UPLOADS_SIGNING_SECRET: z.string().default("dev-signing-secret"),
  // Caps (bytes). Defaults sized for a phone-first feed.
  UPLOADS_IMAGE_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(12 * 1024 * 1024),
  UPLOADS_VIDEO_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(80 * 1024 * 1024),
  UPLOADS_SIGNED_TTL_SECONDS: z.coerce.number().int().positive().default(600),

  // S3 / R2 settings. Only consulted when `UPLOADS_DRIVER=s3`.
  // - `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`
  //   are the standard credentials. A superset refine below makes them
  //   mandatory once the driver flips to `s3`.
  // - `S3_ENDPOINT` is optional and targets S3-compatible backends
  //   (Cloudflare R2, Backblaze B2, MinIO). Leave unset for AWS S3.
  // - `S3_FORCE_PATH_STYLE` flips the bucket from virtual-host style
  //   (`<bucket>.s3.<region>…`) to path style (`<endpoint>/<bucket>/…`),
  //   which R2 / MinIO usually prefer.
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("false"),

  // Push notifications (Expo). Keep off by default for local development.
  PUSH_NOTIFICATIONS_ENABLED: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("false"),
  EXPO_PUSH_ACCESS_TOKEN: z.string().optional(),

  // Transactional email (verification + password reset). Optional in dev.
  MAIL_FROM: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default("false"),
  /** Deep link host for in-app routes, e.g. `zoe://` */
  APP_DEEPLINK_ORIGIN: z.string().default("zoe://"),

  // Google Places. Optional in local development; routes degrade gracefully
  // when unset so the rest of the API can still boot and be tested.
  GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),

  // Account OAuth. Google accepts multiple audiences because native iOS,
  // Android, Expo/web, and backend client IDs can differ.
  GOOGLE_OAUTH_CLIENT_IDS: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  APPLE_BUNDLE_ID: z.string().optional(),

  // Spotify. Client credentials power catalogue search; authorization code
  // + PKCE powers user account connection.
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  OAUTH_STATE_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  OAUTH_TOKEN_ENCRYPTION_KEY: z.string().optional(),
});

const parsed = schema
  .superRefine((cfg, ctx) => {
    // Enforce S3 cred completeness lazily — locals shouldn't have to set
    // any AWS vars, but once the driver flips to `s3` we want a clear,
    // boot-time error for anything missing.
    if (cfg.UPLOADS_DRIVER === "s3") {
      const missing: string[] = [];
      if (!cfg.S3_REGION) missing.push("S3_REGION");
      if (!cfg.S3_BUCKET) missing.push("S3_BUCKET");
      if (!cfg.S3_ACCESS_KEY_ID) missing.push("S3_ACCESS_KEY_ID");
      if (!cfg.S3_SECRET_ACCESS_KEY) missing.push("S3_SECRET_ACCESS_KEY");
      if (missing.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing required S3 settings: ${missing.join(", ")}`,
        });
      }
      // Public base URL is mandatory for S3 — we need to hand clients a
      // readable URL after upload, and S3 virtual-hosted URLs are awkward
      // for anything that wants HTTPS + a custom domain (iOS ATS, CDN).
      if (!cfg.UPLOADS_PUBLIC_BASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "UPLOADS_PUBLIC_BASE_URL must be set when UPLOADS_DRIVER=s3 — " +
            "point it at your CloudFront / R2 custom domain.",
        });
      }
    }
    if (cfg.NODE_ENV === "production") {
      if (!cfg.OAUTH_TOKEN_ENCRYPTION_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "OAUTH_TOKEN_ENCRYPTION_KEY is required in production",
        });
      }
    }
  })
  .safeParse(process.env);
if (!parsed.success) {
  const flat = parsed.error.flatten();
  console.error("Invalid environment:");
  if (flat.formErrors.length > 0) {
    for (const msg of flat.formErrors) console.error(`  - ${msg}`);
  }
  for (const [field, msgs] of Object.entries(flat.fieldErrors)) {
    console.error(`  - ${field}: ${(msgs ?? []).join("; ")}`);
  }
  process.exit(1);
}

export const env = parsed.data;
