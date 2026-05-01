# Real-user content creation & operator runbook

Operator-facing guide: run the stack, configure networking and env, exercise **posts**, **rankings**, **shorts**, and **search**, and debug common failures. Paths and bodies match the current Hono server and Expo client unless noted.

**Sources of truth in code**

| Area | References |
|------|--------------|
| API wrappers | `lib/api/endpoints.ts`, `lib/api/types.ts`, `lib/api/queries.ts` |
| API base URL / dev networking | `lib/api/config.ts` — `EXPO_PUBLIC_API_URL`, LAN host rewrite when `.env` uses `localhost` |
| Server boot & mount order | `server/src/index.ts`, `server/src/env.ts` |
| Prisma schema | `server/prisma/schema.prisma` |

---

## 1. Prerequisites

1. **PostgreSQL** reachable from the machine running the API.
2. **`DATABASE_URL`** set for `server/` (see `server/.env.example`).
3. **Migrations + seed** (catalogue + demo accounts — search and “pick object” need rows in `objects` and users):

   ```bash
   cd server
   npm install
   npm run db:migrate
   npm run db:seed
   ```

   Seeded accounts use password **`password123`** (see `server/prisma/seed.ts`).

4. **Start the API** (default **port 4000** from `PORT` / `server/src/env.ts`):

   ```bash
   cd server
   npm run dev
   ```

5. **Expo app** — set **`EXPO_PUBLIC_API_URL`** to a base the device can reach, e.g. `http://<your-LAN-IP>:4000`.  
   If `.env` still says `localhost`, **`lib/api/config.ts`** rewrites the host from the Metro bundle URL in **native dev** so Expo Go on a phone can hit your laptop. **Web** does not rewrite loopback the same way.

6. **Optional production services**
   - **SMTP** (`MAIL_FROM`, `SMTP_*`) for verification and password-reset emails (`server/.env.example`).
   - **S3 / R2** (`UPLOADS_DRIVER=s3` + `S3_*`, `UPLOADS_PUBLIC_BASE_URL`) for HTTPS media and App Store–friendly uploads.
   - **Push** (`PUSH_NOTIFICATIONS_ENABLED`, `EXPO_PUSH_ACCESS_TOKEN`) for Expo push fan-out.
   - **OAuth/music** (`GOOGLE_OAUTH_CLIENT_IDS`, `APPLE_BUNDLE_ID`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `OAUTH_TOKEN_ENCRYPTION_KEY`) for social sign-in and Spotify listening links. See `docs/oauth-music-privacy.md`.

---

## 2. Authentication

All **mutations** (create, like, follow, upload sign, push token register, reports, etc.) require a session unless the route is explicitly public.

### Headers

```http
Authorization: Bearer <session_token>
Content-Type: application/json
```

The raw token is returned once from **`POST /auth/register`** and **`POST /auth/login`** in `session.token`. Only a hash is stored server-side (`SESSION_TOKEN_PEPPER` optional but recommended in production).

### Auth routes (`/auth`)

| Method | Path | Auth | Body / notes |
|--------|------|------|----------------|
| `POST` | `/auth/register` | — | `{ email, password, handle, displayName, bio?, avatarUrl? }` → `201` `{ user, session: { token, expiresAt } }`. New users are **unverified** until they complete email verification; `user.emailVerified` is `false`. |
| `POST` | `/auth/login` | — | `{ email, password }` → `{ user, session }`. |
| `POST` | `/auth/logout` | Optional | Revokes the session if `Authorization` bearer present. |
| `GET` | `/auth/me` | **Required** | `{ user }` includes counts (`followers`, `following`, `posts`) and `emailVerified`. |
| `DELETE` | `/auth/me` | **Required** | Hard-deletes the account and cascades owned data; then best-effort storage prefix cleanup. |
| `POST` | `/auth/verify-email` | — | `{ token }` (from email deep link). → `{ ok, user }`. |
| `POST` | `/auth/resend-verification` | **Required** | Throttled (~60s between sends server-side). |
| `POST` | `/auth/forgot-password` | — | `{ email }` → always `{ ok: true }` (no email enumeration). |
| `POST` | `/auth/reset-password` | — | `{ token, password }` (min 8 chars). Invalidates **all** sessions for that user. |

