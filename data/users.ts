import { User } from "./types";

export const currentUserId = "U000";

export const users: Record<string, User> = {
  U000: {
    id: "U000",
    handle: "clara.v",
    displayName: "Clara Vance",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    bio: "Curator of quiet aesthetics and slow mornings.",
    followers: 12400,
    following: 845,
    postsCount: 142,
  },
  U001: {
    id: "U001",
    handle: "maya.wen",
    displayName: "Maya Wen",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    bio: "Slow mornings, small rooms, better coffee.",
    followers: 9800,
    following: 310,
    postsCount: 88,
  },
  U002: {
    id: "U002",
    handle: "elton.p",
    displayName: "Elton P.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    bio: "Perfume notes, marble surfaces, second trips.",
    followers: 23500,
    following: 412,
    postsCount: 204,
  },
  U003: {
    id: "U003",
    handle: "cody.m",
    displayName: "Cody M.",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    bio: "Albums to walk to. Night driver.",
    followers: 7100,
    following: 190,
    postsCount: 61,
  },
  U004: {
    id: "U004",
    handle: "nina.ko",
    displayName: "Nina K.",
    avatar:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80",
    bio: "Dessert first. I rank everything sweet.",
    followers: 16700,
    following: 560,
    postsCount: 132,
  },
  U005: {
    id: "U005",
    handle: "ash.r",
    displayName: "Ash R.",
    avatar:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
    bio: "Natural wine, low light, later than planned.",
    followers: 4900,
    following: 280,
    postsCount: 47,
  },
  U006: {
    id: "U006",
    handle: "elena.r",
    displayName: "Elena Rostova",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
    bio: "Ceremonial grade anything.",
    followers: 18200,
    following: 304,
    postsCount: 113,
  },
  U008: {
    id: "U008",
    handle: "lila.a",
    displayName: "Lila A.",
    avatar:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80",
    bio: "Tour diaries and hotel-room truths.",
    followers: 412000,
    following: 220,
    postsCount: 98,
  },
  U009: {
    id: "U009",
    handle: "alex.m",
    displayName: "Alex M.",
    avatar:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
    bio: "Sneaker archivist. Concrete over carpet.",
    followers: 33400,
    following: 412,
    postsCount: 276,
  },
};

export function getUser(id: string): User {
  return users[id] ?? users[currentUserId];
}

/**
 * Merge a user record into the runtime cache. Called from the API mapper so
 * that `getUser(id)` works for any user the app has seen over the wire, not
 * just the seeded mock set. Existing fields are preserved (mock data tends
 * to carry richer counts than API payloads do).
 */
export function registerUser(partial: Partial<User> & Pick<User, "id">) {
  const existing = users[partial.id];
  users[partial.id] = {
    id: partial.id,
    handle: partial.handle ?? existing?.handle ?? partial.id,
    displayName: partial.displayName ?? existing?.displayName ?? partial.id,
    avatar: partial.avatar ?? existing?.avatar ?? users[currentUserId].avatar,
    bio: partial.bio ?? existing?.bio ?? "",
    followers: partial.followers ?? existing?.followers ?? 0,
    following: partial.following ?? existing?.following ?? 0,
    postsCount: partial.postsCount ?? existing?.postsCount ?? 0,
  };
}
