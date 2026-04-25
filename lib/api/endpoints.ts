import { request } from "./client";
import type {
  ApiActivityResponse,
  ApiAuthResponse,
  ApiFeedResponse,
  ApiNotificationsResponse,
  ApiObjectDetail,
  ApiObjectLite,
  ApiPost,
  ApiPostCommentsResponse,
  ApiRankingEntry,
  ApiRankingListDetail,
  ApiRankingListSummary,
  ApiRankingListsResponse,
  ApiSearchObjectHit,
  ApiSearchResponse,
  ApiShort,
  ApiShortCommentsResponse,
  ApiShortsResponse,
  ApiUser,
  ApiUserProfile,
} from "./types";

/**
 * Typed thin wrappers around individual endpoints. Hooks in `queries.ts`
 * call these — view code should never talk to `request()` directly.
 */

// ---------- Auth ----------

export const registerUser = (input: {
  email: string;
  password: string;
  handle: string;
  displayName: string;
  bio?: string;
}) =>
  request<ApiAuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });

export const loginUser = (input: { email: string; password: string }) =>
  request<ApiAuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });

export const logoutUser = (token: string) =>
  request<{ ok: true }>("/auth/logout", { method: "POST", token });

export const fetchMe = (token: string) =>
  request<{ user: ApiUser }>("/auth/me", { token });

export const deleteAccount = (token: string) =>
  request<{ ok: true }>("/auth/me", { method: "DELETE", token });

export const verifyEmail = (token: string) =>
  request<{ ok: true; user: ApiUser }>("/auth/verify-email", {
    method: "POST",
    body: { token },
  });

export const resendVerificationEmail = (token: string) =>
  request<{ ok: true; alreadyVerified?: boolean }>(
    "/auth/resend-verification",
    { method: "POST", token },
  );

export const forgotPassword = (email: string) =>
  request<{ ok: true }>("/auth/forgot-password", {
    method: "POST",
    body: { email: email.trim().toLowerCase() },
  });

