import { prisma } from "../db.js";

/**
 * Moderation helpers — single place every route goes to ask "given this
 * viewer, which users are off-limits?".
 *
 * A block is **symmetric**: when A blocks B, neither side sees the other
 * in feeds, search, comments, profile, or notifications. That means any
 * route filtering content by the viewer has to exclude *both* directions:
 * users the viewer blocked, and users who blocked the viewer.
 *
 * Convention: every helper returns an array (`string[]`), because Prisma
 * `notIn: [...]` accepts arrays and treats empty arrays correctly. A
 * `Set` saves us nothing and costs a conversion.
 */

/** Everyone the viewer has blocked. */
export async function getUsersIBlocked(viewerId: string): Promise<string[]> {
  const rows = await prisma.block.findMany({
    where: { blockerId: viewerId },
    select: { blockedId: true },
  });
  return rows.map((r) => r.blockedId);
}

/** Everyone who has blocked the viewer. */
export async function getUsersWhoBlockedMe(viewerId: string): Promise<string[]> {
  const rows = await prisma.block.findMany({
    where: { blockedId: viewerId },
    select: { blockerId: true },
  });
  return rows.map((r) => r.blockerId);
}

/**
 * Combined — the set of user IDs the viewer should never see content
 * from or attributed to. This is the list you want on nearly every
 * content query's `NOT IN (...)` clause.
 *
 * Returns `[]` for anonymous viewers.
 */
export async function getHiddenUserIds(
  viewerId: string | null | undefined,
): Promise<string[]> {
  if (!viewerId) return [];
  const [iBlocked, blockedMe] = await Promise.all([
    getUsersIBlocked(viewerId),
    getUsersWhoBlockedMe(viewerId),
  ]);
  // Dedupe — extremely unlikely (a block is directional DB-side even
  // though it hides symmetrically) but cheap and correct.
  const all = new Set<string>([...iBlocked, ...blockedMe]);
  return Array.from(all);
}

/**
 * True when either direction of a block exists between the two users.
 * Used on profile lookups ("can I view this person?") and on content
 * detail endpoints ("is this item hidden from me?").
 */
export async function isBlockedEitherWay(
  viewerId: string | null | undefined,
  otherId: string,
): Promise<boolean> {
  if (!viewerId) return false;
  if (viewerId === otherId) return false;
  const hit = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: viewerId, blockedId: otherId },
        { blockerId: otherId, blockedId: viewerId },
      ],
    },
    select: { blockerId: true },
  });
  return hit !== null;
}
