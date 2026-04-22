/**
 * Seeds Zoe with the PRD Sample Data Pack.
 *  - Idempotent via upserts — safe to re-run.
 *  - IDs match the ones used in the mobile mock data so the RN app can
 *    point at the API and see the same content it renders from mocks.
 *  - Every seeded account gets the password `password123` so auth flows
 *    can be exercised immediately.
 */

import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const USERS = [
  ["U000", "clara@zoe.app", "clara.v", "Clara Vance", "Curator of quiet aesthetics and slow mornings.", avatar(1)],
  ["U001", "maya@zoe.app", "maya.wen", "Maya Wen", "Slow mornings, small rooms, better coffee.", avatar(2)],
  ["U002", "elton@zoe.app", "elton.p", "Elton P.", "Perfume notes, marble surfaces, second trips.", avatar(3)],
  ["U003", "cody@zoe.app", "cody.m", "Cody M.", "Albums to walk to. Night driver.", avatar(4)],
  ["U004", "nina@zoe.app", "nina.ko", "Nina K.", "Dessert first. I rank everything sweet.", avatar(5)],
  ["U005", "ash@zoe.app", "ash.r", "Ash R.", "Natural wine, low light, later than planned.", avatar(6)],
  ["U006", "elena@zoe.app", "elena.r", "Elena Rostova", "Ceremonial grade anything.", avatar(7)],
  ["U008", "lila@zoe.app", "lila.a", "Lila A.", "Tour diaries and hotel-room truths.", avatar(8)],
  ["U009", "alex@zoe.app", "alex.m", "Alex M.", "Sneaker archivist. Concrete over carpet.", avatar(9)],
] as const;

const OBJECTS = [
  { id: "O001", type: "cafe", title: "Sumi Coffee", subtitle: "Third-wave · quiet", city: "Pittsburgh", neighborhood: "Shadyside", tags: ["quiet", "laptop-friendly", "aesthetic"], shortDescriptor: "Light-filled corner shop with a tiny seasonal menu.", heroImage: img("1453614512568-c4024d13c249") },
  { id: "O004", type: "restaurant", title: "Legume", subtitle: "Seasonal · neighborhood", city: "Pittsburgh", neighborhood: "Oakland", tags: ["comforting", "casual", "group"], heroImage: img("1414235077428-338989a2e8c0") },
  { id: "O005", type: "bar", title: "Acrimony", subtitle: "Low-light · natural wine", city: "Pittsburgh", neighborhood: "Lawrenceville", tags: ["date-night", "natural-wine", "low-light"], heroImage: img("1470337458703-46ad1756a187") },
  { id: "O006", type: "perfume", title: "Bal d'Afrique", subtitle: "Byredo", tags: ["luxury", "warm", "night"], heroImage: img("1541643600914-78b084683601") },
  { id: "O007", type: "perfume", title: "Blanche", subtitle: "Byredo · skin scent", tags: ["clean", "skin-scent", "minimal"], heroImage: img("1594035910387-fea47794261f") },
  { id: "O008", type: "perfume", title: "Gris Charnel", subtitle: "BDK Parfums", tags: ["woody", "tea", "night"], heroImage: img("1587017539504-67cfbddac569") },
  { id: "O009", type: "album", title: "Blonde", subtitle: "Frank Ocean", tags: ["all-time", "late-night", "headphones"], heroImage: img("1514533212735-5df27d970db9") },
  { id: "O012", type: "cafe", title: "Cha Cha Matcha", subtitle: "Matcha · aesthetic", city: "New York", neighborhood: "SoHo", tags: ["matcha", "aesthetic", "dessert"], heroImage: img("1536520002442-39764a41e987") },
  { id: "O020", type: "sneaker", title: 'Aether "Concrete" High', subtitle: "Limited run", tags: ["sneakers", "limited", "street"], heroImage: img("1542291026-7eec264c27ff") },
  { id: "O021", type: "cafe", title: "Kurasu", subtitle: "Ceremonial grade matcha", city: "Kyoto", tags: ["matcha", "minimal", "slow"], heroImage: img("1515592302748-6c5ea17e2f0e") },
] as const;

