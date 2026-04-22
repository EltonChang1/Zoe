import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "./AuthProvider";
import {
  createComment,
  createRankingList,
  fetchFeed,
  fetchPost,
  fetchRankingList,
  fetchRankingLists,
  insertRankingEntry,
  likePost,
  savePost,
  searchObjects,
  unlikePost,
  unsavePost,
} from "./endpoints";
import {
  mapPost,
  mapRankingListDetail,
  mapRankingListSummary,
} from "./mappers";
import type { ApiPost } from "./types";

/**
 * React-Query hooks. These are the only place view code should touch the
 * network layer. Keys are stable and conservative so cache invalidation is
 * easy to reason about:
 *   ["feed"]             → the main Home feed
 *   ["post", id]         → individual post + comments
 *   ["activity"]         → following-activity (Search tab)
 */

export function useFeedQuery(pageSize = 20) {
  const { token } = useAuth();
  return useInfiniteQuery({
    queryKey: ["feed", { pageSize, viewer: Boolean(token) }],
    queryFn: ({ pageParam }) =>
      fetchFeed({
        limit: pageSize,
        cursor: pageParam ?? undefined,
        token,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      posts: data.pages.flatMap((p) => p.posts.map(mapPost)),
      rawPosts: data.pages.flatMap((p) => p.posts) as ApiPost[],
    }),
    staleTime: 30_000,
  });
}

export function usePostQuery(id: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["post", id],
    enabled: Boolean(id),
    queryFn: () => fetchPost(id!, token),
    staleTime: 15_000,
  });
}

// -------- Mutations: likes & saves --------

export function useLikePost() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? unlikePost(id, token!) : likePost(id, token!),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["post", id] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useSavePost() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved ? unsavePost(id, token!) : savePost(id, token!),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["post", id] });
    },
  });
}

// -------- Ranking lists --------

/**
 * Community hub — all public lists (most-recent first). Passing `category`
 * narrows to a single category slug. No viewer context required.
 */
export function useCommunityRankingListsQuery(params?: {
  category?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["ranking-lists", "community", params ?? {}],
    queryFn: () =>
      fetchRankingLists({
        category: params?.category,
        limit: params?.limit ?? 20,
      }),
    select: (data) => ({
      ...data,
      lists: data.lists.map(mapRankingListSummary),
    }),
    staleTime: 60_000,
  });
}

/**
 * Personal hub — lists owned by a specific user (by handle).
 * Disabled until `handle` is defined so we don't spam the API during boot.
 */
export function useOwnerRankingListsQuery(handle: string | undefined | null) {
  return useQuery({
    queryKey: ["ranking-lists", "owner", handle ?? null],
    enabled: Boolean(handle),
    queryFn: () => fetchRankingLists({ ownerHandle: handle! }),
    select: (data) => ({
      ...data,
      lists: data.lists.map(mapRankingListSummary),
    }),
    staleTime: 30_000,
  });
}

export function useRankingListQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["ranking-list", id],
    enabled: Boolean(id),
    queryFn: () => fetchRankingList(id!),
    select: (data) => ({
      raw: data.list,
      list: mapRankingListDetail(data.list),
    }),
    staleTime: 30_000,
  });
}

// -------- Object search --------

/**
 * Debouncing is the caller's responsibility — pass `""` (or a query shorter
 * than `minLength`) to keep the hook idle. Uses trgm+tsvector fallback, so
 * results can be surprising for single-character queries.
 */
export function useObjectSearchQuery(
  query: string,
  opts: { limit?: number; minLength?: number } = {},
) {
  const { limit = 10, minLength = 2 } = opts;
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["search", "objects", trimmed, { limit }],
    enabled: trimmed.length >= minLength,
    queryFn: () => searchObjects(trimmed, limit),
    staleTime: 60_000,
    // Flickers during debounce feel worse than a slightly stale result set.
    placeholderData: (prev) => prev,
  });
}

// -------- Mutations: ranking lists --------

/**
 * Create a new list owned by the signed-in user. Invalidates the
 * personal-rankings query so the new list appears immediately.
 */
export function useCreateRankingList() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title: string;
      category: string;
      description?: string;
      visibility?: "public" | "followers" | "private";
      coverImage?: string;
    }) => createRankingList(token!, body),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["ranking-lists", "owner", user?.handle ?? null],
      });
      qc.invalidateQueries({ queryKey: ["ranking-lists", "community"] });
    },
  });
}

/**
 * Insert a ranked entry. `insertAt` is 1-indexed (server contract). On
 * success we invalidate both the list detail and the owner's hub to reflect
 * the new entry count / cover.
 */
export function useInsertRankingEntry() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      objectId,
      insertAt,
      note,
    }: {
      listId: string;
      objectId: string;
      insertAt: number;
      note?: string;
    }) => insertRankingEntry(listId, token!, { objectId, insertAt, note }),
    onSuccess: (_data, { listId }) => {
      qc.invalidateQueries({ queryKey: ["ranking-list", listId] });
      qc.invalidateQueries({
        queryKey: ["ranking-lists", "owner", user?.handle ?? null],
      });
      qc.invalidateQueries({ queryKey: ["ranking-lists", "community"] });
    },
  });
}

// -------- Mutations: comments --------

export function useCreateComment() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
      parentId,
    }: {
      id: string;
      body: string;
      parentId?: string;
    }) => createComment(id, token!, { body, parentId }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["post", id] });
    },
  });
}
