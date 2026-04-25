# Zoe — Progress Summary

This document captures what has been built so far and what remains for a cohesive product. It reflects the current codebase and recent feature work (backend + Expo client).

---

## What we have done

### Backend (Node / Hono / PostgreSQL / Prisma)

- **API core**: Session-based auth (Argon2, SHA256 session tokens), Zod validation, global error handling, permissive `idParam` for route IDs.
- **Content**: Posts CRUD patterns, objects catalogue, ranking lists with transactional insert/move/remove, full-text search (tsvector + GIN, `pg_trgm`, immutable SQL wrappers for generated columns).
- **Social**: Follow / unfollow, likes and saves on posts, comments with parent replies and delete (author or post owner).
- **Feeds**: `GET /feed` with optional `author` and `object` filters; `GET /activity` for following activity.
- **Discovery**: `GET /search` across objects, posts, and users; `GET /objects/:id` with counts.
- **Users**: `GET /users/:handle` profile with stats and viewer flags (follows me / I follow / is self); follower/following counts corrected vs Prisma relation naming.
- **Notifications**: `GET /notifications` (auth) — inbox derived from existing tables (likes, follows, top-level comments, replies) with `before` + `limit` pagination; no separate notifications table yet.
- **Ops**: Docker Compose, Pino logging, seed data, `tsconfig.build.json` for server build.

### Mobile client (Expo / Expo Router / NativeWind / TanStack Query)

- **API layer**: Typed endpoints, `request` wrapper, `ApiHttpError`, mappers that hydrate local registries (`registerUser`, `registerObject`) for UI compatibility.
- **Auth**: SecureStore session, `AuthProvider`, auth gates on protected flows.
- **Home**: Live infinite feed, pull-to-refresh, waterfall layout, compose entry on the top bar.
- **Post detail**: Live post fetch, like/save mutations, share, author navigation, object navigation (`ProductHeroView` “View details”), **threaded discussion** with reply, delete, tappable comment authors, and comment author registration for avatars.
- **Rankings**: Community and owner lists, list detail screen, add-to-ranking flow with search, list creation, insert with 409 handling.
- **Search**: Debounced cross-type search; following activity from live `/activity`.
- **Profiles**: Self-profile and `/user/[handle]` with stats, follow/unfollow (optimistic), posts and lists tabs.
- **Object detail**: `/object/[id]` with hero, stats, compose CTA, tabs for posts-on-object and lists containing the object; wired from search, ranking entries, and post detail.
- **Compose**: Modal create-post flow with object pick + editorial fields; entry points from Home and profile.
- **Notifications**: Inbox screen, `useNotifications` + last-seen in SecureStore, unread badge on Home bell.
- **Shorts**: Tab wired to live `GET /shorts` (paginated). Dark glass UI preserved — top-left rank badge, tappable curator → profile, tappable object chip → object detail, infinite scroll with prefetch. Loading / error / empty states all dark-themed.
- **Shorts — engagement**: First-class like / save / comment on a short. New Prisma relations (`ShortLike`, `ShortSave`, `ShortComment`) replace the old denormalised `Int` counters; the wire format now exposes `stats.{likes,saves,comments}` and a `viewer.{likedByMe,savedByMe}` block that mirrors the `/posts/:id` detail shape. `POST /shorts/:id/like`, `DELETE /shorts/:id/like`, matching `/save`, and `/comments` (list + create + delete) are live with optimistic client patches across the single-short and infinite-feed caches; rollback on error, server count wins on success. A dedicated `useShortComments` infinite query plus a keyboard-aware bottom-sheet modal on the Shorts tab (reply, delete, optimistic append).
- **Comments (optimistic)**: New top-level comments and replies append instantly to the post-comments cache and the comments counter on the post detail increments without waiting for the round-trip; a server refetch reconciles on settle and rolls back on error.
- **Post comments pager**: `/posts/:id` no longer returns comments inline — threads are paginated via `GET /posts/:id/comments` with cursor (matching `/shorts/:id/comments`). Client consumes a `usePostComments` infinite query; the `DiscussionSection` renders a pill "Load more" affordance and shows the authoritative `stats.comments` in the header chip so 3-loaded-of-500 reads truthfully. Optimistic create/delete now write to the paginated cache and nudge `post.stats.comments` in the same pass.
- **Deep-link**: `/rank/add?objectId=…` pre-selects the object and jumps straight to list-pick → compare → caption (no search step when the subject is already known, e.g. from the Object detail "Add to a ranking" CTA).

### Design / product docs

- PRD and Design_guide alignment work (visual direction, profile screens, post templates) as referenced in earlier iterations.

---

## What still needs to be done

### High impact (user-visible gaps)

1. **Shorts — video playback** — Engagement is now real per-user; the remaining gap is swapping the hero image for `videoUrl` once the uploader (and a reliable mobile player) is in place. The schema already carries `videoUrl`, so this is client-only work.
2. **Compose deep-link** — Optional polish so compose always lands on the right step when opened with `?objectId=` (object already pre-fills; next step is skipping the picker when it does).

### Notifications / inbox (next iterations)

3. **Server-side read state** — Today unread uses client-only “last seen” per user. For multi-device or push, consider persisted read cursors or a `notifications` table.
4. **More event types** — e.g. “someone ranked your object / added it to a list” once those events are defined and queryable the same way as likes/follows/comments.
5. **Grouping** — “Alice and 3 others liked your post” style aggregation when volume justifies it.

### Product / polish

6. **Push notifications** — Not started; depends on device tokens and a delivery path (FCM/APNs).
7. **Moderation / reporting** — Report user/post, block list, admin tools (if in scope).
8. **Analytics** — Real “saves” on ranking lists (currently placeholder where the API had no true social save count).
9. **CI / deployment** — Hardening: env docs, migrations in deploy pipeline, optional E2E tests for auth + feed + post + notifications smoke paths.

### Nice-to-have engineering

10. **Health check path** — Some environments expect `/healthz`; server exposes `/health` (align docs or add alias if needed).
11. **Dependency / security hygiene** — Periodic `npm audit` / Expo dependency upgrades as the stack ages.

---

## How to use this file

- Treat **“What we have done”** as the baseline shipped in-repo.
- Use **“What still needs to be done”** for prioritization; order is suggestive, not a committed roadmap.
- Update this file when major verticals land (e.g. Shorts wired, push added) so the team shares one source of truth.

_Last updated: April 2026._
