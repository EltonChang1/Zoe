import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "./AuthProvider";
import {
  blockUser,
  completeSpotifyConnect,
  createComment,
  createPost,
  createReport,
  createShort,
  createShortComment,
  deleteComment,
  deletePost,
  deleteRankingList,
  deleteShort,
  deleteShortComment,
  createRankingList,
  disconnectSpotify,
  fetchActivity,
  fetchBlockedUsers,
  fetchCityRankingDetail,
  fetchConnectedAccounts,
  fetchFeed,
  fetchNotifications,
  fetchObject,
  fetchPersonalRankHub,
  fetchPost,
  fetchPostComments,
  fetchQuickVote,
  fetchRankingList,
  fetchRankingLists,
  fetchRankHubCities,
  fetchRankHubCity,
  fetchRestaurantMap,
  fetchRestaurantRecommendations,
  fetchSavedLibrary,
  fetchSearchSuggestions,
  fetchShort,
  fetchShortComments,
  fetchShorts,
  fetchTasteProfile,
  fetchUserProfile,
  followUser,
  insertRankingEntry,
  likePost,
  likeShort,
  replaceRankingEntries,
  removeWantToTryRestaurant,
  savePost,
  saveShort,
  searchAll,
  searchObjects,
  searchGooglePlaces,
  searchSpotifyMusic,
  followSearch,
  recordSearchEvent,
  startSpotifyConnect,
  submitQuickVote,
  unblockUser,
  unfollowUser,
  unfollowSearch,
  unlikePost,
  unlikeShort,
  unsavePost,
  unsaveShort,
  upsertGooglePlace,
  upsertSpotifyMusic,
  wantToTryRestaurant,
} from "./endpoints";
import type {
  CreatePostInput,
  CreateShortInput,
  ReportReason,
  ReportSubjectType,
  RestaurantVisitInput,
} from "./endpoints";
import {
  mapActivityItem,
  mapPost,
  mapRankingListDetail,
  mapRankingListSummary,
  registerShortRefs,
} from "./mappers";
import type { ApiPost, ApiShort } from "./types";

/**
 * React-Query hooks. These are the only place view code should touch the
 * network layer. Keys are stable and conservative so cache invalidation is
 * easy to reason about:
 *   ["feed"]             → the main Home feed
 *   ["post", id]         → individual post + comments
 *   ["activity"]         → following-activity (Search tab)
 */

export function useFeedQuery(
  pageSize = 20,
  params: {
    scope?: "for_you" | "home_city" | "anywhere";
    cityId?: string | null;
    category?: string | null;
    savedOnly?: boolean;
  } = {},
) {
  const { token } = useAuth();
  return useInfiniteQuery({
    queryKey: [
      "feed",
      {
        pageSize,
        viewer: Boolean(token),
        scope: params.scope ?? "for_you",
        cityId: params.cityId ?? null,
        category: params.category ?? null,
        savedOnly: params.savedOnly ?? false,
      },
    ],
    queryFn: ({ pageParam }) =>
      fetchFeed({
        limit: pageSize,
        cursor: pageParam ?? undefined,
        scope: params.scope,
        cityId: params.cityId,
        category: params.category,
        savedOnly: params.savedOnly,
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

/**
 * Feed filtered to a single author — the profile screen's "Posts" tab.
 * Same page shape as the main feed so rendering code can be shared.
 */
export function useUserPostsQuery(
  handle: string | undefined | null,
  pageSize = 20,
) {
  const { token } = useAuth();
  return useInfiniteQuery({
    queryKey: ["feed", "author", handle ?? null, { pageSize }],
    enabled: Boolean(handle),
    queryFn: ({ pageParam }) =>
      fetchFeed({
        limit: pageSize,
        cursor: pageParam ?? undefined,
        author: handle!,
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

/**
 * Following activity (Search tab fallback). Paginated with the same cursor
 * shape as `/feed`; select output is already mapped to `ActivityCard` shape
 * so the existing `ActivityCard` component renders without changes.
 */
export function useActivityQuery(pageSize = 15) {
  const { token } = useAuth();
  return useInfiniteQuery({
    queryKey: ["activity", { pageSize, viewer: Boolean(token) }],
    queryFn: ({ pageParam }) =>
      fetchActivity({
        limit: pageSize,
        cursor: pageParam ?? undefined,
        token,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((p) => p.activity.map(mapActivityItem)),
    }),
    staleTime: 30_000,
  });
}

/**
 * Inbox feed. Auth-gated — unauthenticated callers get `enabled: false`
 * so this hook can be dropped in anywhere (e.g. a home-screen bell) and
 * simply stay idle until the viewer signs in.
 */
export function useNotificationsQuery(pageSize = 20) {
  const { token } = useAuth();
  return useInfiniteQuery({
    queryKey: ["notifications", { pageSize, viewer: Boolean(token) }],
    enabled: Boolean(token),
    queryFn: ({ pageParam }) =>
      fetchNotifications({
        token: token!,
        limit: pageSize,
        before: pageParam ?? undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      items: data.pages.flatMap((p) => p.items),
    }),
    staleTime: 15_000,
  });
}

// -------- Connected accounts --------

export function useConnectedAccountsQuery() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["connected-accounts", { viewer: Boolean(token) }],
    enabled: Boolean(token),
    queryFn: () => fetchConnectedAccounts(token!),
    staleTime: 30_000,
  });
}

export function useStartSpotifyConnect() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (body: { redirectUri: string }) =>
      startSpotifyConnect(token!, body),
  });
}

export function useCompleteSpotifyConnect() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { code: string; state: string }) =>
      completeSpotifyConnect(token!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connected-accounts"] });
    },
  });
}

export function useDisconnectSpotify() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectSpotify(token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connected-accounts"] });
    },
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

/**
 * Paginated comment thread for a post. Mirrors `useShortComments`: top-level
 * rows are cursored by `(createdAt, id)` and include replies inline so the
 * UI never needs a second round-trip to render a thread.
 */