### In-app flows

- **Sign up / sign in**: `app/(auth)/sign-up.tsx`, `app/(auth)/sign-in.tsx`.
- **Forgot password**: `app/(auth)/forgot-password.tsx` → **`POST /auth/forgot-password`**.
- **Reset password**: `app/reset-password.tsx` — deep link **`zoe://reset-password?token=...`** (scheme from `app.json`).
- **Verify email**: `app/verify-email.tsx` — **`zoe://verify-email?token=...`**. Root navigator allows these routes without bouncing to sign-in.
- **Resend verification**: Profile banner when `emailVerified === false` → **`POST /auth/resend-verification`**.

Without SMTP in development, the server **logs** outgoing mail payloads instead of sending (`server/src/lib/mail.ts`).

---

## 3. API surface (mounted routes)

Base URL = `API_BASE_URL` (no trailing slash required). All JSON unless noted.

| Prefix | Purpose |
|--------|---------|
| `GET /health` | Liveness: `{ ok, now, env }`. |
| `/auth` | Registration, session, me, verify, reset (§2). |
| `/users` | Profiles, follow/unfollow, **block/unblock**, **`GET /users/me/blocks`**. |
| `/objects` | Catalogue + object detail. |
| `/posts` | Post CRUD, likes, saves, comments. |
| `/ranking-lists` | Lists + entries. |
| `/shorts` | Shorts feed, detail, likes, saves, comments. |
| `/feed`, `/activity` | Mounted at **root** (`/`). |
| `/search` | Full-text + trigram search. |
| `/music` | Spotify-backed album/song search and catalog upsert. |
| `/connected-accounts` | Connected apps, including Spotify OAuth connect/disconnect. |
| `/notifications` | Derived inbox (auth). |
| `/uploads` | Presigned upload **`POST /uploads/sign`** (auth); local driver also serves PUT/GET. |
| `/push-tokens` | Register / unregister Expo device token (auth). |
| `/reports` | Submit user report (auth, rate-limited). |

---

## 4. Media uploads (`/uploads`)

1. **`POST /uploads/sign`** (authenticated) with JSON:

   ```json
   {
     "kind": "image" | "video",
     "contentType": "<mime>",
     "contentLength": <bytes>,
     "filename": "optional"
   }
   ```

2. Response includes **`uploadUrl`**, **`publicUrl`**, expiry, max bytes, and optional **`requiredHeaders`** (S3 presign may require `Content-Type`).

3. Client **`PUT`**s bytes to `uploadUrl` (direct to S3 when `UPLOADS_DRIVER=s3`), then uses **`publicUrl`** on create payloads (`heroImage`, `videoUrl`, `coverImage`, etc.).

**Drivers**

- **`local`** (default): API may expose PUT/GET under `/uploads/...` for dev; good for simulators on the same host.
- **`s3`**: Presigned PUT to R2/S3/B2; **`UPLOADS_PUBLIC_BASE_URL`** must point at HTTPS CDN/custom domain for production iOS (ATS).

See `server/.env.example` and `server/src/storage/s3.ts`.

---

## 5. Push notifications (`/push-tokens`)

| Method | Path | Body | Notes |
|--------|------|------|--------|
| `POST` | `/push-tokens` | `{ token, platform?, appVersion? }` | `token` must match `ExponentPushToken[...]`. Upserts by token. |
| `DELETE` | `/push-tokens` | `{ token }` | Removes token for current user. |

Client: `lib/push/register.ts` (Expo) registers after sign-in; **`PUSH_NOTIFICATIONS_ENABLED`** on the server gates fan-out to Expo’s push API. Likes / comments / replies / follows trigger pushes when enabled (`server/src/lib/push.ts`, wired from posts/users routes).

---

## 6. Moderation: blocks & reports

