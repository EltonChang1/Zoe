import { z } from "zod";

/**
 * ID validator. Accepts both Prisma-generated cuids (25 chars, starting with c)
 * and the short stable IDs used by the seed script (`U000`, `P001`, `L003`).
 * This keeps seeded data addressable by the API without loosening types.
 */
export const idParam = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-zA-Z0-9_-]+$/, "invalid id");