export function usePostComments(
  id: string | undefined | null,
  pageSize = 30,
) {
  return useInfiniteQuery({
    queryKey: ["post-comments", id ?? null, { pageSize }],
    enabled: Boolean(id),
    queryFn: ({ pageParam }) =>
      fetchPostComments(id!, {
        limit: pageSize,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      comments: data.pages.flatMap((p) => p.comments),
    }),
    staleTime: 15_000,
  });
}

// -------- Restaurant social --------

export function useRestaurantMapQuery(params: {
  cityId?: string | null;
  limit?: number;
} = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["restaurants", "map", params.cityId ?? null, params.limit ?? 150, Boolean(token)],
    queryFn: () =>
      fetchRestaurantMap({
        cityId: params.cityId,
        limit: params.limit,
        token,
      }),
    staleTime: 30_000,
  });
}

export function useRestaurantRecommendationsQuery(params: {
  cityId?: string | null;
  limit?: number;
} = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "restaurants",
      "recommendations",
      params.cityId ?? null,
      params.limit ?? 20,
      Boolean(token),
    ],
    queryFn: () =>
      fetchRestaurantRecommendations({
        cityId: params.cityId,
        limit: params.limit,
        token,
      }),
    staleTime: 45_000,
  });
}

export function useTasteProfileQuery(handle: string | undefined | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["taste-profile", handle ?? null, Boolean(token)],
    enabled: Boolean(handle),
    queryFn: () => fetchTasteProfile(handle!, token),
    staleTime: 60_000,
  });
}

export function useWantToTryRestaurant() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      objectId,
      wanted,
    }: {
      objectId: string;
      wanted: boolean;
    }) => {
      if (wanted) {
        await removeWantToTryRestaurant(objectId, token!);
      } else {
        await wantToTryRestaurant(objectId, token!);
      }
      return { ok: true };
    },
    onSuccess: (_data, { objectId }) => {
      qc.invalidateQueries({ queryKey: ["object", objectId] });
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      qc.invalidateQueries({ queryKey: ["saved-library"] });
    },
  });
}

// -------- Mutations: posts --------

/**
 * Create post. On success we invalidate the Home feed, the author's feed,
 * and their profile so stats (+1 posts) and both lists pick up the new
 * entry on their next read.
 */
export function useCreatePost() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePostInput) => createPost(input, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      if (user?.handle) {
        qc.invalidateQueries({
          queryKey: ["feed", "author", user.handle],
        });
        qc.invalidateQueries({ queryKey: ["user-profile", user.handle] });
      }
    },
  });
}

/**
 * Create short. Invalidates the Shorts feed and the author's profile so
 * both update on the next read. Mirrors `useCreatePost` — keep them in
 * sync when one grows new invalidations.
 */
export function useCreateShort() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateShortInput) => createShort(input, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shorts"] });
      if (user?.handle) {
        qc.invalidateQueries({ queryKey: ["user-profile", user.handle] });
      }
    },
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
      qc.invalidateQueries({ queryKey: ["saved-library"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
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

/**
 * Lists that contain a particular object — powers the "Ranked in" section
 * of the object-detail screen.
 */
export function useObjectListsQuery(objectId: string | undefined | null) {
  return useQuery({
    queryKey: ["ranking-lists", "object", objectId ?? null],
    enabled: Boolean(objectId),
    queryFn: () => fetchRankingLists({ objectId: objectId! }),
    select: (data) => ({
      ...data,
      lists: data.lists.map(mapRankingListSummary),
    }),
    staleTime: 30_000,
  });
}

// -------- Rank Hub --------

export function useRankHubCitiesQuery() {
  return useQuery({
    queryKey: ["rank-hub", "cities"],
    queryFn: fetchRankHubCities,
    staleTime: 5 * 60_000,
  });
}

export function useRankHubCityQuery(cityId: string | undefined | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["rank-hub", "city", cityId ?? null, { viewer: Boolean(token) }],
    enabled: Boolean(cityId),
    queryFn: () => fetchRankHubCity({ cityId, token }),
    staleTime: 30_000,
  });
}

export function useCityRankingDetailQuery(listId: string | undefined | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "rank-hub",
      "city-list",
      listId ?? null,
      { viewer: Boolean(token) },
    ],
    enabled: Boolean(listId),
    queryFn: () => fetchCityRankingDetail(listId!, token),
    staleTime: 30_000,
  });
}

export function usePersonalRankHubQuery(cityId: string | undefined | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "rank-hub",
      "personal",
      cityId ?? null,
      { viewer: Boolean(token) },
    ],
    queryFn: () => fetchPersonalRankHub({ cityId, token }),
    staleTime: 30_000,
  });
}

export function useQuickVoteQuery(input: {
  cityId?: string | null;
  listId?: string | null;
  count?: number;
}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "rank-hub",
      "quick-vote",
      input.cityId ?? null,
      input.listId ?? null,
      { count: input.count ?? 5 },
    ],
    enabled: Boolean(input.cityId && input.listId),
    queryFn: () =>
      fetchQuickVote({
        cityId: input.cityId!,
        listId: input.listId!,
        count: input.count ?? 5,
        token,
      }),
    staleTime: 15_000,
  });
}

export function useSubmitQuickVote() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      cityId: string;
      listId: string;
      votes: Array<{
        objectAId: string;
        objectBId: string;
        selectedObjectId?: string | null;
        skipped?: boolean;
        contextPrompt: string;
      }>;
    }) => submitQuickVote(token!, body),
    onSuccess: (_data, body) => {
      qc.invalidateQueries({ queryKey: ["rank-hub", "city", body.cityId] });
      qc.invalidateQueries({
        queryKey: ["rank-hub", "city-list", body.listId],
      });
      qc.invalidateQueries({ queryKey: ["rank-hub", "quick-vote"] });
    },
  });
}