### Blocks (`/users`)

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/users/:handle/block` | Required — creates block, removes mutual follows. |
| `DELETE` | `/users/:handle/block` | Required |
| `GET` | `/users/me/blocks` | Required — list blocked users (mounted **before** `/:handle` in `index.ts`). |

Blocked relationships are **symmetric** in product behavior: feeds, search, comments, notifications, and profiles hide the other party (`server/src/lib/moderation.ts`).

### Reports (`/reports`)

| Method | Path | Body |
|--------|------|------|
| `POST` | `/reports` | `{ subjectType, subjectId, reason, details? }` |

- **`subjectType`**: `user` \| `post` \| `short` \| `comment` \| `short_comment`
- **`reason`**: `spam` \| `harassment` \| `hate` \| `sexual` \| `violence` \| `self_harm` \| `misinformation` \| `ip_violation` \| `other`

Rate limit: **30 reports / 24h** per reporter; duplicate open reports on the same subject are deduped. Client: `components/moderation/actions.ts`, `useReport`, `useBlockUser` / `useUnblockUser` in `lib/api/queries.ts`.

---

## 7. Notifications (in-app inbox)

**`GET /notifications`** (auth) — query: `limit`, optional `before` (ISO datetime).

Inbox rows are **derived** from likes, follows, and comments (no separate `notifications` table). Blocked users are filtered out. Client: `app/notifications.tsx`, `useNotificationsQuery`.

---

## 8. Creating a ranking list + entries (“actual rankings”)

### In-app

- **Rankings tab** → personal hub → add flow: `app/rank/add.tsx` — category → object search → pairwise compare → caption → confirm.
- **Create empty list**: flows using **`POST /ranking-lists`** with `{ title, category, description?, visibility?, coverImage? }` (`useCreateRankingList`).

### Key APIs

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/ranking-lists?owner=<handle>&...` | **Own hub** (`owner` = signed-in user): returns **public**, **followers**, and **private** lists. **Someone else’s hub** or community listing: **public only** (followers-only discovery for others is deferred). |
| `POST` | `/ranking-lists` | Create list (auth). |
| `POST` | `/ranking-lists/:id/entries` | `{ objectId, insertAt, note? }` — **`insertAt` is 1-indexed** (dense rank). |

### `coverImage`

Use a **`publicUrl`** from **`POST /uploads/sign`** if the list needs a custom cover.

---

## 9. Creating a feed post

### In-app

- **Home or Profile** → **`/compose/post`** (`app/compose/post.tsx`): object search (`GET /search?type=objects`, UI debounces ≥2 chars) → compose → publish.

### Deep link

**`/compose/post?objectId=<id>`** — the screen **hydrates** the picked object via **`useObjectQuery`** so Publish is enabled (same pattern as rank add).

### `POST /posts` (auth)

Body (Zod):

```json
{
  "objectId": "<cuid>",
  "postType": "photo" | "carousel" | "short_video",
  "detailLayout": "discovery_photo" | "album_review" | "product_hero",
  "headline": "…",
  "caption": "…",
  "tags": ["…"],
  "rankingListId": "<optional cuid>",
  "locationLabel": "…",
  "aspect": "tall" | "square" | "wide"
}
```

**Important:** The `Post` row references **`objectId`** only. Card/detail hero imagery comes from the linked **`Object`** in mappers — not a separate image column on `Post`. **`rankingListId`** must be **owned by the caller** (server enforces).

---

## 10. Creating a Short

### In-app

- **`/compose/short`** (`app/compose/short.tsx`) — pick object, hook line, caption, upload hero (and optional video) via signed URLs, then publish.

### `POST /shorts` (auth)

```json
{
  "objectId": "<cuid>",
  "hookLine": "…",
  "caption": "…",
  "audioLabel": "optional",
  "heroImage": "https://…",
  "videoUrl": "https://optional",
  "rankingListTitle": "optional",
  "rankingRank": 1
}
```

(`rankingRank` is optional; when present it must be a **positive** integer per server Zod.)

`heroImage` / `videoUrl` must be valid URLs (typically your CDN **`publicUrl`** after upload). On delete, the server may clean storage for shorts the user owns (see shorts route + storage driver).

---

## 11. Search

**`GET /search`** — query:

| Param | Notes |
|-------|--------|
| `q` | **1–80** characters (`z.string().min(1)`). |
| `type` | `all` (default) \| `objects` \| `posts` \| `users` |
| `limit` | 1–25, default 10 |

