/**
 * Wire types — the JSON shape the server actually returns.
 *
 * Keep this file free of business logic; pair it with `mappers.ts` to
 * translate into the client-facing shapes in `data/types.ts`.
 */

export type ApiDetailLayout = "discovery_photo" | "album_review" | "product_hero";
export type ApiPostType = "photo" | "carousel" | "short_video";
export type ApiMovement = "up" | "down" | "new" | "stable";
export type ApiObjectType =
  | "place" | "restaurant" | "cafe" | "bar" | "perfume"
  | "album" | "fashion" | "sneaker" | "product";

export interface ApiUser {
  id: string;
  email?: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  createdAt?: string;
  followers?: number;
  following?: number;
  posts?: number;
}

export interface ApiObjectLite {
  id: string;
  type: ApiObjectType;
  title: string;
  subtitle?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  heroImage: string | null;
}

/** Full object shape returned alongside ranking entries (/ranking-lists/:id). */
export interface ApiObjectFull extends ApiObjectLite {
  tags?: string[];
  shortDescriptor?: string | null;
  metadata?: string | null;
  createdAt?: string;
}

export interface ApiRankingListLite {
  id: string;
  title: string;
  category: string;
}

export interface ApiRankingListSummary {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  description: string | null;
  visibility: "public" | "followers" | "private";
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  owner: ApiUser;
  _count: { entries: number };
}

export interface ApiRankingEntry {
  id: string;
  listId: string;
  objectId: string;
  rank: number;
  movement: ApiMovement | null;
  delta: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  object: ApiObjectFull;
}

export interface ApiRankingListDetail extends Omit<ApiRankingListSummary, "_count"> {
  entries: ApiRankingEntry[];
  _count: { entries: number; posts: number };
}

export interface ApiRankingListsResponse {
  lists: ApiRankingListSummary[];
  nextCursor: string | null;
}

// ---------- Search ----------

export interface ApiSearchObjectHit {
  id: string;
  type: ApiObjectType;
  title: string;
  subtitle: string | null;
  city: string | null;
  heroImage: string | null;
  rank: number;
}

export interface ApiSearchResponse {
  query: string;
  objects?: ApiSearchObjectHit[];
  posts?: unknown[];
  users?: unknown[];
}

export interface ApiPost {
  id: string;
  authorId: string;
  objectId: string;
  postType: ApiPostType;
  detailLayout: ApiDetailLayout;
  headline: string;
  caption: string;
  tags: string[];
  rankingListId: string | null;
  rankingRank: number | null;
  rankingMovement: ApiMovement | null;
  rankingDelta: number | null;
  locationLabel: string | null;
  aspect: "tall" | "square" | "wide" | null;
  featured: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author: ApiUser;
  object: ApiObjectLite;
  rankingList: ApiRankingListLite | null;
  stats: { likes: number; comments: number; saves: number };
  viewer?: { likedByMe: boolean; savedByMe: boolean };
}

export interface ApiFeedResponse {
  posts: ApiPost[];
  nextCursor: string | null;
}

export interface ApiSession {
  token: string;
  expiresAt: string;
}

export interface ApiAuthResponse {
  user: ApiUser;
  session: ApiSession;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