export const resetPassword = (token: string, password: string) =>
  request<{ ok: true }>("/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });

// ---------- Feed ----------

export const fetchFeed = (params: {
  limit?: number;
  cursor?: string;
  author?: string;
  object?: string;
  token?: string | null;
}) =>
  request<ApiFeedResponse>("/feed", {
    token: params.token ?? null,
    query: {
      limit: params.limit,
      cursor: params.cursor,
      author: params.author,
      object: params.object,
    },
  });

// ---------- Post detail ----------

export const fetchPost = (id: string, token: string | null) =>
  request<{
    post: ApiPost & {
      viewer: { likedByMe: boolean; savedByMe: boolean; isAuthor: boolean };
    };
  }>(`/posts/${id}`, { token });

export const fetchPostComments = (
  id: string,
  params: { limit?: number; cursor?: string } = {},
) =>
  request<ApiPostCommentsResponse>(`/posts/${id}/comments`, {
    query: { limit: params.limit, cursor: params.cursor },
  });

export const likePost = (id: string, token: string) =>
  request<{ liked: boolean; likes: number }>(`/posts/${id}/like`, {
    method: "POST",
    token,
  });

export const unlikePost = (id: string, token: string) =>
  request<{ liked: boolean; likes: number }>(`/posts/${id}/like`, {
    method: "DELETE",
    token,
  });

export const savePost = (id: string, token: string) =>
  request<{ saved: boolean }>(`/posts/${id}/save`, { method: "POST", token });

export const unsavePost = (id: string, token: string) =>
  request<{ saved: boolean }>(`/posts/${id}/save`, { method: "DELETE", token });

export const createComment = (
  id: string,
  token: string,
  body: { body: string; parentId?: string },
) =>
  request<{ comment: unknown }>(`/posts/${id}/comments`, {
    method: "POST",
    token,
    body,
  });

export const deleteComment = (
  postId: string,
  commentId: string,
  token: string,
) =>
  request<{ ok: true }>(`/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
    token,
  });

// ---------- Ranking lists ----------

export const fetchRankingLists = (params: {
  ownerHandle?: string;
  category?: string;
  objectId?: string;
  limit?: number;
  cursor?: string;
}) =>
  request<ApiRankingListsResponse>("/ranking-lists", {
    query: {
      owner: params.ownerHandle,
      category: params.category,
      object: params.objectId,
      limit: params.limit,
      cursor: params.cursor,
    },
  });

export const fetchRankingList = (id: string) =>
  request<{ list: ApiRankingListDetail }>(`/ranking-lists/${id}`);

export const createRankingList = (
  token: string,
  body: {
    title: string;
    category: string;
    description?: string;
    visibility?: "public" | "followers" | "private";
    coverImage?: string;
  },
) =>
  request<{ list: ApiRankingListSummary }>("/ranking-lists", {
    method: "POST",
    token,
    body,
  });

export const insertRankingEntry = (
  listId: string,
  token: string,
  body: { objectId: string; insertAt: number; note?: string },
) =>
  request<{ entry: ApiRankingEntry }>(`/ranking-lists/${listId}/entries`, {
    method: "POST",
    token,
    body,
  });

export const deleteRankingList = (id: string, token: string) =>
  request<{ ok: true }>(`/ranking-lists/${id}`, { method: "DELETE", token });

// ---------- Search ----------

export const searchObjects = (query: string, limit = 10) =>
  request<ApiSearchResponse>("/search", {
    query: { q: query, type: "objects", limit },
  });

export const searchAll = (query: string, limit = 8) =>
  request<ApiSearchResponse>("/search", {
    query: { q: query, type: "all", limit },
  });

// ---------- Create post ----------

export interface CreatePostInput {
  objectId: string;
  headline: string;
  caption: string;
  tags?: string[];
  postType?: "photo" | "carousel" | "short_video";
  detailLayout?: "discovery_photo" | "album_review" | "product_hero";
  rankingListId?: string;
  locationLabel?: string;
  aspect?: "tall" | "square" | "wide";
}

export const createPost = (input: CreatePostInput, token: string) =>
  request<{ post: { id: string } }>("/posts", {
    method: "POST",
    token,
    body: input,
  });

export const deletePost = (id: string, token: string) =>
  request<{ ok: true }>(`/posts/${id}`, { method: "DELETE", token });

// ---------- Notifications ----------

export const fetchNotifications = (params: {
  token: string;
  limit?: number;
  before?: string;
}) =>
  request<ApiNotificationsResponse>("/notifications", {
    token: params.token,
    query: { limit: params.limit, before: params.before },
  });

export const registerPushToken = (
  token: string,
  body: { token: string; platform?: "ios" | "android" | "web"; appVersion?: string },
) =>
  request<{ token: { id: string } }>("/push-tokens", {
    method: "POST",
    token,
    body,
  });

export const unregisterPushToken = (token: string, pushToken: string) =>
  request<{ ok: true }>("/push-tokens", {
    method: "DELETE",
    token,
    body: { token: pushToken },
  });

// ---------- Objects ----------

export const fetchObject = (id: string) =>
  request<{ object: ApiObjectDetail }>(`/objects/${id}`);

// ---------- Activity ----------

export const fetchActivity = (params: {
  limit?: number;
  cursor?: string;
  token?: string | null;
}) =>
  request<ApiActivityResponse>("/activity", {
    token: params.token ?? null,
    query: { limit: params.limit, cursor: params.cursor },
  });

// ---------- Users ----------

export const fetchUserProfile = (handle: string, token: string | null) =>
  request<{ user: ApiUserProfile }>(`/users/${handle}`, { token });

export const followUser = (handle: string, token: string) =>
  request<{ ok: true }>(`/users/${handle}/follow`, {
    method: "POST",
    token,
  });

export const unfollowUser = (handle: string, token: string) =>
  request<{ ok: true }>(`/users/${handle}/follow`, {
    method: "DELETE",
    token,
  });

// ---------- Moderation: blocks + reports ----------

export type ReportSubjectType =
  | "user"
  | "post"
  | "short"
  | "comment"
  | "short_comment";

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "sexual"
  | "violence"
  | "self_harm"
  | "misinformation"
  | "ip_violation"
  | "other";

export interface BlockedUserEntry {
  user: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export const blockUser = (handle: string, token: string) =>
  request<{ ok: true }>(`/users/${handle}/block`, {
    method: "POST",
    token,
  });

export const unblockUser = (handle: string, token: string) =>
  request<{ ok: true }>(`/users/${handle}/block`, {
    method: "DELETE",
    token,
  });

export const fetchBlockedUsers = (token: string) =>
  request<{ blocks: BlockedUserEntry[] }>("/users/me/blocks", { token });

export const createReport = (
  token: string,
  body: {
    subjectType: ReportSubjectType;
    subjectId: string;
    reason: ReportReason;
    details?: string;
  },
) =>
  request<{ report: { id: string; createdAt?: string; deduped?: boolean } }>(
    "/reports",
    { method: "POST", token, body },
  );

// ---------- Shorts ----------

export const fetchShorts = (params: {
  limit?: number;
  cursor?: string;
  token?: string | null;
} = {}) =>
  request<ApiShortsResponse>("/shorts", {
    token: params.token ?? null,
    query: { limit: params.limit, cursor: params.cursor },
  });

export const fetchShort = (id: string, token: string | null) =>
  request<{ short: ApiShort }>(`/shorts/${id}`, { token });

// ---------- Create short ----------

export interface CreateShortInput {
  objectId: string;
  hookLine: string;
  caption: string;
  heroImage: string;
  videoUrl?: string;
  audioLabel?: string;
  rankingListTitle?: string;
  rankingRank?: number;
}

export const createShort = (input: CreateShortInput, token: string) =>
  request<{ short: ApiShort }>("/shorts", {
    method: "POST",
    token,
    body: input,
  });

export const deleteShort = (id: string, token: string) =>
  request<{ ok: true }>(`/shorts/${id}`, { method: "DELETE", token });

export const likeShort = (id: string, token: string) =>
  request<{ liked: boolean; likes: number }>(`/shorts/${id}/like`, {
    method: "POST",
    token,
  });

export const unlikeShort = (id: string, token: string) =>
  request<{ liked: boolean; likes: number }>(`/shorts/${id}/like`, {
    method: "DELETE",
    token,
  });

export const saveShort = (id: string, token: string) =>
  request<{ saved: boolean }>(`/shorts/${id}/save`, {
    method: "POST",
    token,
  });

export const unsaveShort = (id: string, token: string) =>
  request<{ saved: boolean }>(`/shorts/${id}/save`, {
    method: "DELETE",
    token,
  });

export const fetchShortComments = (
  id: string,
  params: { limit?: number; cursor?: string } = {},
) =>
  request<ApiShortCommentsResponse>(`/shorts/${id}/comments`, {
    query: { limit: params.limit, cursor: params.cursor },
  });

export const createShortComment = (
  id: string,
  token: string,
  body: { body: string; parentId?: string },
) =>
  request<{ comment: unknown }>(`/shorts/${id}/comments`, {
    method: "POST",
    token,
    body,
  });

export const deleteShortComment = (
  shortId: string,
  commentId: string,
  token: string,
) =>
  request<{ ok: true }>(`/shorts/${shortId}/comments/${commentId}`, {
    method: "DELETE",
    token,
  });

/** Narrow helper — the server paints a row-shaped object hit. */
export type ObjectSearchHit = ApiSearchObjectHit;
export type { ApiObjectLite };