/**
 * Posts whose subject is a particular object — powers the "Reviews" section
 * of the object-detail screen. Uses the same infinite-pagination shape as
 * the Home feed so rendering code can be shared.
 */
export function useObjectPostsQuery(
  objectId: string | undefined | null,
  pageSize = 20,
) {
  const { token } = useAuth();
  return useInfiniteQuery({
    queryKey: ["feed", "object", objectId ?? null, { pageSize }],
    enabled: Boolean(objectId),
    queryFn: ({ pageParam }) =>
      fetchFeed({
        limit: pageSize,
        cursor: pageParam ?? undefined,
        object: objectId!,
        token,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      posts: data.pages.flatMap((p) => p.posts.map(mapPost)),
    }),
    staleTime: 30_000,
  });
}

/**
 * Shorts — immersive vertical feed. Paginates by publish-desc cursor; the
 * `select` side-effect registers each short's author + object in the client
 * caches so the screen can resolve them for overlays without extra fetches.
 *
 * `viewer` token is forwarded so the server can stamp `likedByMe` /
 * `savedByMe` flags on each row — otherwise the right-rail icons would
 * always render in the unsigned state.
 */
export function useShortsQuery(pageSize = 10) {
  const { token } = useAuth();
  return useInfiniteQuery({
    queryKey: ["shorts", { pageSize, viewer: Boolean(token) }],
    queryFn: ({ pageParam }) =>
      fetchShorts({ limit: pageSize, cursor: pageParam ?? undefined, token }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      shorts: data.pages.flatMap((p) => p.shorts.map(registerShortRefs)),
    }),
    staleTime: 30_000,
  });
}

/**
 * Detail fetch for a single short — used by the comment sheet and by any
 * surface that wants authoritative counts + viewer flags without relying on
 * a stale list projection.
 */
export function useShortQuery(id: string | undefined | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["short", id ?? null, { viewer: Boolean(token) }],
    enabled: Boolean(id),
    queryFn: () => fetchShort(id!, token),
    select: (data) => ({
      ...data,
      short: registerShortRefs(data.short),
    }),
    staleTime: 15_000,
  });
}

/**
 * Paginated comment thread for a short. Kept separate from the feed hook so
 * the comment sheet can refresh without touching the full Shorts pager.
 */
export function useShortComments(
  id: string | undefined | null,
  pageSize = 30,
) {
  return useInfiniteQuery({
    queryKey: ["short-comments", id ?? null, { pageSize }],
    enabled: Boolean(id),
    queryFn: ({ pageParam }) =>
      fetchShortComments(id!, {
        limit: pageSize,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      comments: data.pages.flatMap((p) => p.comments),
    }),
    staleTime: 15_000,
  });
}

// -------- Mutations: shorts --------

type ShortsInfinite = {
  pages: Array<{ shorts: ApiShort[]; nextCursor: string | null }>;
  pageParams: unknown[];
};

/**
 * Walk every page in the cached Shorts infinite list and patch the row with
 * id `shortId`. Any page that doesn't contain the target is returned
 * unchanged to keep cache identity stable.
 */
function patchShortInFeed(
  cache: ShortsInfinite | undefined,
  shortId: string,
  patch: (s: ApiShort) => ApiShort,
): ShortsInfinite | undefined {
  if (!cache) return cache;
  let changed = false;
  const pages = cache.pages.map((page) => {
    const idx = page.shorts.findIndex((s) => s.id === shortId);
    if (idx === -1) return page;
    changed = true;
    const nextShorts = page.shorts.slice();
    nextShorts[idx] = patch(page.shorts[idx]!);
    return { ...page, shorts: nextShorts };
  });
  return changed ? { ...cache, pages } : cache;
}

/**
 * Toggle a like on a short. Optimistically flips the `likedByMe` flag and
 * bumps the `likes` counter on both the single-short cache and any infinite
 * Shorts feed page that currently holds the row. Rolls back on error; the
 * server's authoritative count is absorbed on success.
 */
export function useLikeShort() {
  const { token } = useAuth();
  const qc = useQueryClient();

  type SingleCache = { short: ApiShort };

  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? unlikeShort(id, token!) : likeShort(id, token!),

    onMutate: async ({ id, liked }) => {
      const next = !liked;
      const delta = next ? 1 : -1;

      await Promise.all([
        qc.cancelQueries({ queryKey: ["short", id] }),
        qc.cancelQueries({ queryKey: ["shorts"] }),
      ]);

      const singleSnap = qc.getQueryData<SingleCache>([
        "short",
        id,
        { viewer: true },
      ]);
      const feedSnap = qc.getQueriesData<ShortsInfinite>({
        queryKey: ["shorts"],
      });

      qc.setQueryData<SingleCache>(
        ["short", id, { viewer: true }],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            short: {
              ...prev.short,
              stats: {
                ...prev.short.stats,
                likes: Math.max(0, prev.short.stats.likes + delta),
              },
              viewer: prev.short.viewer
                ? { ...prev.short.viewer, likedByMe: next }
                : { likedByMe: next, savedByMe: false },
            },
          };
        },
      );

      for (const [key] of feedSnap) {
        qc.setQueryData<ShortsInfinite>(key, (prev) =>
          patchShortInFeed(prev, id, (s) => ({
            ...s,
            stats: {
              ...s.stats,
              likes: Math.max(0, s.stats.likes + delta),
            },
            viewer: s.viewer
              ? { ...s.viewer, likedByMe: next }
              : { likedByMe: next, savedByMe: false },
          })),
        );
      }

      return { singleSnap, feedSnap };
    },

    onError: (_err, { id }, ctx) => {
      if (!ctx) return;
      if (ctx.singleSnap) {
        qc.setQueryData(["short", id, { viewer: true }], ctx.singleSnap);
      }
      for (const [key, value] of ctx.feedSnap) {
        qc.setQueryData(key, value);
      }
    },

    onSuccess: (data, { id }) => {
      // Server's count wins — patch in place so we don't re-paint from a
      // background refetch.
      qc.setQueryData<SingleCache>(
        ["short", id, { viewer: true }],
        (prev) =>
          prev
            ? {
                ...prev,
                short: {
                  ...prev.short,
                  stats: { ...prev.short.stats, likes: data.likes },
                  viewer: prev.short.viewer
                    ? { ...prev.short.viewer, likedByMe: data.liked }
                    : { likedByMe: data.liked, savedByMe: false },
                },
              }
            : prev,
      );
      qc.setQueriesData<ShortsInfinite>(
        { queryKey: ["shorts"] },
        (prev) =>
          patchShortInFeed(prev, id, (s) => ({
            ...s,
            stats: { ...s.stats, likes: data.likes },
            viewer: s.viewer
              ? { ...s.viewer, likedByMe: data.liked }
              : { likedByMe: data.liked, savedByMe: false },
          })),
      );
    },
  });
}

