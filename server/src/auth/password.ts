import argon2 from "argon2";

/**
 * Password hashing policy (2026):
 *  - argon2id, 64 MiB memory, 3 iterations, 4 parallel lanes.
 * These are sensible defaults that keep auth < 100ms on modest VPS hardware.
 */
const ARGON_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 4,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON_OPTS);
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
