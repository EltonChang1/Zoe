import { RankingList } from "./types";

export const rankings: RankingList[] = [
  {
    id: "L001",
    ownerId: "U000",
    title: "All-Time Cafés",
    category: "Cafés",
    description: "Rooms that change the way I spend an hour.",
    visibility: "public",
    entries: [
      { objectId: "O021", rank: 1 },
      { objectId: "O001", rank: 2, movement: "up", delta: 1 },
      { objectId: "O012", rank: 3, movement: "new" },
    ],
    saves: 412,
    coverImage:
      "https://images.unsplash.com/photo-1453614512568-c4024d13c249?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "L002",
    ownerId: "U000",
    title: "Night Perfumes",
    category: "Perfume",
    description: "Warm, close-range, stays interesting.",
    visibility: "public",
    entries: [
      { objectId: "O008", rank: 1 },
      { objectId: "O006", rank: 2 },
      { objectId: "O007", rank: 3, movement: "up", delta: 1 },
    ],
    saves: 231,
    coverImage:
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "L003",
    ownerId: "U003",
    title: "All-Time Albums",
    category: "Music",
    description: "Records welded to a period of my life.",
    visibility: "public",
    entries: [
      { objectId: "O009", rank: 1 },
    ],
    saves: 984,
    coverImage:
      "https://images.unsplash.com/photo-1514533212735-5df27d970db9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "L004",
    ownerId: "U009",
    title: "All-Time Sneakers",
    category: "Fashion",
    description: "Concrete over carpet.",
    visibility: "public",
    entries: [{ objectId: "O020", rank: 5 }],
    saves: 712,
    coverImage:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
  },
];

export function getRanking(id: string): RankingList | undefined {
  return rankings.find((r) => r.id === id);
}