const LISTS = [
  { id: "L001", ownerId: "U000", title: "All-Time Cafés", category: "Cafés", description: "Rooms that change the way I spend an hour.", coverImage: img("1453614512568-c4024d13c249"), entries: [{ objectId: "O021", rank: 1 }, { objectId: "O001", rank: 2, movement: "up", delta: 1 }, { objectId: "O012", rank: 3, movement: "new" }] },
  { id: "L002", ownerId: "U000", title: "Night Perfumes", category: "Perfume", description: "Warm, close-range, stays interesting.", coverImage: img("1587017539504-67cfbddac569"), entries: [{ objectId: "O008", rank: 1 }, { objectId: "O006", rank: 2 }, { objectId: "O007", rank: 3, movement: "up", delta: 1 }] },
  { id: "L003", ownerId: "U003", title: "All-Time Albums", category: "Music", description: "Records welded to a period of my life.", coverImage: img("1514533212735-5df27d970db9"), entries: [{ objectId: "O009", rank: 1 }] },
  { id: "L004", ownerId: "U009", title: "All-Time Sneakers", category: "Fashion", description: "Concrete over carpet.", coverImage: img("1542291026-7eec264c27ff"), entries: [{ objectId: "O020", rank: 5 }] },
] as const;

const POSTS = [
  { id: "P001", authorId: "U001", objectId: "O001", detailLayout: "discovery_photo", headline: "Best quiet café in Shadyside if you care about light and mood.", caption: "I keep coming back here for solo work blocks. The menu is small, but the room does exactly what I need it to do.", tags: ["quiet", "laptop-friendly", "aesthetic"], rankingListId: "L001", rankingRank: 3, rankingMovement: "up", rankingDelta: 1, locationLabel: "Shadyside", aspect: "tall" },
  { id: "P002", authorId: "U002", objectId: "O007", detailLayout: "product_hero", headline: "The clean-girl perfume that actually stays interesting on skin.", caption: "Blanche still feels expensive to me because it stays crisp without becoming sterile.", tags: ["clean", "skin-scent", "minimal"], rankingListId: "L002", rankingRank: 2, rankingMovement: "up", rankingDelta: 1, aspect: "wide" },
  { id: "P003", authorId: "U003", objectId: "O009", detailLayout: "album_review", headline: "Still the album I measure every late-night walk against.", caption: "I tried moving it down and immediately changed my mind. Some records are too welded to your life to rank casually.", tags: ["all-time", "late-night", "headphones"], rankingListId: "L003", rankingRank: 1, rankingMovement: "stable", aspect: "square", featured: true },
  { id: "P004", authorId: "U004", objectId: "O012", detailLayout: "discovery_photo", headline: "Beautiful, overpriced, and somehow I'd still bring a friend here.", caption: "The matcha is not the point. The room is. Good for a slow afternoon when you want something a little performative.", tags: ["matcha", "aesthetic", "solo-date"], rankingRank: 6, rankingMovement: "new", locationLabel: "SoHo", aspect: "tall", postType: "short_video" },
  { id: "P005", authorId: "U005", objectId: "O005", detailLayout: "discovery_photo", headline: "The kind of bar that makes your whole outfit feel more correct.", caption: "Go late, sit near the back, order something bitter first.", tags: ["low-light", "date-night", "natural-wine"], rankingRank: 2, rankingMovement: "up", rankingDelta: 1, locationLabel: "Lawrenceville", aspect: "tall" },
  { id: "P006", authorId: "U006", objectId: "O008", detailLayout: "discovery_photo", headline: "If you want one elegant night fragrance that does not scream.", caption: "Gris Charnel is smooth from the first minute and only gets better in cold air.", tags: ["woody", "tea", "night"], rankingListId: "L002", rankingRank: 1, aspect: "square", postType: "short_video" },
  { id: "P007", authorId: "U009", objectId: "O004", detailLayout: "discovery_photo", headline: "My safest answer when someone asks where to eat near campus.", caption: "Comforting, generous, never feels like a compromise.", tags: ["comforting", "casual", "group"], rankingRank: 4, rankingMovement: "down", rankingDelta: 1, locationLabel: "Oakland", aspect: "tall" },
  { id: "P008", authorId: "U008", objectId: "O006", detailLayout: "product_hero", headline: "I know it's obvious. I still love it at night.", caption: "Not subtle, not niche, still one of the quickest ways to feel dressed.", tags: ["luxury", "loud", "night"], rankingRank: 5, rankingMovement: "new", locationLabel: "Paris", aspect: "wide" },
  { id: "P009", authorId: "U006", objectId: "O021", detailLayout: "discovery_photo", headline: "The perfect balance of umami and ceremonial grade sweetness.", caption: "There's a specific quietness to Kurasu that makes drinking matcha here feel almost sacred. The whisking is deliberate; the crema is impossibly fine.", tags: ["matcha", "kyoto-cafes", "minimalist"], rankingListId: "L001", rankingRank: 3, rankingMovement: "up", rankingDelta: 1, locationLabel: "Kurasu, Kyoto", aspect: "tall" },
  { id: "P010", authorId: "U009", objectId: "O020", detailLayout: "product_hero", headline: 'Aether "Concrete" High', caption: "The balance struck here between raw urban aesthetic and surprisingly plush interior comfort is remarkable. These aren't just display pieces; they mold perfectly after a single wear.", tags: ["sneakers", "limited", "street"], rankingListId: "L004", rankingRank: 5, rankingMovement: "stable", aspect: "wide" },
] as const;

