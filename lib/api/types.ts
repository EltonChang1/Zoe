/**
 * Wire types — the JSON shape the server actually returns.
 *
 * Keep this file free of business logic; pair it with `mappers.ts` to
 * translate into the client-facing shapes in `data/types.ts`.
 */

export type ApiDetailLayout =
  | "discovery_photo"
  | "album_review"
  | "product_hero"
  | "blog_story";
export type ApiPostType = "photo" | "carousel" | "short_video";
export type ApiPostKind = "place" | "music" | "blog" | "ranking_update";
export type ApiMovement = "up" | "down" | "new" | "stable";
export type ApiObjectType =
  | "place" | "restaurant" | "cafe" | "bar" | "perfume"
  | "album" | "track" | "fashion" | "sneaker" | "product";
export type ApiRankingListType =
  | "official_city_connected"
  | "custom_personal";
export type ApiOfficialCityCategory =
  | "places_to_go"
  | "restaurant"
  | "cafe";

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
  homeCityId?: string | null;
  preferredCityId?: string | null;
  discoveryLocationMode?: "home_city" | "anywhere";
  locationPermissionState?: "unknown" | "denied" | "granted";
  interestTopics?: string[];
}

export interface ApiObjectLite {
  id: string;
  type: ApiObjectType;
  title: string;
  subtitle?: string | null;
  city?: string | null;
  cityId?: string | null;
  neighborhood?: string | null;
  heroImage: string | null;
  latitude?: number | null;
  longitude?: number | null;
  metadata?: Record<string, unknown> | null;
  musicProviderItems?: ApiMusicProviderItem[];
}

/** Full object shape returned alongside ranking entries (/ranking-lists/:id). */
export interface ApiObjectFull extends ApiObjectLite {
  tags?: string[];
  shortDescriptor?: string | null;
  metadata?: Record<string, unknown> | null;
  externalProvider?: string | null;
  externalPlaceId?: string | null;
  externalPlaceIdRefreshedAt?: string | null;
  primaryType?: string | null;
  externalTypes?: string[];
  musicProviderItems?: ApiMusicProviderItem[];
  createdAt?: string;
}

export interface ApiObjectRecord extends ApiObjectFull {
  cityId?: string | null;
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
  cityId?: string | null;
  listType?: ApiRankingListType;
  countsTowardCityRanking?: boolean;
  linkedCityRankingListId?: string | null;
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
  score: number;
  movement: ApiMovement | null;
  delta: number | null;
  note: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  object: ApiObjectFull;
  restaurantVisit?: ApiRestaurantVisit | null;
}

export interface ApiRankingListDetail extends Omit<ApiRankingListSummary, "_count"> {
  entries: ApiRankingEntry[];
  _count: { entries: number; posts: number };
}

export interface ApiRankingListsResponse {
  lists: ApiRankingListSummary[];
  nextCursor: string | null;
}

// ---------- Rank Hub ----------