/**
 * Save / unsave a short. Mirrors `useLikeShort` but only patches the
 * `savedByMe` flag — saves don't expose a counter in the UI, so there's
 * nothing else to reconcile.
 */
export function useSaveShort() {
  const { token } = useAuth();
  const qc = useQueryClient();

  type SingleCache = { short: ApiShort };

  return useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved ? unsaveShort(id, token!) : saveShort(id, token!),

    onMutate: async ({ id, saved }) => {
      const next = !saved;
      await Promise.all([
        qc.cancelQueries({ queryKey: ["short", id] }),
        qc.cancelQueries({ queryKey: ["shorts"] }),
      ]);

      const singleSnap = qc.getQueryData<SingleCache>([
        "short",
        id,
        { viewer: true },
      ]);
      const feedSnap = qc.getQueriesData<ShortsInfinite>({
        queryKey: ["shorts"],
      });

      qc.setQueryData<SingleCache>(
        ["short", id, { viewer: true }],
        (prev) => {
          if (!prev) return prev;
          const delta = next ? 1 : -1;
          return {
            ...prev,
            short: {
              ...prev.short,
              stats: {
                ...prev.short.stats,
                saves: Math.max(0, prev.short.stats.saves + delta),
              },
              viewer: prev.short.viewer
                ? { ...prev.short.viewer, savedByMe: next }
                : { likedByMe: false, savedByMe: next },
            },
          };
        },
      );

      for (const [key] of feedSnap) {
        qc.setQueryData<ShortsInfinite>(key, (prev) =>
          patchShortInFeed(prev, id, (s) => {
            const delta = next ? 1 : -1;
            return {
              ...s,
              stats: {
                ...s.stats,
                saves: Math.max(0, s.stats.saves + delta),
              },
              viewer: s.viewer
                ? { ...s.viewer, savedByMe: next }
                : { likedByMe: false, savedByMe: next },
            };
          }),
        );
      }

      return { singleSnap, feedSnap };
    },

    onError: (_err, { id }, ctx) => {
      if (!ctx) return;
      if (ctx.singleSnap) {
        qc.setQueryData(["short", id, { viewer: true }], ctx.singleSnap);
      }
      for (const [key, value] of ctx.feedSnap) {
        qc.setQueryData(key, value);
      }
    },
  });
}

/**
 * Create a comment on a short, with an optimistic append to the nearest
 * `useShortComments` page so the input clears to a fully-rendered row.
 * Comment count in the feed + single-short caches is bumped in the same
 * write so the rail counter ticks immediately. Rolls back on failure.
 */
