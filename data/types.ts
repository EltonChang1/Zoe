export type UserId = string;
export type ObjectId = string;
export type PostId = string;
export type RankingListId = string;

export type ObjectCategory =
  | "place"
  | "restaurant"
  | "cafe"
  | "bar"
  | "perfume"
  | "album"
  | "track"
  | "fashion"
  | "sneaker"
  | "product";

export type DetailLayout =
  | "discovery_photo"
  | "album_review"
  | "product_hero"
  | "blog_story";

export interface User {
  id: UserId;
  handle: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
}

export interface RankedObject {
  id: ObjectId;
  type: ObjectCategory;
  title: string;
  subtitle?: string;
  city?: string;
  neighborhood?: string;
  tags: string[];
  shortDescriptor?: string;
  heroImage: string;
  metadata?: Record<string, unknown>;
}

export interface RankingContext {
  listTitle: string;
  rank: number;
  movement?: "up" | "down" | "new" | "stable";
  delta?: number; // +1, -2, etc.
}

export interface MentionUser {
  id: UserId;
  handle: string;
  displayName: string;
  avatar?: string;
}

export interface RestaurantDish {
  id?: string;
  name: string;
  note?: string;
  recommended?: boolean;
}

export interface RestaurantVisit {
  id?: string;
  visitedAt?: string;
  mealType?: "breakfast" | "brunch" | "lunch" | "dinner" | "dessert" | "drinks" | "other";
  priceTier?: number;
  note?: string;
  labels: string[];
  companions: MentionUser[];
  dishes: RestaurantDish[];
}

export interface Post {
  id: PostId;
  authorId: UserId;
  objectId?: ObjectId;
  postKind?: "place" | "music" | "blog" | "ranking_update";
  postType: "photo" | "carousel" | "short_video";
  detailLayout: DetailLayout;
  imageUrl?: string;
  headline: string;
  caption: string;
  tags: string[];
  mentions?: MentionUser[];
  restaurantVisit?: RestaurantVisit;
  ranking: RankingContext;
  likes: number;
  comments: number;
  saves: number;
  publishedAt: string;
  locationLabel?: string;
  aspect?: "tall" | "square" | "wide";
  featured?: boolean;
  why?: string;
}

export interface RankingEntry {
  objectId: ObjectId;
  rank: number;
  score: number;
  movement?: "up" | "down" | "new" | "stable";
  delta?: number;
  note?: string;
  imageUrl?: string;
  restaurantVisit?: RestaurantVisit;
}

export interface RankingList {
  id: RankingListId;
  ownerId: UserId;
  title: string;
  category: string;
  description?: string;
  visibility: "public" | "followers";
  entries: RankingEntry[];
  saves: number;
  coverImage?: string;
}

export interface ActivityCard {
  id: string;
  actorId: UserId;
  verb: "added" | "moved" | "saved" | "published";
  objectId?: ObjectId;
  listId?: RankingListId;
  imageUrl?: string;
  rank?: number;
  movement?: "up" | "down" | "new";
  message: string;
  body?: string;
  timestamp: string;
}

export interface Short {
  id: string;
  authorId: UserId;
  objectId: ObjectId;
  hookLine: string;
  caption: string;
  ranking?: RankingContext;
  likes: number;
  comments: number;
  saves: number;
  hero: string;
  audioLabel?: string;
}

export interface Comment {
  id: string;
  authorId: UserId;
  /** Handle snapshot, used for navigation to `/user/:handle` without a second
   * lookup into the client registry. */
  handle?: string;
  body: string;
  timestamp: string;
  /** True when `authorId === post.authorId` — used to badge replies from the
   * post's creator. Kept in the Comment so renderers don't need the Post. */
  isAuthor?: boolean;
  /** `null` for top-level comments; id of the parent comment when this row is
   * a reply. The discussion view walks this graph to render a threaded UI. */
  parentId?: string | null;
  likes?: number;
}
