import { Comment } from "./types";

export const commentsByPost: Record<string, Comment[]> = {
  P009: [
    {
      id: "C001",
      authorId: "U001",
      body: "Have you tried their seasonal hojicha? Might challenge this ranking!",
      timestamp: "1h",
    },
    {
      id: "C002",
      authorId: "U006",
      body: "I have! It's fantastic, definitely top 5 for hojicha, but this specific ceremonial blend holds the crown for me right now.",
      timestamp: "45m",
      isAuthor: true,
    },
  ],
  P003: [
    {
      id: "C003",
      authorId: "U009",
      body: "The way this album ages is incredible. It feels completely timeless.",
      timestamp: "4h",
    },
    {
      id: "C004",
      authorId: "U004",
      body: "Agreed with the review. The spatial audio mix is a revelation.",
      timestamp: "12h",
    },
  ],
  P010: [
    {
      id: "C005",
      authorId: "U001",
      body: "Finally got my hands on these yesterday. The suede quality is insane in person.",
      timestamp: "1h",
      likes: 12,
    },
    {
      id: "C006",
      authorId: "U003",
      body: "How does the sizing run? I'm usually an 11 in runners but 10.5 in these.",
      timestamp: "3h",
      likes: 4,
    },
  ],
};