export interface ApiCity {
  id: string;
  name: string;
  state: string | null;
  country: string;
  activeRankersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOfficialCityRankingList {
  id: string;
  cityId: string;
  title: string;
  slug: string;
  category: ApiOfficialCityCategory;
  isOfficial: boolean;
  acceptsUserContribution: boolean;
  contributionSource:
    | "official_personal_lists"
    | "pairwise_votes"
    | "hybrid";
  activeRankersCount: number;
  lastRecalculatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCityRankingEntry {
  id: string;
  cityRankingListId: string;
  objectId: string;
  rank: number;
  previousRank: number | null;
  citytasteScore: number;
  rawRankPoints: number;
  confidenceMultiplier: number;
  recencyMultiplier: number;
  localRankersCount: number;
  movement: ApiMovement;
  movementDelta: number | null;
  tagsSummary: string[];
  createdAt: string;
  updatedAt: string;
  object: ApiObjectFull;
}

export interface ApiCityRankingCard
  extends ApiOfficialCityRankingList {
  entries: ApiCityRankingEntry[];
}

export interface ApiCommunityPulseItem extends ApiCityRankingEntry {
  cityRankingList: {
    id: string;
    title: string;
    category: ApiOfficialCityCategory;
  };
}

export interface ApiRankHubCitiesResponse {
  cities: ApiCity[];
}

export interface ApiRankHubCityResponse {
  city: ApiCity | null;
  featuredLists: ApiCityRankingCard[];
  communityPulse: ApiCommunityPulseItem[];
}

export interface ApiCityRankingDetailResponse {
  list: ApiOfficialCityRankingList & {
    city: ApiCity;
    entries: ApiCityRankingEntry[];
  };
  viewer: {
    officialPersonalListId: string | null;
    officialPersonalEntryCount: number;
  };
}

export interface ApiOfficialRankingSuggestion {
  officialList: ApiOfficialCityRankingList;
  userListId: string | null;
  entryCount: number;
  status: "started" | "not_started";
}

export interface ApiPersonalRankHubResponse {
  cityId: string | null;
  officialSuggestions: ApiOfficialRankingSuggestion[];
  officialPersonalLists: ApiRankingListSummary[];
  customLists: ApiRankingListSummary[];
}

export interface ApiQuickVoteMatchup {
  objectA: ApiObjectFull;
  objectB: ApiObjectFull;
  contextPrompt: string;
}

export interface ApiQuickVoteResponse {
  list: ApiOfficialCityRankingList & { city: ApiCity };
  matchups: ApiQuickVoteMatchup[];
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
  objectId: string | null;
  rank: number;
}

export interface ApiSearchUserHit {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ApiSearchListHit {
  id: string;
  title: string;
  category: string;
  description: string | null;
  coverImage: string | null;
  owner: ApiSearchUserHit;
  entries: number;
}

export interface ApiSearchResponse {
  query: string;
  objects?: ApiSearchObjectHit[];
  posts?: ApiSearchPostHit[];
  users?: ApiSearchUserHit[];
  lists?: ApiSearchListHit[];
}

export interface ApiRecentSearch {
  id: string;
  userId: string;
  query: string;
  normalizedQuery: string;
  inferredCategory: string | null;
  lastResultType: string | null;
  lastResultId: string | null;
  hits: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFollowedSearch {
  id: string;
  userId: string;
  query: string;
  normalizedQuery: string;
  inferredCategory: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSearchSuggestionResponse {
  prompts: string[];
  recent: ApiRecentSearch[];
  followed: ApiFollowedSearch[];
  trending: Array<{
    id: string;
    title: string;
    type: ApiObjectType;
    city: string | null;
    rank: number;
    listTitle: string;
  }>;
}

// ---------- Google-backed places ----------

export interface ApiGooglePlaceHit {
  provider: "google";
  placeId: string;
  title: string;
  subtitle: string | null;
  type: ApiObjectType;
  primaryType: string | null;
  externalTypes: string[];
}

export interface ApiGooglePlaceDetail extends ApiGooglePlaceHit {
  formattedAddress: string | null;
  shortFormattedAddress: string | null;
  city: string | null;
  neighborhood: string | null;
  googleMapsUri: string | null;
  location: { latitude: number; longitude: number } | null;
  metadata: Record<string, unknown>;
}

export interface ApiPlaceSearchResponse {
  googlePlaces: ApiGooglePlaceHit[];
  attribution: string;
  unavailable: boolean;
}

export interface ApiPlaceDetailsResponse {
  place: ApiGooglePlaceDetail;
  attribution: string;
}

export interface ApiPlaceUpsertResponse {
  object: ApiObjectRecord;
  place: ApiGooglePlaceDetail;
  attribution: string;
}

// ---------- Object detail ----------

export interface ApiObjectDetail {
  id: string;
  type: ApiObjectType;
  title: string;
  subtitle: string | null;
  city: string | null;
  cityId?: string | null;
  neighborhood: string | null;
  tags: string[];
  shortDescriptor: string | null;
  metadata: Record<string, unknown> | null;
  heroImage: string | null;
  externalProvider?: string | null;
  externalPlaceId?: string | null;
  externalPlaceIdRefreshedAt?: string | null;
  primaryType?: string | null;
  externalTypes?: string[];
  latitude?: number | null;
  longitude?: number | null;
  musicProviderItems?: ApiMusicProviderItem[];
  restaurantVisits?: ApiRestaurantVisit[];
  restaurantBookmarks?: ApiUserRestaurantBookmark[];
  viewer?: {
    wantToTry: boolean;
  };
  socialProof?: {
    rankingAppearances: number;
    savedPosts: number;
    friendSaves: number;
    topCityRank: {
      rank: number;
      listTitle: string;
      city: string;
    } | null;
  };
  createdAt: string;
  _count: {
    posts: number;
    entries: number;
  };
}

// ---------- Music providers ----------

export interface ApiSpotifyItem {
  provider: "spotify";
  itemType: "album" | "track";
  providerItemId: string;
  title: string;
  subtitle: string | null;
  spotifyUri: string;
  webUrl: string;
  artworkUrl: string | null;
  artists: string[];
  albumName: string | null;
  albumProviderId: string | null;
  releaseDate: string | null;
  durationMs: number | null;
  explicit: boolean;
}

export interface ApiMusicProviderItem {
  id: string;
  objectId: string;
  provider: "spotify";
  itemType: "album" | "track";
  providerItemId: string;
  spotifyUri: string | null;
  webUrl: string;
  artworkUrl: string | null;
  artists: string[];
  albumName: string | null;
  albumProviderId: string | null;
  releaseDate: string | null;
  durationMs: number | null;
  explicit: boolean;
  market: string | null;
  refreshedAt: string;
}

export interface ApiMusicSearchResponse {
  spotifyItems: ApiSpotifyItem[];
  unavailable: boolean;
  attribution: string;
}

export interface ApiMusicUpsertResponse {
  object: ApiObjectRecord;
  spotifyItem: ApiSpotifyItem;
  attribution: string;
}

// ---------- Connected accounts ----------

export interface ApiConnectedAccount {
  id: string;
  provider: "spotify";
  providerAccountId: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  market: string | null;
  scopes: string[];
  connectedAt: string;
}

export interface ApiConnectedAccountsResponse {
  accounts: ApiConnectedAccount[];
  spotifyConfigured: boolean;
}

export interface ApiSpotifyConnectStartResponse {
  authUrl: string;
  state: string;
  expiresAt: string;
  scopes: string[];
}

// ---------- Restaurant social ----------

export interface ApiMentionUser {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ApiPostMention {
  id: string;
  postId: string;
  userId: string;
  createdById: string;
  createdAt: string;
  user: ApiMentionUser;
}

export interface ApiRestaurantDish {
  id: string;
  visitId: string;
  name: string;
  note: string | null;
  recommended: boolean;
  createdAt: string;
}

export interface ApiRestaurantVisit {
  id: string;
  authorId: string;
  objectId: string;
  postId: string | null;
  rankingEntryId: string | null;
  visitedAt: string | null;
  mealType:
    | "breakfast"
    | "brunch"
    | "lunch"
    | "dinner"
    | "dessert"
    | "drinks"
    | "other"
    | null;
  priceTier: number | null;
  note: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  author?: ApiMentionUser;
  companions: Array<{
    visitId: string;
    userId: string;
    createdAt: string;
    user: ApiMentionUser;
  }>;
  dishes: ApiRestaurantDish[];
}

export interface ApiUserRestaurantBookmark {
  id: string;
  userId: string;
  objectId: string;
  status: "want_to_try";
  createdAt: string;
  updatedAt: string;
}

export interface ApiRestaurantMapPin {
  id: string;
  object: ApiObjectLite;
  latitude: number;
  longitude: number;
  status: "ranked" | "want_to_try" | "friend" | "city";
  rankedByMe: boolean;
  wantToTryByMe: boolean;
  friendRankers: ApiMentionUser[];
  recentVisits: Array<{
    id: string;
    author: ApiMentionUser;
    labels: string[];
    dishes: ApiRestaurantDish[];
    visitedAt: string | null;
    note: string | null;
  }>;
  stats: {
    rankedCount: number;
    friendRankedCount: number;
    friendVisitedCount: number;
  };
}

export interface ApiRestaurantRecommendation {
  object: ApiObjectLite & {
    latitude?: number | null;
    longitude?: number | null;
  };
  score: number;
  reasons: string[];
  friendRankers: ApiMentionUser[];
  topDishes: Array<{ name: string; count: number }>;
}

export interface ApiTasteProfile {
  user: ApiMentionUser;
  stats: {
    visits: number;
    restaurants: number;
    dishes: number;
  };
  topCities: Array<{ label: string; count: number }>;
  topLabels: Array<{ label: string; count: number }>;
  topDishes: Array<{ label: string; count: number }>;
  topPlaceTypes: Array<{ label: string; count: number }>;
  matchScore: number | null;
}

// ---------- Notifications (inbox) ----------

export type ApiNotificationType =
  | "like"
  | "comment"
  | "reply"
  | "follow"
  | "mention"
  | "companion_tag";

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
  imageUrl: string | null;
  object: {
    id: string;
    type: ApiObjectType;
    title: string;
    city: string | null;
    heroImage: string | null;
  } | null;
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
    metadata?: Record<string, unknown> | null;
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
  objectId: string | null;
  postKind: ApiPostKind;
  postType: ApiPostType;
  detailLayout: ApiDetailLayout;
  imageUrl: string;
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
  object: ApiObjectLite | null;
  rankingList: ApiRankingListLite | null;
  mentions?: ApiPostMention[];
  restaurantVisit?: ApiRestaurantVisit | null;
  stats: { likes: number; comments: number; saves: number };
  viewer?: { likedByMe: boolean; savedByMe: boolean };
  why?: string | null;
}

export interface ApiFeedResponse {
  posts: ApiPost[];
  nextCursor: string | null;
}

export interface ApiSavedLibraryResponse {
  posts: ApiPost[];
  objects: ApiObjectFull[];
  wantToTry: Array<{
    bookmark: ApiUserRestaurantBookmark;
    object: ApiObjectFull;
  }>;
  unrankedObjects: Array<ApiObjectFull & { entries?: Array<{ id: string }> }>;
}

export interface ApiSession {
  token: string;
  expiresAt: string;
}

export interface ApiAuthResponse {
  user: ApiUser;
  session: ApiSession;
  onboardingRequired?: boolean;
  created?: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