export function useCreateShortComment() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  type MinimalAuthor = {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
  type CommentsInfinite = {
    pages: Array<{
      comments: Array<{
        id: string;
        shortId: string;
        authorId: string;
        parentId: string | null;
        body: string;
        likes: number;
        createdAt: string;
        author: MinimalAuthor;
        replies: Array<{
          id: string;
          shortId: string;
          authorId: string;
          parentId: string | null;
          body: string;
          likes: number;
          createdAt: string;
          author: MinimalAuthor;
        }>;
      }>;
      nextCursor: string | null;
    }>;
    pageParams: unknown[];
  };
  type SingleCache = { short: ApiShort };

  return useMutation({
    mutationFn: ({
      id,
      body,
      parentId,
    }: {
      id: string;
      body: string;
      parentId?: string;
    }) => createShortComment(id, token!, { body, parentId }),

    onMutate: async ({ id, body, parentId }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["short-comments", id] }),
        qc.cancelQueries({ queryKey: ["short", id] }),
        qc.cancelQueries({ queryKey: ["shorts"] }),
      ]);

      const previousComments = qc.getQueriesData<CommentsInfinite>({
        queryKey: ["short-comments", id],
      });
      const previousShort = qc.getQueryData<SingleCache>([
        "short",
        id,
        { viewer: true },
      ]);
      const previousFeeds = qc.getQueriesData<ShortsInfinite>({
        queryKey: ["shorts"],
      });

      if (!user) {
        // Unsigned — we still capture snapshots so the mutation can be
        // rolled back cleanly on the (guaranteed 401) error path.
        return { previousComments, previousShort, previousFeeds, tempId: null };
      }

      const tempId = `__pending_short_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const author: MinimalAuthor = {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
      };
      const createdAt = new Date().toISOString();

      qc.setQueriesData<CommentsInfinite>(
        { queryKey: ["short-comments", id] },
        (prev) => {
          if (!prev || prev.pages.length === 0) return prev;
          // For top-level comments we append to the last page so the new
          // row shows up right above the input; for replies we insert into
          // the parent's replies array wherever it lives.
          if (parentId) {
            const pages = prev.pages.map((page) => ({
              ...page,
              comments: page.comments.map((c) =>
                c.id === parentId
                  ? {
                      ...c,
                      replies: [
                        ...c.replies,
                        {
                          id: tempId,
                          shortId: id,
                          authorId: user.id,
                          parentId,
                          body,
                          likes: 0,
                          createdAt,
                          author,
                        },
                      ],
                    }
                  : c,
              ),
            }));
            return { ...prev, pages };
          }
          const pages = prev.pages.slice();
          const last = pages[pages.length - 1]!;
          pages[pages.length - 1] = {
            ...last,
            comments: [
              ...last.comments,
              {
                id: tempId,
                shortId: id,
                authorId: user.id,
                parentId: null,
                body,
                likes: 0,
                createdAt,
                author,
                replies: [],
              },
            ],
          };
          return { ...prev, pages };
        },
      );

      qc.setQueryData<SingleCache>(
        ["short", id, { viewer: true }],
        (prev) =>
          prev
            ? {
                ...prev,
                short: {
                  ...prev.short,
                  stats: {
                    ...prev.short.stats,
                    comments: prev.short.stats.comments + 1,
                  },
                },
              }
            : prev,
      );

      qc.setQueriesData<ShortsInfinite>(
        { queryKey: ["shorts"] },
        (prev) =>
          patchShortInFeed(prev, id, (s) => ({
            ...s,
            stats: { ...s.stats, comments: s.stats.comments + 1 },
          })),
      );

      return { previousComments, previousShort, previousFeeds, tempId };
    },

    onError: (_err, { id }, ctx) => {
      if (!ctx) return;
      for (const [key, value] of ctx.previousComments ?? []) {
        qc.setQueryData(key, value);
      }
      if (ctx.previousShort) {
        qc.setQueryData(
          ["short", id, { viewer: true }],
          ctx.previousShort,
        );
      }
      for (const [key, value] of ctx.previousFeeds ?? []) {
        qc.setQueryData(key, value);
      }
    },

    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["short-comments", id] });
      qc.invalidateQueries({ queryKey: ["short", id] });
    },
  });
}

/**
 * Delete a short comment. Optimistically removes the row from every cached
 * thread for that short and decrements the counter. Rolls back on failure;
 * `onSettled` invalidates so the server's view wins in the rare case the
 * local prediction diverged.
 */
export function useDeleteShortComment() {
  const { token } = useAuth();
  const qc = useQueryClient();

  type CommentsInfinite = {
    pages: Array<{
      comments: Array<{
        id: string;
        replies: Array<{ id: string }>;
      } & Record<string, unknown>>;
      nextCursor: string | null;
    }>;
    pageParams: unknown[];
  };
  type SingleCache = { short: ApiShort };

  return useMutation({
    mutationFn: ({
      shortId,
      commentId,
    }: {
      shortId: string;
      commentId: string;
    }) => deleteShortComment(shortId, commentId, token!),

    onMutate: async ({ shortId, commentId }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["short-comments", shortId] }),
        qc.cancelQueries({ queryKey: ["short", shortId] }),
        qc.cancelQueries({ queryKey: ["shorts"] }),
      ]);

      const previousComments = qc.getQueriesData<CommentsInfinite>({
        queryKey: ["short-comments", shortId],
      });
      const previousShort = qc.getQueryData<SingleCache>([
        "short",
        shortId,
        { viewer: true },
      ]);
      const previousFeeds = qc.getQueriesData<ShortsInfinite>({
        queryKey: ["shorts"],
      });

      let removed = 0;
      qc.setQueriesData<CommentsInfinite>(
        { queryKey: ["short-comments", shortId] },
        (prev) => {
          if (!prev) return prev;
          const pages = prev.pages.map((page) => {
            const next = page.comments
              .filter((c) => {
                if (c.id === commentId) {
                  removed += 1 + c.replies.length;
                  return false;
                }
                return true;
              })
              .map((c) => {
                const filtered = c.replies.filter((r) => {
                  if (r.id === commentId) {
                    removed += 1;
                    return false;
                  }
                  return true;
                });
                return filtered.length === c.replies.length
                  ? c
                  : { ...c, replies: filtered };
              });
            return { ...page, comments: next };
          });
          return { ...prev, pages };
        },
      );

      qc.setQueryData<SingleCache>(
        ["short", shortId, { viewer: true }],
        (prev) =>
          prev
            ? {
                ...prev,
                short: {
                  ...prev.short,
                  stats: {
                    ...prev.short.stats,
                    comments: Math.max(
                      0,
                      prev.short.stats.comments - removed,
                    ),
                  },
                },
              }
            : prev,
      );

      qc.setQueriesData<ShortsInfinite>(
        { queryKey: ["shorts"] },
        (prev) =>
          patchShortInFeed(prev, shortId, (s) => ({
            ...s,
            stats: {
              ...s.stats,
              comments: Math.max(0, s.stats.comments - removed),
            },
          })),
      );

      return { previousComments, previousShort, previousFeeds };
    },

    onError: (_err, { shortId }, ctx) => {
      if (!ctx) return;
      for (const [key, value] of ctx.previousComments ?? []) {
        qc.setQueryData(key, value);
      }
      if (ctx.previousShort) {
        qc.setQueryData(
          ["short", shortId, { viewer: true }],
          ctx.previousShort,
        );
      }
      for (const [key, value] of ctx.previousFeeds ?? []) {
        qc.setQueryData(key, value);
      }
    },

    onSettled: (_data, _err, { shortId }) => {
      qc.invalidateQueries({ queryKey: ["short-comments", shortId] });
      qc.invalidateQueries({ queryKey: ["short", shortId] });
    },
  });
}

export function useObjectQuery(id: string | undefined | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["object", id ?? null, Boolean(token)],
    enabled: Boolean(id),
    queryFn: () => fetchObject(id!, token),
    select: (data) => data.object,
    staleTime: 60_000,
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

/**
 * Cross-type search — people, places/things, and posts in one round trip.
 * Caller is responsible for debouncing the input.
 */
export function useSearchAllQuery(
  query: string,
  opts: { limit?: number; minLength?: number } = {},
) {
  const { limit = 8, minLength = 2 } = opts;
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["search", "all", trimmed, { limit }],
    enabled: trimmed.length >= minLength,
    queryFn: () => searchAll(trimmed, limit),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useSearchSuggestionsQuery() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["search", "suggestions", { viewer: Boolean(token) }],
    queryFn: () => fetchSearchSuggestions(token),
    staleTime: 30_000,
  });
}

export function useRecordSearchEvent() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      query: string;
      resultType?: "object" | "post" | "user" | "list" | "google_place" | "prompt";
      resultId?: string;
    }) => {
      if (!token) return Promise.resolve({ ok: true as const });
      return recordSearchEvent(token, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["search", "suggestions"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useFollowSearch() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (query: string) => {
      if (!token) {
        return Promise.resolve({
          followed: {
            id: "local",
            userId: "anonymous",
            query,
            normalizedQuery: query.trim().toLowerCase(),
            inferredCategory: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }
      return followSearch(token, query);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["search", "suggestions"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useUnfollowSearch() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unfollowSearch(token!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["search", "suggestions"] });
    },
  });
}

export function useSavedLibraryQuery(params: {
  cityId?: string | null;
  limit?: number;
} = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "saved-library",
      params.cityId ?? null,
      params.limit ?? 20,
      { viewer: Boolean(token) },
    ],
    enabled: Boolean(token),
    queryFn: () =>
      fetchSavedLibrary({
        token: token!,
        cityId: params.cityId,
        limit: params.limit,
      }),
    select: (data) => ({
      ...data,
      posts: data.posts.map(mapPost),
    }),
    staleTime: 30_000,
  });
}

export function useGooglePlaceSearchQuery(
  query: string,
  opts: {
    cityId?: string | null;
    type?: "all" | "place" | "restaurant" | "cafe" | "bar";
    sessionToken?: string | null;
    limit?: number;
    minLength?: number;
  } = {},
) {
  const {
    cityId = null,
    type = "all",
    sessionToken = null,
    limit = 8,
    minLength = 2,
  } = opts;
  const trimmed = query.trim();
  return useQuery({
    queryKey: [
      "places",
      "google",
      trimmed,
      { cityId, type, sessionToken: Boolean(sessionToken), limit },
    ],
    enabled: trimmed.length >= minLength,
    queryFn: () =>
      searchGooglePlaces({
        query: trimmed,
        cityId,
        type,
        sessionToken,
        limit,
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useUpsertGooglePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      placeId: string;
      sessionToken?: string | null;
      cityId?: string | null;
    }) => upsertGooglePlace(body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["search"] });
      qc.invalidateQueries({ queryKey: ["places"] });
      qc.invalidateQueries({ queryKey: ["object", data.object.id] });
    },
  });
}

export function useSpotifyMusicSearchQuery(
  query: string,
  opts: {
    type?: "album" | "track" | "all";
    market?: string | null;
    limit?: number;
    minLength?: number;
  } = {},
) {
  const { token } = useAuth();
  const {
    type = "all",
    market = null,
    limit = 8,
    minLength = 2,
  } = opts;
  const trimmed = query.trim();
  return useQuery({
    queryKey: [
      "music",
      "spotify",
      trimmed,
      { type, market, limit, viewer: Boolean(token) },
    ],
    enabled: trimmed.length >= minLength,
    queryFn: () =>
      searchSpotifyMusic({
        query: trimmed,
        type,
        market,
        limit,
        token,
      }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useUpsertSpotifyMusic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      itemType: "album" | "track";
      providerItemId: string;
      market?: string | null;
    }) => upsertSpotifyMusic(body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["search"] });
      qc.invalidateQueries({ queryKey: ["music"] });
      qc.invalidateQueries({ queryKey: ["object", data.object.id] });
    },
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
      cityId?: string;
      listType?: "official_city_connected" | "custom_personal";
      linkedCityRankingListId?: string;
    }) => createRankingList(token!, body),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["ranking-lists", "owner", user?.handle ?? null],
      });
      qc.invalidateQueries({ queryKey: ["ranking-lists", "community"] });
      qc.invalidateQueries({ queryKey: ["rank-hub"] });
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
      imageUrl,
      publishPost,
      mentionedUserIds,
      restaurantVisit,
    }: {
      listId: string;
      objectId: string;
      insertAt: number;
      note?: string;
      imageUrl?: string;
      publishPost?: {
        headline?: string;
        caption?: string;
        tags?: string[];
      };
      mentionedUserIds?: string[];
      restaurantVisit?: RestaurantVisitInput;
    }) =>
      insertRankingEntry(listId, token!, {
        objectId,
        insertAt,
        note,
        imageUrl,
        publishPost,
        mentionedUserIds,
        restaurantVisit,
      }),
    onSuccess: (_data, { listId }) => {
      qc.invalidateQueries({ queryKey: ["ranking-list", listId] });
      qc.invalidateQueries({
        queryKey: ["ranking-lists", "owner", user?.handle ?? null],
      });
      qc.invalidateQueries({ queryKey: ["ranking-lists", "community"] });
      qc.invalidateQueries({ queryKey: ["rank-hub"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      if (user?.handle) {
        qc.invalidateQueries({ queryKey: ["feed", "author", user.handle] });
        qc.invalidateQueries({ queryKey: ["user-profile", user.handle] });
      }
    },
  });
}

export function useReplaceRankingEntries() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      entries,
    }: {
      listId: string;
      entries: Array<{ objectId: string; note?: string }>;
    }) => replaceRankingEntries(listId, token!, { entries }),
    onSuccess: (_data, { listId }) => {
      qc.invalidateQueries({ queryKey: ["ranking-list", listId] });
      qc.invalidateQueries({
        queryKey: ["ranking-lists", "owner", user?.handle ?? null],
      });
      qc.invalidateQueries({ queryKey: ["rank-hub"] });
    },
  });
}

// -------- User profile + follow --------

export function useUserProfileQuery(handle: string | undefined | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["user-profile", handle ?? null, { viewer: Boolean(token) }],
    enabled: Boolean(handle),
    queryFn: () => fetchUserProfile(handle!, token),
    select: (data) => data.user,
    staleTime: 30_000,
  });
}

/**
 * Follow / unfollow as a single toggle mutation. Optimistically flips the
 * viewer block on the profile cache so the button feels instant; onError we
 * roll back by invalidating. Followers count is refreshed on settled so the
 * stats strip stays authoritative.
 */
export function useToggleFollow() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      handle,
      followedByMe,
    }: {
      handle: string;
      followedByMe: boolean;
    }) =>
      followedByMe
        ? unfollowUser(handle, token!)
        : followUser(handle, token!),

    onMutate: async ({ handle, followedByMe }) => {
      const keys = [
        ["user-profile", handle, { viewer: true }] as const,
        ["user-profile", handle, { viewer: false }] as const,
      ];
      await Promise.all(
        keys.map((k) => qc.cancelQueries({ queryKey: k })),
      );
      const snapshots = keys.map(
        (k) => [k, qc.getQueryData(k)] as const,
      );

      keys.forEach((k) => {
        qc.setQueryData(k, (old: { user?: ApiUserProfileLike } | undefined) => {
          if (!old?.user) return old;
          const next = !followedByMe;
          const delta = next ? 1 : -1;
          return {
            ...old,
            user: {
              ...old.user,
              viewer: { ...old.user.viewer, followedByMe: next },
              stats: {
                ...old.user.stats,
                followers: Math.max(0, old.user.stats.followers + delta),
              },
            },
          };
        });
      });

      return { snapshots };
    },

    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([k, v]) => qc.setQueryData(k, v));
    },

    onSettled: (_data, _err, { handle }) => {
      qc.invalidateQueries({ queryKey: ["user-profile", handle] });
      // Our own follower count changed too.
      if (user?.handle) {
        qc.invalidateQueries({ queryKey: ["user-profile", user.handle] });
      }
    },
  });
}

/**
 * Minimal shape our optimistic update writes against. We keep this local
 * (rather than reusing ApiUserProfile directly) because react-query's
 * setQueryData types don't give us a narrow selector hook.
 */
type ApiUserProfileLike = {
  viewer: { followedByMe: boolean };
  stats: { followers: number };
};

// -------- Mutations: comments --------

/**
 * Create a comment with an optimistic append on the paginated comment
 * cache (`["post-comments", id, …]`). A top-level row is appended to the
 * last page so it shows up right above the composer; a reply is spliced
 * into its parent's `replies` array wherever it lives. We also bump
 * `post.stats.comments` on the detail cache so the header counter ticks
 * immediately. Rollback on error; `onSettled` reconciles with the server.
 */
export function useCreateComment() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  type MinimalAuthor = {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
  type Reply = {
    id: string;
    postId: string;
    authorId: string;
    parentId: string | null;
    body: string;
    likes: number;
    createdAt: string;
    author: MinimalAuthor;
  };
  type CommentRow = Reply & { replies: Reply[] };
  type CommentsInfinite = {
    pages: Array<{ comments: CommentRow[]; nextCursor: string | null }>;
    pageParams: unknown[];
  };
  type PostDetailCache = {
    post: { stats: { comments: number } } & Record<string, unknown>;
  };

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

    onMutate: async ({ id, body, parentId }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["post-comments", id] }),
        qc.cancelQueries({ queryKey: ["post", id] }),
      ]);

      const previousComments = qc.getQueriesData<CommentsInfinite>({
        queryKey: ["post-comments", id],
      });
      const previousPost = qc.getQueryData<PostDetailCache>(["post", id]);

      if (!user) {
        // Unsigned — the mutation will 401 immediately; keep snapshots so
        // the error path can still restore cleanly.
        return { previousComments, previousPost, tempId: null };
      }

      const tempId = `__pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const author: MinimalAuthor = {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
      };
      const createdAt = new Date().toISOString();

      qc.setQueriesData<CommentsInfinite>(
        { queryKey: ["post-comments", id] },
        (prev) => {
          if (!prev || prev.pages.length === 0) return prev;
          if (parentId) {
            const pages = prev.pages.map((page) => ({
              ...page,
              comments: page.comments.map((c) =>
                c.id === parentId
                  ? {
                      ...c,
                      replies: [
                        ...c.replies,
                        {
                          id: tempId,
                          postId: id,
                          authorId: user.id,
                          parentId,
                          body,
                          likes: 0,
                          createdAt,
                          author,
                        },
                      ],
                    }
                  : c,
              ),
            }));
            return { ...prev, pages };
          }
          // Top-level: append to the last page so it sits just above the
          // composer (comments are chronologically ascending).
          const pages = prev.pages.slice();
          const last = pages[pages.length - 1]!;
          pages[pages.length - 1] = {
            ...last,
            comments: [
              ...last.comments,
              {
                id: tempId,
                postId: id,
                authorId: user.id,
                parentId: null,
                body,
                likes: 0,
                createdAt,
                author,
                replies: [],
              },
            ],
          };
          return { ...prev, pages };
        },
      );

      qc.setQueryData<PostDetailCache>(["post", id], (prev) =>
        prev
          ? {
              ...prev,
              post: {
                ...prev.post,
                stats: {
                  ...prev.post.stats,
                  comments: prev.post.stats.comments + 1,
                },
              },
            }
          : prev,
      );

      return { previousComments, previousPost, tempId };
    },

    onError: (_err, { id }, ctx) => {
      if (!ctx) return;
      for (const [key, value] of ctx.previousComments ?? []) {
        qc.setQueryData(key, value);
      }
      if (ctx.previousPost) {
        qc.setQueryData(["post", id], ctx.previousPost);
      }
    },

    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["post-comments", id] });
      qc.invalidateQueries({ queryKey: ["post", id] });
    },
  });
}

