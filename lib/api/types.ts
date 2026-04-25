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
  /** Present on `/auth/me`, login, and register for the signed-in user. */
  emailVerified?: boolean;
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

export interface ApiSearchPostHit {
  id: string;
  headline: string;
  caption: string;
  authorId: string;
  objectId: string;
  rank: number;
}

export interface ApiSearchUserHit {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ApiSearchResponse {
  query: string;
  objects?: ApiSearchObjectHit[];
  posts?: ApiSearchPostHit[];
  users?: ApiSearchUserHit[];
}

// ---------- Object detail ----------

export interface ApiObjectDetail {
  id: string;
  type: ApiObjectType;
  title: string;
  subtitle: string | null;
  city: string | null;
  neighborhood: string | null;
  tags: string[];
  shortDescriptor: string | null;
  metadata: Record<string, unknown> | null;
  heroImage: string | null;
  createdAt: string;
  _count: {
    posts: number;
    entries: number;
  };
}

// ---------- Notifications (inbox) ----------

export type ApiNotificationType = "like" | "comment" | "reply" | "follow";

export interface ApiNotificationItem {
  id: string;
  type: ApiNotificationType;
  actor: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  target: {
    postId?: string;
    commentId?: string;
    postHeadline?: string;
    commentBody?: string;
    handle?: string;
  };
}

export interface ApiNotificationsResponse {
  items: ApiNotificationItem[];
  nextCursor: string | null;
}

// ---------- Activity feed ----------

export interface ApiActivityItem {
  id: string;
  actor: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
  verb: "added" | "moved";
  object: {
    id: string;
    type: ApiObjectType;
    title: string;
    city: string | null;
    heroImage: string | null;
  };
  list: { id: string; title: string; category: string } | null;
  rank: number | null;
  movement: "up" | "down" | "new" | "stable" | null;
  delta: number | null;
  body: string | null;
  headline: string;
  publishedAt: string;
}

export interface ApiActivityResponse {
  activity: ApiActivityItem[];
  nextCursor: string | null;
}

// ---------- Post comments ----------

/**
 * Top-level comment on a post with its direct replies inlined. Top-level
 * rows are paginated by `GET /posts/:id/comments`; replies live inside each
 * parent so the UI renders a single-depth thread without a second request.
 */
export interface ApiPostComment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  likes: number;
  createdAt: string;
  author: ApiUser;
  replies: Array<{
    id: string;
    postId: string;
    authorId: string;
    parentId: string | null;
    body: string;
    likes: number;
    createdAt: string;
    author: ApiUser;
  }>;
}

export interface ApiPostCommentsResponse {
  comments: ApiPostComment[];
  nextCursor: string | null;
}

// ---------- Shorts ----------

export interface ApiShort {
  id: string;
  authorId: string;
  objectId: string;
  hookLine: string;
  caption: string;
  audioLabel: string | null;
  heroImage: string;
  videoUrl: string | null;
  rankingListTitle: string | null;
  rankingRank: number | null;
  rankingMovement: ApiMovement | null;
  publishedAt: string;
  createdAt: string;
  author: ApiUser;
  object: {
    id: string;
    title: string;
    type: ApiObjectType;
    heroImage: string | null;
  };
  /** Aggregate counts derived from `likedBy` / `savedBy` / `comments`. */
  stats: {
    likes: number;
    saves: number;
    comments: number;
  };
  /** Viewer-specific flags. `null` when the request is unauthenticated. */
  viewer: { likedByMe: boolean; savedByMe: boolean } | null;
}

export interface ApiShortsResponse {
  shorts: ApiShort[];
  nextCursor: string | null;
}

export interface ApiShortComment {
  id: string;
  shortId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  likes: number;
  createdAt: string;
  author: ApiUser;
  replies: Array<{
    id: string;
    shortId: string;
    authorId: string;
    parentId: string | null;
    body: string;
    likes: number;
    createdAt: string;
    author: ApiUser;
  }>;
}

export interface ApiShortCommentsResponse {
  comments: ApiShortComment[];
  nextCursor: string | null;
}

// ---------- User profile ----------

export interface ApiUserProfile {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  stats: {
    posts: number;
    followers: number;
    following: number;
    lists: number;
  };
  viewer: {
    followsMe: boolean;
    followedByMe: boolean;
    isSelf: boolean;
  };
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
