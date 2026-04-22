import { request } from "./client";
import type {
  ApiAuthResponse,
  ApiFeedResponse,
  ApiObjectLite,
  ApiPost,
  ApiRankingEntry,
  ApiRankingListDetail,
  ApiRankingListSummary,
  ApiRankingListsResponse,
  ApiSearchObjectHit,
  ApiSearchResponse,
  ApiUser,
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

// ---------- Feed ----------

export const fetchFeed = (params: {
  limit?: number;
  cursor?: string;
  token?: string | null;
}) =>
  request<ApiFeedResponse>("/feed", {
    token: params.token ?? null,
    query: { limit: params.limit, cursor: params.cursor },
  });

// ---------- Post detail ----------

export const fetchPost = (id: string, token: string | null) =>
  request<{
    post: ApiPost & {
      viewer: { likedByMe: boolean; savedByMe: boolean; isAuthor: boolean };
    };
    comments: Array<{
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
        body: string;
        createdAt: string;
        author: ApiUser;
      }>;
    }>;
  }>(`/posts/${id}`, { token });

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

// ---------- Ranking lists ----------

export const fetchRankingLists = (params: {
  ownerHandle?: string;
  category?: string;
  limit?: number;
  cursor?: string;
}) =>
  request<ApiRankingListsResponse>("/ranking-lists", {
    query: {
      owner: params.ownerHandle,
      category: params.category,
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

// ---------- Search ----------

export const searchObjects = (query: string, limit = 10) =>
  request<ApiSearchResponse>("/search", {
    query: { q: query, type: "objects", limit },
  });

/** Narrow helper — the server paints a row-shaped object hit. */
export type ObjectSearchHit = ApiSearchObjectHit;
export type { ApiObjectLite };