const COMMENTS = [
  { id: "C001", postId: "P009", authorId: "U001", body: "Have you tried their seasonal hojicha? Might challenge this ranking!" },
  { id: "C002", postId: "P009", authorId: "U006", body: "I have! It's fantastic, definitely top 5 for hojicha, but this specific ceremonial blend holds the crown for me right now." },
  { id: "C003", postId: "P003", authorId: "U009", body: "The way this album ages is incredible. It feels completely timeless." },
  { id: "C004", postId: "P003", authorId: "U004", body: "Agreed with the review. The spatial audio mix is a revelation." },
  { id: "C005", postId: "P010", authorId: "U001", body: "Finally got my hands on these yesterday. The suede quality is insane in person." },
  { id: "C006", postId: "P010", authorId: "U003", body: "How does the sizing run? I'm usually an 11 in runners but 10.5 in these." },
] as const;

const SHORTS = [
  { id: "S001", authorId: "U004", objectId: "O012", hookLine: "Pretty? yes. Worth the line? depends.", caption: "If you come here, come for the room and split dessert.", rankingListTitle: "NYC Dessert Spots", rankingRank: 6, rankingMovement: "new", heroImage: img("1536520002442-39764a41e987"), audioLabel: "Original · @nina.ko", likes: 3400, comments: 82, saves: 911 },
  { id: "S002", authorId: "U002", objectId: "O008", hookLine: "One elegant night fragrance — that's it.", caption: "Gris Charnel in cold air. Top 1 for me.", rankingListTitle: "Night Perfumes", rankingRank: 1, heroImage: img("1587017539504-67cfbddac569"), audioLabel: "Original · @elton.p", likes: 2210, comments: 48, saves: 907 },
  { id: "S003", authorId: "U003", objectId: "O009", hookLine: "Still #1 on every late-night walk.", caption: "I tried moving it down. I couldn't.", rankingListTitle: "All-Time Albums", rankingRank: 1, heroImage: img("1514533212735-5df27d970db9"), audioLabel: "Ivy · Frank Ocean", likes: 5600, comments: 210, saves: 1400 },
] as const;

