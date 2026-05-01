import { request } from "./client";
import type {
  ApiActivityResponse,
  ApiAuthResponse,
  ApiConnectedAccountsResponse,
  ApiConnectedAccount,
  ApiFeedResponse,
  ApiMusicSearchResponse,
  ApiMusicUpsertResponse,
  ApiNotificationsResponse,
  ApiObjectDetail,
  ApiObjectLite,
  ApiPlaceDetailsResponse,
  ApiPlaceSearchResponse,
  ApiPlaceUpsertResponse,
  ApiPost,
  ApiPostCommentsResponse,
  ApiCityRankingDetailResponse,
  ApiPersonalRankHubResponse,
  ApiQuickVoteResponse,
  ApiRankHubCitiesResponse,
  ApiRankHubCityResponse,
  ApiRankingEntry,
  ApiRankingListDetail,
  ApiRankingListSummary,
  ApiRankingListsResponse,
  ApiRestaurantMapPin,
  ApiRestaurantRecommendation,
  ApiSavedLibraryResponse,
  ApiSearchObjectHit,
  ApiSearchResponse,
  ApiSearchSuggestionResponse,
  ApiFollowedSearch,
  ApiShort,
  ApiShortCommentsResponse,
  ApiShortsResponse,
  ApiUser,
  ApiUserProfile,
  ApiTasteProfile,
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
  avatarUrl?: string | null;
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

export const loginWithGoogle = (input: {
  idToken: string;
  handle?: string;
  displayName?: string;
}) =>
  request<ApiAuthResponse>("/auth/google", {
    method: "POST",
    body: input,
  });

export const loginWithApple = (input: {
  idToken: string;
  handle?: string;
  displayName?: string;
}) =>
  request<ApiAuthResponse>("/auth/apple", {
    method: "POST",
    body: input,
  });

export const completeProfile = (
  token: string,
  body: {
    handle: string;
    displayName: string;
    bio?: string;
    avatarUrl?: string | null;
    homeCityId?: string | null;
    preferredCityId?: string | null;
    discoveryLocationMode?: "home_city" | "anywhere";
    locationPermissionState?: "unknown" | "denied" | "granted";
    interestTopics?: string[];
  },
) =>
  request<{ user: ApiUser }>("/auth/complete-profile", {
    method: "POST",
    token,
    body,
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

// ---------- Connected accounts ----------

export const fetchConnectedAccounts = (token: string) =>
  request<ApiConnectedAccountsResponse>("/connected-accounts", { token });

export const startSpotifyConnect = (
  token: string,
  body: { redirectUri: string },
) =>
  request<{
    authUrl: string;
    state: string;
    expiresAt: string;
    scopes: string[];
  }>("/connected-accounts/spotify/start", {
    method: "POST",
    token,
    body,
  });

export const completeSpotifyConnect = (
  token: string,
  body: { code: string; state: string },
) =>
  request<{ account: ApiConnectedAccount }>(
    "/connected-accounts/spotify/complete",
    { method: "POST", token, body },
  );

export const disconnectSpotify = (token: string) =>
  request<{ ok: true }>("/connected-accounts/spotify", {
    method: "DELETE",
    token,
  });

// ---------- Feed ----------

export const fetchFeed = (params: {
  limit?: number;
  cursor?: string;
  author?: string;
  object?: string;
  scope?: "for_you" | "home_city" | "anywhere";
  cityId?: string | null;
  category?: string | null;
  savedOnly?: boolean;
  token?: string | null;
}) =>
  request<ApiFeedResponse>("/feed", {
    token: params.token ?? null,
    query: {
      limit: params.limit,
      cursor: params.cursor,
      author: params.author,
      object: params.object,
      scope: params.scope,
      cityId: params.cityId,
      category: params.category,
      savedOnly: params.savedOnly,
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
    cityId?: string;
    listType?: "official_city_connected" | "custom_personal";
    linkedCityRankingListId?: string;
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
  body: {
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
  },
) =>
  request<{ entry: ApiRankingEntry; postId?: string | null }>(
    `/ranking-lists/${listId}/entries`,
    {
      method: "POST",
      token,
      body,
    },
  );

export const replaceRankingEntries = (
  listId: string,
  token: string,
  body: { entries: Array<{ objectId: string; note?: string }> },
) =>
  request<{ list: ApiRankingListDetail }>(`/ranking-lists/${listId}/entries`, {
    method: "PUT",
    token,
    body,
  });

export const deleteRankingList = (id: string, token: string) =>
  request<{ ok: true }>(`/ranking-lists/${id}`, { method: "DELETE", token });

// ---------- Rank Hub ----------

export const fetchRankHubCities = () =>
  request<ApiRankHubCitiesResponse>("/rank-hub/cities");

export const fetchRankHubCity = (params: {
  cityId?: string | null;
  token?: string | null;
}) =>
  request<ApiRankHubCityResponse>("/rank-hub/city", {
    token: params.token ?? null,
    query: { cityId: params.cityId },
  });

export const fetchCityRankingDetail = (
  listId: string,
  token?: string | null,
) =>
  request<ApiCityRankingDetailResponse>(`/rank-hub/city-lists/${listId}`, {
    token: token ?? null,
  });

export const fetchPersonalRankHub = (params: {
  cityId?: string | null;
  token?: string | null;
}) =>
  request<ApiPersonalRankHubResponse>("/rank-hub/personal", {
    token: params.token ?? null,
    query: { cityId: params.cityId },
  });

export const fetchQuickVote = (params: {
  cityId: string;
  listId: string;
  count?: number;
  token?: string | null;
}) =>
  request<ApiQuickVoteResponse>("/rank-hub/quick-vote", {
    token: params.token ?? null,
    query: {
      cityId: params.cityId,
      listId: params.listId,
      count: params.count,
    },
  });

export const submitQuickVote = (
  token: string,
  body: {
    cityId: string;
    listId: string;
    votes: Array<{
      objectAId: string;
      objectBId: string;
      selectedObjectId?: string | null;
      skipped?: boolean;
      contextPrompt: string;
    }>;
  },
) =>
  request<{ ok: true }>("/rank-hub/quick-vote", {
    method: "POST",
    token,
    body,
  });

// ---------- Search ----------

export const searchObjects = (query: string, limit = 10) =>
  request<ApiSearchResponse>("/search", {
    query: { q: query, type: "objects", limit },
  });

export const searchAll = (query: string, limit = 8) =>
  request<ApiSearchResponse>("/search", {
    query: { q: query, type: "all", limit },
  });

export const fetchSearchSuggestions = (token?: string | null) =>
  request<ApiSearchSuggestionResponse>("/search/suggestions", {
    token: token ?? null,
  });

export const recordSearchEvent = (
  token: string,
  body: {
    query: string;
    resultType?: "object" | "post" | "user" | "list" | "google_place" | "prompt";
    resultId?: string;
  },
) =>
  request<{ ok: true }>("/search/events", {
    method: "POST",
    token,
    body,
  });

export const followSearch = (token: string, query: string) =>
  request<{ followed: ApiFollowedSearch }>("/search/followed", {
    method: "POST",
    token,
    body: { query },
  });

export const unfollowSearch = (token: string, id: string) =>
  request<{ ok: true }>(`/search/followed/${id}`, {
    method: "DELETE",
    token,
  });

// ---------- Google-backed place search ----------

export const searchGooglePlaces = (params: {
  query: string;
  cityId?: string | null;
  type?: "all" | "place" | "restaurant" | "cafe" | "bar";
  sessionToken?: string | null;
  limit?: number;
}) =>
  request<ApiPlaceSearchResponse>("/places/search", {
    query: {
      q: params.query,
      cityId: params.cityId,
      type: params.type ?? "all",
      sessionToken: params.sessionToken,
      limit: params.limit,
    },
  });

export const fetchGooglePlaceDetails = (params: {
  placeId: string;
  sessionToken?: string | null;
}) =>
  request<ApiPlaceDetailsResponse>("/places/details", {
    query: {
      placeId: params.placeId,
      sessionToken: params.sessionToken,
    },
  });

export const upsertGooglePlace = (body: {
  placeId: string;
  sessionToken?: string | null;
  cityId?: string | null;
}) =>
  request<ApiPlaceUpsertResponse>("/places/upsert", {
    method: "POST",
    body,
  });

// ---------- Spotify-backed music search ----------

export const searchSpotifyMusic = (params: {
  query: string;
  type?: "album" | "track" | "all";
  market?: string | null;
  limit?: number;
  token?: string | null;
}) =>
  request<ApiMusicSearchResponse>("/music/search", {
    token: params.token ?? null,
    query: {
      provider: "spotify",
      q: params.query,
      type: params.type ?? "all",
      market: params.market,
      limit: params.limit,
    },
  });

export const upsertSpotifyMusic = (body: {
  itemType: "album" | "track";
  providerItemId: string;
  market?: string | null;
}) =>
  request<ApiMusicUpsertResponse>("/music/spotify/upsert", {
    method: "POST",
    body: {
      provider: "spotify",
      itemType: body.itemType,
      providerItemId: body.providerItemId,
      market: body.market,
    },
  });

// ---------- Create post ----------

export interface CreatePostInput {
  objectId?: string;
  postKind?: "place" | "music" | "blog" | "ranking_update";
  imageUrl?: string;
  headline: string;
  caption: string;
  tags?: string[];
  postType?: "photo" | "carousel" | "short_video";
  detailLayout?: "discovery_photo" | "album_review" | "product_hero" | "blog_story";
  rankingListId?: string;
  rankingAttachment?:
    | { mode: "existing"; listId: string }
    | { mode: "insert"; listId: string; insertAt: number; note?: string };
  locationLabel?: string;
  aspect?: "tall" | "square" | "wide";
  mentionedUserIds?: string[];
  restaurantVisit?: RestaurantVisitInput;
}

export const createPost = (input: CreatePostInput, token: string) =>
  request<{ post: { id: string } }>("/posts", {
    method: "POST",
    token,
    body: input,
  });

export const deletePost = (id: string, token: string) =>
  request<{ ok: true }>(`/posts/${id}`, { method: "DELETE", token });

export interface RestaurantVisitInput {
  visitedAt?: string;
  companionUserIds?: string[];
  dishes?: Array<{ name: string; note?: string; recommended?: boolean }>;
  labels?: string[];
  mealType?:
    | "breakfast"
    | "brunch"
    | "lunch"
    | "dinner"
    | "dessert"
    | "drinks"
    | "other";
  priceTier?: 1 | 2 | 3 | 4;
  note?: string;
}

// ---------- Restaurants ----------

export const wantToTryRestaurant = (objectId: string, token: string) =>
  request<{ bookmark: unknown }>(`/restaurants/${objectId}/want-to-try`, {
    method: "POST",
    token,
  });

export const removeWantToTryRestaurant = (objectId: string, token: string) =>
  request<{ ok: true }>(`/restaurants/${objectId}/want-to-try`, {
    method: "DELETE",
    token,
  });

export const fetchRestaurantMap = (params: {
  cityId?: string | null;
  limit?: number;
  token?: string | null;
}) =>
  request<{ pins: ApiRestaurantMapPin[] }>("/restaurants/map", {
    token: params.token ?? null,
    query: { cityId: params.cityId, limit: params.limit },
  });

export const fetchRestaurantRecommendations = (params: {
  cityId?: string | null;
  limit?: number;
  token?: string | null;
}) =>
  request<{ recommendations: ApiRestaurantRecommendation[] }>(
    "/restaurants/recommendations",
    {
      token: params.token ?? null,
      query: { cityId: params.cityId, limit: params.limit },
    },
  );

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

export const fetchObject = (id: string, token?: string | null) =>
  request<{ object: ApiObjectDetail }>(`/objects/${id}`, {
    token: token ?? null,
  });

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

export const fetchSavedLibrary = (params: {
  cityId?: string | null;
  limit?: number;
  token: string;
}) =>
  request<ApiSavedLibraryResponse>("/users/me/saves", {
    token: params.token,
    query: { cityId: params.cityId, limit: params.limit },
  });

export const fetchTasteProfile = (handle: string, token: string | null) =>
  request<{ profile: ApiTasteProfile }>(`/users/${handle}/taste-profile`, {
    token,
  });

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