Uses Postgres **`tsvector`** + **`plainto_tsquery`**, with trigram fallback on objects. **Blocked users** are excluded from post/user result sets when the viewer is authenticated.

**Client:** Search tab and compose use hooks with **`minLength: 2`** by default (`useObjectSearchQuery`, `useSearchAllQuery`) — shorter queries stay idle.

---

## 12. Feed & activity

| Method | Path | Auth | Query |
|--------|------|------|--------|
| `GET` | `/feed` | Optional | `limit` (1–40), `cursor`, optional **`author`** (handle), **`object`** (object id). |
| `GET` | `/activity` | Optional | Following-activity for Search tab; `limit`, `cursor`. |

Both respect **block** filtering for the viewer.

---

## 13. Objects & profiles (context for creation flows)

- **`GET /objects/:id`** — object detail (catalogue).
- **`GET /users/:handle`** — public profile (optional auth for `viewer` flags). **404** if either side has blocked the other (no existence leak).
- **`POST /users/:handle/follow`**, **`DELETE`** — follow / unfollow (auth).

---

## 14. Troubleshooting & failure modes

| Symptom | Likely cause |
|---------|----------------|
| Network / “failed to fetch” on device | Wrong **`EXPO_PUBLIC_API_URL`**, API not bound to `0.0.0.0`, firewall, or phone not on same LAN. Check `GET /health` from the device browser or curl. |
| Search / compose always empty | **`objects`** (or posts) table empty — run **seed** or insert catalogue rows. |
| `401` on mutations | Missing/expired **`Authorization: Bearer`**. |
| `403` on `POST /posts` with `rankingListId` | List not owned by you. |
| Publish disabled on compose with `?objectId=` | Should not happen if API returns object — verify **`GET /objects/:id`** and token/network. |
| Verification email never arrives | **`MAIL_FROM`** / **`SMTP_HOST`** unset in production; in dev, read **server logs** for the console mail dump. |
| Push never arrives | **`PUSH_NOTIFICATIONS_ENABLED=false`**, invalid Expo token, or physical device / EAS build requirements not met. |
| Upload fails on iOS release | Use **`UPLOADS_DRIVER=s3`** + **HTTPS** `UPLOADS_PUBLIC_BASE_URL` (ATS). |
| `429` on reports | Reporter exceeded **30 reports / 24h**. |
| `422` on `/push-tokens` | Token string is not a valid **Expo** push token format. |

---

## 15. Quick verification checklist

1. **`GET /health`** → `200`, `ok: true`.
2. **`POST /auth/login`** with seeded email → `session.token`.
3. **`GET /auth/me`** with `Authorization: Bearer <token>` → `user` + `emailVerified`.
4. **`GET /search?q=matcha&type=objects`** (or any seeded substring) → non-empty when DB seeded.
5. **`POST /uploads/sign`** with image kind → receive `uploadUrl` / `publicUrl`; PUT succeeds.
6. **`POST /posts`** with valid `objectId` → `201`; new id appears on **`GET /feed`**.
7. **`POST /ranking-lists`** then **`POST /ranking-lists/:id/entries`** → entry appears on **`GET /ranking-lists/:id`**.
8. **`POST /shorts`** (or in-app compose) → short appears on **`GET /shorts`**.
9. Optional: **`POST /auth/forgot-password`**, **`POST /auth/verify-email`** with token from logs (dev) or inbox (prod).

---

## 16. Related client entry points (quick map)

| Flow | Route file(s) |
|------|----------------|
| Post composer | `app/compose/post.tsx` |
| Short composer | `app/compose/short.tsx` |
| Ranking add | `app/rank/add.tsx` |
| Rankings hub | `app/(tabs)/rankings.tsx` |
| Search | `app/(tabs)/search.tsx` |
| Shorts feed | `app/(tabs)/shorts.tsx` |
| Notifications | `app/notifications.tsx` |
| Blocked users settings | `app/settings/blocked.tsx` |
| Verify / reset (deep links) | `app/verify-email.tsx`, `app/reset-password.tsx` |

This document is regenerated from the **user creation flows** plan outline plus the **current** server and client; re-run migrations and cross-check `lib/api/endpoints.ts` after large API refactors.
