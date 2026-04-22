import { registerObject } from "@/data/objects";
import type {
  Post,
  RankingContext,
  RankingList,
  User,
} from "@/data/types";
import { registerUser } from "@/data/users";

import type {
  ApiObjectFull,
  ApiPost,
  ApiRankingEntry,
  ApiRankingListDetail,
  ApiRankingListSummary,
  ApiUser,
} from "./types";

/**
 * API → UI shape mappers.
 *
 * The mobile components are already fluent in the `data/types.ts` shapes
 * (mock data). These mappers keep that contract stable while the server
 * speaks a richer, nested wire format.
 */

export function mapUser(api: ApiUser): User {
  return {
    id: api.id,
    handle: api.handle,
    displayName: api.displayName,
    avatar:
      api.avatarUrl ??
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    bio: api.bio ?? "",
    followers: api.followers ?? 0,
    following: api.following ?? 0,
    postsCount: api.posts ?? 0,
  };
}

export function mapPost(api: ApiPost): Post {
  // Side-effect: keep the mock-shaped runtime caches in sync so the cards
  // (which look up author + object by id) don't fall back to placeholders.
  registerUser(mapUser(api.author));
  registerObject({
    id: api.object.id,
    type: api.object.type,
    title: api.object.title,
    subtitle: api.object.subtitle ?? undefined,
    city: api.object.city ?? undefined,
    neighborhood: api.object.neighborhood ?? undefined,
    heroImage: api.object.heroImage ?? "",
  });

  const ranking: RankingContext = api.rankingList
    ? {
        listTitle: api.rankingList.title,
        rank: api.rankingRank ?? 0,
        movement: api.rankingMovement ?? "stable",
        delta: api.rankingDelta ?? undefined,
      }
    : {
        listTitle: api.object.title,
        rank: api.rankingRank ?? 0,
        movement: api.rankingMovement ?? "stable",
        delta: api.rankingDelta ?? undefined,
      };

  return {
    id: api.id,
    authorId: api.authorId,
    objectId: api.objectId,
    postType: api.postType,
    detailLayout: api.detailLayout,
    headline: api.headline,
    caption: api.caption,
    tags: api.tags,
    ranking,
    likes: api.stats.likes,
    comments: api.stats.comments,
    saves: api.stats.saves,
    publishedAt: api.publishedAt,
    locationLabel: api.locationLabel ?? undefined,
    aspect: (api.aspect ?? "tall") as Post["aspect"],
    featured: api.featured,
  };
}

function registerObjectFromApi(api: ApiObjectFull) {
  registerObject({
    id: api.id,
    type: api.type,
    title: api.title,
    subtitle: api.subtitle ?? undefined,
    city: api.city ?? undefined,
    neighborhood: api.neighborhood ?? undefined,
    tags: api.tags ?? [],
    shortDescriptor: api.shortDescriptor ?? undefined,
    heroImage: api.heroImage ?? "",
    metadata: api.metadata ?? undefined,
  });
}

/**
 * API → UI `RankingList`. Derived `saves` is not returned by the v1 endpoint
 * (that's a future analytics counter), so we default to 0 until the server
 * exposes it.
 */
export function mapRankingListDetail(api: ApiRankingListDetail): RankingList {
  registerUser(mapUser(api.owner));
  api.entries.forEach((e) => registerObjectFromApi(e.object));

  return {
    id: api.id,
    ownerId: api.ownerId,
    title: api.title,
    category: api.category,
    description: api.description ?? undefined,
    visibility: visibilityToUi(api.visibility),
    entries: api.entries.map(mapRankingEntry),
    saves: 0,
    coverImage: api.coverImage ?? undefined,
  };
}

/**
 * Summary list (no entries). Used by the Community / Personal rankings hub.
 * We synthesise an empty `entries` array so the existing `RankingListCard`
 * layout keeps working without branching.
 */
export function mapRankingListSummary(api: ApiRankingListSummary): RankingList {
  registerUser(mapUser(api.owner));
  return {
    id: api.id,
    ownerId: api.ownerId,
    title: api.title,
    category: api.category,
    description: api.description ?? undefined,
    visibility: visibilityToUi(api.visibility),
    entries: [],
    // TODO(analytics): wire true save count once the server exposes
    // `_count.savedBy`. Until then, don't conflate entry count with social
    // saves — the card's heart icon would otherwise misrepresent engagement.
    saves: 0,
    coverImage: api.coverImage ?? undefined,
  };
}

export function mapRankingEntry(api: ApiRankingEntry) {
  return {
    objectId: api.objectId,
    rank: api.rank,
    movement: api.movement ?? undefined,
    delta: api.delta ?? undefined,
    note: api.note ?? undefined,
  };
}

function visibilityToUi(v: ApiRankingListSummary["visibility"]): RankingList["visibility"] {
  // The UI only models "public" and "followers"; collapse "private" into
  // followers until a first-party settings surface exists.
  return v === "public" ? "public" : "followers";
}