/**
 * Delete a comment. Optimistically removes the row from every cached page
 * of the `post-comments` infinite query for that post and decrements
 * `post.stats.comments` accordingly. Replies nested under a deleted parent
 * are counted and removed alongside it (matching the backend's CASCADE).
 */
export function useDeleteComment() {
  const { token } = useAuth();
  const qc = useQueryClient();

  type CommentsInfinite = {
    pages: Array<{
      comments: Array<{
        id: string;
        replies: Array<{ id: string }>;
      } & Record<string, unknown>>;
      nextCursor: string | null;
    }>;
    pageParams: unknown[];
  };
  type PostDetailCache = {
    post: { stats: { comments: number } } & Record<string, unknown>;
  };

  return useMutation({
    mutationFn: ({
      postId,
      commentId,
    }: {
      postId: string;
      commentId: string;
    }) => deleteComment(postId, commentId, token!),

    onMutate: async ({ postId, commentId }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["post-comments", postId] }),
        qc.cancelQueries({ queryKey: ["post", postId] }),
      ]);

      const previousComments = qc.getQueriesData<CommentsInfinite>({
        queryKey: ["post-comments", postId],
      });
      const previousPost = qc.getQueryData<PostDetailCache>(["post", postId]);

      let removed = 0;
      qc.setQueriesData<CommentsInfinite>(
        { queryKey: ["post-comments", postId] },
        (prev) => {
          if (!prev) return prev;
          const pages = prev.pages.map((page) => {
            const nextComments = page.comments
              .filter((c) => {
                if (c.id === commentId) {
                  removed += 1 + c.replies.length;
                  return false;
                }
                return true;
              })
              .map((c) => {
                const filtered = c.replies.filter((r) => {
                  if (r.id === commentId) {
                    removed += 1;
                    return false;
                  }
                  return true;
                });
                return filtered.length === c.replies.length
                  ? c
                  : { ...c, replies: filtered };
              });
            return { ...page, comments: nextComments };
          });
          return { ...prev, pages };
        },
      );

      qc.setQueryData<PostDetailCache>(["post", postId], (prev) =>
        prev
          ? {
              ...prev,
              post: {
                ...prev.post,
                stats: {
                  ...prev.post.stats,
                  comments: Math.max(0, prev.post.stats.comments - removed),
                },
              },
            }
          : prev,
      );

      return { previousComments, previousPost };
    },

    onError: (_err, { postId }, ctx) => {
      if (!ctx) return;
      for (const [key, value] of ctx.previousComments ?? []) {
        qc.setQueryData(key, value);
      }
      if (ctx.previousPost) {
        qc.setQueryData(["post", postId], ctx.previousPost);
      }
    },

    onSettled: (_data, _err, { postId }) => {
      qc.invalidateQueries({ queryKey: ["post-comments", postId] });
      qc.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}