async function main() {
  console.log("⇢ seeding zoe…");

  const passwordHash = await argon2.hash("password123", {
    type: argon2.argon2id,
    memoryCost: 64 * 1024,
    timeCost: 3,
    parallelism: 4,
  });

  // Users
  for (const [id, email, handle, displayName, bio, avatarUrl] of USERS) {
    await prisma.user.upsert({
      where: { id },
      update: { email, handle, displayName, bio, avatarUrl },
      create: { id, email, handle, displayName, bio, avatarUrl, passwordHash },
    });
  }

  // Objects
  for (const o of OBJECTS) {
    await prisma.object.upsert({
      where: { id: o.id },
      update: {
        type: o.type,
        title: o.title,
        subtitle: o.subtitle ?? null,
        city: "city" in o ? o.city : null,
        neighborhood: "neighborhood" in o ? o.neighborhood : null,
        tags: [...o.tags],
        shortDescriptor: "shortDescriptor" in o ? o.shortDescriptor : null,
        heroImage: o.heroImage,
      },
      create: {
        id: o.id,
        type: o.type,
        title: o.title,
        subtitle: o.subtitle ?? null,
        city: "city" in o ? o.city : null,
        neighborhood: "neighborhood" in o ? o.neighborhood : null,
        tags: [...o.tags],
        shortDescriptor: "shortDescriptor" in o ? o.shortDescriptor : null,
        heroImage: o.heroImage,
      },
    });
  }

  // Ranking lists + entries (delete-and-reinsert so re-seeds stay tidy)
  for (const list of LISTS) {
    await prisma.rankingList.upsert({
      where: { id: list.id },
      update: {
        title: list.title,
        category: list.category,
        description: list.description,
        coverImage: list.coverImage,
        ownerId: list.ownerId,
      },
      create: {
        id: list.id,
        title: list.title,
        category: list.category,
        description: list.description,
        coverImage: list.coverImage,
        ownerId: list.ownerId,
      },
    });
    await prisma.rankingEntry.deleteMany({ where: { listId: list.id } });
    for (const e of list.entries) {
      await prisma.rankingEntry.create({
        data: {
          listId: list.id,
          objectId: e.objectId,
          rank: e.rank,
          movement: ("movement" in e ? e.movement : "stable") as
            | "up" | "down" | "new" | "stable",
          delta: "delta" in e ? e.delta : null,
        },
      });
    }
  }

  // Posts
  for (const p of POSTS) {
    await prisma.post.upsert({
      where: { id: p.id },
      update: {
        authorId: p.authorId,
        objectId: p.objectId,
        postType: ("postType" in p ? p.postType : "photo") as
          | "photo" | "carousel" | "short_video",
        detailLayout: p.detailLayout,
        headline: p.headline,
        caption: p.caption,
        tags: [...p.tags],
        rankingListId: "rankingListId" in p ? p.rankingListId : null,
        rankingRank: "rankingRank" in p ? p.rankingRank : null,
        rankingMovement: ("rankingMovement" in p ? p.rankingMovement : "stable") as
          | "up" | "down" | "new" | "stable",
        rankingDelta: "rankingDelta" in p ? p.rankingDelta : null,
        locationLabel: "locationLabel" in p ? p.locationLabel : null,
        aspect: "aspect" in p ? p.aspect : "tall",
        featured: "featured" in p ? p.featured : false,
      },
      create: {
        id: p.id,
        authorId: p.authorId,
        objectId: p.objectId,
        postType: ("postType" in p ? p.postType : "photo") as
          | "photo" | "carousel" | "short_video",
        detailLayout: p.detailLayout,
        headline: p.headline,
        caption: p.caption,
        tags: [...p.tags],
        rankingListId: "rankingListId" in p ? p.rankingListId : null,
        rankingRank: "rankingRank" in p ? p.rankingRank : null,
        rankingMovement: ("rankingMovement" in p ? p.rankingMovement : "stable") as
          | "up" | "down" | "new" | "stable",
        rankingDelta: "rankingDelta" in p ? p.rankingDelta : null,
        locationLabel: "locationLabel" in p ? p.locationLabel : null,
        aspect: "aspect" in p ? p.aspect : "tall",
        featured: "featured" in p ? p.featured : false,
      },
    });
  }

  // Comments (threaded: C002 replies to C001 if both exist)
  for (const c of COMMENTS) {
    await prisma.comment.upsert({
      where: { id: c.id },
      update: { body: c.body },
      create: {
        id: c.id,
        postId: c.postId,
        authorId: c.authorId,
        body: c.body,
      },
    });
  }
  // Mark C002 as a reply to C001
  await prisma.comment.update({
    where: { id: "C002" },
    data: { parentId: "C001" },
  }).catch(() => undefined);

  // Shorts
  for (const s of SHORTS) {
    await prisma.short.upsert({
      where: { id: s.id },
      update: {
        authorId: s.authorId,
        objectId: s.objectId,
        hookLine: s.hookLine,
        caption: s.caption,
        heroImage: s.heroImage,
        audioLabel: s.audioLabel,
        rankingListTitle: s.rankingListTitle,
        rankingRank: s.rankingRank,
        rankingMovement: ("rankingMovement" in s ? s.rankingMovement : "stable") as
          | "up" | "down" | "new" | "stable",
        likes: s.likes,
        comments: s.comments,
        saves: s.saves,
      },
      create: {
        id: s.id,
        authorId: s.authorId,
        objectId: s.objectId,
        hookLine: s.hookLine,
        caption: s.caption,
        heroImage: s.heroImage,
        audioLabel: s.audioLabel,
        rankingListTitle: s.rankingListTitle,
        rankingRank: s.rankingRank,
        rankingMovement: ("rankingMovement" in s ? s.rankingMovement : "stable") as
          | "up" | "down" | "new" | "stable",
        likes: s.likes,
        comments: s.comments,
        saves: s.saves,
      },
    });
  }

  // Social graph: U000 (Clara, the viewer) follows everyone else.
  const others = USERS.map((u) => u[0]).filter((id) => id !== "U000");
  for (const followeeId of others) {
    await prisma.follow.upsert({
      where: { followerId_followeeId: { followerId: "U000", followeeId } },
      create: { followerId: "U000", followeeId },
      update: {},
    });
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.object.count(),
    prisma.post.count(),
    prisma.rankingList.count(),
    prisma.rankingEntry.count(),
    prisma.comment.count(),
    prisma.short.count(),
    prisma.follow.count(),
  ]);
  console.log("✓ seed complete", {
    users: counts[0],
    objects: counts[1],
    posts: counts[2],
    rankingLists: counts[3],
    rankingEntries: counts[4],
    comments: counts[5],
    shorts: counts[6],
    follows: counts[7],
  });
}

function avatar(n: number): string {
  // stable Unsplash portrait set
  const hashes = [
    "1544005313-94ddf0286df2",
    "1517841905240-472988babdf9",
    "1500648767791-00dcc994a43e",
    "1506794778202-cad84cf45f1d",
    "1529626455594-4ff0802cfb7e",
    "1492562080023-ab3db95bfbce",
    "1531123897727-8f129e1688ce",
    "1488426862026-3ee34a7d66df",
    "1508214751196-bcfd4ca60f91",
  ];
  return `https://images.unsplash.com/photo-${hashes[n - 1]}?auto=format&fit=crop&w=400&q=80`;
}

function img(hash: string): string {
  return `https://images.unsplash.com/photo-${hash}?auto=format&fit=crop&w=1200&q=80`;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
