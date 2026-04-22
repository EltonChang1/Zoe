# Zoe — API server

A small, typed HTTP API that backs the mobile app. Everything the app needs
to run a full MVP vertical (auth + feed + ranking lists + posts + comments)
lives here.

## Stack

| Concern         | Tool                                                 |
|-----------------|------------------------------------------------------|
| HTTP framework  | **Hono** on the Node adapter                         |
| Database        | **PostgreSQL 16** (via docker-compose)               |
| ORM             | **Prisma**                                           |
| Validation      | **Zod** + `@hono/zod-validator`                      |
| Auth            | argon2id + opaque session tokens (sha256-hashed)     |
| Search          | Postgres `tsvector` generated columns + GIN indexes  |
| Logging         | pino (pretty in dev)                                 |

Strict TypeScript, ESM, no framework magic.

## Getting started

```bash
cd server
cp .env.example .env
docker compose up -d postgres      # Postgres 16 on :5432
npm install
npx prisma generate
npm run db:setup                   # apply migrations + seed
npm run dev                        # http://localhost:4000
```

After `db:setup` you have:
- 9 curators (password = `password123` for every seeded account)
- 10 catalog objects spanning cafés, perfume, albums, sneakers
- 4 ranking lists with 8 ordered entries
- 10 posts (across all three `detailLayout` templates)
- 3 shorts + 6 comments (one threaded)
- `U000 → everyone` follow graph so Clara is your default "viewer"

### Handy scripts

| Script             | What it does                                         |
|--------------------|------------------------------------------------------|
| `npm run dev`      | `tsx watch src/index.ts`                             |
| `npm run build`    | Type-safe compile to `dist/` (production artefact)   |
| `npm run start`    | Run the compiled `dist/index.js`                     |
| `npm run typecheck`| `tsc --noEmit`                                       |
| `npm run db:migrate` | `prisma migrate deploy`                            |
| `npm run db:seed`  | Re-run the idempotent seed                           |
| `npm run db:setup` | `migrate deploy && seed` — one-shot bootstrap        |
| `npm run db:reset` | Drop + re-apply (destructive; asks first)            |
| `npm run db:studio`| Prisma Studio on http://localhost:5555               |

## Authentication

Session-based. POST `/auth/register` or `/auth/login` returns:

```json
{
  "user":    { "id": "...", "handle": "clara.v", ... },
  "session": { "token": "…", "expiresAt": "2026-05-22T…" }
}
```

Send subsequent requests with `Authorization: Bearer <token>`. Only a
sha256 hash of the token (plus optional pepper) is stored, so a DB
compromise doesn't surface usable tokens.

Middleware:
- `optionalAuth` — sets `c.var.user` if a token is valid, otherwise `null`.
- `requireAuth` — 401 unless the token is valid.

## Endpoint inventory

### Auth
| Method | Path              | Auth     | Notes                            |
|--------|-------------------|----------|----------------------------------|
| POST   | `/auth/register`  | —        | Creates user + session           |
| POST   | `/auth/login`     | —        | Returns user + session token     |
| POST   | `/auth/logout`    | bearer   | Revokes the presented token      |
| GET    | `/auth/me`        | required | Current user + follower counts   |

### Users & graph
| Method | Path                         | Auth     |
|--------|------------------------------|----------|
| GET    | `/users/:handle`             | optional |
| POST   | `/users/:handle/follow`      | required |
| DELETE | `/users/:handle/follow`      | required |

### Catalog
| Method | Path              |
|--------|-------------------|
| GET    | `/objects`        |
| GET    | `/objects/:id`    |
| POST   | `/objects`        |

### Posts
| Method | Path                                    | Auth     |
|--------|-----------------------------------------|----------|
| GET    | `/posts/:id`                            | optional |
| POST   | `/posts`                                | required |
| POST   | `/posts/:id/like`                       | required |
| DELETE | `/posts/:id/like`                       | required |
| POST   | `/posts/:id/save`                       | required |
| DELETE | `/posts/:id/save`                       | required |
| POST   | `/posts/:id/comments`                   | required |
| DELETE | `/posts/:id/comments/:commentId`        | required |

### Ranking lists
| Method | Path                                             | Auth     |
|--------|--------------------------------------------------|----------|
| GET    | `/ranking-lists`                                 | optional |
| GET    | `/ranking-lists/:id`                             | optional |
| POST   | `/ranking-lists`                                 | required |
| POST   | `/ranking-lists/:id/entries`                     | required |
| PATCH  | `/ranking-lists/:id/entries/:entryId/move`       | required |
| DELETE | `/ranking-lists/:id/entries/:entryId`            | required |