/**
 * Delete a post the viewer authored. We don't try to surgically remove
 * the row from every cached feed/profile page — those queries refetch on
 * the next invalidation and the detail screen typically pops back to the
 * caller on success — so it's simpler (and correct) to just invalidate
 * broadly and let React Query reconcile.
 */
export function useDeletePost() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePost(id, token!),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ["post", id] });
      qc.removeQueries({ queryKey: ["post-comments", id] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["ranking-lists"] });
    },
  });
}

/**
 * Delete a short the viewer authored. Same broad-invalidation strategy
 * as `useDeletePost` — the shorts pager re-pages on focus anyway.
 */
export function useDeleteShort() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteShort(id, token!),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ["short", id] });
      qc.removeQueries({ queryKey: ["short-comments", id] });
      qc.invalidateQueries({ queryKey: ["shorts"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

/**
 * Delete a ranking list the viewer owns. Posts that reference the list
 * stay put (the server FK is `ON DELETE SET NULL`), but their ranking
 * chip goes away on the next fetch — invalidate feed + profile so the
 * stale chips don't linger.
 */
export function useDeleteRankingList() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRankingList(id, token!),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ["ranking-list", id] });
      qc.invalidateQueries({ queryKey: ["ranking-lists"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// ---------- Moderation ----------

/**
 * Block a user by handle. On success we aggressively flush every feed,
 * comment thread, ranking page, and profile query — content from the
 * blocked user must disappear app-wide without waiting for stale-while-
 * revalidate to settle.
 */
export function useBlockUser() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (handle: string) => blockUser(handle, token!),
    onSuccess: (_data, handle) => {
      qc.removeQueries({ queryKey: ["user-profile", handle] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["shorts"] });
      qc.invalidateQueries({ queryKey: ["search"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["post-comments"] });
      qc.invalidateQueries({ queryKey: ["short-comments"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["ranking-lists"] });
      qc.invalidateQueries({ queryKey: ["blocked-users"] });
    },
  });
}

/** Unblock a user — same invalidation fan-out as `useBlockUser`. */
export function useUnblockUser() {
  const { token } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (handle: string) => unblockUser(handle, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["shorts"] });
      qc.invalidateQueries({ queryKey: ["search"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["post-comments"] });
      qc.invalidateQueries({ queryKey: ["short-comments"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["ranking-lists"] });
      qc.invalidateQueries({ queryKey: ["blocked-users"] });
    },
  });
}

export function useBlockedUsers() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["blocked-users"],
    enabled: Boolean(token),
    queryFn: () => fetchBlockedUsers(token!),
    select: (data) => data.blocks,
  });
}

/**
 * Fire-and-forget report. We don't cache the response — each press is an
 * independent event and the server dedupes open reports by
 * (reporter, subject).
 */
export function useReport() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (input: {
      subjectType: ReportSubjectType;
      subjectId: string;
      reason: ReportReason;
      details?: string;
    }) => createReport(token!, input),
  });
}