### Feed & search
| Method | Path       | Notes                                              |
|--------|------------|----------------------------------------------------|
| GET    | `/feed`    | Editorial masonry. Authed viewers get `likedByMe`. |
| GET    | `/activity`| Following activity (PRD Search tab).                |
| GET    | `/search`  | `?q=…&type=all|objects|posts|users`                 |

### Shorts
| Method | Path       | Auth     |
|--------|------------|----------|
| GET    | `/shorts`  | —        |
| POST   | `/shorts`  | required |

Every response takes the shape `{ ok: true }` or a domain-specific object.
Errors take the shape:

```json
{ "error": { "code": "conflict", "message": "…", "details": {…} } }
```

## Ranking engine

`src/lib/ranking.ts` is the heart of the pairwise flow.

- `insertEntry({ listId, objectId, insertAt, note })` — inside a single
  transaction, shifts everyone at rank `≥ insertAt` down by one and
  writes the new entry as `movement = "new"`.
- `moveEntry({ listId, entryId, toRank })` — shifts the intermediate
  range by ±1 and stamps the moved entry with `movement = up|down`,
  `delta = |from - to|`.
- `removeEntry(listId, entryId)` — deletes and compacts the tail.

Correctness relies on a `UNIQUE ("listId", "rank") DEFERRABLE INITIALLY
DEFERRED` constraint so multi-row shifts don't trip the index mid-statement.

`src/lib/ranking.ts` also exposes `assertContiguous(listId)` — a test /
integrity-check helper that validates ranks are a dense 1..N sequence.

## Full-text search

`objects.search_tsv` and `posts.search_tsv` are `GENERATED ALWAYS AS ... STORED`
columns, backed by GIN indexes. Weights:

| Column (Objects)   | Weight |
|--------------------|--------|
| `title`            | A      |
| `subtitle`, `city` | B      |
| `neighborhood`, `shortDescriptor` | C |
| `tags`             | D      |

| Column (Posts)     | Weight |
|--------------------|--------|
| `headline`         | A      |
| `caption`          | B      |
| `tags`             | C      |

Two quirks worth knowing:

1. `to_tsvector(regconfig, text)` is STABLE in Postgres, which would
   otherwise forbid its use in a GENERATED expression. The migration
   ships two plpgsql IMMUTABLE wrappers (`zoe_english_tsv`,
   `zoe_english_tsv_arr`) — plpgsql functions are never inlined so
   Postgres trusts the declaration.
2. `pg_trgm` is enabled so `objects.title` also has a trigram GIN index,
   giving typo-tolerant fallback matching on the `/search` endpoint.

## Project structure

```
server/
├── prisma/
│   ├── schema.prisma              models + enums, single source
│   ├── migrations/                hand-written initial migration
│   └── seed.ts                    idempotent seed from the Sample Data Pack
├── src/
│   ├── index.ts                   Hono app + route mounting + error handler
│   ├── env.ts                     zod-validated environment
│   ├── db.ts                      Prisma client singleton
│   ├── logger.ts                  pino
│   ├── auth/
│   │   ├── password.ts            argon2id wrapper
│   │   ├── session.ts             opaque token issue/revoke/lookup
│   │   └── middleware.ts          Hono middleware: optionalAuth, requireAuth
│   ├── http/
│   │   ├── errors.ts              HttpError vocabulary + sendError
│   │   └── validate.ts            shared idParam validator
│   ├── lib/
│   │   └── ranking.ts             insert/move/remove/readList
│   └── routes/
│       ├── auth.ts
│       ├── users.ts               profile + follow/unfollow
│       ├── objects.ts             catalog CRUD
│       ├── posts.ts               post detail, create, like, save, comment
│       ├── ranking-lists.ts
│       ├── feed.ts                /feed + /activity
│       ├── search.ts              ts_rank_cd + trigram fallback
│       └── shorts.ts
├── docker-compose.yml             Postgres 16 on :5432
├── .env.example
└── README.md
```

## Next steps (not yet wired)

- Mobile API client (`lib/api/`) for the Expo app to consume this server.
- Signed uploads for hero images / shorts video (S3-compatible store).
- Real notifications fanout when comments land on `P001`-style posts.
- Rate-limiting middleware (per-token and per-IP).
